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
