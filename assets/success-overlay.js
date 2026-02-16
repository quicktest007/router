/**
 * CE Success Overlay – full-screen confirmation after checkout.
 * Namespace: ce-success-*. Append to body; does not alter existing layout.
 *
 * Customize: edit SUCCESS_STRINGS, OVERLAY_MESSAGES, or pass options into openOverlay().
 * Triggers: ?success=true, #success, DOM success text, checkoutFormSubmitted event,
 *          localStorage forceSuccessOverlay, or Ctrl+Shift+K (dev).
 */
(function () {
  "use strict";

  var OVERLAY_ID = "ce-success-overlay";
  var FOCUSABLE = "button, [href], input, select, textarea, [tabindex]:not([tabindex=\"-1\"])";

  // Text we consider "success" when found in the DOM (MutationObserver).
  var SUCCESS_STRINGS = [
    "Thank you! You're in!",
    "Order confirmed",
    "Payment successful"
  ];

  // Default copy (override via openOverlay({ headline, text }) or data attrs).
  var OVERLAY_MESSAGES = {
    headline: "Order confirmed",
    text: "Thank you for your order. We'll follow up with you soon.",
    primaryCta: "Back to home",
    receiptCta: "View receipt"
  };

  var overlayEl = null;
  var previousActiveElement = null;
  var focusTrapHandler = null;

  /**
   * Build and return the overlay DOM; append to document.body.
   * Call once on init (e.g. DOMContentLoaded).
   */
  function createOverlay() {
    if (document.getElementById(OVERLAY_ID)) return document.getElementById(OVERLAY_ID);

    var root = document.createElement("div");
    root.id = OVERLAY_ID;
    root.className = "success-overlay ce-success-overlay";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-labelledby", "ce-success-overlay-headline");
    root.setAttribute("aria-hidden", "true");

    root.innerHTML =
      '<button type="button" class="ce-success-overlay__close" aria-label="Close">\u00D7</button>' +
      '<div class="ce-success-overlay__card" role="document">' +
        '<div class="ce-success-overlay__icon" aria-hidden="true">\u2713</div>' +
        '<h2 id="ce-success-overlay-headline" class="ce-success-overlay__headline">' + escapeHtml(OVERLAY_MESSAGES.headline) + '</h2>' +
        '<p class="ce-success-overlay__text">' + escapeHtml(OVERLAY_MESSAGES.text) + '</p>' +
        '<div class="ce-success-overlay__details" id="ce-success-overlay-details"></div>' +
        '<div class="ce-success-overlay__actions">' +
          '<a href="index.html" class="ce-success-overlay__btn-primary" id="ce-success-overlay-primary">' + escapeHtml(OVERLAY_MESSAGES.primaryCta) + '</a>' +
          '<a href="#" class="ce-success-overlay__btn-secondary is-hidden" id="ce-success-overlay-receipt">' + escapeHtml(OVERLAY_MESSAGES.receiptCta) + '</a>' +
        '</div>' +
      '</div>';

    document.body.appendChild(root);
    overlayEl = root;

    var closeBtn = root.querySelector(".ce-success-overlay__close");
    var card = root.querySelector(".ce-success-overlay__card");
    var primaryBtn = root.querySelector("#ce-success-overlay-primary");
    var receiptBtn = root.querySelector("#ce-success-overlay-receipt");

    closeBtn.addEventListener("click", function () { closeOverlay(); });
    root.addEventListener("click", function (e) {
      if (e.target === root) closeOverlay();
    });
    root.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeOverlay();
      }
    });

    receiptBtn.addEventListener("click", function (e) {
      if (receiptBtn.classList.contains("is-hidden") || receiptBtn.getAttribute("href") === "#") {
        e.preventDefault();
        closeOverlay();
      }
    });

    return root;
  }

  function escapeHtml(s) {
    var div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  /**
   * Show the overlay. Optionally pass { headline, text, primaryHref, primaryLabel, receiptUrl, details }.
   * details: string or array of lines for the details block (order total, email, plan, etc.).
   */
  function openOverlay(options) {
    options = options || {};
    if (!overlayEl) createOverlay();

    previousActiveElement = document.activeElement;

    var headline = options.headline != null ? options.headline : OVERLAY_MESSAGES.headline;
    var text = options.text != null ? options.text : OVERLAY_MESSAGES.text;
    var primaryLabel = options.primaryLabel != null ? options.primaryLabel : OVERLAY_MESSAGES.primaryCta;
    var primaryHref = options.primaryHref != null ? options.primaryHref : "index.html";
    var receiptUrl = options.receiptUrl;

    var headlineEl = overlayEl.querySelector("#ce-success-overlay-headline");
    var textEl = overlayEl.querySelector(".ce-success-overlay__text");
    var detailsEl = overlayEl.querySelector("#ce-success-overlay-details");
    var primaryBtn = overlayEl.querySelector("#ce-success-overlay-primary");
    var receiptBtn = overlayEl.querySelector("#ce-success-overlay-receipt");

    if (headlineEl) headlineEl.textContent = headline;
    if (textEl) textEl.textContent = text;
    if (primaryBtn) {
      primaryBtn.textContent = primaryLabel;
      primaryBtn.setAttribute("href", primaryHref);
    }

    if (options.details != null && (typeof options.details === "string" ? options.details : options.details.length)) {
      if (typeof options.details === "string") {
        detailsEl.innerHTML = escapeHtml(options.details).replace(/\n/g, "<br>");
      } else {
        detailsEl.innerHTML = options.details.map(function (line) { return escapeHtml(line); }).join("<br>");
      }
    } else {
      detailsEl.textContent = "";
    }

    if (receiptUrl) {
      receiptBtn.setAttribute("href", receiptUrl);
      receiptBtn.classList.remove("is-hidden");
    } else {
      receiptBtn.setAttribute("href", "#");
      receiptBtn.classList.add("is-hidden");
    }

    overlayEl.classList.add("is-visible");
    overlayEl.setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("ce-success-overlay-open");
    document.body.classList.add("ce-success-overlay-open");

    var legacyModal = document.getElementById("checkout-success-modal");
    if (legacyModal) {
      legacyModal.classList.remove("is-visible");
      legacyModal.setAttribute("aria-hidden", "true");
    }

    trapFocus(overlayEl);
    setTimeout(function () {
      var firstFocusable = overlayEl.querySelector(FOCUSABLE);
      if (firstFocusable) firstFocusable.focus();
    }, 0);
  }

  /**
   * Hide overlay, restore scroll, restore focus to the element that had it when opened.
   */
  function closeOverlay() {
    if (!overlayEl) return;

    overlayEl.classList.remove("is-visible");
    overlayEl.setAttribute("aria-hidden", "true");
    document.documentElement.classList.remove("ce-success-overlay-open");
    document.body.classList.remove("ce-success-overlay-open");

    if (focusTrapHandler) {
      document.removeEventListener("keydown", focusTrapHandler);
      focusTrapHandler = null;
    }

    if (previousActiveElement && typeof previousActiveElement.focus === "function") {
      try { previousActiveElement.focus(); } catch (e) {}
    }
    previousActiveElement = null;
  }

  /**
   * Keep tab focus inside the overlay while open.
   */
  function trapFocus(container) {
    if (focusTrapHandler) document.removeEventListener("keydown", focusTrapHandler);

    focusTrapHandler = function (e) {
      if (e.key !== "Tab") return;
      var focusable = [].slice.call(container.querySelectorAll(FOCUSABLE));
      if (focusable.length === 0) return;

      var first = focusable[0];
      var last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", focusTrapHandler);
  }

  /**
   * Read order total, product/plan name, email from the page if present.
   * Returns an object { detailsLines: string[], receiptUrl: string|undefined }.
   */
  function extractDetails() {
    var detailsLines = [];
    var receiptUrl = null;

    var totalEl = document.querySelector(".checkout-summary__total");
    if (totalEl) {
      var totalText = totalEl.textContent.trim();
      if (totalText) detailsLines.push("Total: " + totalText);
    }

    var valueEl = document.querySelector(".checkout-summary__value");
    if (valueEl) {
      var planText = valueEl.textContent.trim();
      if (planText) detailsLines.push("Plan: " + planText);
    }

    var qtyEl = document.querySelector(".checkout-summary__qty");
    if (qtyEl) {
      var qtyText = qtyEl.textContent.trim();
      if (qtyText) detailsLines.push(qtyText);
    }

    var emailInput = document.querySelector("#checkout-airtable-form") && document.querySelector('input[type="email"]');
    if (emailInput && emailInput.value) {
      detailsLines.push("Email: " + emailInput.value);
    }

    if (typeof window.CE_SUCCESS_RECEIPT_URL !== "undefined" && window.CE_SUCCESS_RECEIPT_URL) {
      receiptUrl = window.CE_SUCCESS_RECEIPT_URL;
    }

    return { detailsLines: detailsLines, receiptUrl: receiptUrl };
  }

  /**
   * Check URL and hash for success flags; check DOM for success text.
   */
  function checkSuccessIndicators() {
    var params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true" || params.get("submitted") === "1" || params.get("submitted") === "true") {
      return true;
    }
    if (window.location.hash === "#success") {
      return true;
    }
    var bodyText = document.body ? document.body.innerText || document.body.textContent || "" : "";
    for (var i = 0; i < SUCCESS_STRINGS.length; i++) {
      if (bodyText.indexOf(SUCCESS_STRINGS[i]) !== -1) return true;
    }
    return false;
  }

  /**
   * Use MutationObserver to show overlay when success text appears in the DOM (e.g. after form submit).
   */
  function observeSuccessState() {
    var observed = false;

    function maybeShow() {
      if (observed) return;
      if (!checkSuccessIndicators()) return;
      observed = true;
      var extracted = extractDetails();
      openOverlay({
        headline: "Order confirmed",
        text: "Thank you for your order. We'll follow up with you soon.",
        primaryLabel: "Back to home",
        primaryHref: "index.html",
        receiptUrl: extracted.receiptUrl,
        details: extracted.detailsLines.length > 0 ? extracted.detailsLines : null
      });
    }

    if (checkSuccessIndicators()) {
      maybeShow();
      return;
    }

    var observer = new MutationObserver(function () {
      if (checkSuccessIndicators()) maybeShow();
    });

    observer.observe(document.body, { childList: true, subtree: true, characterData: true, characterDataOldValue: true });
  }

  function init() {
    createOverlay();

    if (checkSuccessIndicators()) {
      var extracted = extractDetails();
      openOverlay({
        headline: "Order confirmed",
        text: "Thank you for your order. We'll follow up with you soon.",
        primaryLabel: "Back to home",
        primaryHref: "index.html",
        receiptUrl: extracted.receiptUrl,
        details: extracted.detailsLines.length > 0 ? extracted.detailsLines : null
      });
      return;
    }

    try {
      if (localStorage.getItem("forceSuccessOverlay") === "true") {
        openOverlay({ headline: "Order confirmed", text: "Your order was successful. (Dev: forceSuccessOverlay)" });
        return;
      }
    } catch (e) {}

    observeSuccessState();

    document.addEventListener("checkoutFormSubmitted", function () {
      if (overlayEl && overlayEl.classList.contains("is-visible")) return;
      var extracted = extractDetails();
      openOverlay({
        headline: "Order confirmed",
        text: "Thank you for your order. We'll follow up with you soon.",
        primaryLabel: "Back to home",
        primaryHref: "index.html",
        receiptUrl: extracted.receiptUrl,
        details: extracted.detailsLines.length > 0 ? extracted.detailsLines : null
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.ctrlKey && e.shiftKey && e.key === "K") {
        e.preventDefault();
        if (overlayEl && overlayEl.classList.contains("is-visible")) {
          closeOverlay();
        } else {
          openOverlay({ headline: "Thank you! You're in! (Dev)", text: "Ctrl+Shift+K toggles this overlay." });
        }
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.CESuccessOverlay = { createOverlay: createOverlay, openOverlay: openOverlay, closeOverlay: closeOverlay, trapFocus: trapFocus, observeSuccessState: observeSuccessState, extractDetails: extractDetails };
})();
