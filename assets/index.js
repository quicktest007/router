/**
 * Covenant Eyes Router – Index: gallery, pack selector, home guide, add to cart
 */

(function () {
  "use strict";

  var GALLERY_SRCS = [
    "./assets/CErouter1pack.png",
    "./assets/routerathome.png",
    "./assets/1packcoverage.png",
    "./assets/CErouter2pack.png",
    "./assets/2packcoverage.png"
  ];
  var GALLERY_ALTS = [
    "Covenant Eyes Router — 1 Pack",
    "Covenant Eyes Router at home",
    "1-Pack coverage — up to 3,000 sqft",
    "Covenant Eyes Router — 2 Pack",
    "2-Pack coverage — up to 5,000 sqft"
  ];
  var CURRENT_INDEX_KEY = "gallery_index";
  var SAVINGS_2PACK = 99;

  function getPackSelection() {
    var btn = document.querySelector(".pack-selector__btn.is-selected");
    if (!btn) return { package: "1pack", price: "299.00" };
    return {
      package: btn.getAttribute("data-package"),
      price: btn.getAttribute("data-price")
    };
  }

  function setPackSelection(pkg) {
    var btns = document.querySelectorAll(".pack-selector__btn");
    btns.forEach(function (b) {
      var isSel = b.getAttribute("data-package") === pkg;
      b.classList.toggle("is-selected", isSel);
      b.setAttribute("aria-pressed", isSel ? "true" : "false");
    });
  }

  function updatePrice(price) {
    var el = document.getElementById("dynamic-price");
    if (el) el.textContent = "$" + price;
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

  function updateProductImage(pkg) {
    var img = document.getElementById("product-image");
    if (!img) return;
    var src = pkg === "2pack" ? "./assets/CErouter2pack.png" : "./assets/CErouter1pack.png";
    var alt = pkg === "2pack" ? "Covenant Eyes Router — 2 Pack" : "Covenant Eyes Router — 1 Pack";
    img.setAttribute("src", src);
    img.setAttribute("alt", alt);
  }

  function getQty() {
    var input = document.getElementById("qty-input");
    if (!input) return 1;
    var n = parseInt(input.value, 10);
    return isNaN(n) || n < 1 ? 1 : Math.min(99, n);
  }

  function getSavings(pkg) {
    return pkg === "2pack" ? SAVINGS_2PACK : 0;
  }

  function syncFromPack() {
    var s = getPackSelection();
    updatePrice(s.price);
    updateSavings(s.package);
    updateProductImage(s.package);
    try {
      localStorage.setItem("selected_package", s.package);
      localStorage.setItem("selected_price", s.price);
    } catch (e) {}
  }

  function initGallery() {
    var main = document.getElementById("product-image");
    var thumbs = document.querySelectorAll(".gallery__thumb");
    var counter = document.getElementById("gallery-counter");
    var prevBtn = document.querySelector(".gallery__arrow--prev");
    var nextBtn = document.querySelector(".gallery__arrow--next");
    var current = 0;

    function setCurrent(i) {
      current = (i + GALLERY_SRCS.length) % GALLERY_SRCS.length;
      if (main) {
        main.setAttribute("src", GALLERY_SRCS[current]);
        main.setAttribute("alt", GALLERY_ALTS[current]);
      }
      thumbs.forEach(function (t, idx) {
        t.classList.toggle("is-active", idx === current);
        t.setAttribute("aria-selected", idx === current ? "true" : "false");
      });
      if (counter) counter.textContent = (current + 1) + " / " + GALLERY_SRCS.length;
      if (typeof track === "function") track("click_thumbnail", { index: current });
    }

    thumbs.forEach(function (thumb, idx) {
      thumb.addEventListener("click", function () {
        setCurrent(idx);
      });
    });
    if (prevBtn) prevBtn.addEventListener("click", function () { setCurrent(current - 1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { setCurrent(current + 1); });
  }

  function initPackSelector() {
    var btns = document.querySelectorAll(".pack-selector__btn");
    btns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var pkg = btn.getAttribute("data-package");
        var price = btn.getAttribute("data-price");
        setPackSelection(pkg);
        syncFromPack();
        if (typeof track === "function") track("select_pack", { package: pkg, price: price });
      });
    });
  }

  function initHomeGuide() {
    var tiles = document.querySelectorAll(".home-guide__tile");
    var recEl = document.getElementById("home-recommendation");

    tiles.forEach(function (tile) {
      tile.addEventListener("click", function () {
        tiles.forEach(function (t) { t.classList.remove("is-selected"); });
        tile.classList.add("is-selected");
        var profile = tile.getAttribute("data-profile");
        var recommend = tile.getAttribute("data-recommend");
        var rationale = tile.getAttribute("data-rationale");
        setPackSelection(recommend);
        syncFromPack();
        if (recEl) recEl.textContent = "We recommend " + (recommend === "2pack" ? "2 Pack" : "1 Pack") + ". " + rationale;
        if (typeof track === "function") track("select_home_profile", { profile: profile, recommended_pack: recommend });
      });
    });
  }

  function initQty() {
    var minus = document.getElementById("qty-minus");
    var plus = document.getElementById("qty-plus");
    var input = document.getElementById("qty-input");
    if (!input) return;

    function setQty(n) {
      n = Math.max(1, Math.min(99, n));
      input.value = String(n);
    }

    if (minus) minus.addEventListener("click", function () { setQty(getQty() - 1); });
    if (plus) plus.addEventListener("click", function () { setQty(getQty() + 1); });
  }

  function initAddToCart() {
    var btn = document.getElementById("btn-add-cart");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var s = getPackSelection();
      var qty = getQty();
      var savings = getSavings(s.package);
      if (typeof track === "function") track("add_to_cart", { package: s.package, price: s.price, qty: qty, savings: savings });
      try {
        localStorage.setItem("selected_package", s.package);
        localStorage.setItem("selected_price", s.price);
        localStorage.setItem("selected_qty", String(qty));
        localStorage.setItem("selected_savings", String(savings));
      } catch (e) {}
      var url = "checkout.html?package=" + encodeURIComponent(s.package) + "&price=" + encodeURIComponent(s.price) + "&qty=" + encodeURIComponent(qty) + "&savings=" + encodeURIComponent(savings);
      window.location.href = url;
    });
  }

  function init() {
    if (typeof captureUTM === "function") captureUTM();
    if (typeof track === "function") track("view_product", {});

    initGallery();
    initPackSelector();
    initHomeGuide();
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
