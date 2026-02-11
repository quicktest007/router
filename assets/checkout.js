/**
 * Covenant Eyes Router – Checkout page behavior
 * Optional: set WEBHOOK_URL in assets/config.js to POST leads to your endpoint.
 */
(function () {
  "use strict";

  var LEADS_KEY = "leads";
  var PACKAGE_PARAM = "package";

  function getQueryParam(name) {
    var params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  function getPackageFromPage() {
    var q = getQueryParam(PACKAGE_PARAM);
    if (q === "1pack" || q === "2pack") return { package: q, price: q === "1pack" ? "299.00" : "499.00" };
    try {
      var pkg = localStorage.getItem("selected_package");
      var price = localStorage.getItem("selected_price");
      if (pkg && (pkg === "1pack" || pkg === "2pack")) return { package: pkg, price: price || (pkg === "1pack" ? "299.00" : "499.00") };
    } catch (e) {}
    return null;
  }

  function redirectToIndex() {
    window.location.replace("index.html#pricing");
  }

  function showSummary(pkg, price) {
    var label = pkg === "1pack" ? "1 Pack" : "2 Pack";
    var el = document.getElementById("summary-text");
    if (el) el.textContent = label + " — $" + price + " USD";
  }

  function validateEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value || "");
  }

  function showEmailError(msg) {
    var err = document.getElementById("email-error");
    var input = document.getElementById("email");
    if (err) { err.textContent = msg || ""; err.style.display = msg ? "block" : "none"; }
    if (input) input.classList.toggle("error", !!msg);
  }

  function getLeads() {
    try {
      var raw = localStorage.getItem(LEADS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveLead(lead) {
    var list = getLeads();
    list.push(lead);
    try {
      localStorage.setItem(LEADS_KEY, JSON.stringify(list));
    } catch (e) {
      if (console && console.warn) console.warn("saveLead failed", e);
    }
  }

  function buildLeadPayload(email, pkg, price) {
    var utm = typeof getStoredUTM === "function" ? getStoredUTM() : {};
    return {
      email: email,
      selected_package: pkg,
      price: price,
      timestamp: new Date().toISOString(),
      utm_source: utm.utm_source || null,
      utm_medium: utm.utm_medium || null,
      utm_campaign: utm.utm_campaign || null,
      utm_content: utm.utm_content || null,
      utm_term: utm.utm_term || null,
      referrer: utm.referrer || (typeof document !== "undefined" && document.referrer) || null,
      user_agent: typeof navigator !== "undefined" && navigator.userAgent ? navigator.userAgent : null
    };
  }

  function sendToWebhook(lead, done) {
    var url = typeof WEBHOOK_URL !== "undefined" ? WEBHOOK_URL : "";
    if (!url || typeof fetch !== "function") {
      if (done) done(false);
      return;
    }
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lead)
    })
      .then(function (res) {
        if (done) done(res.ok);
      })
      .catch(function () {
        if (console && console.log) console.log("Lead saved locally (webhook failed or unavailable).");
        if (done) done(false);
      });
  }

  function showSuccess() {
    var formContainer = document.getElementById("checkout-form-container");
    var successEl = document.getElementById("checkout-success");
    if (formContainer) formContainer.classList.add("is-hidden");
    if (successEl) successEl.classList.add("is-visible");
  }

  function init() {
    var selection = getPackageFromPage();
    if (!selection) {
      redirectToIndex();
      return;
    }

    showSummary(selection.package, selection.price);

    var form = document.getElementById("checkout-form");
    var emailInput = document.getElementById("email");

    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var email = (emailInput && emailInput.value) ? emailInput.value.trim() : "";
        showEmailError("");

        if (!email) {
          showEmailError("Please enter your email address.");
          if (emailInput) emailInput.focus();
          return;
        }
        if (!validateEmail(email)) {
          showEmailError("Please enter a valid email address.");
          if (emailInput) emailInput.focus();
          return;
        }

        if (typeof track === "function") track("submit_email", { email: email, package: selection.package, price: selection.price });

        var lead = buildLeadPayload(email, selection.package, selection.price);
        saveLead(lead);

        sendToWebhook(lead, function (ok) {
          if (!ok && typeof WEBHOOK_URL !== "undefined" && WEBHOOK_URL && console && console.log) {
            console.log("Saved locally; webhook did not succeed.");
          }
        });

        showSuccess();
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
