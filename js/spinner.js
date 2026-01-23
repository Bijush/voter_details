// ===============================
// spinner.js
// Global Spinner Utility (SAFE)
// ===============================

console.log("✅ spinner.js loaded");

// -------------------------------
// SHOW / HIDE SPINNER
// -------------------------------
export function showSpinner(show) {
  const sp = document.getElementById("globalSpinner");
  if (!sp) return;
  sp.style.display = show ? "flex" : "none";
}

// -------------------------------
// UPDATE PROGRESS + ETA
// -------------------------------
export function updateSpinner(done, total, startTime) {

  const text = document.getElementById("spinnerText");
  const bar  = document.getElementById("spinnerBar");
  const eta  = document.getElementById("spinnerEta");

  if (text) {
    text.textContent = `${done} / ${total} processed`;
  }

  if (bar && total > 0) {
    bar.style.width = `${Math.round((done / total) * 100)}%`;
  }

  if (eta && done > 0 && startTime) {
    const elapsed = (Date.now() - startTime) / 1000;
    const avg = elapsed / done;
    eta.textContent =
      `⏱️ ~${Math.round(avg * (total - done))}s remaining`;
  }
}

// -------------------------------
// CANCEL BUTTON (SAFE NOTICE)
// -------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("spinnerCancel");
  if (!btn) return;

  btn.onclick = () => {
    alert("⚠️ Operation cannot be cancelled safely");
  };
});