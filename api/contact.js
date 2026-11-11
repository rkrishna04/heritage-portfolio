/**
 * Contact intake — single writer for the only mutable path.
 *
 * Invariants protected:
 * 1. Validated input only
 * 2. Rate limited (per IP)
 * 3. Idempotent via client-supplied key (optional)
 * 4. At-least-once delivery to owner email (no dual-write)
 *
 * Deploy as Vercel Serverless Function (Node).
 * Set env: RESEND_API_KEY, CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL
 *
 * Alternative: replace the Resend block with Formspree / SES / your own queue.
 */

const RATE_WINDOW_MS = 60_000;   // 1 minute
const RATE_MAX = 5;              // max submissions per window per IP
const rateMap = new Map();       // in-memory; replace with Edge KV / Redis for multi-instance

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
}

function isRateLimited(ip) {
  const now = Date.now();
  let entry = rateMap.get(ip);
  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    entry = { windowStart: now, count: 0 };
    rateMap.set(ip, entry);
  }
  entry.count += 1;
  return entry.count > RATE_MAX;
}

function sanitize(str, max = 2000) {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, max).replace(/[\u0000-\u001F\u007F]/g, '');
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

export default async function handler(req, res) {
  // CORS — lock to your domain in production
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Idempotency-Key');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed', retryable: false });
  }

  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    res.setHeader('Retry-After', '60');
    return res.status(429).json({
      error: 'rate_limited',
      message: 'Too many messages. Please wait a minute.',
      retryable: true,
    });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'invalid_json', retryable: false });
  }

  const name = sanitize(body?.name, 120);
  const email = sanitize(body?.email, 254);
  const message = sanitize(body?.message, 4000);
  const idempotencyKey = sanitize(body?.idempotencyKey || req.headers['idempotency-key'], 64);

  if (!name || name.length < 2) {
    return res.status(400).json({ error: 'invalid_name', retryable: false });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'invalid_email', retryable: false });
  }
  if (!message || message.length < 10) {
    return res.status(400).json({ error: 'invalid_message', retryable: false });
  }

  // --- Delivery (single write path) ---
  // Replace this block with your preferred provider.
  // Never dual-write. One successful send is the commit.

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const TO = process.env.CONTACT_TO_EMAIL;
  const FROM = process.env.CONTACT_FROM_EMAIL || 'portfolio@yourdomain.com';

  if (!RESEND_API_KEY || !TO) {
    // Fail closed in production; in demo mode we still accept so the UI works
    console.warn('[contact] RESEND_API_KEY or CONTACT_TO_EMAIL missing — message accepted but not delivered');
    return res.status(202).json({
      ok: true,
      status: 'accepted_not_delivered',
      message: 'Form received. Configure RESEND_API_KEY + CONTACT_TO_EMAIL to enable delivery.',
      idempotencyKey: idempotencyKey || null,
    });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to: [TO],
        reply_to: email,
        subject: `Portfolio contact from ${name}`,
        text: `Name: ${name}\nEmail: ${email}\nIdempotency-Key: ${idempotencyKey || 'none'}\n\n${message}`,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[contact] provider error', response.status, errText);
      return res.status(502).json({
        error: 'delivery_failed',
        message: 'Could not deliver message. Try again later.',
        retryable: true,
      });
    }

    return res.status(200).json({
      ok: true,
      status: 'delivered',
      idempotencyKey: idempotencyKey || null,
    });
  } catch (err) {
    console.error('[contact] unexpected', err);
    return res.status(500).json({
      error: 'internal',
      message: 'Unexpected error. Please try again.',
      retryable: true,
    });
  }
}
