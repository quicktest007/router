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
    var coverage = selection.package === "2pack" ? "5,000" : "3,000";
    var specs = "WiFi 6 · Up to " + coverage + " sq ft coverage";

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
      "<p class=\"checkout-summary__specs\">" + specs + "</p>";
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

  /** Airtable form embed base URL (no query string). Prefill params added in buildAirtablePrefillUrl(). */
  var AIRTABLE_FORM_BASE_URL = "https://airtable.com/embed/app8UV0RBo7wvJy7G/pagKOCvwDdnEpCyel/form";

  /** Airtable field names – must match the table/form exactly. Package single-select options must be "1 Pack" | "2 Pack". */
  var AIRTABLE_PACKAGE_FIELD = "Package";
  var AIRTABLE_QTY_FIELD = "QTY";

  /**
   * Build the Airtable embed URL with prefill params so Package and QTY are submitted with the form.
   * hide_ was removed because hidden prefilled fields often do not submit in embeds; with prefill_ only,
   * Package and QTY will show in the form (prefilled) and will be saved. In Airtable, ensure the
   * "Package" field is Single select with options exactly "1 Pack" and "2 Pack".
   * @param {Object} selection - { package: "1pack"|"2pack", qty: number }
   * @returns {string} Full embed URL with ?prefill_Package=...&prefill_QTY=...
   */
  function buildAirtablePrefillUrl(selection) {
    if (!selection || (selection.package !== "1pack" && selection.package !== "2pack")) return "";

    var pkgLabel = selection.package === "1pack" ? "1 Pack" : "2 Pack";
    var qty = Math.min(99, Math.max(1, parseInt(selection.qty, 10) || 1));

    var params = [
      "prefill_" + AIRTABLE_PACKAGE_FIELD + "=" + encodeURIComponent(pkgLabel),
      "prefill_" + AIRTABLE_QTY_FIELD + "=" + encodeURIComponent(String(qty)),
      "_=" + String(Date.now())
    ];
    var sep = AIRTABLE_FORM_BASE_URL.indexOf("?") >= 0 ? "&" : "?";
    return AIRTABLE_FORM_BASE_URL + sep + params.join("&");
  }

  /**
   * Set the checkout iframe src to the Airtable form URL with prefill params.
   * If no selection, iframe src is not set (empty cart is shown instead).
   */
  function setAirtableFormPrefill(selection) {
    var iframe = document.getElementById("checkout-airtable-form");
    if (!iframe) return;
    var url = buildAirtablePrefillUrl(selection);
    if (url) {
      iframe.src = url;
    } else {
      iframe.removeAttribute("src");
    }
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

  /** Show the full-screen success overlay on top of the checkout (used when user submits the form). */
  function showSuccessModal() {
    if (successShown) return;
    successShown = true;

    if (typeof window.CESuccessOverlay !== "undefined" && window.CESuccessOverlay.openOverlay) {
      var extracted = window.CESuccessOverlay.extractDetails();
      window.CESuccessOverlay.openOverlay({
        headline: "Order confirmed",
        text: "Thank you for your order. We'll follow up with you soon.",
        primaryLabel: "Back to home",
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

  /** Only show success overlay once per page. */
  var successShown = false;

  /**
   * Safely check if we can detect success from the iframe (URL or body text).
   * Cross-origin will throw; we never surface errors.
   */
  function detectSuccessFromIframe() {
    var iframe = document.getElementById("checkout-airtable-form");
    if (!iframe) return false;
    try {
      var loc = iframe.contentWindow && iframe.contentWindow.location;
      if (loc && loc.href && loc.href.indexOf("/success") !== -1) return true;
    } catch (e) {}
    try {
      var doc = iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document);
      if (doc && doc.body && doc.body.innerText && doc.body.innerText.indexOf("Thank you") !== -1) return true;
    } catch (e) {}
    return false;
  }

  function init() {
    var selection = getSelection();
    if (selection && window.CEAnalytics && typeof window.CEAnalytics.capture === "function") {
      var pkgLabel = selection.package === "1pack" ? "1 Pack" : "2 Pack";
      window.CEAnalytics.capture("checkout_viewed", {
        package: pkgLabel,
        quantity: selection.qty,
        page: location.pathname || ""
      });
    }

    var submitted = getQueryParam("submitted");
    if (submitted === "1" || submitted === "true") {
      if (typeof history.replaceState === "function") {
        history.replaceState({}, document.title, window.location.pathname + window.location.hash);
      }
      selection = getSelection();
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

    /* 1) postMessage from Airtable embed – only accept from Airtable origin. */
    window.addEventListener("message", function (event) {
      if (!event.origin || event.origin.indexOf("airtable.com") === -1) return;
      var data;
      try {
        data = event.data;
      } catch (e) {
        return;
      }
      if (data == null) return;
      var isSubmit = false;
      if (typeof data === "string") {
        isSubmit = data === "formSubmit" || data === "submitSuccess" || data === "airtableFormSubmit";
      } else if (typeof data === "object") {
        isSubmit = data.type === "formSubmit" || data.event === "submitSuccess" || data.submitted === true;
      }
      if (isSubmit) {
        showSuccessModal();
        onFormSubmitted();
      }
    });

    /* 2) Fallback: observe iframe src for URL change to include "/success". */
    var iframe = document.getElementById("checkout-airtable-form");
    if (iframe) {
      try {
        var srcObserver = new MutationObserver(function (mutations) {
          for (var i = 0; i < mutations.length; i++) {
            if (mutations[i].attributeName === "src") {
              var src = iframe.getAttribute("src") || "";
              if (src.indexOf("/success") !== -1) {
                showSuccessModal();
                onFormSubmitted();
                srcObserver.disconnect();
                break;
              }
            }
          }
        });
        srcObserver.observe(iframe, { attributes: true, attributeFilter: ["src"] });
      } catch (e) {}
    }

    /* 3) Fallback: poll iframe location/body for success (cross-origin will throw; we ignore). */
    var pollCount = 0;
    var pollMax = 30;
    var pollInterval = setInterval(function () {
      if (successShown) {
        clearInterval(pollInterval);
        return;
      }
      pollCount++;
      if (pollCount > pollMax) {
        clearInterval(pollInterval);
        return;
      }
      if (detectSuccessFromIframe()) {
        clearInterval(pollInterval);
        showSuccessModal();
        onFormSubmitted();
      }
    }, 2000);

    showCheckoutWithSelection(selection);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
