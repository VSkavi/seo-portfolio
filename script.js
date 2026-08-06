/* =========================================================
   KAVI VS — SEO Portfolio — script.js
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  initMobileNav();
  initActiveNavLink();
  initTypewriter(prefersReducedMotion);
  initReveal(prefersReducedMotion);
  initMediaSlots();
  initLightbox();
  initBackToTop();
  document.getElementById('year').textContent = new Date().getFullYear();
});

/* ---------- Mobile nav ---------- */
function initMobileNav() {
  const toggle = document.getElementById('nav-toggle');
  const menu = document.getElementById('nav-menu');
  if (!toggle || !menu) return;

  toggle.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('is-open');
    toggle.classList.toggle('is-open', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  // Close menu after tapping a link (mobile)
  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.remove('is-open');
      toggle.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

/* ---------- Highlight the current section's nav link ---------- */
function initActiveNavLink() {
  const links = Array.from(document.querySelectorAll('.nav__link[href^="#"]'));
  const sections = links
    .map(link => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  if (!sections.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const link = links.find(l => l.getAttribute('href') === `#${entry.target.id}`);
      if (!link) return;
      if (entry.isIntersecting) {
        links.forEach(l => l.classList.remove('is-active'));
        link.classList.add('is-active');
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

  sections.forEach(section => observer.observe(section));
}

/* ---------- Hero typewriter ---------- */
function initTypewriter(prefersReducedMotion) {
  const el = document.getElementById('typewriter');
  if (!el) return;

  const phrases = [
    'keyword research.',
    'on-page optimization.',
    'technical SEO audits.',
    'content that ranks.'
  ];

  if (prefersReducedMotion) {
    el.textContent = phrases[0];
    return;
  }

  let phraseIndex = 0;
  let charIndex = 0;
  let deleting = false;

  const TYPE_SPEED = 55;
  const DELETE_SPEED = 30;
  const HOLD_TIME = 1400;

  function tick() {
    const current = phrases[phraseIndex];

    if (!deleting) {
      charIndex++;
      el.textContent = current.slice(0, charIndex);
      if (charIndex === current.length) {
        deleting = true;
        setTimeout(tick, HOLD_TIME);
        return;
      }
      setTimeout(tick, TYPE_SPEED);
    } else {
      charIndex--;
      el.textContent = current.slice(0, charIndex);
      if (charIndex === 0) {
        deleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
      }
      setTimeout(tick, DELETE_SPEED);
    }
  }

  tick();
}

/* ---------- Reveal-on-scroll ---------- */
function initReveal(prefersReducedMotion) {
  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;

  if (prefersReducedMotion) {
    items.forEach(el => el.classList.add('in-view'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  items.forEach(el => observer.observe(el));
}

/* ---------- Media slots: local upload + preview for images/PDFs ----------
   These are working placeholders so you can preview how each project
   proof point will look before you swap in hosted files for deployment.
   Files stay in the browser (object URLs) — nothing uploads anywhere,
   and previews reset on page refresh. For the live site, replace the
   relevant <label> block in index.html with a normal <img src="..."> tag
   pointing at a hosted image, or a link to a hosted PDF.
------------------------------------------------------------------------ */
function initMediaSlots() {
  document.querySelectorAll('.media-slot').forEach(slot => {
    const input = slot.querySelector('.media-slot__input');
    const dropzone = slot.querySelector('.media-slot__dropzone');
    const type = slot.dataset.type;
    if (!input || !dropzone) return;

    let objectUrl = null;

    // Filename chip + remove button, added once
    const filenameEl = document.createElement('span');
    filenameEl.className = 'media-slot__filename';
    dropzone.appendChild(filenameEl);

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'media-slot__remove';
    removeBtn.setAttribute('aria-label', 'Remove file');
    removeBtn.innerHTML = '&times;';
    slot.appendChild(removeBtn);

    input.addEventListener('change', () => {
      const file = input.files && input.files[0];
      if (!file) return;

      if (objectUrl) URL.revokeObjectURL(objectUrl);
      objectUrl = URL.createObjectURL(file);

      if (type === 'image') {
        dropzone.style.backgroundImage = `url(${objectUrl})`;
      } else {
        // PDF: keep a plain background, just show the filename + open link
        dropzone.style.backgroundImage = 'none';
      }

      filenameEl.textContent = file.name;
      slot.classList.add('has-file');

      if (type === 'pdf') {
        dropzone.setAttribute('href', objectUrl);
        // Open the PDF in a new tab on click instead of re-triggering the file picker
        dropzone.addEventListener('click', openPdfOnce);
      }
    });

    function openPdfOnce(e) {
      if (slot.classList.contains('has-file')) {
        e.preventDefault();
        window.open(objectUrl, '_blank', 'noopener');
      }
    }

    removeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      input.value = '';
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      objectUrl = null;
      dropzone.style.backgroundImage = 'none';
      filenameEl.textContent = '';
      slot.classList.remove('has-file');
      dropzone.removeEventListener('click', openPdfOnce);
    });
  });
}

/* ---------- Tool logo fallback ----------
   Handled inline via the onerror="" attribute on each <img class="tool__logo">
   in index.html — this fires synchronously the moment a logo fails to load
   (e.g. offline, or a CDN slug changes), so it can't race against this
   script loading. It swaps the image for a small monogram badge instead
   of leaving a broken image icon.
------------------------------------------------------------------------ */

/* ---------- Lightbox: click any project screenshot to view it full size ----------
   Applies to every <img> inside a .media-slot (the media grid tiles and the
   HomeFit Hub mockup). The PDF tile is a plain link, not an <img>, so it's
   untouched — it keeps opening the PDF in a new tab.
------------------------------------------------------------------------ */
function initLightbox() {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const closeBtn = document.getElementById('lightbox-close');
  if (!lightbox || !lightboxImg || !closeBtn) return;

  let lastFocused = null;

  function open(img) {
    lastFocused = document.activeElement;
    lightboxImg.src = img.currentSrc || img.src;
    lightboxImg.alt = img.alt || '';
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lightbox-open');
    closeBtn.focus();
  }

  function close() {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lightbox-open');
    lightboxImg.src = '';
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  document.querySelectorAll('.media-slot > img').forEach(img => {
    img.setAttribute('tabindex', '0');
    img.setAttribute('role', 'button');
    img.setAttribute('aria-label', 'View full size: ' + (img.alt || 'image'));
    img.addEventListener('click', () => open(img));
    img.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open(img);
      }
    });
  });

  closeBtn.addEventListener('click', close);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('is-open')) close();
  });
}

/* ---------- Back to top ---------- */
function initBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}
