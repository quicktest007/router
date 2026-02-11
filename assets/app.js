/**
 * Covenant Eyes Router – Analytics & shared behavior
 */

(function () {
  "use strict";

  var EVENTS_KEY = "events";
  var UTM_KEY = "utm";

  /**
   * Track an event. Logs in dev and appends to localStorage "events" array.
   * @param {string} eventName - e.g. "view_product", "select_package", "submit_email"
   * @param {Object} [props] - optional event properties
   */
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
      var stored = localStorage.getItem(EVENTS_KEY);
      var list = stored ? JSON.parse(stored) : [];
      list.push(payload);
      localStorage.setItem(EVENTS_KEY, JSON.stringify(list));
    } catch (e) {
      if (console && console.warn) console.warn("track storage failed", e);
    }
  };

  /**
   * Capture UTM params and referrer from URL; store in localStorage.
   * Call once on index.html load.
   */
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

  /**
   * Get stored UTM object (for lead payload).
   * @returns {Object}
   */
  window.getStoredUTM = function () {
    try {
      var stored = localStorage.getItem(UTM_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  };
})();
