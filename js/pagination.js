// ===============================
// pagination.js (FINAL – SAFE)
// ===============================

import { renderResults } from "./render_result.js";

console.log("✅ pagination.js loaded");

window.PAGE_SIZE = 50;
window.currentPage =
  Number(localStorage.getItem("lastPage")) || 1;

window.PAGINATION_ENABLED = false;

// ===============================
// ✅ ACTIVE LIST HELPER
// ===============================
function getActiveList() {
  return window.lastRenderedList && window.lastRenderedList.length
    ? window.lastRenderedList
    : window.allPeople || [];
}

document.addEventListener("DOMContentLoaded", () => {

  const swPagination   = document.getElementById("swPagination");
  const paginationBox = document.getElementById("pagination");

  const prevBtn  = document.getElementById("prevPage");
  const nextBtn  = document.getElementById("nextPage");
  const pageInfo = document.getElementById("pageInfo");

  const pageInput = document.getElementById("pageInput");
  const goPageBtn = document.getElementById("goPageBtn");

  // ===============================
  // 🔁 RESTORE SAVED STATE
  // ===============================
  const saved =
    localStorage.getItem("pagination_enabled") === "1";

  window.PAGINATION_ENABLED = saved;

  if (swPagination) swPagination.checked = saved;
  if (paginationBox) {
    paginationBox.style.display = saved ? "flex" : "none";
  }

  // ===============================
  // 📄 PAGE INFO
  // ===============================
  function updatePageInfo(totalItems) {

    if (!window.PAGINATION_ENABLED) return;

    const totalPages =
      Math.ceil(totalItems / window.PAGE_SIZE) || 1;

    if (window.currentPage < 1) window.currentPage = 1;
    if (window.currentPage > totalPages)
      window.currentPage = totalPages;

    if (pageInfo) {
      pageInfo.textContent =
        `Page ${window.currentPage} of ${totalPages}`;
    }

    if (prevBtn) prevBtn.disabled = window.currentPage <= 1;
    if (nextBtn) nextBtn.disabled = window.currentPage >= totalPages;

    if (pageInput) pageInput.value = window.currentPage;
  }

  // 🔓 expose for render_result.js
  window.updatePageInfo = updatePageInfo;

  // ===============================
  // ⬅️ PREVIOUS PAGE
  // ===============================
  prevBtn?.addEventListener("click", () => {
    window.currentPage--;
    renderResults(getActiveList());
  });

  // ===============================
  // ➡️ NEXT PAGE
  // ===============================
  nextBtn?.addEventListener("click", () => {
    window.currentPage++;
    renderResults(getActiveList());
  });

  // ===============================
  // 🔢 GO TO PAGE
  // ===============================
  goPageBtn?.addEventListener("click", () => {

    if (!pageInput.value) return;

    const totalPages =
      Math.ceil(getActiveList().length / window.PAGE_SIZE) || 1;

    let page = Number(pageInput.value);

    if (isNaN(page) || page < 1) page = 1;
    if (page > totalPages) page = totalPages;

    window.currentPage = page;

    renderResults(getActiveList());
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  pageInput?.addEventListener("keydown", e => {
    if (e.key === "Enter") goPageBtn.click();
  });

  // ===============================
  // 📦 SIDEBAR SWITCH
  // ===============================
  swPagination?.addEventListener("change", () => {

    window.PAGINATION_ENABLED = swPagination.checked;

    localStorage.setItem(
      "pagination_enabled",
      window.PAGINATION_ENABLED ? "1" : "0"
    );

    if (paginationBox) {
      paginationBox.style.display =
        window.PAGINATION_ENABLED ? "flex" : "none";
    }

    window.currentPage = 1;
    renderResults(getActiveList());
  });
});