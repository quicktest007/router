/**
 * Optional: set WEBHOOK_URL to POST leads to your endpoint (e.g. Google Sheets).
 * Leave empty to only store leads in localStorage.
 */
var WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbxgBgwHzhxqmT6LETD-BDwWHk4bPl0wpz5K6zQxKANMB_dcH-cRvrZ8plPwB3U-Xw-fbg/exec";

/**
 * Worker endpoint for sending leads to Airtable.
 * If set, checkout will POST the lead payload here (used by submitLead).
 */
var WORKER_URL = "https://lingering-resonance-c646.jd-hcovenanteyes.workers.dev/";

async function submitLead(payload) {
  var res = await fetch(WORKER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
