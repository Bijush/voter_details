// pending.js
import { ref, onValue, remove, push, get }
from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// reuse existing Firebase DB
const db = window.db;

const listBox = document.getElementById("pendingList");
const popup = document.getElementById("addPendingPopup");
const movePopup = document.getElementById("movePopup");

let moveKey = null;
let moveData = null;

/* open add popup */
document.getElementById("openAddPending").onclick = () => {
  popup.style.display = "flex";
};

/* close add popup */
window.closeAdd = () => {
  popup.style.display = "none";
};

/* load pending voters */
onValue(ref(db, "pendingVoters"), snap => {
  const data = snap.val() || {};
  listBox.innerHTML = "";

  const keys = Object.keys(data);
  if (!keys.length) {
    listBox.innerHTML = "<p>✅ No pending voters</p>";
    return;
  }

  keys.forEach(key => {
    const p = data[key];
    const div = document.createElement("div");
    div.className = "pending-card";

    div.innerHTML = `
      <h3>${p.name || "—"}</h3>
      <div class="pending-meta">
        <div><b>House:</b> ${p.house?.replace("house_","") || "—"}</div>
        <div><b>Father:</b> ${p.father || "—"}</div>
        <div><b>Mother:</b> ${p.mother || "—"}</div>
        <div><b>Husband:</b> ${p.husband || "—"}</div>
      <div>
      <b>Age:</b>
  ${p.birthYear ? (new Date().getFullYear() - p.birthYear) : "—"}

        <div><b>Caste:</b> ${p.caste || "General"}</div>
        <div><b>Mobile:</b> ${p.mobile || "—"}</div>
      </div>
      <div class="pending-actions">
        <button class="btn btn-del" onclick="deletePending('${key}')">🗑 Delete</button>
        <button class="btn btn-move" onclick="openMove('${key}')">➡ Move to Main</button>
      </div>
    `;
    listBox.appendChild(div);
  });
});

/* save pending voter */
window.savePendingVoter = () => {
  const name = pvName.value.trim();
  const house = pvHouse.value.trim();

  if (!name || !house) {
    alert("Name and House required");
    return;
  }

  push(ref(db, "pendingVoters"), {
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

/* delete pending */
window.deletePending = (key) => {
  if (!confirm("Delete this pending voter?")) return;
  remove(ref(db, "pendingVoters/" + key));
};

/* ---------- MOVE TO MAIN ---------- */

window.openMove = async (key) => {
  moveKey = key;
  const snap = await get(ref(db, "pendingVoters/" + key));
  moveData = snap.val();
  movePopup.style.display = "flex";
};

window.closeMove = () => {
  movePopup.style.display = "none";
  moveKey = null;
  moveData = null;
};

window.confirmMove = () => {
  const serial = mvSerial.value.trim();
  const byp = mvBYP.value.trim();

  if (!serial || !byp) {
    alert("Serial & BYP required");
    return;
  }

  if (!moveData) {
    alert("No data found");
    return;
  }

  // add to main voter list
  push(ref(db, "voters/" + moveData.house), {
  serial,
  byp,
  name: moveData.name,
  father: moveData.father || "",
  mother: moveData.mother || "",
  husband: moveData.husband || "",

  // ⭐ Birth Year is master
  birthYear: moveData.birthYear || "",

  // ⭐ Age auto-calculated from birthYear
  age: moveData.birthYear
    ? (new Date().getFullYear() - Number(moveData.birthYear))
    : "",

  caste: moveData.caste || "General",
  mobile: moveData.mobile || "",
  verified: false,
  addedAt: Date.now()
});

  // remove from pending
  remove(ref(db, "pendingVoters/" + moveKey));

  closeMove();
};