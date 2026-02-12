/**
 * Covenant Eyes Router – Tracking and UTM
 * Events: view_product, select_pack, click_thumbnail, select_home_profile, add_to_cart, submit_email
 */

(function () {
  "use strict";

  var EVENTS_KEY = "events";
  var UTM_KEY = "utm";

  window.track = function (eventName, props) {
    var payload = {
      name: eventName,
      props: props || {},
      ts: new Date().toISOString()
    };
    if (typeof console !== "undefined" && console.log) {
      console.log("[track]", eventName, payload);
    }
    try {
      var raw = localStorage.getItem(EVENTS_KEY);
      var list = raw ? JSON.parse(raw) : [];
      list.push(payload);
      localStorage.setItem(EVENTS_KEY, JSON.stringify(list));
    } catch (e) {
      if (console && console.warn) console.warn("track failed", e);
    }
  };

  window.captureUTM = function () {
    try {
      var params = new URLSearchParams(window.location.search);
      var utm = {};
      ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach(function (key) {
        var val = params.get(key);
        if (val) utm[key] = val;
      });
      if (document.referrer) utm.referrer = document.referrer;
      if (Object.keys(utm).length) {
        localStorage.setItem(UTM_KEY, JSON.stringify(utm));
      }
    } catch (e) {
      if (console && console.warn) console.warn("captureUTM failed", e);
    }
  };

  window.getStoredUTM = function () {
    try {
      var raw = localStorage.getItem(UTM_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  };

  function updateHeaderCartCount() {
    try {
      var el = document.getElementById("header-cart-count");
      if (!el) return;
      var qty = parseInt(localStorage.getItem("selected_qty"), 10);
      if (isNaN(qty) || qty < 1) {
        el.textContent = "";
        el.classList.remove("is-visible");
      } else {
        el.textContent = qty > 99 ? "99+" : String(qty);
        el.classList.add("is-visible");
      }
    } catch (e) {}
  }

  window.updateHeaderCartCount = updateHeaderCartCount;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", updateHeaderCartCount);
  } else {
    updateHeaderCartCount();
  }
})();
