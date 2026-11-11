# Heritage Portfolio

Personal developer portfolio inspired by traditional Indian aesthetics (terracotta, indigo, gold, Warli, Madhubani, temple jali) blended with modern responsive design.

**Architecture posture (Ghost-coding / Principal Enterprise Architect review):**  
This is a low-workload presentation surface. The only mutable path is contact intake. We therefore keep a **boring static core** and a single thin serverless writer for the form. No database, no CMS, no microservices.

## Invariants protected

1. Pages never execute attacker-controlled script.
2. Accepted contact messages are not silently dropped (at-least-once to owner email).
3. Form endpoint is rate-limited.
4. Content remains under the owner’s direct control.

## Containers

```
Browser → CDN (static assets)
       → /api/contact (Vercel Serverless Function)
            → Resend / SES / Formspree  (single delivery path)
```

## Local preview

```bash
npx serve .
```

Open `http://localhost:3000` (or the port shown).

## Deploy on Vercel

1. Import this repository at [vercel.com/new](https://vercel.com/new).
2. Framework Preset: **Other**.
3. Add environment variables (optional but required for live email delivery):

| Variable | Purpose |
|----------|---------|
| `RESEND_API_KEY` | Resend API key |
| `CONTACT_TO_EMAIL` | Your inbox |
| `CONTACT_FROM_EMAIL` | Verified sender (e.g. `portfolio@yourdomain.com`) |
| `ALLOWED_ORIGIN` | Your production origin (recommended) |

4. Deploy.

Without the env vars the form still accepts submissions and returns `202 accepted_not_delivered` so the UI remains usable during setup.

## Contact path details

- Client generates an idempotency key per attempt.
- Server validates name / email / message length and format.
- In-memory rate limit (5 / minute / IP). For multi-instance production replace with Edge Config or Redis.
- Single write: one call to the email provider. No dual-write.
- Failure modes return structured JSON with `retryable` flag.

See `api/contact.js`.

## Customize

- Replace “Krishna”, email, and social links in `index.html`.
- Update the six sample projects with real work.
- Tweak CSS custom properties at the top of `css/style.css` for palette shifts.
- Swap Resend for Formspree or SES inside the same handler if preferred.

## What we deliberately did not build

- Database or message store (no need at this traffic).
- Headless CMS (content changes infrequently; external CMS adds attack surface).
- Full Next.js + auth + complex state (workload does not justify the surface).
- Client-side only form that pretends to succeed.

Revisit the architecture when traffic, content volume, or compliance requirements change.

---

Built with respect for traditional Indian art forms and for systems that stay correct under real constraints.
