// ui.js (TOP OF FILE)
import { detectCaste } from "./caste.js";
import { renderResults } from "./render_result.js";
window.renderResults = renderResults;
import {
  calculateAgeFromYear,
  syncAgeWithBirthYear,
  convertAgeToBirthYear_2025,
  commitConvertedBirthYear
} from "./year.js";
import {
  applySearch,
  applyFiltersCore,
  applySort
} from "./fss.js";


// ABOVE ONLY IMPORT CODE

function dlog(msg){
  const box = document.getElementById("debugBox");
  if(box){
    box.textContent += "\n" + msg;
  }
}

dlog("✅ main.js loaded");
window.DEFAULT_NOTE_TEMPLATE = 
`FormType:
New House:
Old House:`;

let lastActionVoterKey = null;
let lastScrollY = 0;

let lastVisibleSerial = Number(localStorage.getItem("lastVisibleSerial")) || null;


window.lastRenderedList = [];
let isLiveUpdate = false;   // 🔥 ADD THIS


//let lastFilteredList = null;   // ✅ FILTER STATE SAVE

let lastFilterState = null;
let isFilterMode = false;
//window.IS_DATA_LOADING = true;
let lastScroll = 0;

window.SHOW_ONLY_NOTED = false;


// 🔁 BULK MODE STATE
window.BULK_MODE_ON = false;

// 🔄 SPINNER STATE
let CANCEL_BULK_MOVE = false;

// AUTO-FIX: remove duplicate shift popup if exists
document.addEventListener("DOMContentLoaded", () => {
  
/*
  // ⚡ INSTANT LOAD FROM CACHE
  const cached = localStorage.getItem("voters_cache");
  if (cached) {
    const parsed = JSON.parse(cached);

    // 🔒 ONLY USE CACHE IF IT HAS REAL DATA
    if (parsed && Object.keys(parsed).length > 0) {
      window.voterData = parsed;
      IS_DATA_LOADING = false;
      processData();
    }
  }
*/
  // 🧹 REMOVE DUPLICATE SHIFT POPUP IF ANY
  const popups = document.querySelectorAll("#shiftVoterPopup");
  if (popups.length > 1) {
    for (let i = 1; i < popups.length; i++) {
      popups[i].remove();
    }
  }

  // 🔁 RESTORE NOTE FILTER STATE (ONLY THIS STAYS)
  window.SHOW_ONLY_NOTED =
    localStorage.getItem("sidebar_swNotes") === "1";

  // 🔐 LOGOUT BUTTON
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("isAdmin");
      window.location.replace("login.html");
    });
  }

  // 🏠 ADDRESS MODULE BUTTONS (from am.js)
  document
    .getElementById("updateAllAddressBtn")
    ?.addEventListener(
      "click",
      window.bulkUpdateAddressForAllVoters
    );

  document
    .getElementById("fixSelectedAddressBtn")
    ?.addEventListener(
      "click",
      window.confirmFixSelectedAddress
    );

});

// End of DOMCONTENT LOAD


const exportBtn = document.getElementById("exportPDFBtn");
if (exportBtn) {
  exportBtn.onclick = () => {
    window.print();
  };
}

  // DOM ELEMENTS
  // ----------------------------
  const sortBy = document.getElementById("sortBy");
  window.sortMode = "default";

  const searchInput    = document.getElementById("search");
  
  const resultsDiv     = document.getElementById("results");
  const filterAge      = document.getElementById("filterAge");
  const filterHouse    = document.getElementById("filterHouse");
  const filterMobile   = document.getElementById("filterMobile");

  const statTotal  = document.getElementById("statTotal");
  const statMale   = document.getElementById("statMale");
  const statFemale = document.getElementById("statFemale");
  const statDup    = document.getElementById("statDup");

  const statSC  = document.getElementById("statSC");
  const statOBC = document.getElementById("statOBC");
  const statST  = document.getElementById("statST");
  const statMus = document.getElementById("statMuslim");
  const statHouses = document.getElementById("statHouses");

  //const houseNav        = document.getElementById("houseNav");
  const breadcrumbHouse = document.getElementById("breadcrumbHouse");
  const dupBtn          = document.getElementById("dupJumpBtn");
  const backToTop       = document.getElementById("backToTop");

  const houseViewSelect = document.getElementById("filterHouseToggle");
  
const filterBar        = document.querySelector(".filter-bar");
const statsBar         = document.querySelector(".stats-bar");
const resetBtn         = document.getElementById("resetFiltersBtn");

const addVoterBtn = document.getElementById("openAddVoter");
const deletedListBtn = document.getElementById("deletedBtn");



const topBar = document.querySelector(".top-action-bar");
const filterVerified     = document.getElementById("filterVerified");
const filterHouseToggle = document.getElementById("filterHouseToggle");

// ⭐ REPORT SECTION TOGGLE

  window.allPeople = [];
  window.colors = {};
  
  // ===============================
// 🔲 MULTIPLE VOTER SELECTION STORE
// ===============================
window.selectedVoters = new Map();


// ----------------------------
window.CONVERSION_IN_PROGRESS = false;



  // ----------------------------
  // PROCESS DATA
  // ----------------------------
  window.processData = function processData() {
// ✅ ENSURE PAGINATION READY (CRITICAL)
  if (!window.currentPage) window.currentPage = 1;
  const voterData = window.voterData || {};
  window.IS_DATA_LOADING = false;

  window.allPeople = [];

  Object.keys(voterData).forEach(h => {
    Object.entries(voterData[h] || {}).forEach(([key, p]) => {

      if (!p || typeof p !== "object") return;
      if (!p.house) p.house = h;

      window.allPeople.push({
        key,
        house: h,
        ...p,
        age:
          p.age !== undefined && p.age !== null && p.age !== ""
            ? Number(p.age)
            : 0,
        caste: detectCaste(p.name || "")
      });
    });
  });

  detectDuplicateSerials();
  generateColors();

  renderResults(window.allPeople);

  setTimeout(scrollToLastVisibleSerial, 0);

  window.calculateSurveyReport?.();
  window.renderCharts?.();
  window.renderDailyNewVoterNames?.();
  window.renderDailyShiftVoterList?.();

  window.dispatchEvent(new Event("renderResultsDone"));

  isLiveUpdate = false;
};

  // End Of ProcessData Function
  
  function normalizeGender(g) {
    if (!g) return "";
    g = g.trim();
    if (g === "Male") return "Male";
    if (g === "Female") return "Female";
    return g;
  }

 
  function detectDuplicateSerials() {

  // 🔁 reset first
  window.allPeople.forEach(p => {
    p.duplicateSerial = false;
  });

  const map = {};

  window.allPeople.forEach(p => {
    if (!p.serial) return;
    map[p.serial] = (map[p.serial] || 0) + 1;
  });

  window.allPeople.forEach(p => {
    if (map[p.serial] > 1) {
      p.duplicateSerial = true;
    }
  });
}

  window.sortHouseASC = function sortHouseASC(a, b) {
    return parseInt(a.replace("house_", "")) - parseInt(b.replace("house_", ""));
  }

  function generateColors() {
    const houses = [...new Set(window.allPeople.map(p => p.house))].sort(sortHouseASC);
    houses.forEach((h, i) => {
      colors[h] = `hsla(${(i * 40) % 360}, 70%, 92%, 1)`;
    });
  }
  
  // ----------------------------
  // BUILD LEFT HOUSE NAV
  // ----------------------------
  function buildHouseNav() {
    houseNav.innerHTML = "";
    const houses = [...new Set(window.allPeople.map(p => p.house))].sort(sortHouseASC);

    houses.forEach(h => {
      const btn = document.createElement("button");
      btn.className = "house-nav-item";
      btn.textContent = h.replace("house_", "");

      btn.addEventListener("click", () => {
        document.querySelectorAll(".house-nav-item").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        const sec = document.getElementById("house-section-" + h);
        if (sec) sec.scrollIntoView({ behavior: "smooth", block: "start" });
      });

      houseNav.appendChild(btn);
    });
  }

  
  // UPDATE STATS
 
  window.updateStats = function updateStats(list) {

  // 🏠 Houses & Total
  statHouses.textContent = new Set(list.map(p => p.house)).size;
  statTotal.textContent  = list.length;

  // 👤 Gender
  statMale.textContent =
    list.filter(p => normalizeGender(p.gender) === "Male").length;

  statFemale.textContent =
    list.filter(p => normalizeGender(p.gender) === "Female").length;

  // ❌ REMOVE duplicateBYPs based stat
  // statDup ❌ (element থাকলেও এখন unused)

  if (statDup) statDup.textContent = "—";

  // 🧬 Caste
  statSC.textContent  = list.filter(p => p.caste === "SC").length;
  statOBC.textContent = list.filter(p => p.caste === "OBC").length;
  statST.textContent  = list.filter(p => p.caste === "ST").length;
  statMus.textContent = list.filter(p => p.caste === "Muslim").length;

  const statGeneralEl = document.getElementById("statGeneral");
  if (statGeneralEl) {
    statGeneralEl.textContent =
      list.filter(p => (p.caste || "General") === "General").length;
  }

  // ✅ Verified / Unverified
  const statVerifiedEl = document.getElementById("statVerified");
  if (statVerifiedEl) {
    statVerifiedEl.textContent =
      list.filter(p => p.verified === true).length;
  }

  const statUnverifiedEl = document.getElementById("statUnverified");
  if (statUnverifiedEl) {
    statUnverifiedEl.textContent =
      list.filter(p => !p.verified).length;
  }

  // ☪️ Muslim verification split
  const statVerifiedMuslimEl =
    document.getElementById("statVerifiedMuslim");

  if (statVerifiedMuslimEl) {
    statVerifiedMuslimEl.textContent =
      list.filter(p => p.caste === "Muslim" && p.verified === true).length;
  }

  const statUnverifiedMuslimEl =
    document.getElementById("statUnverifiedMuslim");

  if (statUnverifiedMuslimEl) {
    statUnverifiedMuslimEl.textContent =
      list.filter(p => p.caste === "Muslim" && !p.verified).length;
  }

  // 🔁 DUPLICATE SERIAL (NEW SINGLE SOURCE)
  const dupSerialCount =
    list.filter(p => p.duplicateSerial === true).length;

  const statDupSerialEl =
    document.getElementById("statDupSerial");

  if (statDupSerialEl) {
    statDupSerialEl.textContent = dupSerialCount;
  }
};



const NOTE_DIVIDER = "───────────────────";

const DEFAULT_NOTE_TEMPLATE = `Online :
${NOTE_DIVIDER}
Form Type:
${NOTE_DIVIDER}
New house :
${NOTE_DIVIDER}
Old house :`;

// 🔽 COLLAPSE ALL HOUSES
function collapseAllHouses() {
  document.querySelectorAll(".house-section").forEach(section => {
    const content = section.querySelector(".house-content");
    const arrow   = section.querySelector(".collapse-icon");

    if (!content) return;

    // 🔥 FORCE COLLAPSE (NO CONDITION)
    content.style.maxHeight = "0px";
    content.style.opacity = "0";

    if (arrow) arrow.classList.add("rotate");
  });
}

// 🔼 EXPAND ALL HOUSES
function expandAllHouses() {
  document.querySelectorAll(".house-section").forEach(section => {
    const content = section.querySelector(".house-content");
    const arrow   = section.querySelector(".collapse-icon");

    if (content) {
      content.style.maxHeight = content.scrollHeight + "px";
      content.style.opacity = "1";
    }
    if (arrow) arrow.classList.remove("rotate");
  });
}

  // FILTERS
  
function applyFiltersUI(resetPage = true){
  applyFiltersCore({
    data: allPeople,
    filters: {
      age: filterAge.value,
      house: filterHouse.value,
      mobile: filterMobile.value,
      verified: filterVerified.value,
      houseToggle: filterHouseToggle.value
    },
    renderResults,
    resetPage: () => {
      if (resetPage) currentPage = 1;
    }
  });
}
filterAge.onchange         = () => applyFiltersUI(true);
filterMobile.onchange      = () => applyFiltersUI(true);
filterVerified.onchange    = () => applyFiltersUI(true);
filterHouseToggle.onchange = () => applyFiltersUI(true);
filterHouse.oninput        = () => applyFiltersUI(true);
  
 
  // SEARCH
 
searchInput?.addEventListener("input", (e) => {
  applySearch({
  query: e.target.value,
  data: allPeople,
  renderResults,
  setPage: () => currentPage = 1
});
});
  
  // ----------------------------
  // BACK TO TOP
  // ----------------------------
  window.addEventListener("scroll", () => {
    if (!backToTop) return;
    backToTop.style.display = window.scrollY > 200 ? "block" : "none";
  });
  
  // 🔁 SAVE CURRENT VISIBLE VOTER (SCROLL MEMORY)
let scrollTimer = null;

window.addEventListener("scroll", () => {
  clearTimeout(scrollTimer);
  scrollTimer = setTimeout(saveCurrentVisibleVoter, 200);
});

  if (backToTop) {
    backToTop.onclick = () => window.scrollTo({ top: 0, behavior: "smooth" });
  }


// ===============================
// 🔽 TOP BAR SHRINK ON SCROLL
// ===============================


window.addEventListener("scroll", () => {
  const current = window.scrollY;

  if (current > 80 && current > lastScroll) {
    // 🔽 scrolling down → shrink
    topBar?.classList.add("shrink");
  } else {
    // 🔼 scrolling up → normal
    topBar?.classList.remove("shrink");
  }

  lastScroll = current;
});
  
// 📤 Upload Voter List PDF
const sidebarUploadPdfBtn = document.getElementById("sidebarUploadPdfBtn");
if (sidebarUploadPdfBtn) {
  sidebarUploadPdfBtn.addEventListener("click", () => {
    window.open(
      "https://voterlist.onrender.com",
      "_blank"
    );
  });
}

// Holding Page 

const sidebarHolding = document.getElementById("sidebarHolding");
if (sidebarHolding) {
  sidebarHolding.addEventListener("click", () => {
    window.open(
      "https://avoter.onrender.com",
      "_blank"
    );
  });
}

// 🖨 Print / Export PDF (reuse existing logic)
const sidebarPrintBtn = document.getElementById("sidebarPrintBtn");
const exportPDFBtn   = document.getElementById("exportPDFBtn");

if (sidebarPrintBtn && exportPDFBtn) {
  sidebarPrintBtn.addEventListener("click", () => {
    exportPDFBtn.click(); // 🔥 same window.print()
  });
}


//  END OF SIDE BAR CODE HERE 


 // sortBy
 
 sortBy?.addEventListener("change", () => {

  // 🔥 THIS WAS MISSING
  window.sortMode = sortBy.value;

  applySort({
    mode: sortBy.value,
    data: window.lastRenderedList.length
      ? window.lastRenderedList
      : allPeople,
    renderResults,
    setPage: () => currentPage = 1
  });
});

 
  // 🔍 SHOW MISSING SERIALS IN ALERT — MOBILE FRIENDLY
  window.showMissingSerials = function () {
    const serials = allPeople.map(p => Number(p.serial));
    const maxSerial = Math.max(...serials);
    const serialSet = new Set(serials);

    const missing = [];
    for (let i = 1; i <= maxSerial; i++) {
      if (!serialSet.has(i)) missing.push(i);
    }

    alert("Missing Serials (" + missing.length + "):\n\n" + missing.join(", "));
  };
  
  
  function isNewVoter(p) {
  return !p.byp || p.byp.trim() === "";
}
  
function loadEditForm(voter) {
  evSerial.value = voter.serial;
  evHouse.value  = voter.house.replace("house_", "");
  evName.value   = voter.name;
  evFather.value = voter.father || "";
  evMother.value = voter.mother || ""; 
  evHusband.value = voter.husband || "";
  evBirthYear.value = voter.birthYear || "";
  evGender.value = voter.gender;
  evBYP.value    = voter.byp;
  evMobile.value = voter.mobile || "";

  document.getElementById("editVoterPopup").style.display = "flex";
}



let editHouse = null;
let editKey = null;

window.editVoter = function (house, key) {

  let voter = allPeople.find(p =>
    String(p.key) === String(key) &&
    String(p.house) === String(house)
  );

  // fallback find by serial — but DO NOT override again!
  if (!voter) {
    voter = allPeople.find(p => Number(p.serial) === Number(evSerial.value));
  }

  if (!voter) {
    alert("❌ Voter not found!");
    return;
  }

  // ⭐ Set correct house + key exactly from voter
  editHouse = voter.house;   // ALWAYS correct "house_22"
  editKey   = voter.key;

  loadEditForm(voter);
};

  
window.closeEditVoter = function () {
  document.getElementById("editVoterPopup").style.display = "none";
};

// ✅ OPEN ADD VOTER POPUP (MAIN GREEN BUTTON)
document.getElementById("openAddVoter").onclick = () => {
  document.getElementById("addVoterPopup").style.display = "flex";
};

// ✅ CLOSE ADD VOTER POPUP
window.closeAddVoter = function () {
  document.getElementById("addVoterPopup").style.display = "none";
};

window.openDeletedPage = function () {
  window.location.href = "deleted.html";
};

// 🔗 Deleted Voters button click
document.addEventListener("DOMContentLoaded", () => {
  const delBtn = document.getElementById("deletedBtn");
  if (delBtn) {
    delBtn.addEventListener("click", () => {
      window.location.href = "deleted.html";
    });
  }
});

function updateStickyHeaderVisibility() {
  const header = document.querySelector(".sticky-header");
  if (!header) return;

  // check if ANY visible child exists
  const hasVisibleContent = [...header.querySelectorAll("*")]
    .some(el => {
      const style = window.getComputedStyle(el);
      return style.display !== "none" && el.offsetHeight > 0;
    });

  if (!hasVisibleContent) {
    header.style.display = "none";
  } else {
    header.style.display = "block";
  }
}

// 🔁 run after every toggle / render
setTimeout(updateStickyHeaderVisibility, 50);
document.addEventListener("click", () =>
  setTimeout(updateStickyHeaderVisibility, 50)
);

// current position Voter

function saveCurrentVisibleVoter() {
  const cards = document.querySelectorAll(".card");
  let closest = null;
  let minDiff = Infinity;

  cards.forEach(card => {
    const rect = card.getBoundingClientRect();
    const diff = Math.abs(rect.top);

    if (rect.top >= 0 && diff < minDiff) {
      minDiff = diff;
      closest = card;
    }
  });

  if (closest) {
    const serialText = closest.querySelector(".pill")?.innerText || "";
    const serial = Number(serialText.replace("#", ""));

    if (serial) {
      localStorage.setItem("lastVisibleSerial", serial);
      lastVisibleSerial = serial;
    }
  }
}

function isDuplicateSerial(serial, currentKey = null) {
  return allPeople.some(p =>
    Number(p.serial) === Number(serial) &&
    (!currentKey || p.key !== currentKey)
  );
}

// ===============================

document.addEventListener("DOMContentLoaded", () => {
  const cancelBtn = document.getElementById("spinnerCancel");
  if (cancelBtn) {
    cancelBtn.onclick = () => {
      CANCEL_BULK_MOVE = true;
    };
  }
});
// ===============================
// 📝 SHOW NOTES TOGGLE (FIX)
// ===============================
window.applyShowNotes = function (on) {

  window.SHOW_ONLY_NOTED = on;

  localStorage.setItem(
    "sidebar_swNotes",
    on ? "1" : "0"
  );

  // 🔥 RESET UI STATE
  window.currentPage = 1;
  window.sortMode = "default";
  window.lastRenderedList = [];

  // 🔥 RENDER FULL LIST
  renderResults(allPeople);

  // 🔥 SCROLL BACK TO TOP
  window.scrollTo({ top: 0, behavior: "smooth" });
};
function scrollToLastVisibleSerial() {
  const serial =
    Number(localStorage.getItem("lastVisibleSerial"));

  if (!serial) return;

  // 🔍 find card by serial pill
  const cards = document.querySelectorAll(".card");
  let target = null;

  cards.forEach(card => {
    const pill = card.querySelector(".pill");
    if (!pill) return;

    const num = Number(
      pill.innerText.replace("#", "")
    );

    if (num === serial) {
      target = card;
    }
  });

  if (target) {
    target.scrollIntoView({
      behavior: "auto",
      block: "start"
    });
  }
}

