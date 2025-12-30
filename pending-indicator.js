// pending-indicator.js
import { ref, onValue }
from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

window.addEventListener("DOMContentLoaded", () => {
  const db = window.db;
  const btn = document.getElementById("pendingBtn");
  const countEl = document.getElementById("pendingCount");

  if (!db || !btn || !countEl) return;

  onValue(ref(db, "pendingVoters"), snap => {
    const data = snap.val() || {};
    const count = Object.keys(data).length;

    countEl.textContent = count;

    if (count > 0) {
      btn.classList.add("pending-alert");
    } else {
      btn.classList.remove("pending-alert");
    }
  });
});