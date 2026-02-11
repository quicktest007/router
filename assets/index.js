/**
 * Covenant Eyes Router – Index page: pills, price, checkout, learn more
 */

(function () {
  "use strict";

  function getSelection() {
    var selected = document.querySelector(".card__pill.is-selected");
    if (!selected) return { package: "1pack", price: "299.00" };
    return {
      package: selected.getAttribute("data-package"),
      price: selected.getAttribute("data-price")
    };
  }

  function updatePrice(price) {
    var el = document.getElementById("dynamic-price");
    if (el) el.textContent = "$" + price + ".00";
  }

  function updateCheckoutHref(pkg) {
    var el = document.getElementById("btn-checkout");
    if (el) el.setAttribute("href", "checkout.html?package=" + encodeURIComponent(pkg));
  }

  function syncUI() {
    var s = getSelection();
    updatePrice(s.price);
    updateCheckoutHref(s.package);
  }

  function init() {
    if (typeof captureUTM === "function") captureUTM();
    if (typeof track === "function") track("view_product", {});

    var pills = document.querySelectorAll(".card__pill");
    pills.forEach(function (pill) {
      pill.addEventListener("click", function () {
        pills.forEach(function (p) {
          p.classList.remove("is-selected");
          p.setAttribute("aria-pressed", "false");
        });
        pill.classList.add("is-selected");
        pill.setAttribute("aria-pressed", "true");
        syncUI();
        if (typeof track === "function") {
          track("select_package", {
            package: pill.getAttribute("data-package"),
            price: pill.getAttribute("data-price")
          });
        }
      });
    });

    var checkoutBtn = document.getElementById("btn-checkout");
    if (checkoutBtn) {
      checkoutBtn.addEventListener("click", function (e) {
        var s = getSelection();
        try {
          localStorage.setItem("selected_package", s.package);
          localStorage.setItem("selected_price", s.price);
        } catch (err) {}
        if (typeof track === "function") track("click_checkout", { package: s.package, price: s.price });
        e.preventDefault();
        window.location.href = "checkout.html?package=" + encodeURIComponent(s.package);
      });
    }

    syncUI();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
