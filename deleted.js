import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, onValue, remove, set }
from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

/* 🔥 FIREBASE */
const app = initializeApp({
  apiKey: "AIzaSyCybmzCk3M8jV_255SbRGkGPWLAz2lgayE",
  authDomain: "bijus-app-52978.firebaseapp.com",
  databaseURL: "https://bijus-app-52978.firebaseio.com",
  projectId: "bijus-app-52978"
});
const db = getDatabase(app);

/* 🔁 GLOBAL STATE */
let allDeletedData = {};
let activeReasonFilter = "";
let activeMonthFilter = "";

/* DOM */
const list = document.getElementById("deletedList");
const monthFilter = document.getElementById("monthFilter");

const cTotal = document.getElementById("cTotal");
const cDead = document.getElementById("cDead");
const cShifted = document.getElementById("cShifted");
const cDuplicate = document.getElementById("cDuplicate");

/* 🕒 DATE PARSER (FIX Invalid Date) */
function parseDeletedDate(str) {
  if (!str) return null;

  const [datePart, timePart] = str.split(",");
  if (!datePart || !timePart) return null;

  const [dd, mm, yyyy] = datePart.trim().split("/").map(Number);

  let [time, meridian] = timePart.trim().split(" ");
  let [hh, min, sec] = time.split(":").map(Number);

  if (meridian.toLowerCase() === "pm" && hh < 12) hh += 12;
  if (meridian.toLowerCase() === "am" && hh === 12) hh = 0;

  return new Date(yyyy, mm - 1, dd, hh, min, sec);
}

/* 🔘 COUNTER CLICK */
window.setReasonFilter = (reason) => {
  activeReasonFilter = reason;

  // 🔥 ACTIVE COUNTER UI
  document.querySelectorAll(".counter").forEach(c =>
    c.classList.remove("active")
  );

  const map = {
    "": 0,
    "Dead": 1,
    "Shifted": 2,
    "Duplicate": 3
  };

  const index = map[reason];
  document.querySelectorAll(".counter")[index]
    ?.classList.add("active");

  renderList();
};

/* 📆 MONTH CHANGE */
monthFilter.onchange = () => {
  activeMonthFilter = monthFilter.value;
  renderList();
};

/* 🔥 FIREBASE LISTENER */
onValue(ref(db, "deleted_voters"), snap => {
  allDeletedData = snap.val() || {};
  buildMonthFilter();
  updateCounters();
  renderList();
});

/* 📆 BUILD MONTH DROPDOWN */
function buildMonthFilter() {

  const months = new Set();

  Object.values(allDeletedData).forEach(v => {
    const d = parseDeletedDate(v.deletedAt);
    if (!d) return;
    months.add(d.getFullYear() + "-" + (d.getMonth() + 1));
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

/* 🔢 UPDATE COUNTERS */
function updateCounters() {

  let total = 0, dead = 0, shifted = 0, dup = 0;

  Object.values(allDeletedData).forEach(v => {
    total++;
    if (v.deleteReason === "Dead") dead++;
    else if (v.deleteReason === "Shifted") shifted++;
    else if (v.deleteReason === "Duplicate") dup++;
  });

  cTotal.textContent = total;
  cDead.textContent = dead;
  cShifted.textContent = shifted;
  cDuplicate.textContent = dup;
}



// ===============================
// ⭐ SCROLL CURRENT DELETED CARD
// ===============================
let activeDeletedCard = null;

const delObserver = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;

    // 🔥 remove from all cards first
    document.querySelectorAll(".card.current-card")
      .forEach(c => c.classList.remove("current-card"));

    e.target.classList.add("current-card");
  });
}, {
  rootMargin: "-40% 0px -40% 0px",
  threshold: 0
});

/* 🧠 MAIN RENDER */
function renderList() {

  list.innerHTML = "";

  Object.entries(allDeletedData).reverse().forEach(([key, v]) => {

    // Reason filter
    if (activeReasonFilter && v.deleteReason !== activeReasonFilter) return;

    // Month filter
    if (activeMonthFilter) {
      const d = parseDeletedDate(v.deletedAt);
      if (!d) return;
      const m = d.getFullYear() + "-" + (d.getMonth() + 1);
      if (m !== activeMonthFilter) return;
    }

    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
  <div style="font-size:16px;font-weight:700;">
    ${v.name || "-"} <span>(#${v.serial || "-"})</span>
  </div>

  <div style="font-size:14px;margin-top:8px;">

    <div class="line">🏠 <b>House:</b> ${v.house?.replace("house_","")}</div>
    <div class="line">🆔 <b>BYP:</b> ${v.byp || "-"}</div>
<div class="line">
  🎂 <b>Age:</b>
  ${v.birthYear
    ? (new Date().getFullYear() - Number(v.birthYear))
    : (v.age || "-")}
</div>
    <div class="line">🚻 <b>Gender:</b> ${v.gender || "-"}</div>
    <div class="line">✔️ <b>Verified:</b> ${v.verified ? "Yes" : "No"}</div>

    <div class="line">
      📝 <b>Reason:</b>
      <span style="
        padding:2px 8px;
        border-radius:999px;
        font-weight:600;
        background:
          ${v.deleteReason === "Dead" ? "#fecaca" :
            v.deleteReason === "Shifted" ? "#dbeafe" :
            "#fde68a"};
      ">
        ${v.deleteReason || "—"}
      </span>
    </div>

    <div class="line">⏰ <b>Deleted:</b> ${v.deletedAt || "-"}</div>

  </div>

  <div style="margin-top:10px;display:flex;gap:10px;">
    <button class="btn restoreBtn">♻️ Restore</button>
    <button class="btn permBtn">❌ Permanent</button>
  </div>
`;

    // ♻️ RESTORE
    div.querySelector(".restoreBtn").onclick = async () => {
  if (!confirm("Restore this voter?")) return;

  // ⭐ Rebuild voter object safely
  const restoredVoter = {
    ...v,

    // 🔑 Age always synced from birthYear
    age: v.birthYear
      ? (new Date().getFullYear() - Number(v.birthYear))
      : v.age || "",

    // (optional) mark restored time
    restoredAt: new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour12: true
    })
  };

  // 🔁 Restore to main voters
  await set(
    ref(db, `voters/${v.house}/${v.originalKey || key}`),
    restoredVoter
  );

  // 🗑️ Remove from deleted list
  await remove(ref(db, `deleted_voters/${key}`));

  alert("✅ Voter restored successfully");
};

    // ❌ PERMANENT DELETE
    div.querySelector(".permBtn").onclick = async () => {
      const code = prompt("Enter secret code:");
      if (code !== "bijush") return alert("❌ Wrong code");
      if (!confirm("⚠️ Permanent delete?")) return;
      await remove(ref(db, `deleted_voters/${key}`));
    };

    list.appendChild(div);
  });
  
  // ⭐ AUTO HIGHLIGHT FIRST CARD
// ⭐ AUTO HIGHLIGHT FIRST CARD (FORCE TEST)
// ⭐ AUTO HIGHLIGHT FIRST CARD (FINAL)
setTimeout(() => {
  const first = document.querySelector(".card");
  if (first) {
    first.classList.add("current-card");
    first.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}, 50);
  document.querySelectorAll(".card").forEach(c=>{
  delObserver.observe(c);
});

}


