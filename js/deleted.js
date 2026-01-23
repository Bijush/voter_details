// ===============================
// 🗑️ DELETED VOTERS (CLEAN VERSION)
// ===============================

import {
  listenPath,
  fbPush,
  fbRemove
} from "./firebase.js";

/* 🔁 GLOBAL STATE */
let allDeletedData = {};
let activeReasonFilter = "";
let activeMonthFilter = "";

/* -----------------------------
   DOM (SAFE ACCESS)
----------------------------- */
const list = document.getElementById("deletedList");
const monthFilter = document.getElementById("monthFilter");

const cTotal = document.getElementById("cTotal");
const cDead = document.getElementById("cDead");
const cShifted = document.getElementById("cShifted");
const cDuplicate = document.getElementById("cDuplicate");

/* -----------------------------
   🕒 DATE PARSER
----------------------------- */
function parseDeletedDate(str) {
  if (!str) return null;

  const [datePart, timePart] = str.split(",");
  if (!datePart || !timePart) return null;

  const [dd, mm, yyyy] = datePart.trim().split("/").map(Number);
  let [time, meridian] = timePart.trim().split(" ");
  let [hh, min, sec] = time.split(":").map(Number);

  if (meridian?.toLowerCase() === "pm" && hh < 12) hh += 12;
  if (meridian?.toLowerCase() === "am" && hh === 12) hh = 0;

  return new Date(yyyy, mm - 1, dd, hh, min, sec || 0);
}

/* -----------------------------
   🔘 REASON FILTER
----------------------------- */
window.setReasonFilter = (reason) => {
  activeReasonFilter = reason;

  document.querySelectorAll(".counter")
    .forEach(c => c.classList.remove("active"));

  const map = { "": 0, "Dead": 1, "Shifted": 2, "Duplicate": 3 };
  document.querySelectorAll(".counter")[map[reason]]
    ?.classList.add("active");

  renderList();
};

/* -----------------------------
   📆 MONTH FILTER (GUARDED)
----------------------------- */
if (monthFilter) {
  monthFilter.onchange = () => {
    activeMonthFilter = monthFilter.value;
    renderList();
  };
}

/* -----------------------------
   🔥 FIREBASE LISTENER
----------------------------- */
listenPath("deleted_voters", (data) => {
  allDeletedData = data || {};
  buildMonthFilter();
  updateCounters();
  renderList();
});

/* -----------------------------
   📆 BUILD MONTH DROPDOWN
----------------------------- */
function buildMonthFilter() {
  if (!monthFilter) return;

  const months = new Set();

  Object.values(allDeletedData).forEach(v => {
    const d = parseDeletedDate(v.deletedAt);
    if (!d) return;
    months.add(`${d.getFullYear()}-${d.getMonth() + 1}`);
  });

  monthFilter.innerHTML = `<option value="">📆 All Months</option>`;

  [...months].sort().reverse().forEach(m => {
    const [y, mo] = m.split("-");
    const label = new Date(y, mo - 1).toLocaleString("en-IN", {
      month: "long",
      year: "numeric"
    });
    monthFilter.innerHTML += `<option value="${m}">${label}</option>`;
  });
}

/* -----------------------------
   🔢 COUNTERS
----------------------------- */
function updateCounters() {
  let total = 0, dead = 0, shifted = 0, dup = 0;

  Object.values(allDeletedData).forEach(v => {
    total++;
    if (v.deleteReason === "Dead") dead++;
    else if (v.deleteReason === "Shifted") shifted++;
    else if (v.deleteReason === "Duplicate") dup++;
  });

  if (cTotal) cTotal.textContent = total;
  if (cDead) cDead.textContent = dead;
  if (cShifted) cShifted.textContent = shifted;
  if (cDuplicate) cDuplicate.textContent = dup;
}

/* -----------------------------
   🧠 MAIN RENDER
----------------------------- */
function renderList() {
  if (!list) return;
  list.innerHTML = "";

  Object.entries(allDeletedData).reverse().forEach(([key, v]) => {

    if (activeReasonFilter && v.deleteReason !== activeReasonFilter) return;

    if (activeMonthFilter) {
      const d = parseDeletedDate(v.deletedAt);
      if (!d) return;
      const m = `${d.getFullYear()}-${d.getMonth() + 1}`;
      if (m !== activeMonthFilter) return;
    }

    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <div style="font-weight:700;font-size:16px;">
        ${v.name || "-"} <span>(#${v.serial || "-"})</span>
      </div>

      <div class="line">🏠 <b>House:</b> ${v.house?.replace("house_","") || "-"}</div>
      <div class="line">🆔 <b>BYP:</b> ${v.byp || "-"}</div>
      <div class="line">🎂 <b>Age:</b> ${
        v.birthYear
          ? new Date().getFullYear() - Number(v.birthYear)
          : (v.age || "-")
      }</div>
      <div class="line">🚻 <b>Gender:</b> ${v.gender || "-"}</div>

      <div class="line">
        📝 <b>Reason:</b>
        <span style="padding:2px 8px;border-radius:999px;font-weight:600;">
          ${v.deleteReason || "-"}
        </span>
      </div>

      <div class="line">⏰ <b>Deleted:</b> ${v.deletedAt || "-"}</div>

      <div style="margin-top:10px;display:flex;gap:10px;">
        <button class="btn restoreBtn">♻️ Restore</button>
        <button class="btn permBtn">❌ Permanent</button>
      </div>
    `;

    /* ♻️ RESTORE */
    div.querySelector(".restoreBtn").onclick = async () => {
      if (!confirm("Restore this voter?")) return;

      const restored = {
        ...v,
        age: v.birthYear
          ? new Date().getFullYear() - Number(v.birthYear)
          : v.age || "",
        restoredAt: new Date().toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
          hour12: true
        })
      };

      await fbPush(`voters/${v.house}`, restored);
      await fbRemove(`deleted_voters/${key}`);

      alert("✅ Voter restored");
    };

    /* ❌ PERMANENT DELETE */
    div.querySelector(".permBtn").onclick = async () => {
      const code = prompt("Enter secret code:");
      if (code !== "bijush") return alert("❌ Wrong code");
      if (!confirm("⚠️ Permanent delete?")) return;

      await fbRemove(`deleted_voters/${key}`);
    };

    list.appendChild(div);
  });
}