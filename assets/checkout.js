/**
 * Covenant Eyes Router – Checkout: summary (pack, qty, total, savings), Airtable form embed
 */

(function () {
  "use strict";

  function getQueryParam(name) {
    var params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  function getSelection() {
    var q = getQueryParam("package");
    var pkg = (q === "1pack" || q === "2pack") ? q : null;
    if (!pkg) {
      try {
        pkg = localStorage.getItem("selectedPackage") || localStorage.getItem("selected_package");
        if (pkg !== "1pack" && pkg !== "2pack") pkg = null;
      } catch (e) {}
    }
    if (!pkg) return null;

    var priceStr = getQueryParam("price") || localStorage.getItem("selected_price");
    var price = (pkg === "1pack" ? "299.00" : "499.00");
    if (priceStr === "299" || priceStr === "299.00") price = "299.00";
    if (priceStr === "499" || priceStr === "499.00") price = "499.00";

    var qtyStr = getQueryParam("qty") || localStorage.getItem("selected_qty");
    var qty = 1;
    if (qtyStr) {
      var n = parseInt(qtyStr, 10);
      if (!isNaN(n) && n >= 1) qty = Math.min(99, n);
    }

    var savingsStr = getQueryParam("savings") || localStorage.getItem("selected_savings");
    var savings = pkg === "2pack" ? 99 : 0;
    if (savingsStr) {
      var s = parseInt(savingsStr, 10);
      if (!isNaN(s)) savings = s;
    }

    return { package: pkg, price: price, qty: qty, savings: savings };
  }

  function renderSummary(selection, container) {
    if (!container) return;
    var label = selection.package === "1pack" ? "1 Pack" : "2 Pack";
    var unitPrice = parseFloat(selection.price, 10);
    var total = (unitPrice * selection.qty).toFixed(2);

    var summary = document.createElement("div");
    summary.className = "checkout-summary";
    summary.innerHTML =
      "<p class=\"checkout-summary__label\">Your selection</p>" +
      "<p class=\"checkout-summary__value\">" + label + " — $" + selection.price + " each</p>" +
      "<p class=\"checkout-summary__qty\">Quantity: " + selection.qty + "</p>" +
      "<p class=\"checkout-summary__total\">Total: $" + total + " USD</p>" +
      (selection.savings > 0
        ? "<p class=\"checkout-summary__savings\">You save $" + selection.savings + " (vs. buying two 1-packs)</p>"
        : "") +
      "<p class=\"checkout-summary__note\">Summary reflects your selection from the product page. If you change the option in the form, your submission will use the form choice.</p>";
    container.innerHTML = "";
    container.appendChild(summary);
  }

  function getAssetsBase() {
    var path = window.location.pathname || "";
    var lastSlash = path.lastIndexOf("/");
    var dir = lastSlash >= 0 ? path.substring(0, lastSlash + 1) : "/";
    return window.location.origin + dir;
  }

  function setRouterImage(selection) {
    var wrap = document.getElementById("checkout-router-image");
    var img = document.getElementById("checkout-router-img");
    if (!wrap || !img) return;
    var filename = selection.package === "1pack" ? "CErouter1pack.png" : "CErouter2pack.png";
    var label = selection.package === "1pack" ? "1 Pack" : "2 Pack";
    img.src = getAssetsBase() + "assets/" + filename;
    img.alt = "Covenant Eyes Router – " + label;
    wrap.classList.remove("is-hidden");
  }

  function showEmptyCart() {
    var emptyEl = document.getElementById("checkout-empty");
    var columnsEl = document.getElementById("checkout-columns");
    var summaryContainer = document.getElementById("checkout-summary-container");
    var summaryCard = document.getElementById("checkout-summary-card");
    var formBlock = document.getElementById("checkout-form-block");
    var successEl = document.getElementById("checkout-success");
    if (emptyEl) emptyEl.classList.add("is-visible");
    if (columnsEl) columnsEl.classList.add("is-hidden");
    if (summaryContainer) summaryContainer.innerHTML = "";
    if (summaryCard) summaryCard.classList.add("is-hidden");
    if (formBlock) formBlock.classList.add("is-hidden");
    if (successEl) successEl.classList.remove("is-visible");
  }

  var AIRTABLE_FORM_BASE = "https://airtable.com/embed/app8UV0RBo7wvJy7G/pagKOCvwDdnEpCyel/form";

  /** Set iframe src with prefill_Package and prefill_QTY so the user's selection is sent to Airtable. */
  function setAirtableFormPrefill(selection) {
    var iframe = document.getElementById("checkout-airtable-form");
    if (!iframe) return;
    if (!selection || (selection.package !== "1pack" && selection.package !== "2pack")) {
      iframe.removeAttribute("src");
      return;
    }
    var pkgField = (typeof AIRTABLE_PACKAGE_FIELD !== "undefined" && AIRTABLE_PACKAGE_FIELD) ? AIRTABLE_PACKAGE_FIELD : "Package";
    var pkgValue = selection.package === "1pack" ? "1 Pack" : "2 Pack";
    var qtyField = (typeof AIRTABLE_QTY_FIELD !== "undefined" && AIRTABLE_QTY_FIELD) ? AIRTABLE_QTY_FIELD : "Qty";
    var qtyValue = String(selection.qty || 1);
    var params = [
      "prefill_" + encodeURIComponent(pkgField).replace(/%20/g, "+") + "=" + encodeURIComponent(pkgValue),
      "prefill_" + encodeURIComponent(qtyField).replace(/%20/g, "+") + "=" + encodeURIComponent(qtyValue)
    ];
    iframe.src = AIRTABLE_FORM_BASE + "?" + params.join("&");
  }

  function showCheckoutWithSelection(selection) {
    var emptyEl = document.getElementById("checkout-empty");
    var columnsEl = document.getElementById("checkout-columns");
    var summaryContainer = document.getElementById("checkout-summary-container");
    var summaryCard = document.getElementById("checkout-summary-card");
    var formBlock = document.getElementById("checkout-form-block");
    var formBody = document.getElementById("checkout-form-body");
    var successEl = document.getElementById("checkout-success");
    if (emptyEl) emptyEl.classList.remove("is-visible");
    if (columnsEl) columnsEl.classList.remove("is-hidden");
    if (summaryCard) summaryCard.classList.remove("is-hidden");
    if (summaryContainer) renderSummary(selection, summaryContainer);
    setRouterImage(selection);
    if (formBody) formBody.classList.remove("is-loaded");
    setAirtableFormPrefill(selection);
    if (formBlock) formBlock.classList.remove("is-hidden");
    if (successEl) successEl.classList.remove("is-visible");
  }

  function showSuccessView() {
    var emptyEl = document.getElementById("checkout-empty");
    var columnsEl = document.getElementById("checkout-columns");
    var summaryCard = document.getElementById("checkout-summary-card");
    var formBlock = document.getElementById("checkout-form-block");
    var successEl = document.getElementById("checkout-success");
    if (emptyEl) emptyEl.classList.remove("is-visible");
    if (columnsEl) columnsEl.classList.add("is-hidden");
    if (summaryCard) summaryCard.classList.add("is-hidden");
    if (formBlock) formBlock.classList.add("is-hidden");
    if (successEl) successEl.classList.add("is-visible");
  }

  /** Show the success modal overlay on top of the checkout (used when user submits the form). */
  function showSuccessModal() {
    if (typeof window.CESuccessOverlay !== "undefined" && window.CESuccessOverlay.openOverlay) {
      var extracted = window.CESuccessOverlay.extractDetails();
      window.CESuccessOverlay.openOverlay({
        headline: "Thank you! You're in!",
        text: "Your order was successful. You'll receive an email confirmation shortly.",
        primaryLabel: "Continue",
        primaryHref: "index.html",
        receiptUrl: extracted.receiptUrl,
        details: extracted.detailsLines.length > 0 ? extracted.detailsLines : null
      });
      return;
    }
    var modal = document.getElementById("checkout-success-modal");
    if (!modal) return;
    modal.classList.add("is-visible");
    modal.setAttribute("aria-hidden", "false");
  }

  /**
   * Notify that the form was submitted (from redirect param or postMessage).
   * Other scripts can listen: document.addEventListener("checkoutFormSubmitted", function (e) { ... });
   */
  function onFormSubmitted() {
    try {
      document.dispatchEvent(new CustomEvent("checkoutFormSubmitted"));
    } catch (err) {}
  }

  function init() {
    var submitted = getQueryParam("submitted");
    if (submitted === "1" || submitted === "true") {
      if (typeof history.replaceState === "function") {
        history.replaceState({}, document.title, window.location.pathname + window.location.hash);
      }
      var selection = getSelection();
      if (selection) {
        var iframe = document.getElementById("checkout-airtable-form");
        var formBody = document.getElementById("checkout-form-body");
        if (iframe && formBody) iframe.addEventListener("load", function () { formBody.classList.add("is-loaded"); });
        showCheckoutWithSelection(selection);
      }
      showSuccessModal();
      onFormSubmitted();
      return;
    }

    var selection = getSelection();
    if (!selection) {
      showEmptyCart();
      return;
    }

    var iframe = document.getElementById("checkout-airtable-form");
    var formBody = document.getElementById("checkout-form-body");
    if (iframe && formBody) {
      iframe.addEventListener("load", function onFormLoad() {
        formBody.classList.add("is-loaded");
      });
    }

    /* Listen for postMessage from Airtable embed when user submits (if Airtable sends it). */
    window.addEventListener("message", function (event) {
      if (event.origin !== "https://airtable.com" && event.origin !== "https://www.airtable.com") return;
      var data = event.data;
      if (data == null) return;
      var isSubmit =
        data === "formSubmit" ||
        data === "submitSuccess" ||
        (typeof data === "object" && (data.type === "formSubmit" || data.event === "submitSuccess" || data.submitted === true));
      if (isSubmit) {
        showSuccessModal();
        onFormSubmitted();
      }
    });

    showCheckoutWithSelection(selection);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
