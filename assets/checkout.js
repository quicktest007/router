/**
 * Covenant Eyes Router – Checkout: summary (pack, qty, total, savings), email, lead
 */

(function () {
  "use strict";

  var LEADS_KEY = "leads";

  function getQueryParam(name) {
    var params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  function getSelection() {
    var q = getQueryParam("package");
    var pkg = (q === "1pack" || q === "2pack") ? q : null;
    if (!pkg) {
      try {
        pkg = localStorage.getItem("selected_package");
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

  function redirectToIndex() {
    window.location.replace("index.html");
  }

  function setSummary(selection) {
    var label = selection.package === "1pack" ? "1 Pack" : "2 Pack";
    var unitPrice = parseFloat(selection.price, 10);
    var total = (unitPrice * selection.qty).toFixed(2);

    var valEl = document.getElementById("summary-value");
    if (valEl) valEl.textContent = label + " — $" + selection.price + " each";

    var qtyEl = document.getElementById("summary-qty");
    if (qtyEl) qtyEl.textContent = "Quantity: " + selection.qty;

    var totalEl = document.getElementById("summary-total");
    if (totalEl) totalEl.textContent = "Total: $" + total + " USD";

    var savEl = document.getElementById("summary-savings");
    if (savEl) {
      if (selection.savings > 0) {
        savEl.textContent = "You save $" + selection.savings + " (vs. buying two 1-packs)";
        savEl.style.display = "block";
      } else {
        savEl.style.display = "none";
      }
    }
  }

  function validateEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((value || "").trim());
  }

  function showError(msg) {
    var err = document.getElementById("email-error");
    var input = document.getElementById("email");
    if (err) {
      err.textContent = msg || "";
      err.style.display = msg ? "block" : "none";
    }
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

  function buildLead(email, selection) {
    var utm = typeof getStoredUTM === "function" ? getStoredUTM() : {};
    return {
      email: email,
      selected_package: selection.package,
      price: selection.price,
      qty: selection.qty,
      savings: selection.savings,
      total: (parseFloat(selection.price, 10) * selection.qty).toFixed(2),
      timestamp: new Date().toISOString(),
      referrer: utm.referrer || (typeof document !== "undefined" && document.referrer) || null,
      user_agent: typeof navigator !== "undefined" && navigator.userAgent ? navigator.userAgent : null,
      utm_source: utm.utm_source || null,
      utm_medium: utm.utm_medium || null,
      utm_campaign: utm.utm_campaign || null,
      utm_content: utm.utm_content || null,
      utm_term: utm.utm_term || null
    };
  }

  function sendWebhook(lead, done) {
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
      .then(function (res) { if (done) done(res.ok); })
      .catch(function () {
        if (console && console.log) console.log("Lead saved locally; webhook failed.");
        if (done) done(false);
      });
  }

  function showSuccess() {
    var formBlock = document.getElementById("checkout-form-block");
    var successEl = document.getElementById("checkout-success");
    if (formBlock) formBlock.classList.add("is-hidden");
    if (successEl) successEl.classList.add("is-visible");
  }

  function init() {
    var selection = getSelection();
    if (!selection) {
      redirectToIndex();
      return;
    }

    setSummary(selection);

    var form = document.getElementById("checkout-form");
    var emailInput = document.getElementById("email");

    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var email = (emailInput && emailInput.value) ? emailInput.value.trim() : "";
        showError("");

        if (!email) {
          showError("Please enter your email address.");
          if (emailInput) emailInput.focus();
          return;
        }
        if (!validateEmail(email)) {
          showError("Please enter a valid email address.");
          if (emailInput) emailInput.focus();
          return;
        }

        if (typeof track === "function") {
          track("submit_email", {
            email: email,
            package: selection.package,
            price: selection.price,
            qty: selection.qty,
            savings: selection.savings
          });
        }

        var lead = buildLead(email, selection);
        saveLead(lead);
        sendWebhook(lead, function () {});
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
