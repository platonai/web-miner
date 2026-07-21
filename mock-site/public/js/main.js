/**
 * Mock E-Commerce Site — Client-side JavaScript
 * Provides scroll-driven animations, cart interactions, search preview,
 * back-to-top button, toast notifications, and image lazy loading.
 */
(function () {
  'use strict';

  // ── Scroll-triggered animations ────────────────────────────────────────────
  function initScrollAnimations() {
    const els = document.querySelectorAll('.fade-up, .fade-in');
    if (!els.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -30px 0px' }
    );
    els.forEach((el) => observer.observe(el));
  }

  // Stagger children of product grids
  function initStaggerAnimations() {
    const containers = document.querySelectorAll('.product-grid, .related-grid, .deals-strip');
    containers.forEach((container) => {
      const children = container.querySelectorAll('.product-card');
      if (!children.length) return;
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.style.transitionDelay = '0s';
              entry.target.classList.add('visible');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1 }
      );
      children.forEach((child, i) => {
        child.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        child.style.transitionDelay = `${Math.min(i * 40, 400)}ms`;
        observer.observe(child);
      });
    });
  }

  // ── Back to Top Button ──────────────────────────────────────────────────────
  function initBackToTop() {
    const btn = document.querySelector('.back-to-top') || createBackToTopBtn();
    let ticking = false;

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          if (window.scrollY > 400) {
            btn.classList.add('visible');
          } else {
            btn.classList.remove('visible');
          }
          ticking = false;
        });
        ticking = true;
      }
    });

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  function createBackToTopBtn() {
    const btn = document.createElement('button');
    btn.className = 'back-to-top';
    btn.setAttribute('aria-label', 'Back to top');
    btn.innerHTML = '↑';
    document.body.appendChild(btn);
    return btn;
  }

  // ── Cart Counter (Mock) ────────────────────────────────────────────────────
  let cartCount = 0;

  function initCartButtons() {
    document.addEventListener('click', (e) => {
      const addBtn = e.target.closest('.btn-add, .btn-sm-primary');
      if (!addBtn) return;

      e.preventDefault();
      cartCount++;
      updateCartBadge();
      showToast('Added to cart! 🛒');

      // Button pulse animation
      addBtn.style.transform = 'scale(0.95)';
      setTimeout(() => { addBtn.style.transform = ''; }, 150);
    });
  }

  function updateCartBadge() {
    const badges = document.querySelectorAll('.nav-cart .badge');
    badges.forEach((b) => (b.textContent = cartCount));
    if (cartCount > 0) {
      badges.forEach((b) => (b.style.display = 'flex'));
    }
  }

  // ── Toast Notifications ────────────────────────────────────────────────────
  function showToast(message) {
    const container =
      document.querySelector('.toast-container') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);

    toast.addEventListener('animationend', (e) => {
      if (e.animationName === 'toastOut') toast.remove();
    });
  }

  function createToastContainer() {
    const div = document.createElement('div');
    div.className = 'toast-container';
    document.body.appendChild(div);
    return div;
  }

  // ── Search Dropdown ────────────────────────────────────────────────────────
  function initSearchDropdown() {
    const searchForm = document.querySelector('.nav-search');
    if (!searchForm) return;
    const input = searchForm.querySelector('input');
    if (!input) return;

    let dropdown = null;
    let debounceTimer = null;

    input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      const q = input.value.trim();
      if (q.length < 2) {
        if (dropdown) dropdown.classList.remove('open');
        return;
      }
      debounceTimer = setTimeout(() => fetchSearchResults(q), 250);
    });

    input.addEventListener('focus', () => {
      if (input.value.trim().length >= 2 && dropdown && dropdown.children.length > 0) {
        dropdown.classList.add('open');
      }
    });

    document.addEventListener('click', (e) => {
      if (dropdown && !searchForm.contains(e.target)) {
        dropdown.classList.remove('open');
      }
    });

    async function fetchSearchResults(q) {
      try {
        const resp = await fetch(`/search?q=${encodeURIComponent(q)}`);
        const results = await resp.json();
        renderDropdown(results);
      } catch (_) {
        // Silently fail — search is a progressive enhancement
      }
    }

    function renderDropdown(results) {
      if (!dropdown) {
        dropdown = document.createElement('div');
        dropdown.className = 'search-dropdown';
        searchForm.style.position = 'relative';
        searchForm.appendChild(dropdown);
      }
      if (!results.length) {
        dropdown.classList.remove('open');
        return;
      }
      dropdown.innerHTML = results
        .map(
          (p) =>
            `<a class="item" href="/product/${p.id}">
              <div class="p-title">${escapeHtml(p.title)}</div>
              <div class="p-price">$${p.price.toFixed(2)}</div>
            </a>`
        )
        .join('');
      dropdown.classList.add('open');
    }
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ── Lazy Load Images ──────────────────────────────────────────────────────
  function initLazyImages() {
    const imgs = document.querySelectorAll('img[loading="lazy"]');
    if (!('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
            }
            observer.unobserve(img);
          }
        });
      },
      { rootMargin: '100px' }
    );
    imgs.forEach((img) => observer.observe(img));
  }

  // ── Product Card Ripple Effect ────────────────────────────────────────────
  function initCardRipple() {
    document.addEventListener('click', (e) => {
      const card = e.target.closest('.product-card');
      if (!card) return;
      if (e.target.closest('button, a[href]')) return; // Let buttons/links work normally

      // Navigate to product detail
      const link = card.querySelector('a[href*="/product/"]');
      if (link) {
        window.location.href = link.href;
      }
    });
  }

  // ── Price Count-Up Animation (Home page stats) ────────────────────────────
  function initCountUp() {
    const values = document.querySelectorAll('.hero-card .value');
    values.forEach((el) => {
      const text = el.textContent;
      const numMatch = text.match(/([\d,.]+)/);
      if (!numMatch) return;
      const target = parseFloat(numMatch[1].replace(/,/g, ''));
      if (isNaN(target)) return;
      const prefix = text.slice(0, text.indexOf(numMatch[1]));
      const suffix = text.slice(text.indexOf(numMatch[1]) + numMatch[1].length);
      const duration = 1500;
      const start = performance.now();

      function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(target * eased);
        el.textContent = prefix + current.toLocaleString() + suffix;
        if (progress < 1) requestAnimationFrame(update);
      }
      requestAnimationFrame(update);
    });
  }

  // ── Navbar Scroll Shadow ──────────────────────────────────────────────────
  function initNavShadow() {
    const nav = document.querySelector('.site-nav');
    if (!nav) return;
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          if (window.scrollY > 10) {
            nav.style.boxShadow = '0 2px 12px rgba(0,0,0,0.2)';
          } else {
            nav.style.boxShadow = '';
          }
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  // ── Quantity Selector (Product Detail Page) ──────────────────────────────
  function initQuantitySelect() {
    const select = document.querySelector('.buy-box select, select[name="quantity"]');
    if (!select) return;
    const priceEl = document.querySelector('.buy-box .price-lg');
    if (!priceEl) return;
    const basePrice = parseFloat(priceEl.dataset.basePrice || priceEl.textContent.replace(/[^0-9.]/g, ''));
    if (!basePrice) return;

    select.addEventListener('change', () => {
      const qty = parseInt(select.value, 10);
      const total = (basePrice * qty).toFixed(2);
      priceEl.innerHTML = `<span class="symbol">$</span>${total}`;
    });
  }

  // ── Initialize Everything ──────────────────────────────────────────────────
  function init() {
    initScrollAnimations();
    initStaggerAnimations();
    initBackToTop();
    initCartButtons();
    initSearchDropdown();
    initLazyImages();
    initCardRipple();
    initCountUp();
    initNavShadow();
    initQuantitySelect();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
