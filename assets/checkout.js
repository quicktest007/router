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

  var AIRTABLE_FORM_BASE = "https://airtable.com/embed/app8UV0RBo7wvJy7G/pagKOCvwDdnEpCyel/form";

  /**
   * Build Airtable embed URL with prefill + hide params so Package and QTY are submitted but not editable.
   * Fields must remain in the Airtable form; hide_Package=true and hide_QTY=true hide them in the UI.
   * Structure: ?prefill_Package=...&prefill_QTY=...&hide_Package=true&hide_QTY=true
   */
  function setAirtableFormPrefill(selection) {
    var iframe = document.getElementById("checkout-airtable-form");
    if (!iframe) return;
    if (!selection || (selection.package !== "1pack" && selection.package !== "2pack")) {
      iframe.removeAttribute("src");
      return;
    }
    var pkgField = (typeof AIRTABLE_PACKAGE_FIELD !== "undefined" && AIRTABLE_PACKAGE_FIELD) ? AIRTABLE_PACKAGE_FIELD : "Package";
    var qtyField = (typeof AIRTABLE_QTY_FIELD !== "undefined" && AIRTABLE_QTY_FIELD) ? AIRTABLE_QTY_FIELD : "QTY";
    var pkgValue = selection.package === "1pack" ? "1 Pack" : "2 Pack";
    var qtyValue = String(Math.min(99, Math.max(1, parseInt(selection.qty, 10) || 1)));

    function enc(name) {
      return encodeURIComponent(name).replace(/%20/g, "+");
    }
    function encVal(val) {
      return encodeURIComponent(val).replace(/%20/g, "+");
    }

    var params = [
      "prefill_" + enc(pkgField) + "=" + encVal(pkgValue),
      "prefill_" + enc(qtyField) + "=" + encVal(qtyValue),
      "hide_" + enc(pkgField) + "=true",
      "hide_" + enc(qtyField) + "=true"
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
