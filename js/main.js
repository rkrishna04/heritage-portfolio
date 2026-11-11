/**
 * Heritage Portfolio — Dynamic Interactive Engine
 */
(() => {
  'use strict';

  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const cursor = document.getElementById('cursor');
  const follower = document.getElementById('cursor-follower');
  let mouseX = 0, mouseY = 0;
  let followerX = 0, followerY = 0;

  if (cursor && follower && window.matchMedia('(pointer: fine)').matches) {
    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursor.style.left = mouseX + 'px';
      cursor.style.top = mouseY + 'px';
    });

    const animateFollower = () => {
      followerX += (mouseX - followerX) * 0.12;
      followerY += (mouseY - followerY) * 0.12;
      follower.style.left = followerX + 'px';
      follower.style.top = followerY + 'px';
      requestAnimationFrame(animateFollower);
    };
    animateFollower();

    document.querySelectorAll('a, button, .work-card, .filter-chip, .craft-item').forEach(el => {
      el.addEventListener('mouseenter', () => {
        cursor.classList.add('hover');
        follower.classList.add('hover');
      });
      el.addEventListener('mouseleave', () => {
        cursor.classList.remove('hover');
        follower.classList.remove('hover');
      });
    });
  }

  const progressBar = document.getElementById('progress-bar');
  const updateProgress = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    if (progressBar) progressBar.style.width = progress + '%';
  };
  window.addEventListener('scroll', updateProgress, { passive: true });

  const header = document.getElementById('header');
  const onScrollHeader = () => {
    if (window.scrollY > 40) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  };
  window.addEventListener('scroll', onScrollHeader, { passive: true });
  onScrollHeader();

  const toggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('active');
      nav.classList.toggle('open');
      document.body.style.overflow = nav.classList.contains('open') ? 'hidden' : '';
    });
    nav.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        toggle.classList.remove('active');
        nav.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');
  const highlightNav = () => {
    const y = window.scrollY + 120;
    sections.forEach(sec => {
      const top = sec.offsetTop;
      const h = sec.offsetHeight;
      const id = sec.getAttribute('id');
      if (y >= top && y < top + h) {
        navLinks.forEach(l => {
          l.classList.toggle('active', l.getAttribute('href') === '#' + id);
        });
      }
    });
  };
  window.addEventListener('scroll', highlightNav, { passive: true });

  const reveals = document.querySelectorAll('.reveal, .title-line, .hero-lead, .hero-cta, .hero-visual, .work-card');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        if (entry.target.classList.contains('work-card')) {
          const idx = parseInt(entry.target.dataset.index || '0', 10);
          entry.target.style.transitionDelay = (idx * 0.08) + 's';
        }
        if (entry.target.classList.contains('craft-item')) {
          const idx = parseInt(entry.target.dataset.index || '0', 10);
          entry.target.style.setProperty('--i', idx);
        }
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  reveals.forEach(el => revealObserver.observe(el));

  document.querySelectorAll('.title-line').forEach((line, i) => {
    line.style.transitionDelay = (0.15 + i * 0.12) + 's';
  });

  setTimeout(() => {
    document.querySelectorAll('.hero .reveal, .hero .title-line, .hero-lead, .hero-cta, .hero-visual').forEach(el => {
      el.classList.add('revealed');
    });
  }, 100);

  document.querySelectorAll('.magnetic').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });

  document.querySelectorAll('.work-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (y - centerY) / 18;
      const rotateY = (centerX - x) / 18;
      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  const chips = document.querySelectorAll('.filter-chip');
  const cards = document.querySelectorAll('.work-card');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const filter = chip.dataset.filter;

      cards.forEach(card => {
        const cats = card.dataset.category || '';
        const show = filter === 'all' || cats.includes(filter);
        if (show) {
          card.classList.remove('hidden');
          card.style.position = '';
          card.style.visibility = '';
          requestAnimationFrame(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          });
        } else {
          card.style.opacity = '0';
          card.style.transform = 'scale(0.92)';
          setTimeout(() => {
            card.classList.add('hidden');
          }, 350);
        }
      });
    });
  });

  const form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const statusEl = document.getElementById('form-status');
      const original = btn.innerHTML;
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
      btn.innerHTML = '<span>Sending…</span>';
      if (statusEl) { statusEl.textContent = ''; statusEl.dataset.state = ''; }

      const idempotencyKey = crypto.randomUUID?.() || `idemp-${Date.now()}`;

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
          btn.innerHTML = '<span>Message received · धन्यवाद</span>';
          if (statusEl) {
            statusEl.textContent = data.message || 'Thank you. I will respond with care.';
            statusEl.dataset.state = 'ok';
          }
          form.reset();
          setTimeout(() => {
            btn.innerHTML = original;
            btn.disabled = false;
          }, 3000);
        } else if (res.status === 429) {
          btn.innerHTML = original;
          btn.disabled = false;
          if (statusEl) {
            statusEl.textContent = data.message || 'Too many messages. Please wait.';
            statusEl.dataset.state = 'error';
          }
        } else {
          btn.innerHTML = original;
          btn.disabled = false;
          if (statusEl) {
            statusEl.textContent = data.message || 'Could not send. Try again or email directly.';
            statusEl.dataset.state = 'error';
          }
        }
      } catch {
        btn.innerHTML = original;
        btn.disabled = false;
        if (statusEl) {
          statusEl.textContent = 'Network error. Please try again or use the email link.';
          statusEl.dataset.state = 'error';
        }
      }
    });
  }

  const visualCard = document.querySelector('.visual-card');
  if (visualCard) {
    window.addEventListener('scroll', () => {
      const scrolled = window.scrollY;
      if (scrolled < window.innerHeight) {
        visualCard.style.transform = `translateY(${scrolled * 0.08}px)`;
      }
    }, { passive: true });
  }
})();
