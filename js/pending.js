// js/pending.js ✅ SAME FEATURES (MODULAR FIREBASE)

import {
  listenPath,
  fbPush,
  fbRemove,
  fbGet
} from "./firebase.js";

const listBox   = document.getElementById("pendingList");
const popup     = document.getElementById("addPendingPopup");
const movePopup = document.getElementById("movePopup");

let moveKey  = null;
let moveData = null;

// -------------------------------
// 🟢 OPEN / CLOSE ADD POPUP
// -------------------------------
document.getElementById("openAddPending")?.addEventListener("click", () => {
  popup.style.display = "flex";
});

window.closeAdd = () => {
  popup.style.display = "none";
};

// -------------------------------
// 🔥 LOAD PENDING VOTERS (LIVE)
// -------------------------------
listenPath("pendingVoters", (data) => {

  listBox.innerHTML = "";

  const pending = data || {};
  const keys = Object.keys(pending);

  if (!keys.length) {
    listBox.innerHTML = "<p>✅ No pending voters</p>";
    return;
  }

  keys.forEach(key => {
    const p = pending[key];

    const div = document.createElement("div");
    div.className = "pending-card";

    const age =
      p.birthYear
        ? new Date().getFullYear() - Number(p.birthYear)
        : "—";

    div.innerHTML = `
      <h3>${p.name || "—"}</h3>

      <div class="pending-meta">
        <div><b>House:</b> ${p.house?.replace("house_","") || "—"}</div>
        <div><b>Father:</b> ${p.father || "—"}</div>
        <div><b>Mother:</b> ${p.mother || "—"}</div>
        <div><b>Husband:</b> ${p.husband || "—"}</div>
        <div><b>Age:</b> ${age}</div>
        <div><b>Caste:</b> ${p.caste || "General"}</div>
        <div><b>Mobile:</b> ${p.mobile || "—"}</div>
      </div>

      <div class="pending-actions">
        <button class="btn btn-del"
          onclick="deletePending('${key}')">🗑 Delete</button>

        <button class="btn btn-move"
          onclick="openMove('${key}')">➡ Move to Main</button>
      </div>
    `;

    listBox.appendChild(div);
  });
});

// -------------------------------
// 💾 SAVE PENDING VOTER
// -------------------------------
window.savePendingVoter = () => {

  const name  = pvName.value.trim();
  const house = pvHouse.value.trim();

  if (!name || !house) {
    alert("Name and House required");
    return;
  }

  fbPush("pendingVoters", {
    name,
    house: "house_" + house,
    father: pvFather.value.trim(),
    mother: pvMother.value.trim(),
    husband: pvHusband.value.trim(),
    birthYear: Number(pvBirthYear.value) || "",
    caste: pvCaste.value.trim() || "General",
    mobile: pvMobile.value.trim(),
    createdAt: Date.now()
  });

  popup.style.display = "none";
};

// -------------------------------
// 🗑 DELETE PENDING
// -------------------------------
window.deletePending = (key) => {
  if (!confirm("Delete this pending voter?")) return;
  fbRemove("pendingVoters/" + key);
};

// -------------------------------
// 🔁 MOVE TO MAIN VOTER
// -------------------------------
window.openMove = async (key) => {
  moveKey = key;
  const snap = await fbGet("pendingVoters/" + key);
  moveData = snap.val();
  movePopup.style.display = "flex";
};

window.closeMove = () => {
  movePopup.style.display = "none";
  moveKey = null;
  moveData = null;
};

window.confirmMove = async () => {

  const serial = mvSerial.value.trim();
  const byp    = mvBYP.value.trim();

  if (!serial || !byp) {
    alert("Serial & BYP required");
    return;
  }

  if (!moveData) {
    alert("No data found");
    return;
  }

  const birthYear = moveData.birthYear || "";
  const age =
    birthYear
      ? new Date().getFullYear() - Number(birthYear)
      : "";

  // ➕ ADD TO MAIN VOTERS
  await fbPush(`voters/${moveData.house}`, {
    serial,
    byp,
    name: moveData.name,
    father: moveData.father || "",
    mother: moveData.mother || "",
    husband: moveData.husband || "",
    birthYear,
    age,
    caste: moveData.caste || "General",
    mobile: moveData.mobile || "",
    verified: false,
    addedAt: Date.now()
  });

  // ❌ REMOVE FROM PENDING
  await fbRemove("pendingVoters/" + moveKey);

  closeMove();
};