/**
 * Heritage Portfolio — client interactions
 * Contact path talks to /api/contact (serverless).
 * No business rules live here; only UX + transport.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Header scroll state
  const header = document.querySelector('.site-header');
  const onScroll = () => {
    if (window.scrollY > 20) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile nav
  const toggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('active');
      nav.classList.toggle('open');
    });
    nav.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        toggle.classList.remove('active');
        nav.classList.remove('open');
      });
    });
  }

  // Active nav link
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');
  const highlightNav = () => {
    const scrollY = window.scrollY + 100;
    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');
      if (scrollY >= top && scrollY < top + height) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${id}`) link.classList.add('active');
        });
      }
    });
  };
  window.addEventListener('scroll', highlightNav, { passive: true });

  // Works filter
  const filterBtns = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.work-card');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      const filter = btn.dataset.filter;
      cards.forEach(card => {
        const cats = card.dataset.category || '';
        if (filter === 'all' || cats.includes(filter)) card.classList.remove('hidden');
        else card.classList.add('hidden');
      });
    });
  });

  // Contact form — real transport
  const form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const statusEl = document.getElementById('form-status');
      const original = btn.textContent;

      const name = form.name.value.trim();
      const email = form.email.value.trim();
      const message = form.message.value.trim();

      if (name.length < 2 || !email.includes('@') || message.length < 10) {
        if (statusEl) {
          statusEl.textContent = 'Please fill all fields with care.';
          statusEl.dataset.state = 'error';
        }
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Sending…';
      if (statusEl) {
        statusEl.textContent = '';
        statusEl.dataset.state = '';
      }

      const idempotencyKey = crypto.randomUUID ? crypto.randomUUID() : `idemp-${Date.now()}`;

      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify({ name, email, message, idempotencyKey }),
        });

        const data = await res.json().catch(() => ({}));

        if (res.ok || res.status === 202) {
          btn.textContent = 'Message received · धन्यवाद';
          if (statusEl) {
            statusEl.textContent = data.message || 'Thank you. I will respond with care.';
            statusEl.dataset.state = 'ok';
          }
          form.reset();
          setTimeout(() => {
            btn.textContent = original;
            btn.disabled = false;
          }, 3200);
        } else if (res.status === 429) {
          btn.textContent = original;
          btn.disabled = false;
          if (statusEl) {
            statusEl.textContent = data.message || 'Too many messages. Please wait a minute.';
            statusEl.dataset.state = 'error';
          }
        } else {
          btn.textContent = original;
          btn.disabled = false;
          if (statusEl) {
            statusEl.textContent = data.message || 'Could not send. Please try again or email directly.';
            statusEl.dataset.state = 'error';
          }
        }
      } catch (err) {
        btn.textContent = original;
        btn.disabled = false;
        if (statusEl) {
          statusEl.textContent = 'Network error. Please try again or use the email link below.';
          statusEl.dataset.state = 'error';
        }
      }
    });
  }

  // Gentle reveal
  const revealEls = document.querySelectorAll('.work-card, .craft-card');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(24px)';
      el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      io.observe(el);
    });
  }
});
