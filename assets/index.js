/**
 * Covenant Eyes Router – Index page behavior
 */
(function () {
  "use strict";

  function init() {
    if (typeof captureUTM === "function") captureUTM();
    if (typeof track === "function") track("view_product", {});

    var buttons = document.querySelectorAll(".pricing__btn[data-package][data-price]");
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var pkg = btn.getAttribute("data-package");
        var price = btn.getAttribute("data-price");
        try {
          localStorage.setItem("selected_package", pkg);
          localStorage.setItem("selected_price", price);
        } catch (e) {}
        if (typeof track === "function") track("select_package", { package: pkg, price: price });
        window.location.href = "checkout.html?package=" + encodeURIComponent(pkg);
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
