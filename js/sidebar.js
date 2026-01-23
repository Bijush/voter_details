// ===============================
// sidebar.js — FINAL (SIDEBAR ONLY)
// ===============================
console.log("✅ sidebar.js loaded");

let IS_RESTORING_SIDEBAR = false;

// ✅ DEFAULT: house collapse ENABLED
window.HOUSE_COLLAPSE_ENABLED =
  window.HOUSE_COLLAPSE_ENABLED ?? true;

// ===============================
// 📦 SIDEBAR ELEMENTS
// ===============================
const sidebar          = document.querySelector(".sidebar");
const sidebarOverlay   = document.getElementById("sidebarOverlay");
const toggleSidebarBtn = document.getElementById("toggleSidebarBtn");
const sidebarCloseBtn  = document.querySelector(".sidebar-close-btn");
const topBar           = document.querySelector(".top-action-bar");

// ===============================
// 🔓 OPEN / CLOSE SIDEBAR
// ===============================
toggleSidebarBtn?.addEventListener("click", () => {
  sidebar.classList.add("open");
  sidebarOverlay.style.display = "block";
  topBar?.classList.add("hide");
});

function closeSidebar() {
  sidebar.classList.remove("open");
  sidebarOverlay.style.display = "none";
  topBar?.classList.remove("hide");
}

sidebarCloseBtn?.addEventListener("click", closeSidebar);
sidebarOverlay?.addEventListener("click", closeSidebar);

// ===============================
// 💾 SIDEBAR STATE SAVE
// ===============================
function saveSidebarState(id, checked) {
  localStorage.setItem("sidebar_" + id, checked ? "1" : "0");
}

// ===============================
// 🔘 SIDEBAR SWITCHES
// ===============================
const swFilters      = document.getElementById("swFilters");
const swSearch       = document.getElementById("swSearch");
const swStats        = document.getElementById("swStats");
const swReset        = document.getElementById("swReset");
const swReport       = document.getElementById("swReport");
const swPagination   = document.getElementById("swPagination");
const swHouseViewBtn = document.getElementById("swHouseViewBtn");
const swAddVoter     = document.getElementById("swAddVoter");
const swDeletedList  = document.getElementById("swDeletedList");
const swMuslimJump   = document.getElementById("swMuslimJump");
const swUnverifiedMuslimJump = document.getElementById("swUnverifiedMuslimJump");
const swShowMissing  = document.getElementById("swShowMissing");
const swBulk         = document.getElementById("swBulkMove");
const swNotes        = document.getElementById("swNotes");

// filter switches
const swAge      = document.getElementById("swAge");
const swHouse    = document.getElementById("swHouse");
const swMobile   = document.getElementById("swMobile");
const swVerified = document.getElementById("swVerified");
const swSort     = document.getElementById("swSort");

// ===============================
// 🎛️ TARGET UI ELEMENTS
// ===============================
const filterBar    = document.getElementById("filterBar");
const filterArea   = document.getElementById("filterToggleArea");
const statsBar     = document.querySelector(".stats-bar");
const resetBtn     = document.getElementById("resetFiltersBtn");
const reportBtn    = document.getElementById("toggleReportBtn");
const rptBox       = document.getElementById("reportSection");
const searchInput  = document.getElementById("search");
const houseViewSel = document.getElementById("filterHouseToggle");

const addVoterBtn  = document.getElementById("openAddVoter");
const deletedBtn   = document.getElementById("deletedBtn");

const muslimJumpBtn = document.getElementById("muslimJumpBtn");
const unverifiedMuslimJumpBtn =
  document.getElementById("unverifiedMuslimJumpBtn");

const paginationBox  = document.getElementById("pagination");
const bulkBtn        = document.getElementById("bulkMoveBtnFloating");
const showMissingBtn = document.getElementById("showMissing");

// filter inputs
const elAge      = document.getElementById("filterAge");
const elHouse    = document.getElementById("filterHouse");
const elMobile   = document.getElementById("filterMobile");
const elVerified = document.getElementById("filterVerified");
const elSort     = document.getElementById("sortBy");

// ===============================
// 🧩 HELPERS
// ===============================
function ensureFiltersOn() {
  if (IS_RESTORING_SIDEBAR) return;

  if (!swFilters.checked) {
    swFilters.checked = true;
    filterArea.style.display = "block";
    filterBar.style.display  = "flex";
  }
}

function toggle(sw, el) {
  if (!sw || !el) return;
  sw.addEventListener("change", () => {
    ensureFiltersOn();
    el.style.display = sw.checked ? "block" : "none";

    // 🔥 DATA RESET WHEN OFF
    if (!sw.checked && typeof window.resetToNormalView === "function") {
      window.resetToNormalView();
    }
  });
}

// ===============================
// 🔁 DEFAULT HIDE
// ===============================
[
  filterBar, filterArea, statsBar, resetBtn, reportBtn, rptBox,
  searchInput, houseViewSel, addVoterBtn, deletedBtn,
  muslimJumpBtn, unverifiedMuslimJumpBtn,
  paginationBox, bulkBtn, showMissingBtn,
  elAge, elHouse, elMobile, elVerified, elSort
].forEach(el => el && (el.style.display = "none"));

// ===============================
// ⚙️ SWITCH LOGIC
// ===============================

// NOTES
swNotes?.addEventListener("change", () => {
  window.applyShowNotes?.(swNotes.checked);
});

// FILTER MASTER
swFilters?.addEventListener("change", () => {
  const on = swFilters.checked;
  filterArea.style.display = on ? "block" : "none";
  filterBar.style.display  = on ? "flex"  : "none";

  if (!on && window.resetToNormalView) {
    window.resetToNormalView();
  }
});

// SEARCH
swSearch?.addEventListener("change", () => {
  ensureFiltersOn();
  searchInput.style.display = swSearch.checked ? "block" : "none";

  if (!swSearch.checked && window.resetToNormalView) {
    window.resetToNormalView();
  }
});

// STATS
swStats?.addEventListener("change", () => {
  ensureFiltersOn();
  statsBar.style.display = swStats.checked ? "flex" : "none";
});

// REPORT
swReport?.addEventListener("change", () => {
  ensureFiltersOn();
  reportBtn.style.display = swReport.checked ? "block" : "none";
  rptBox.style.display   = swReport.checked ? "block" : "none";
});

// PAGINATION
swPagination?.addEventListener("change", () => {
  const on = swPagination.checked;
  localStorage.setItem("pagination_enabled", on ? "1" : "0");
  paginationBox.style.display = on ? "flex" : "none";

  if (!on && window.resetToNormalView) {
    window.resetToNormalView();
  }
});

// SHOW MISSING
swShowMissing?.addEventListener("change", () => {
  ensureFiltersOn();
  showMissingBtn.style.display =
    swShowMissing.checked ? "block" : "none";

  if (!swShowMissing.checked && window.resetToNormalView) {
    window.resetToNormalView();
  }
});

// SORT / FILTER INPUTS
toggle(swAge, elAge);
toggle(swHouse, elHouse);
toggle(swMobile, elMobile);
toggle(swVerified, elVerified);
toggle(swSort, elSort);

// BULK MOVE
swBulk?.addEventListener("change", () => {
  window.BULK_MODE_ON = swBulk.checked;
  bulkBtn.style.display = swBulk.checked ? "block" : "none";

  window.renderResults?.(
    window.lastRenderedList?.length
      ? window.lastRenderedList
      : window.allPeople
  );
});

// ===============================
// ➕ ADD VOTER BUTTON
// ===============================
swAddVoter?.addEventListener("change", () => {
  addVoterBtn.style.display = swAddVoter.checked ? "block" : "none";
});

// ===============================
// 🗑️ DELETED LIST BUTTON
// ===============================
swDeletedList?.addEventListener("change", () => {
  deletedBtn.style.display = swDeletedList.checked ? "block" : "none";
});

// ===============================
// 🏠 HOUSE VIEW (SAFE FIX)
// ===============================
swHouseViewBtn?.addEventListener("change", () => {
  const on = swHouseViewBtn.checked;

  // dropdown show / hide
  houseViewSel.style.display = on ? "block" : "none";

  // 🔒 restore চলাকালীন render trigger করো না
  if (IS_RESTORING_SIDEBAR) {
    window.HOUSE_COLLAPSE_ENABLED = on;
    return;
  }

  // ✅ checkbox ON  → collapse ENABLED
  // ✅ checkbox OFF → collapse DISABLED
  window.HOUSE_COLLAPSE_ENABLED = on;

  // 🔁 re-render safely
  window.renderResults?.(
    window.lastRenderedList?.length
      ? window.lastRenderedList
      : window.allPeople
  );
});

// ===============================
// 🔁 RESTORE SIDEBAR STATE
// ===============================
function restoreSidebarState() {
  IS_RESTORING_SIDEBAR = true;

  document
    .querySelectorAll(".sidebar input[type='checkbox']")
    .forEach(sw => {
      const saved = localStorage.getItem("sidebar_" + sw.id);
      if (saved !== null) {
        sw.checked = saved === "1";
      }
    });

  document
    .querySelectorAll(".sidebar input[type='checkbox']")
    .forEach(sw => {
      sw.dispatchEvent(new Event("change", { bubbles: true }));
    });

  IS_RESTORING_SIDEBAR = false;
}

// save state
document
  .querySelectorAll(".sidebar input[type='checkbox']")
  .forEach(sw => {
    sw.addEventListener("change", () => {
      if (!IS_RESTORING_SIDEBAR) {
        saveSidebarState(sw.id, sw.checked);
      }
    });
  });
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("clearOfflineCacheBtn");
  if (btn) {
    btn.addEventListener("click", () => {
      window.clearOfflineCache();
    });
  }
});
// ===============================
// 🚀 INIT
// ===============================
document.addEventListener("DOMContentLoaded", restoreSidebarState);