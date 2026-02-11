/**
 * Covenant Eyes Router – Admin page (local leads viewer)
 * Simple password gate – not secure; prevents accidental viewing only.
 */
(function () {
  "use strict";

  var LEADS_KEY = "leads";
  var ADMIN_PASSWORD = "router2025"; // change as needed; not secure
  var UNLOCK_KEY = "admin_unlock";

  function getLeads() {
    try {
      var raw = localStorage.getItem(LEADS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function showGate() {
    var gate = document.getElementById("admin-gate");
    var content = document.getElementById("admin-content");
    if (gate) gate.style.display = "block";
    if (content) content.classList.remove("is-visible");
  }

  function showContent() {
    var gate = document.getElementById("admin-gate");
    var content = document.getElementById("admin-content");
    if (gate) gate.style.display = "none";
    if (content) content.classList.add("is-visible");
    renderTable();
  }

  function renderTable() {
    var tbody = document.getElementById("admin-tbody");
    var emptyEl = document.getElementById("admin-empty");
    var tableWrap = document.querySelector(".admin__table-wrap");
    var leads = getLeads();

    if (tbody) tbody.innerHTML = "";
    if (emptyEl) emptyEl.style.display = "none";
    if (tableWrap) tableWrap.style.display = "block";

    if (!leads.length) {
      if (emptyEl) emptyEl.style.display = "block";
      if (tableWrap) tableWrap.style.display = "none";
      return;
    }

    leads.forEach(function (lead) {
      var tr = document.createElement("tr");
      tr.innerHTML =
        "<td>" + escapeHtml(lead.email || "") + "</td>" +
        "<td>" + escapeHtml(lead.selected_package || "") + "</td>" +
        "<td>" + escapeHtml(lead.price != null ? lead.price : "") + "</td>" +
        "<td>" + escapeHtml(lead.timestamp || "") + "</td>" +
        "<td>" + escapeHtml(lead.utm_source || "") + "</td>";
      if (tbody) tbody.appendChild(tr);
    });
  }

  function escapeHtml(s) {
    if (s == null) return "";
    var div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  function exportJson() {
    var leads = getLeads();
    var blob = new Blob([JSON.stringify(leads, null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "covenant-eyes-router-leads-" + new Date().toISOString().slice(0, 10) + ".json";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function init() {
    if (sessionStorage.getItem(UNLOCK_KEY) === "1") {
      showContent();
      return;
    }

    var input = document.getElementById("admin-password");
    var btn = document.getElementById("admin-unlock");
    var err = document.getElementById("admin-gate-error");

    function checkPassword() {
      var pwd = (input && input.value) ? input.value : "";
      if (pwd === ADMIN_PASSWORD) {
        try { sessionStorage.setItem(UNLOCK_KEY, "1"); } catch (e) {}
        if (err) { err.style.display = "none"; err.textContent = ""; }
        showContent();
      } else {
        if (err) { err.textContent = "Incorrect password."; err.style.display = "block"; }
      }
    }

    if (btn) btn.addEventListener("click", checkPassword);
    if (input) input.addEventListener("keydown", function (e) { if (e.key === "Enter") checkPassword(); });

    var exportBtn = document.getElementById("admin-export");
    if (exportBtn) exportBtn.addEventListener("click", exportJson);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
