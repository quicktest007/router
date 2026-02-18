/**
 * Covenant Eyes Router – Index: gallery (auto-advance, fade, keyboard), pack selector, add to cart
 */

(function () {
  "use strict";

  var GALLERY_IMAGES = [
    { src: "./assets/CErouter1pack.png", alt: "Covenant Eyes Router — 1 Pack" },
    { src: "./assets/routerathome.png", alt: "Covenant Eyes Router at home" },
    { src: "./assets/1packcoverage.png", alt: "1-Pack coverage — up to 3,000 sqft" },
    { src: "./assets/CErouter2pack.png", alt: "Covenant Eyes Router — 2 Pack" },
    { src: "./assets/2packcoverage.png", alt: "2-Pack coverage — up to 5,000 sqft" }
  ];

  var AUTO_ADVANCE_MS = 5000;
  var PAUSE_AFTER_INTERACTION_MS = 8000;
  var FADE_DURATION_MS = 280;

  var SAVINGS_2PACK = 99;

  var currentIndex = 0;
  var autoAdvanceTimerId = null;
  var pauseTimeoutId = null;

  function getPackSelection() {
    var btn = document.querySelector(".pack-selector__card.is-selected");
    if (!btn) return { package: "1pack", price: "299.00" };
    return {
      package: btn.getAttribute("data-package"),
      price: btn.getAttribute("data-price")
    };
  }

  function setPackSelection(pkg) {
    var btns = document.querySelectorAll(".pack-selector__card");
    btns.forEach(function (b) {
      var isSel = b.getAttribute("data-package") === pkg;
      b.classList.toggle("is-selected", isSel);
      b.setAttribute("aria-pressed", isSel ? "true" : "false");
    });
  }

  function updateSavings(pkg) {
    var el = document.getElementById("savings-line");
    if (!el) return;
    if (pkg === "2pack") {
      el.innerHTML = "You save <span class=\"card__savings-amount\">$" + SAVINGS_2PACK + "</span> (vs. buying two 1-packs)";
    } else {
      el.innerHTML = "You save <span class=\"card__savings-amount\">$0</span> (standard pricing)";
    }
  }

  function updateCoverage(pkg) {
    var el = document.getElementById("coverage-sqft");
    if (el) el.textContent = pkg === "2pack" ? "5,000" : "3,000";
  }

  function getQty() {
    var input = document.getElementById("qty-input");
    if (!input) return 0;
    var n = parseInt(input.value, 10);
    return isNaN(n) || n < 0 ? 0 : Math.min(99, n);
  }

  /** Selected package label for analytics (e.g. "1 Pack", "2 Pack"). */
  function getSelectedPackage() {
    var s = getPackSelection();
    return s.package === "1pack" ? "1 Pack" : "2 Pack";
  }

  /** Current quantity from stepper (integer 1–99). */
  function getQuantity() {
    return getQty();
  }

  function getSavings(pkg) {
    return pkg === "2pack" ? SAVINGS_2PACK : 0;
  }

  function syncFromPack() {
    var s = getPackSelection();
    updateSavings(s.package);
    updateCoverage(s.package);
    try {
      localStorage.setItem("selected_package", s.package);
      localStorage.setItem("selected_price", s.price);
    } catch (e) {}
  }

  function preloadNextImage() {
    var nextIdx = (currentIndex + 1) % GALLERY_IMAGES.length;
    var item = GALLERY_IMAGES[nextIdx];
    if (!item) return;
    var img = new Image();
    img.src = item.src;
  }

  function stopAutoAdvance() {
    if (autoAdvanceTimerId) {
      clearInterval(autoAdvanceTimerId);
      autoAdvanceTimerId = null;
    }
  }

  function startAutoAdvance() {
    stopAutoAdvance();
    autoAdvanceTimerId = setInterval(function () {
      nextImage(false);
    }, AUTO_ADVANCE_MS);
  }

  function pauseThenResume() {
    if (pauseTimeoutId) clearTimeout(pauseTimeoutId);
    stopAutoAdvance();
    pauseTimeoutId = setTimeout(function () {
      pauseTimeoutId = null;
      startAutoAdvance();
    }, PAUSE_AFTER_INTERACTION_MS);
  }

  function setImage(index, opts) {
    opts = opts || {};
    var fromUser = opts.fromUser === true;
    var skipFade = opts.skipFade === true;

    var len = GALLERY_IMAGES.length;
    currentIndex = (index + len) % len;

    var main = document.getElementById("product-image");
    var thumbs = document.querySelectorAll(".gallery__thumb");
    var counter = document.getElementById("gallery-counter");

    var item = GALLERY_IMAGES[currentIndex];
    if (!item) return;

    function applyImage() {
      if (main) {
        main.setAttribute("src", item.src);
        main.setAttribute("alt", item.alt);
        main.classList.remove("is-fading");
      }
      thumbs.forEach(function (t, idx) {
        var isActive = idx === currentIndex;
        t.classList.toggle("is-active", isActive);
        t.setAttribute("aria-selected", isActive ? "true" : "false");
      });
      if (counter) counter.textContent = (currentIndex + 1) + " / " + len;
      preloadNextImage();
    }

    if (skipFade || !main) {
      applyImage();
      return;
    }

    main.classList.add("is-fading");
    setTimeout(function () {
      applyImage();
    }, FADE_DURATION_MS);

    if (fromUser) {
      pauseThenResume();
      if (typeof track === "function") track("click_thumbnail", { index: currentIndex });
    }
  }

  function nextImage(fromUser) {
    setImage(currentIndex + 1, { fromUser: fromUser !== false });
  }

  function prevImage(fromUser) {
    setImage(currentIndex - 1, { fromUser: fromUser !== false });
  }

  function initGallery() {
    var thumbs = document.querySelectorAll(".gallery__thumb");
    var prevBtn = document.querySelector(".gallery__arrow--prev");
    var nextBtn = document.querySelector(".gallery__arrow--next");

    setImage(0, { skipFade: true });
    startAutoAdvance();

    thumbs.forEach(function (thumb, idx) {
      thumb.addEventListener("click", function () {
        setImage(idx, { fromUser: true });
      });
    });

    if (prevBtn) {
      prevBtn.addEventListener("click", function () {
        prevImage(true);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        nextImage(true);
      });
    }

    document.addEventListener("keydown", function (e) {
      var tag = e.target && e.target.tagName ? e.target.tagName.toUpperCase() : "";
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevImage(true);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        nextImage(true);
      }
    });
  }

  var GALLERY_INDEX_1PACK = 0;
  var GALLERY_INDEX_2PACK = 3;

  function initPackSelector() {
    var btns = document.querySelectorAll(".pack-selector__card");
    btns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var pkg = btn.getAttribute("data-package");
        var price = btn.getAttribute("data-price");
        setPackSelection(pkg);
        syncFromPack();
        var galleryIndex = pkg === "2pack" ? GALLERY_INDEX_2PACK : GALLERY_INDEX_1PACK;
        setImage(galleryIndex, { fromUser: true, skipFade: false });
        if (typeof track === "function") track("select_pack", { package: pkg, price: price });
      });
    });
  }

  function clearAddToCartError() {
    var btn = document.getElementById("btn-add-cart");
    var err = document.getElementById("add-to-cart-error");
    if (btn) btn.classList.remove("cta-bar__add-cart--error");
    if (err) {
      err.textContent = "";
      err.style.display = "none";
    }
  }

  function showAddToCartError() {
    var btn = document.getElementById("btn-add-cart");
    var err = document.getElementById("add-to-cart-error");
    if (btn) btn.classList.add("cta-bar__add-cart--error");
    if (err) {
      err.textContent = "Please add at least one item to your cart.";
      err.style.display = "block";
    }
  }

  function initQty() {
    var minus = document.getElementById("qty-minus");
    var plus = document.getElementById("qty-plus");
    var input = document.getElementById("qty-input");
    if (!input) return;

    var saved = parseInt(localStorage.getItem("selected_qty"), 10);
    if (!isNaN(saved) && saved >= 1 && saved <= 99) {
      input.value = String(saved);
    } else {
      input.value = "1";
    }
    if (typeof updateHeaderCartCount === "function") updateHeaderCartCount();

    function setQty(n) {
      n = Math.max(1, Math.min(99, n));
      input.value = String(n);
      clearAddToCartError();
      try {
        localStorage.setItem("selected_qty", String(n));
        if (typeof updateHeaderCartCount === "function") updateHeaderCartCount();
      } catch (e) {}
    }

    if (minus) minus.addEventListener("click", function () { setQty(getQty() - 1); });
    if (plus) plus.addEventListener("click", function () { setQty(getQty() + 1); });
  }

  function initAddToCart() {
    var btn = document.getElementById("btn-add-cart");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var qty = getQty();
      if (qty < 1) {
        showAddToCartError();
        return;
      }
      clearAddToCartError();
      var s = getPackSelection();
      var packageLabel = getSelectedPackage();
      try {
        if (window.posthog && typeof window.posthog.capture === "function") {
          window.posthog.capture("add_to_cart_clicked", { package: packageLabel, quantity: qty });
        }
      } catch (e) {}
      var savings = getSavings(s.package);
      if (typeof track === "function") track("add_to_cart", { package: s.package, price: s.price, qty: qty, savings: savings });
      try {
        localStorage.setItem("selected_package", s.package);
        localStorage.setItem("selected_price", s.price);
        localStorage.setItem("selected_qty", String(qty));
        localStorage.setItem("selected_savings", String(savings));
        localStorage.setItem("cart_has_items", "1");
        if (typeof updateHeaderCartCount === "function") updateHeaderCartCount();
      } catch (e) {}
      var url = "checkout.html?package=" + encodeURIComponent(s.package) + "&price=" + encodeURIComponent(s.price) + "&qty=" + encodeURIComponent(qty) + "&savings=" + encodeURIComponent(savings);
      window.location.href = url;
    });
  }

  function init() {
    if (typeof captureUTM === "function") captureUTM();
    if (typeof track === "function") track("view_product", {});
    if (window.CEAnalytics && typeof window.CEAnalytics.capture === "function") {
      window.CEAnalytics.capture("product_page_viewed", { page: location.pathname || "" });
    }

    initGallery();
    initPackSelector();
    initQty();
    initAddToCart();

    syncFromPack();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
