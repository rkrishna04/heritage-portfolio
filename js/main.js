(() => {
  'use strict';

  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const cursor = document.getElementById('cursor');
  const follower = document.getElementById('cursor-follower');
  let mx = 0, my = 0, fx = 0, fy = 0;

  if (cursor && follower && window.matchMedia('(pointer: fine)').matches) {
    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      cursor.style.left = mx + 'px';
      cursor.style.top = my + 'px';
    });
    (function loop() {
      fx += (mx - fx) * 0.13;
      fy += (my - fy) * 0.13;
      follower.style.left = fx + 'px';
      follower.style.top = fy + 'px';
      requestAnimationFrame(loop);
    })();
    document.querySelectorAll('a, button, .bento-card, .stat-card').forEach(el => {
      el.addEventListener('mouseenter', () => { cursor.classList.add('hover'); follower.classList.add('hover'); });
      el.addEventListener('mouseleave', () => { cursor.classList.remove('hover'); follower.classList.remove('hover'); });
    });
  }

  const bar = document.getElementById('progress-bar');
  window.addEventListener('scroll', () => {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
  }, { passive: true });

  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 30);
  }, { passive: true });

  const toggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('active');
      nav.classList.toggle('open');
      document.body.style.overflow = nav.classList.contains('open') ? 'hidden' : '';
    });
    nav.querySelectorAll('.nav-link').forEach(l => l.addEventListener('click', () => {
      toggle.classList.remove('active');
      nav.classList.remove('open');
      document.body.style.overflow = '';
    }));
  }

  const sections = document.querySelectorAll('section[id]');
  const links = document.querySelectorAll('.nav-link');
  window.addEventListener('scroll', () => {
    const y = window.scrollY + 100;
    sections.forEach(s => {
      if (y >= s.offsetTop && y < s.offsetTop + s.offsetHeight) {
        links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + s.id));
      }
    });
  }, { passive: true });

  const reveals = document.querySelectorAll('.reveal, .title-line, .hero-lead, .hero-actions, .telemetry-panel, .bento-card');
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('revealed');
        if (e.target.classList.contains('bento-card')) {
          const i = parseInt(e.target.dataset.index || '0', 10);
          e.target.style.transitionDelay = (i * 0.1) + 's';
        }
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
  reveals.forEach(el => io.observe(el));

  document.querySelectorAll('.title-line').forEach((line, i) => {
    line.style.transitionDelay = (0.12 + i * 0.12) + 's';
  });

  setTimeout(() => {
    document.querySelectorAll('.hero .reveal, .hero .title-line, .hero-lead, .hero-actions, .telemetry-panel')
      .forEach(el => el.classList.add('revealed'));
  }, 80);

  document.querySelectorAll('.magnetic').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      btn.style.transform = `translate(${x * 0.18}px, ${y * 0.18}px)`;
    });
    btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
  });

  document.querySelectorAll('.bento-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const rx = (y - r.height / 2) / 20;
      const ry = (r.width / 2 - x) / 20;
      card.style.transform = `perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });

  const form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const status = document.getElementById('form-status');
      const original = btn.innerHTML;
      const name = form.name.value.trim();
      const email = form.email.value.trim();
      const message = form.message.value.trim();

      if (name.length < 2 || !email.includes('@') || message.length < 10) {
        if (status) { status.textContent = 'Please complete all fields.'; status.dataset.state = 'error'; }
        return;
      }

      btn.disabled = true;
      btn.innerHTML = '<span>Sending…</span>';
      if (status) { status.textContent = ''; status.dataset.state = ''; }

      const key = crypto.randomUUID?.() || `k-${Date.now()}`;
      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Idempotency-Key': key },
          body: JSON.stringify({ name, email, message, idempotencyKey: key }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok || res.status === 202) {
          btn.innerHTML = '<span>Sent · धन्यवाद</span>';
          if (status) { status.textContent = data.message || 'Message received.'; status.dataset.state = 'ok'; }
          form.reset();
          setTimeout(() => { btn.innerHTML = original; btn.disabled = false; }, 2800);
        } else {
          btn.innerHTML = original; btn.disabled = false;
          if (status) { status.textContent = data.message || 'Could not send. Try again.'; status.dataset.state = 'error'; }
        }
      } catch {
        btn.innerHTML = original; btn.disabled = false;
        if (status) { status.textContent = 'Network error. Email directly instead.'; status.dataset.state = 'error'; }
      }
    });
  }
})();
