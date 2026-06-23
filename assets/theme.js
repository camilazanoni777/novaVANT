/* ==========================================================================
   VANT — Theme JavaScript
   Vanilla JS, sem dependências externas
   ========================================================================== */

(function () {
  'use strict';

  /* -------------------------------------------------------------------------
     Utilities
  ------------------------------------------------------------------------- */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }

  function debounce(fn, wait) {
    var t;
    return function () {
      clearTimeout(t);
      t = setTimeout(fn.bind(this, ...arguments), wait);
    };
  }

  function formatMoney(cents) {
    return 'R$ ' + (cents / 100).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function trapFocus(el) {
    var focusable = el.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])');
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    el.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* -------------------------------------------------------------------------
     Top Bar Slider (Mobile)
  ------------------------------------------------------------------------- */
  function initTopBar() {
    var slides = $$('.top-bar__slide');
    if (!slides.length) return;
    var current = 0;
    var wrapper = $('.top-bar__slides');
    if (!wrapper) return;

    setInterval(function () {
      current = (current + 1) % slides.length;
      wrapper.style.transform = 'translateY(-' + (current * 20) + 'px)';
    }, 3500);
  }

  /* -------------------------------------------------------------------------
     Header: transparent → solid on scroll
  ------------------------------------------------------------------------- */
  function initHeader() {
    var header = $('#siteHeader');
    if (!header) return;

    var scrolled = false;
    function onScroll() {
      var should = window.scrollY > 60;
      if (should !== scrolled) {
        scrolled = should;
        header.classList.toggle('is-scrolled', scrolled);
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* -------------------------------------------------------------------------
     Mobile Menu
  ------------------------------------------------------------------------- */
  function initMobileMenu() {
    var toggle = $('#menuToggle');
    var close = $('#menuClose');
    var menu = $('#mobileMenu');
    var overlay = $('#overlay');
    if (!toggle || !menu) return;

    function openMenu() {
      menu.classList.add('is-open');
      menu.setAttribute('aria-hidden', 'false');
      toggle.setAttribute('aria-expanded', 'true');
      overlay && overlay.classList.add('is-visible');
      document.body.style.overflow = 'hidden';
      trapFocus(menu);
    }

    function closeMenu() {
      menu.classList.remove('is-open');
      menu.setAttribute('aria-hidden', 'true');
      toggle.setAttribute('aria-expanded', 'false');
      overlay && overlay.classList.remove('is-visible');
      document.body.style.overflow = '';
      toggle.focus();
    }

    toggle.addEventListener('click', openMenu);
    close && close.addEventListener('click', closeMenu);
    overlay && overlay.addEventListener('click', function () {
      closeMenu();
      closeCart();
      closeSearch();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if (menu.classList.contains('is-open')) closeMenu();
      }
    });

    // Mobile submenu accordions
    $$('.mobile-nav__toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var expanded = this.getAttribute('aria-expanded') === 'true';
        var targetId = this.getAttribute('aria-controls');
        var target = $('#' + targetId);
        this.setAttribute('aria-expanded', !expanded);
        if (target) target.hidden = expanded;
      });
    });
  }

  /* -------------------------------------------------------------------------
     Cart Drawer
  ------------------------------------------------------------------------- */
  var cartDrawer = null;
  var cartToggle = null;

  function openCart() {
    cartDrawer = cartDrawer || $('#cartDrawer');
    var overlay = $('#overlay');
    if (!cartDrawer) return;
    cartDrawer.classList.add('is-open');
    cartDrawer.setAttribute('aria-hidden', 'false');
    cartToggle && cartToggle.setAttribute('aria-expanded', 'true');
    overlay && overlay.classList.add('is-visible');
    document.body.style.overflow = 'hidden';
    trapFocus(cartDrawer);
    loadCartDrawer();
  }

  function closeCart() {
    cartDrawer = cartDrawer || $('#cartDrawer');
    var overlay = $('#overlay');
    if (!cartDrawer) return;
    cartDrawer.classList.remove('is-open');
    cartDrawer.setAttribute('aria-hidden', 'true');
    cartToggle && cartToggle.setAttribute('aria-expanded', 'false');
    if (!document.querySelector('.mobile-menu.is-open')) {
      overlay && overlay.classList.remove('is-visible');
      document.body.style.overflow = '';
    }
    cartToggle && cartToggle.focus();
  }

  function loadCartDrawer() {
    try {
      var cartData = JSON.parse(localStorage.getItem('vant_cart') || '{"items":[],"total":0}');
      renderCartDrawer(cartData);
    } catch (e) {
      // Cart data from Nuvemshop is handled server-side for real cart;
      // here we ensure the UI reflects the current state.
    }
  }

  function renderCartDrawer(cart) {
    var itemsEl = $('#cartDrawerItems');
    var emptyEl = $('#cartDrawerEmpty');
    var footerEl = $('#cartDrawerFooter');
    var totalEl = $('#cartDrawerTotal');
    var countEl = $('#cartCount');
    var template = $('#cartItemTemplate');

    if (!itemsEl) return;

    var items = cart.items || [];
    var total = cart.total || 0;
    var count = items.reduce(function (s, i) { return s + (i.quantity || 1); }, 0);

    if (countEl) {
      countEl.textContent = count;
      countEl.style.display = count > 0 ? '' : 'none';
    }

    if (items.length === 0) {
      itemsEl.innerHTML = '';
      emptyEl && (emptyEl.hidden = false);
      footerEl && (footerEl.hidden = true);
      return;
    }

    emptyEl && (emptyEl.hidden = true);
    footerEl && (footerEl.hidden = false);
    totalEl && (totalEl.textContent = formatMoney(total));

    if (!template) return;

    itemsEl.innerHTML = '';
    items.forEach(function (item) {
      var node = template.content.cloneNode(true);
      var el = node.querySelector('.cart-item');

      el.querySelector('.cart-item__image').src = item.image || '';
      el.querySelector('.cart-item__image').alt = item.name || '';
      el.querySelector('.cart-item__name').textContent = item.name || '';
      el.querySelector('.cart-item__name').href = item.url || '#';
      el.querySelector('.cart-item__image-link').href = item.url || '#';
      el.querySelector('.cart-item__variant').textContent = item.variant || '';
      el.querySelector('.cart-item__price').textContent = formatMoney(item.price || 0);
      el.querySelector('.qty-selector__input').value = item.quantity || 1;
      el.dataset.itemId = item.id;

      el.querySelector('.qty-selector__btn--minus').addEventListener('click', function () {
        updateCartItem(item.id, Math.max(1, (item.quantity || 1) - 1));
      });

      el.querySelector('.qty-selector__btn--plus').addEventListener('click', function () {
        updateCartItem(item.id, (item.quantity || 1) + 1);
      });

      el.querySelector('.cart-item__remove').addEventListener('click', function () {
        removeCartItem(item.id);
      });

      itemsEl.appendChild(node);
    });

    updateShippingBar(total);
  }

  function updateShippingBar(total) {
    var threshold = 10000; // R$100 em centavos
    var fill = $('#shippingBarFill');
    var text = $('#shippingBarText');
    var amount = $('#shippingBarAmount');

    if (!fill) return;

    if (total >= threshold) {
      fill.style.width = '100%';
      text && (text.innerHTML = '<strong>Frete grátis desbloqueado!</strong>');
    } else {
      var pct = (total / threshold) * 100;
      fill.style.width = pct + '%';
      var remaining = threshold - total;
      amount && (amount.textContent = formatMoney(remaining));
    }
  }

  function updateCartItem(id, qty) {
    try {
      var cart = JSON.parse(localStorage.getItem('vant_cart') || '{"items":[],"total":0}');
      var item = cart.items.find(function (i) { return i.id === id; });
      if (item) { item.quantity = qty; }
      cart.total = cart.items.reduce(function (s, i) { return s + (i.price * i.quantity); }, 0);
      localStorage.setItem('vant_cart', JSON.stringify(cart));
      renderCartDrawer(cart);
    } catch (e) {}
  }

  function removeCartItem(id) {
    try {
      var cart = JSON.parse(localStorage.getItem('vant_cart') || '{"items":[],"total":0}');
      cart.items = cart.items.filter(function (i) { return i.id !== id; });
      cart.total = cart.items.reduce(function (s, i) { return s + (i.price * i.quantity); }, 0);
      localStorage.setItem('vant_cart', JSON.stringify(cart));
      renderCartDrawer(cart);
    } catch (e) {}
  }

  function addToCart(productId, variantId, qty, productData) {
    try {
      var cart = JSON.parse(localStorage.getItem('vant_cart') || '{"items":[],"total":0}');
      var existing = cart.items.find(function (i) { return i.id === (variantId || productId); });
      if (existing) {
        existing.quantity += (qty || 1);
      } else {
        cart.items.push({
          id: variantId || productId,
          product_id: productId,
          name: productData.name || '',
          image: productData.image || '',
          url: productData.url || '',
          price: productData.price || 0,
          quantity: qty || 1,
          variant: productData.variant || ''
        });
      }
      cart.total = cart.items.reduce(function (s, i) { return s + (i.price * i.quantity); }, 0);
      localStorage.setItem('vant_cart', JSON.stringify(cart));

      var countEl = $('#cartCount');
      if (countEl) {
        var count = cart.items.reduce(function (s, i) { return s + i.quantity; }, 0);
        countEl.textContent = count;
        countEl.style.display = '';
      }

      openCart();
    } catch (e) {}
  }

  function initCart() {
    cartToggle = $('#cartToggle');
    var closeBtn = $('#cartDrawerClose');
    cartDrawer = $('#cartDrawer');

    cartToggle && cartToggle.addEventListener('click', openCart);
    closeBtn && closeBtn.addEventListener('click', closeCart);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && cartDrawer && cartDrawer.classList.contains('is-open')) {
        closeCart();
      }
    });

    // Quick add forms
    $$('.product-card__quick-add').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var productId = form.querySelector('[name="product_id"]').value;
        var qty = parseInt(form.querySelector('[name="quantity"]').value) || 1;
        var card = form.closest('.product-card');
        var productData = {
          name: card ? card.querySelector('.product-card__name').textContent.trim() : '',
          image: card ? (card.querySelector('.product-card__img--main') || {}).src || '' : '',
          price: 0,
          url: card ? (card.querySelector('.product-card__name-link') || {}).href || '' : ''
        };
        addToCart(productId, null, qty, productData);
      });
    });

    // Product form
    var productForm = $('#productForm');
    if (productForm) {
      productForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var submitBtn = $('#addToCartBtn');
        var submitText = submitBtn && submitBtn.querySelector('.product-form__submit-text');
        var submitLoading = submitBtn && submitBtn.querySelector('.product-form__submit-loading');

        if (submitText) submitText.hidden = true;
        if (submitLoading) submitLoading.hidden = false;

        setTimeout(function () {
          if (submitText) submitText.hidden = false;
          if (submitLoading) submitLoading.hidden = true;
          openCart();
        }, 600);
      });
    }

    // Initialize from server-side cart count
    var countEl = $('#cartCount');
    if (countEl) {
      var count = parseInt(countEl.textContent) || 0;
      countEl.style.display = count > 0 ? '' : 'none';
    }
  }

  /* -------------------------------------------------------------------------
     Search Drawer
  ------------------------------------------------------------------------- */
  function openSearch() {
    var drawer = $('#searchDrawer');
    var overlay = $('#overlay');
    if (!drawer) return;
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    overlay && overlay.classList.add('is-visible');
    var input = $('#searchInput');
    input && setTimeout(function () { input.focus(); }, 100);
  }

  function closeSearch() {
    var drawer = $('#searchDrawer');
    var overlay = $('#overlay');
    if (!drawer) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    if (!document.querySelector('.mobile-menu.is-open') && !document.querySelector('.cart-drawer.is-open')) {
      overlay && overlay.classList.remove('is-visible');
      document.body.style.overflow = '';
    }
    $('#searchToggle') && $('#searchToggle').focus();
  }

  function initSearch() {
    var toggle = $('#searchToggle');
    var closeBtn = $('#searchDrawerClose');
    var input = $('#searchInput');

    toggle && toggle.addEventListener('click', openSearch);
    closeBtn && closeBtn.addEventListener('click', closeSearch);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeSearch();
    });

    // Live search suggestions
    if (input) {
      input.addEventListener('input', debounce(function () {
        var q = this.value.trim();
        var suggestions = $('#searchSuggestions');
        var quickLinks = $('#searchQuickLinks');
        if (!suggestions) return;

        if (q.length < 2) {
          suggestions.hidden = true;
          quickLinks && (quickLinks.hidden = false);
          return;
        }

        quickLinks && (quickLinks.hidden = true);
        suggestions.hidden = false;
        suggestions.innerHTML = '<li class="search-suggestion" style="justify-content:center;padding:1rem 0;color:#746D69;font-size:.875rem;">Buscando...</li>';

        // In production, this would call Nuvemshop's search API
        // fetch('/busca.json?q=' + encodeURIComponent(q))
        //   .then(r => r.json())
        //   .then(data => renderSuggestions(data.products));
      }, 300));
    }
  }

  /* -------------------------------------------------------------------------
     Product Gallery
  ------------------------------------------------------------------------- */
  function initProductGallery() {
    var slides = $$('.product-gallery__slide');
    var thumbs = $$('.gallery-thumb');
    var dots = $$('.gallery-dot');
    var prevBtn = $('#galleryPrev');
    var nextBtn = $('#galleryNext');

    if (!slides.length) return;

    var current = 0;

    function goTo(idx) {
      slides[current] && slides[current].classList.remove('is-active');
      thumbs[current] && thumbs[current].classList.remove('is-active');
      thumbs[current] && thumbs[current].setAttribute('aria-pressed', 'false');
      dots[current] && dots[current].classList.remove('is-active');
      dots[current] && dots[current].setAttribute('aria-selected', 'false');

      current = (idx + slides.length) % slides.length;

      slides[current] && slides[current].classList.add('is-active');
      thumbs[current] && thumbs[current].classList.add('is-active');
      thumbs[current] && thumbs[current].setAttribute('aria-pressed', 'true');
      dots[current] && dots[current].classList.add('is-active');
      dots[current] && dots[current].setAttribute('aria-selected', 'true');
    }

    thumbs.forEach(function (thumb, i) {
      thumb.addEventListener('click', function () { goTo(i); });
    });

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () { goTo(i); });
    });

    prevBtn && prevBtn.addEventListener('click', function () { goTo(current - 1); });
    nextBtn && nextBtn.addEventListener('click', function () { goTo(current + 1); });

    // Swipe support
    var galleryMain = $('#galleryMain');
    if (galleryMain) {
      var startX = 0;
      galleryMain.addEventListener('touchstart', function (e) {
        startX = e.touches[0].clientX;
      }, { passive: true });
      galleryMain.addEventListener('touchend', function (e) {
        var dx = e.changedTouches[0].clientX - startX;
        if (Math.abs(dx) > 50) {
          goTo(dx < 0 ? current + 1 : current - 1);
        }
      }, { passive: true });
    }

    // Keyboard navigation
    document.addEventListener('keydown', function (e) {
      if (document.activeElement && document.activeElement.closest('.product-gallery')) {
        if (e.key === 'ArrowLeft') goTo(current - 1);
        if (e.key === 'ArrowRight') goTo(current + 1);
      }
    });
  }

  /* -------------------------------------------------------------------------
     Variant Selector
  ------------------------------------------------------------------------- */
  function initVariantSelector() {
    var swatches = $$('.variant-swatch__input');
    var chips = $$('.variant-chip__input');

    swatches.forEach(function (input) {
      input.addEventListener('change', function () {
        var price = this.dataset.price;
        var comparePrice = this.dataset.comparePrice;
        var name = this.dataset.name;
        var selectedEl = $('#selectedFinish');
        if (selectedEl) selectedEl.textContent = '— ' + name;
        updatePrice(price, comparePrice);
      });
    });

    chips.forEach(function (input) {
      input.addEventListener('change', function () {
        var selectedEl = $('#selectedSize');
        if (selectedEl) selectedEl.textContent = '— Aro ' + this.value;
      });
    });

    function updatePrice(price, comparePrice) {
      var currentEl = document.querySelector('.price-current');
      var compareEl = document.querySelector('.price-compare s');

      if (price && currentEl) {
        currentEl.textContent = formatMoney(parseInt(price));
      }

      if (compareEl) {
        if (comparePrice && parseInt(comparePrice) > parseInt(price)) {
          compareEl.textContent = formatMoney(parseInt(comparePrice));
          compareEl.parentElement.style.display = '';
        } else {
          compareEl.parentElement.style.display = 'none';
        }
      }
    }
  }

  /* -------------------------------------------------------------------------
     Quantity Selector
  ------------------------------------------------------------------------- */
  function initQtySelectors() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('.qty-selector__btn');
      if (!btn) return;

      var input = btn.closest('.qty-selector').querySelector('.qty-selector__input');
      if (!input) return;

      var val = parseInt(input.value) || 1;
      var max = parseInt(input.max) || 99;
      var min = parseInt(input.min) || 1;

      if (btn.classList.contains('qty-selector__btn--plus')) {
        input.value = Math.min(val + 1, max);
      } else {
        input.value = Math.max(val - 1, min);
      }

      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }

  /* -------------------------------------------------------------------------
     Accordions
  ------------------------------------------------------------------------- */
  function initAccordions() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('.accordion__trigger');
      if (!btn) return;

      var accordion = btn.closest('.accordion, .filter-group');
      var bodyId = btn.getAttribute('aria-controls');
      var body = bodyId ? $('#' + bodyId) : accordion && accordion.querySelector('.accordion__body, .filter-group__options');

      if (!body) return;

      var expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', !expanded);
      body.hidden = expanded;
    });
  }

  /* -------------------------------------------------------------------------
     Newsletter Forms
  ------------------------------------------------------------------------- */
  function initNewsletterForms() {
    $$('.newsletter-form, .footer__newsletter-form').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var input = form.querySelector('input[type="email"]');
        var success = form.querySelector('.newsletter-form__success');

        if (!input || !input.value.trim()) {
          input && input.focus();
          return;
        }

        // In production, submit to Nuvemshop newsletter API
        // For now, show success message
        if (success) {
          form.querySelector('.newsletter-form__group') && (form.querySelector('.newsletter-form__group').style.display = 'none');
          success.hidden = false;
        }
      });
    });
  }

  /* -------------------------------------------------------------------------
     Shipping Calculator
  ------------------------------------------------------------------------- */
  function initShippingCalc() {
    var form = $('#shippingForm');
    if (!form) return;

    var cepInput = $('#cepInput');

    // CEP mask
    if (cepInput) {
      cepInput.addEventListener('input', function () {
        var v = this.value.replace(/\D/g, '');
        if (v.length > 5) v = v.slice(0, 5) + '-' + v.slice(5, 8);
        this.value = v;
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var cep = cepInput ? cepInput.value.replace(/\D/g, '') : '';
      var results = $('#shippingResults');

      if (cep.length !== 8 || !results) return;

      results.hidden = false;
      results.innerHTML = '<p style="font-size:.8125rem;color:#746D69;">Calculando...</p>';

      // In production, call Nuvemshop's shipping API
      setTimeout(function () {
        results.innerHTML = '<p style="font-size:.8125rem;color:#746D69;">Consulte as opções de frete no checkout.</p>';
      }, 800);
    });
  }

  /* -------------------------------------------------------------------------
     Size Guide Modal
  ------------------------------------------------------------------------- */
  function initSizeGuide() {
    var openBtn = $('#openSizeGuide');
    var closeBtn = $('#sizeGuideClose');
    var modal = $('#sizeGuideModal');
    var overlay = $('#sizeGuideOverlay');

    if (!modal) return;

    function openModal() {
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      closeBtn && closeBtn.focus();
      trapFocus(modal);
    }

    function closeModal() {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      openBtn && openBtn.focus();
    }

    openBtn && openBtn.addEventListener('click', openModal);
    closeBtn && closeBtn.addEventListener('click', closeModal);
    overlay && overlay.addEventListener('click', closeModal);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
    });
  }

  /* -------------------------------------------------------------------------
     Wishlist (localStorage)
  ------------------------------------------------------------------------- */
  function initWishlist() {
    function getWishlist() {
      try { return JSON.parse(localStorage.getItem('vant_wishlist') || '[]'); } catch (e) { return []; }
    }

    function saveWishlist(list) {
      try { localStorage.setItem('vant_wishlist', JSON.stringify(list)); } catch (e) {}
    }

    function updateWishlistCount() {
      var list = getWishlist();
      var countEl = $('#wishlistCount');
      if (countEl) {
        countEl.textContent = list.length;
        countEl.style.display = list.length > 0 ? '' : 'none';
      }
    }

    function updateWishlistButtons() {
      var list = getWishlist();
      var ids = list.map(function (p) { return String(p.id); });

      $$('.wishlist-btn').forEach(function (btn) {
        var id = btn.dataset.productId;
        if (id) {
          btn.classList.toggle('is-wishlisted', ids.indexOf(id) !== -1);
          btn.setAttribute('aria-label', ids.indexOf(id) !== -1 ? 'Remover dos favoritos' : 'Adicionar aos favoritos');
        }
      });
    }

    document.addEventListener('click', function (e) {
      var btn = e.target.closest('.wishlist-btn');
      if (!btn || !btn.dataset.productId) return;

      e.preventDefault();
      var id = btn.dataset.productId;
      var list = getWishlist();
      var idx = list.findIndex(function (p) { return String(p.id) === String(id); });

      if (idx === -1) {
        list.push({
          id: id,
          name: btn.dataset.productName || '',
          url: btn.dataset.productUrl || '',
          image: btn.dataset.productImage || ''
        });
      } else {
        list.splice(idx, 1);
      }

      saveWishlist(list);
      updateWishlistCount();
      updateWishlistButtons();
    });

    updateWishlistCount();
    updateWishlistButtons();
  }

  /* -------------------------------------------------------------------------
     Recently Viewed Products
  ------------------------------------------------------------------------- */
  function initRecentlyViewed() {
    var section = $('#recentlyViewed');
    var carousel = $('#recentlyViewedCarousel');
    if (!section || !carousel) return;

    var viewed;
    try { viewed = JSON.parse(localStorage.getItem('vant_viewed') || '[]'); } catch (e) { return; }

    // Remove current product
    var currentId = document.querySelector('[data-product-id]') && document.querySelector('[data-product-id]').dataset.productId;
    viewed = viewed.filter(function (p) { return String(p.id) !== String(currentId); });

    if (viewed.length === 0) return;

    section.hidden = false;

    viewed.slice(0, 6).forEach(function (p) {
      var card = document.createElement('a');
      card.href = p.url;
      card.className = 'product-card-mini';
      card.innerHTML = '<img src="' + p.image + '" alt="' + p.name + '" width="200" height="200" loading="lazy" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:8px;background:#F5E7E7;">' +
        '<p style="font-size:.875rem;margin-top:.5rem;color:#2C2826;">' + p.name + '</p>' +
        '<p style="font-size:.75rem;color:#C7A879;">' + p.price + '</p>';
      carousel.appendChild(card);
    });
  }

  /* -------------------------------------------------------------------------
     Cookies Banner (LGPD)
  ------------------------------------------------------------------------- */
  function initCookiesBanner() {
    var banner = $('#cookiesBanner');
    if (!banner) return;

    if (localStorage.getItem('vant_cookies')) return;

    setTimeout(function () {
      banner.hidden = false;
      banner.setAttribute('aria-hidden', 'false');
    }, 1500);

    var accept = $('#cookiesAccept');
    var decline = $('#cookiesDecline');

    function dismiss(val) {
      localStorage.setItem('vant_cookies', val);
      banner.style.opacity = '0';
      setTimeout(function () { banner.hidden = true; }, 300);
    }

    accept && accept.addEventListener('click', function () { dismiss('all'); });
    decline && decline.addEventListener('click', function () { dismiss('essential'); });
  }

  /* -------------------------------------------------------------------------
     Mobile Filter Toggle
  ------------------------------------------------------------------------- */
  function initFilters() {
    var toggle = $('#filtersToggle');
    var sidebar = $('#filtersSidebar');
    var close = $('#filtersClose');
    var overlay = $('#overlay');

    if (!toggle || !sidebar) return;

    toggle.addEventListener('click', function () {
      sidebar.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      overlay && overlay.classList.add('is-visible');
      document.body.style.overflow = 'hidden';
    });

    function closeSidebar() {
      sidebar.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      overlay && overlay.classList.remove('is-visible');
      document.body.style.overflow = '';
    }

    close && close.addEventListener('click', closeSidebar);
    overlay && overlay.addEventListener('click', closeSidebar);

    // Sort select
    var sortSelect = $('#sortSelect');
    if (sortSelect) {
      sortSelect.addEventListener('change', function () {
        var url = new URL(window.location);
        url.searchParams.set('sort', this.value);
        window.location = url.toString();
      });
    }
  }

  /* -------------------------------------------------------------------------
     Cart Page (quantity updates)
  ------------------------------------------------------------------------- */
  function initCartPage() {
    if (!document.querySelector('.page-cart')) return;

    document.addEventListener('click', function (e) {
      var removeBtn = e.target.closest('.cart-item__remove-link');
      if (removeBtn) {
        e.preventDefault();
        var item = removeBtn.closest('.cart-item--page');
        if (item && confirm('Remover este item?')) {
          item.style.opacity = '0';
          item.style.transition = 'opacity 0.3s';
          setTimeout(function () { item.remove(); }, 300);
        }
      }
    });

    // Shipping bar on cart page
    var shippingFill = $('#pageShippingFill');
    var shippingText = $('#pageShippingText');
    if (shippingFill) {
      var totalEl = $('#cartTotal');
      var totalText = totalEl ? totalEl.textContent : 'R$0,00';
      // Parse total — in real Nuvemshop this comes from the server
      shippingText && (shippingText.textContent = 'Frete grátis em compras acima de R$100');
    }
  }

  /* -------------------------------------------------------------------------
     CEP input auto-format
  ------------------------------------------------------------------------- */
  document.addEventListener('input', function (e) {
    if (!e.target.matches('#cepInput')) return;
    var v = e.target.value.replace(/\D/g, '').slice(0, 8);
    if (v.length > 5) v = v.slice(0, 5) + '-' + v.slice(5);
    e.target.value = v;
  });

  /* -------------------------------------------------------------------------
     Lazy images observer
  ------------------------------------------------------------------------- */
  function initLazyImages() {
    if (!('IntersectionObserver' in window)) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          observer.unobserve(img);
        }
      });
    }, { rootMargin: '200px' });

    $$('img[data-src]').forEach(function (img) { observer.observe(img); });
  }

  /* -------------------------------------------------------------------------
     Smooth scroll for anchor links
  ------------------------------------------------------------------------- */
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href^="#"]');
    if (!link) return;
    var target = document.getElementById(link.getAttribute('href').slice(1));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    target.focus({ preventScroll: true });
  });

  /* -------------------------------------------------------------------------
     Photo zoom (product gallery)
  ------------------------------------------------------------------------- */
  function initPhotoZoom() {
    document.addEventListener('click', function (e) {
      var img = e.target.closest('.product-gallery__img');
      if (!img || !img.dataset.zoom) return;

      var zoomed = document.createElement('div');
      zoomed.style.cssText = 'position:fixed;inset:0;z-index:500;background:rgba(44,40,38,.95);display:flex;align-items:center;justify-content:center;cursor:zoom-out;';
      zoomed.setAttribute('role', 'dialog');
      zoomed.setAttribute('aria-label', 'Imagem ampliada');

      var zImg = document.createElement('img');
      zImg.src = img.dataset.zoom;
      zImg.alt = img.alt;
      zImg.style.cssText = 'max-width:90vw;max-height:90vh;object-fit:contain;border-radius:4px;';

      var closeZ = document.createElement('button');
      closeZ.setAttribute('aria-label', 'Fechar imagem');
      closeZ.style.cssText = 'position:absolute;top:1rem;right:1rem;width:40px;height:40px;background:rgba(255,255,255,.1);border-radius:50%;color:#fff;display:flex;align-items:center;justify-content:center;font-size:1.25rem;border:none;cursor:pointer;';
      closeZ.innerHTML = '&times;';

      zoomed.appendChild(zImg);
      zoomed.appendChild(closeZ);
      document.body.appendChild(zoomed);
      document.body.style.overflow = 'hidden';

      function closeZoom() {
        document.body.removeChild(zoomed);
        document.body.style.overflow = '';
      }

      zoomed.addEventListener('click', function (ev) {
        if (ev.target === zoomed || ev.target === closeZ) closeZoom();
      });

      document.addEventListener('keydown', function onKey(ev) {
        if (ev.key === 'Escape') { closeZoom(); document.removeEventListener('keydown', onKey); }
      });
    });
  }

  /* -------------------------------------------------------------------------
     no-js class removal
  ------------------------------------------------------------------------- */
  document.documentElement.classList.remove('no-js');

  /* -------------------------------------------------------------------------
     Init all
  ------------------------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', function () {
    initTopBar();
    initHeader();
    initMobileMenu();
    initCart();
    initSearch();
    initProductGallery();
    initVariantSelector();
    initQtySelectors();
    initAccordions();
    initNewsletterForms();
    initShippingCalc();
    initSizeGuide();
    initWishlist();
    initRecentlyViewed();
    initCookiesBanner();
    initFilters();
    initCartPage();
    initLazyImages();
    initPhotoZoom();
  });

})();
