/* ==========================================================================
   Sujan Adhikari — Portfolio
   Organized by feature: nav, contour canvas, role rotator, reveals, form.
   ========================================================================== */

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* --------------------------------------------------------------------------
   1. APPEARANCE TOGGLE — save the visitor's choice and respect system default
   -------------------------------------------------------------------------- */
(function appearanceToggle() {
  const toggle = document.getElementById('themeToggle');
  if (!toggle) return;

  const storageKey = 'portfolio-theme';
  const root = document.documentElement;
  const systemTheme = window.matchMedia('(prefers-color-scheme: light)');

  const updateToggle = () => {
    const isLight = root.dataset.theme === 'light';
    toggle.setAttribute('aria-checked', String(isLight));
    toggle.setAttribute('aria-label', `Switch to ${isLight ? 'dark' : 'light'} theme`);
  };

  const setTheme = (theme, shouldSave = true) => {
    root.dataset.theme = theme;
    if (shouldSave) {
      try { localStorage.setItem(storageKey, theme); } catch (_) {}
    }
    updateToggle();
    window.dispatchEvent(new Event('themechange'));
  };

  updateToggle();
  toggle.addEventListener('click', () => {
    setTheme(root.dataset.theme === 'light' ? 'dark' : 'light');
  });

  systemTheme.addEventListener('change', (event) => {
    try {
      if (!localStorage.getItem(storageKey)) setTheme(event.matches ? 'light' : 'dark', false);
    } catch (_) {}
  });
})();

/* --------------------------------------------------------------------------
   2. HEADER SCROLL STATE + MOBILE MENU
   -------------------------------------------------------------------------- */
(function header() {
  const header = document.getElementById('siteHeader');
  const toggle = document.getElementById('menuToggle');
  const mobileNav = document.getElementById('mobileNav');

  const onScroll = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 40);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const closeMenu = () => {
    toggle.setAttribute('aria-expanded', 'false');
    mobileNav.classList.remove('is-open');
    mobileNav.hidden = true;
    document.body.style.overflow = '';
  };
  const openMenu = () => {
    toggle.setAttribute('aria-expanded', 'true');
    mobileNav.hidden = false;
    // allow the browser to paint hidden->block before animating opacity
    requestAnimationFrame(() => mobileNav.classList.add('is-open'));
    document.body.style.overflow = 'hidden';
  };

  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    isOpen ? closeMenu() : openMenu();
  });

  mobileNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });
})();

/* --------------------------------------------------------------------------
   2. ACTIVE SECTION TRACKING — nav underline, coordinate rail, station number
   -------------------------------------------------------------------------- */
(function sectionTracking() {
  const sections = document.querySelectorAll('main section[id], .hero[id]');
  const navLinks = document.querySelectorAll('.nav__link');
  const railFill = document.getElementById('railFill');
  const railStation = document.getElementById('railStation');

  const sectionOrder = ['top', 'about', 'skills', 'work', 'journey', 'contact'];

  const setActive = (id) => {
    navLinks.forEach((link) => {
      link.classList.toggle('is-active', link.dataset.section === id);
    });
    const idx = sectionOrder.indexOf(id);
    if (idx > -1) {
      railStation.textContent = String(idx + 1).padStart(2, '0');
      railFill.style.height = `${((idx + 1) / sectionOrder.length) * 100}%`;
    }
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    },
    { rootMargin: '-45% 0px -45% 0px', threshold: 0 }
  );

  sections.forEach((s) => observer.observe(s));
})();

/* --------------------------------------------------------------------------
   3. HERO CONTOUR CANVAS — topographic lines that shift subtly toward cursor
   -------------------------------------------------------------------------- */
(function contours() {
  const canvas = document.getElementById('contourCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const hero = document.querySelector('.hero');

  let w, h, dpr;
  let mouseX = 0.5, mouseY = 0.35; // normalized, default near name position
  let targetX = mouseX, targetY = mouseY;
  let contourRgb = getComputedStyle(document.documentElement).getPropertyValue('--contour-rgb').trim();
  const RING_COUNT = 9;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = hero.offsetWidth;
    h = hero.offsetHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw() {
    // ease current position toward target for a gentle, non-jittery follow
    mouseX += (targetX - mouseX) * 0.04;
    mouseY += (targetY - mouseY) * 0.04;

    ctx.clearRect(0, 0, w, h);
    const cx = mouseX * w;
    const cy = mouseY * h;
    const maxR = Math.hypot(w, h) * 0.55;

    for (let i = 1; i <= RING_COUNT; i++) {
      const r = (i / RING_COUNT) * maxR;
      const wobble = Math.sin(i * 1.3) * 14;
      ctx.beginPath();
      ctx.ellipse(cx, cy, r + wobble, r * 0.72 + wobble * 0.6, 0.15, 0, Math.PI * 2);
      const alpha = 0.16 - i * 0.012;
      ctx.strokeStyle = `rgba(${contourRgb},${Math.max(alpha, 0.015)})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    if (!prefersReducedMotion) requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('themechange', () => {
    contourRgb = getComputedStyle(document.documentElement).getPropertyValue('--contour-rgb').trim();
    if (prefersReducedMotion) draw();
  });

  if (!prefersReducedMotion) {
    hero.addEventListener('pointermove', (e) => {
      const rect = hero.getBoundingClientRect();
      targetX = (e.clientX - rect.left) / rect.width;
      targetY = (e.clientY - rect.top) / rect.height;
    });
    requestAnimationFrame(draw);
  } else {
    // static single render for reduced-motion users
    draw();
  }
})();

/* --------------------------------------------------------------------------
   4. ROLE ROTATOR — type/reveal effect through a list of roles
   -------------------------------------------------------------------------- */
(function roleRotator() {
  const el = document.getElementById('roleText');
  const cursor = document.getElementById('roleCursor');
  if (!el) return;

  const roles = [
    'Web Developer',
    'UI Enthusiast',
    'JavaScript Learner',
    'Future Full-Stack Developer',
    'Problem Solver',
  ];

  if (prefersReducedMotion) {
    // simple cross-fade cycle, no typing motion, cursor hidden
    cursor.style.display = 'none';
    let i = 0;
    el.textContent = roles[0];
    el.style.transition = 'opacity 600ms ease';
    setInterval(() => {
      el.style.opacity = 0;
      setTimeout(() => {
        i = (i + 1) % roles.length;
        el.textContent = roles[i];
        el.style.opacity = 1;
      }, 600);
    }, 2600);
    return;
  }

  let roleIndex = 0;
  let charIndex = 0;
  let mode = 'typing'; // 'typing' | 'pausing' | 'deleting'
  const TYPE_SPEED = 42;
  const DELETE_SPEED = 26;
  const PAUSE_AFTER_TYPE = 1500;
  const PAUSE_AFTER_DELETE = 250;

  function tick() {
    const word = roles[roleIndex];

    if (mode === 'typing') {
      charIndex++;
      el.textContent = word.slice(0, charIndex);
      if (charIndex >= word.length) {
        mode = 'pausing';
        return setTimeout(tick, PAUSE_AFTER_TYPE);
      }
      return setTimeout(tick, TYPE_SPEED);
    }

    if (mode === 'pausing') {
      mode = 'deleting';
      return setTimeout(tick, DELETE_SPEED);
    }

    if (mode === 'deleting') {
      charIndex--;
      el.textContent = word.slice(0, charIndex);
      if (charIndex <= 0) {
        mode = 'typing';
        roleIndex = (roleIndex + 1) % roles.length;
        return setTimeout(tick, PAUSE_AFTER_DELETE);
      }
      return setTimeout(tick, DELETE_SPEED);
    }
  }

  setTimeout(tick, TYPE_SPEED);
})();

/* --------------------------------------------------------------------------
   5. SCROLL REVEALS — sections, elevation tags, ascent path/camps
   -------------------------------------------------------------------------- */
(function reveals() {
  // generic fade/rise for section heads and key blocks
  const revealTargets = document.querySelectorAll(
    '.section-head, .about__lead, .about__facts, .skill-group, .case-study, .contact__intro, .contact__form'
  );
  revealTargets.forEach((t) => t.classList.add('reveal'));

  const io = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  revealTargets.forEach((t) => io.observe(t));

  // elevation tags — staggered via CSS custom property --d
  const tags = document.querySelectorAll('.elevation-tag');
  const tagIo = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.4 }
  );
  tags.forEach((t) => tagIo.observe(t));

  // ascent path draw + camp reveal
  const ascent = document.getElementById('ascent');
  if (ascent) {
    const ascentIo = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );
    ascentIo.observe(ascent);

    const camps = document.querySelectorAll('.camp');
    const campIo = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );
    camps.forEach((c) => campIo.observe(c));
  }
})();

/* --------------------------------------------------------------------------
   6. CONTACT FORM — validation + EmailJS delivery
   -------------------------------------------------------------------------- */
(function contactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;
  const note = document.getElementById('formNote');
  const submitButton = document.getElementById('contactSubmit');
  const emailConfig = window.EMAILJS_CONFIG;

  const fields = {
    name: { input: document.getElementById('cf-name'), error: document.getElementById('err-name') },
    email: { input: document.getElementById('cf-email'), error: document.getElementById('err-email') },
    subject: { input: document.getElementById('cf-subject'), error: document.getElementById('err-subject') },
    message: { input: document.getElementById('cf-message'), error: document.getElementById('err-message') },
  };

  function validate() {
    let valid = true;

    if (!fields.name.input.value.trim()) {
      fields.name.error.textContent = 'Please enter your name.';
      fields.name.input.closest('.field').classList.add('has-error');
      valid = false;
    } else {
      fields.name.error.textContent = '';
      fields.name.input.closest('.field').classList.remove('has-error');
    }

    const emailVal = fields.email.input.value.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(emailVal)) {
      fields.email.error.textContent = 'Please enter a valid email address.';
      fields.email.input.closest('.field').classList.add('has-error');
      valid = false;
    } else {
      fields.email.error.textContent = '';
      fields.email.input.closest('.field').classList.remove('has-error');
    }

    if (!fields.subject.input.value.trim()) {
      fields.subject.error.textContent = 'Please enter a subject.';
      fields.subject.input.closest('.field').classList.add('has-error');
      valid = false;
    } else {
      fields.subject.error.textContent = '';
      fields.subject.input.closest('.field').classList.remove('has-error');
    }

    if (!fields.message.input.value.trim()) {
      fields.message.error.textContent = 'Let me know what you\u2019d like to say.';
      fields.message.input.closest('.field').classList.add('has-error');
      valid = false;
    } else {
      fields.message.error.textContent = '';
      fields.message.input.closest('.field').classList.remove('has-error');
    }

    return valid;
  }

  const isEmailJsConfigured = () => (
    window.emailjs
    && emailConfig
    && emailConfig.serviceId
    && emailConfig.templateId
    && emailConfig.publicKey
    && emailConfig.templateId !== 'YOUR_EMAILJS_TEMPLATE_ID'
    && emailConfig.publicKey !== 'YOUR_EMAILJS_PUBLIC_KEY'
  );

  if (isEmailJsConfigured()) {
    window.emailjs.init({
      publicKey: emailConfig.publicKey,
      limitRate: { id: 'portfolio-contact', throttle: 10000 },
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate()) {
      note.textContent = '';
      return;
    }

    if (!isEmailJsConfigured()) {
      note.textContent = 'Email delivery is being configured. Please use the email link instead.';
      return;
    }

    if (form.dataset.sending === 'true') return;

    form.dataset.sending = 'true';
    form.setAttribute('aria-busy', 'true');
    submitButton.disabled = true;
    submitButton.querySelector('span').textContent = 'Sending...';
    note.textContent = '';

    try {
      await window.emailjs.sendForm(emailConfig.serviceId, emailConfig.templateId, form);
      note.textContent = "Message sent successfully! I'll get back to you soon.";
      form.reset();
    } catch (error) {
      console.error('EmailJS failed to send the contact form.', error);
      note.textContent = 'Sorry, your message could not be sent. Please try again or use the email link.';
    } finally {
      delete form.dataset.sending;
      form.removeAttribute('aria-busy');
      submitButton.disabled = false;
      submitButton.querySelector('span').textContent = 'Send message';
    }
  });

  // clear individual field errors as the person fixes them
  Object.values(fields).forEach(({ input }) => {
    input.addEventListener('input', () => {
      input.closest('.field').classList.remove('has-error');
    });
  });
})();
