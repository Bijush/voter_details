// pending-indicator.js
import { listenPath } from "./firebase.js";

window.addEventListener("DOMContentLoaded", () => {

  const btn = document.getElementById("pendingBtn");
  const countEl = document.getElementById("pendingCount");

  if (!btn || !countEl) {
    console.warn("❌ Pending indicator elements missing");
    return;
  }

  // 🔥 LIVE LISTENER FOR pendingVoters
  listenPath("pendingVoters", (data) => {

    const pending = data || {};
    const count = Object.keys(pending).length;

    // update UI
    countEl.textContent = count;

    if (count > 0) {
      btn.classList.add("pending-alert");
    } else {
      btn.classList.remove("pending-alert");
    }
  });

});