/**
 * Covenant Eyes Router – Index page behavior
 * Single-card layout with 1 Pack / 2 Pack pill toggle; price and CTA update with selection.
 */
(function () {
  "use strict";

  function getSelection() {
    var active = document.querySelector(".product-card__pill.is-active");
    if (!active) return { package: "1pack", price: "299.00" };
    return {
      package: active.getAttribute("data-package"),
      price: active.getAttribute("data-price")
    };
  }

  function setPrice(price) {
    var el = document.getElementById("product-price");
    if (el) el.innerHTML = "$" + price + " <span>USD</span>";
  }

  function setBadge(visible) {
    var el = document.getElementById("product-badge");
    if (el) el.classList.toggle("is-visible", !!visible);
  }

  function setCtaHref(pkg) {
    var el = document.getElementById("product-cta");
    if (el) el.setAttribute("href", "checkout.html?package=" + encodeURIComponent(pkg));
  }

  function updateFromSelection() {
    var s = getSelection();
    setPrice(s.price);
    setBadge(s.package === "2pack");
    setCtaHref(s.package);
  }

  function init() {
    if (typeof captureUTM === "function") captureUTM();
    if (typeof track === "function") track("view_product", {});

    var pills = document.querySelectorAll(".product-card__pill");
    pills.forEach(function (pill) {
      pill.addEventListener("click", function () {
        pills.forEach(function (p) {
          p.classList.remove("is-active");
          p.setAttribute("aria-pressed", "false");
        });
        pill.classList.add("is-active");
        pill.setAttribute("aria-pressed", "true");
        updateFromSelection();
      });
    });

    var cta = document.getElementById("product-cta");
    if (cta) {
      cta.addEventListener("click", function (e) {
        var s = getSelection();
        try {
          localStorage.setItem("selected_package", s.package);
          localStorage.setItem("selected_price", s.price);
        } catch (err) {}
        if (typeof track === "function") track("select_package", { package: s.package, price: s.price });
        e.preventDefault();
        window.location.href = "checkout.html?package=" + encodeURIComponent(s.package);
      });
    }

    updateFromSelection();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
