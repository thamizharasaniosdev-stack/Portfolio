/**
 * Portfolio interactions: theme switching, navigation, scroll effects and a
 * few small UX helpers. Plain JavaScript, no dependencies.
 */
(function () {
  'use strict';

  // Tells the inline script in <head> that this file loaded and ran.
  window.__portfolioReady = true;

  const root = document.documentElement;
  const THEME_KEY = 'portfolio-theme';
  const THEME_COLORS = {light: '#f5f5f7', dark: '#000000'};
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const canObserve = 'IntersectionObserver' in window;

  const storage = {
    set(key, value) {
      try {
        window.localStorage.setItem(key, value);
      } catch (error) {
        // Storage can be unavailable (private mode, blocked site data).
      }
    },
  };

  /* Theme ----------------------------------------------------------------- */
  const themeToggle = document.querySelector('[data-theme-toggle]');
  const themeMetas = document.querySelectorAll('meta[data-theme-color]');

  function effectiveTheme() {
    const forced = root.getAttribute('data-theme');
    if (forced === 'light' || forced === 'dark') {
      return forced;
    }
    return prefersDark.matches ? 'dark' : 'light';
  }

  function syncThemeUI() {
    const theme = effectiveTheme();
    const label = `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`;
    if (themeToggle) {
      themeToggle.setAttribute('aria-label', label);
      themeToggle.setAttribute('title', label);
    }
    const forced = root.hasAttribute('data-theme');
    themeMetas.forEach(meta => {
      const own = meta.getAttribute('data-theme-color');
      meta.setAttribute('content', THEME_COLORS[forced ? theme : own]);
    });
  }

  function setTheme(theme) {
    root.setAttribute('data-theme', theme);
    storage.set(THEME_KEY, theme);
    syncThemeUI();
  }

  function toggleTheme() {
    const next = effectiveTheme() === 'dark' ? 'light' : 'dark';
    if (!document.startViewTransition || reduceMotion.matches) {
      setTheme(next);
      return;
    }
    // Grow the new theme outward from the toggle button.
    const rect = themeToggle.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );
    const transition = document.startViewTransition(() => setTheme(next));
    transition.ready
      .then(() => {
        root.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${radius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 520,
            easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)',
            pseudoElement: '::view-transition-new(root)',
          },
        );
      })
      .catch(() => {});
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
  prefersDark.addEventListener('change', syncThemeUI);
  syncThemeUI();

  /* Header state and scroll progress ---------------------------------------- */
  const header = document.querySelector('[data-header]');
  const progress = document.querySelector('[data-progress]');
  let scrollQueued = false;

  function updateScroll() {
    scrollQueued = false;
    const y = window.scrollY;
    if (header) {
      header.classList.toggle('is-scrolled', y > 8);
    }
    if (progress) {
      const max = root.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(y / max, 1) : 0;
      progress.style.transform = `scaleX(${ratio})`;
    }
  }

  function queueScrollUpdate() {
    if (!scrollQueued) {
      scrollQueued = true;
      window.requestAnimationFrame(updateScroll);
    }
  }

  window.addEventListener('scroll', queueScrollUpdate, {passive: true});
  window.addEventListener('resize', queueScrollUpdate);
  updateScroll();

  /* Mobile menu ------------------------------------------------------------ */
  const menuToggle = document.querySelector('[data-menu-toggle]');
  const nav = document.querySelector('[data-nav]');
  const backdrop = document.querySelector('[data-menu-backdrop]');
  const desktop = window.matchMedia('(min-width: 1024px)');

  function isMenuOpen() {
    return Boolean(header && header.classList.contains('menu-open'));
  }

  function setMenu(open, returnFocus) {
    header.classList.toggle('menu-open', open);
    root.classList.toggle('menu-locked', open);
    if (backdrop) {
      backdrop.classList.toggle('is-visible', open);
    }
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (open) {
      const firstLink = nav.querySelector('a');
      if (firstLink) {
        firstLink.focus({preventScroll: true});
      }
    } else if (returnFocus) {
      menuToggle.focus();
    }
  }

  // Keep keyboard focus inside the header while the menu is open.
  function trapFocus(event) {
    const focusable = Array.from(
      header.querySelectorAll('a[href], button:not([disabled])'),
    ).filter(el => el.getClientRects().length > 0);
    if (focusable.length === 0) {
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  if (header && menuToggle && nav) {
    menuToggle.addEventListener('click', () => setMenu(!isMenuOpen(), false));
    if (backdrop) {
      backdrop.addEventListener('click', () => setMenu(false, false));
    }
    nav.addEventListener('click', event => {
      if (event.target.closest('a') && isMenuOpen()) {
        setMenu(false, false);
      }
    });
    document.addEventListener('keydown', event => {
      if (!isMenuOpen()) {
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        setMenu(false, true);
      } else if (event.key === 'Tab') {
        trapFocus(event);
      }
    });
    desktop.addEventListener('change', event => {
      if (event.matches && isMenuOpen()) {
        setMenu(false, false);
      }
    });
  }

  /* Reveal on scroll -------------------------------------------------------- */
  const revealEls = Array.from(document.querySelectorAll('.reveal'));
  const siblingIndex = new Map();
  revealEls.forEach(el => {
    const index = siblingIndex.get(el.parentElement) || 0;
    siblingIndex.set(el.parentElement, index + 1);
    el.style.setProperty('--reveal-delay', `${Math.min(index, 5) * 90}ms`);
  });

  if (!canObserve || reduceMotion.matches) {
    revealEls.forEach(el => el.classList.add('is-visible'));
  } else {
    const revealObserver = new window.IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      {rootMargin: '0px 0px -6% 0px', threshold: 0.08},
    );
    revealEls.forEach(el => revealObserver.observe(el));
  }

  // Stagger the lines of the hero code window.
  document.querySelectorAll('.code-body .line').forEach((line, index) => {
    line.style.setProperty('--line', String(index));
  });

  /* Active section in the navigation --------------------------------------- */
  const navLinks = Array.from(
    document.querySelectorAll('[data-nav] a[href^="#"]'),
  );
  const sections = navLinks
    .map(link => document.getElementById(link.hash.slice(1)))
    .filter(Boolean);

  if (canObserve && sections.length > 0) {
    const visible = new Set();
    const sectionObserver = new window.IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            visible.add(entry.target.id);
          } else {
            visible.delete(entry.target.id);
          }
        });
        let current = null;
        sections.forEach(section => {
          if (visible.has(section.id)) {
            current = section.id;
          }
        });
        navLinks.forEach(link => {
          const active = link.hash === `#${current}`;
          link.classList.toggle('is-active', active);
          if (active) {
            link.setAttribute('aria-current', 'true');
          } else {
            link.removeAttribute('aria-current');
          }
        });
      },
      {rootMargin: '-45% 0px -50% 0px'},
    );
    sections.forEach(section => sectionObserver.observe(section));
  }

  /* Copy email -------------------------------------------------------------- */
  const copyStatus = document.querySelector('[data-copy-status]');

  function legacyCopy(text) {
    const field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.appendChild(field);
    field.select();
    let copied = false;
    try {
      copied = document.execCommand('copy');
    } catch (error) {
      copied = false;
    }
    document.body.removeChild(field);
    return copied;
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(
        () => true,
        () => legacyCopy(text),
      );
    }
    return Promise.resolve(legacyCopy(text));
  }

  document.querySelectorAll('[data-copy]').forEach(button => {
    const label = button.querySelector('[data-copy-label]');
    const originalLabel = label ? label.textContent : '';
    let resetTimer = 0;

    button.addEventListener('click', () => {
      const text = button.getAttribute('data-copy');
      copyText(text).then(copied => {
        button.classList.toggle('is-copied', copied);
        if (label) {
          label.textContent = copied ? 'Copied' : originalLabel;
        }
        if (copyStatus) {
          copyStatus.textContent = copied
            ? 'Email address copied to the clipboard.'
            : `Copy didn’t work here. The address is ${text}.`;
        }
        window.clearTimeout(resetTimer);
        resetTimer = window.setTimeout(() => {
          button.classList.remove('is-copied');
          if (label) {
            label.textContent = originalLabel;
          }
          if (copyStatus) {
            copyStatus.textContent = '';
          }
        }, 2600);
      });
    });
  });

  /* Pointer spotlight on cards (fine pointers only) ------------------------- */
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  if (finePointer.matches && !reduceMotion.matches) {
    document.addEventListener(
      'pointermove',
      event => {
        const target = event.target;
        const card =
          target && target.closest ? target.closest('.spotlight') : null;
        if (!card) {
          return;
        }
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${event.clientX - rect.left}px`);
        card.style.setProperty('--my', `${event.clientY - rect.top}px`);
      },
      {passive: true},
    );
  }

  /* Footer year ------------------------------------------------------------- */
  document.querySelectorAll('[data-year]').forEach(el => {
    el.textContent = String(new Date().getFullYear());
  });
})();
