import { createVoterCard } from "./card.js";

// render_result.js
console.log("✅ render_result.js loaded");

// 🔥 SINGLE SOURCE (GLOBAL SYNC)
export let lastRenderedList = [];
window.lastRenderedList = lastRenderedList;

// 🔥 HOUSE COLLAPSE FLAG (default = collapse)
window.HOUSE_COLLAPSE_ENABLED =
  window.HOUSE_COLLAPSE_ENABLED ?? true;

export function renderResults(list) {

  const resultsDiv = document.getElementById("results");
  if (!resultsDiv) return;

  // 📝 SHOW ONLY NOTED VOTERS
  if (window.SHOW_ONLY_NOTED) {
    list = list.filter(p => p.note && p.note.trim() !== "");
  }

  // ⭐ SORT FIRST
  let workingList = [...list];

  if (window.sortMode === "serial-asc") {
    workingList.sort((a, b) => a.serial - b.serial);
  }

  if (window.sortMode === "serial-desc") {
    workingList.sort((a, b) => b.serial - a.serial);
  }

  // 🔥 UPDATE GLOBAL LIST FOR PAGINATION
  lastRenderedList = workingList;
  window.lastRenderedList = workingList;

  // ===============================
  // 🔁 PAGINATION
  // ===============================
  let displayList = workingList;

  if (window.PAGINATION_ENABLED) {
    const start = (window.currentPage - 1) * window.PAGE_SIZE;
    const end   = start + window.PAGE_SIZE;
    displayList = workingList.slice(start, end);
  }

  document.getElementById("loadingSkeleton")?.remove();
  resultsDiv.innerHTML = "";

  // ❌ NO DATA
  if (!workingList.length) {

  // ⏳ DATA STILL LOADING → SHOW LOADER
  if (window.IS_DATA_LOADING) {
    resultsDiv.innerHTML = `
      <div id="loadingSkeleton">
        <p style="text-align:center;opacity:.6">
          ⏳ Loading voters…
        </p>
      </div>
    `;
    return;
  }

  // ❌ DATA LOADED BUT EMPTY
  resultsDiv.innerHTML = "<p>No results found.</p>";
  window.updateStats?.([]);

  if (window.PAGINATION_ENABLED) {
    window.updatePageInfo?.(0);
  }
  return;
}

  // 📊 STATS
  window.updateStats?.(workingList);

  // =================================================
  // ⭐ SERIAL SORT MODE — FLAT LIST
  // =================================================
  if (
    window.sortMode === "serial-asc" ||
    window.sortMode === "serial-desc"
  ) {

    const frag = document.createDocumentFragment();
    displayList.forEach(p =>
      frag.appendChild(createVoterCard(p))
    );
    resultsDiv.appendChild(frag);

 // 🔁 BULK MODE
    document.querySelectorAll(".voter-select").forEach(cb => {
      cb.style.display = window.BULK_MODE_ON ? "block" : "none";
    });

    if (window.PAGINATION_ENABLED) {
      window.updatePageInfo?.(workingList.length);
      localStorage.setItem("lastPage", window.currentPage);
    }

    setTimeout(() => window.observeCards?.(), 0);
    // 🐞 update debug panel
window.updateDebugPanel?.();
    return;
  }

  // =================================================
  // ⭐ DEFAULT MODE — GROUP BY HOUSE
  // =================================================
  const grouped = {};

  displayList.forEach(p => {
    if (!p.house) return;
    if (!grouped[p.house]) grouped[p.house] = [];
    grouped[p.house].push(p);
  });

  const frag = document.createDocumentFragment();

  Object.keys(grouped)
    .sort(window.sortHouseASC)
    .forEach(h => {

      const housePeople = grouped[h].sort(
        (a, b) => a.serial - b.serial
      );

      const section = document.createElement("div");
      section.className = "house-section";
      section.style.background =
        window.colors?.[h] || "#f1f5f9";

      const header = document.createElement("div");
      header.className = "house-title";
      header.innerHTML = `
        <span>
          House: ${h.replace("house_", "")}
          <i class="bi bi-chevron-up collapse-icon"></i>
        </span>
        <small>${housePeople.length} voters</small>
      `;

      const content = document.createElement("div");
      content.className = "house-content";

      // 🔥 INITIAL STATE (RULE ENFORCE)
      if (window.HOUSE_COLLAPSE_ENABLED) {
        content.style.maxHeight = "0px";
        content.style.opacity = "0";
        header.querySelector(".collapse-icon")
          ?.classList.add("rotate");
      }

      // 🔁 COLLAPSE / EXPAND (USER ACTION)
      header.addEventListener("click", () => {

        // if collapse mode OFF → allow expand
        const collapsed = content.style.maxHeight === "0px";

        if (collapsed) {
          content.style.maxHeight =
            content.scrollHeight + "px";
          content.style.opacity = "1";
          header.querySelector(".collapse-icon")
            ?.classList.remove("rotate");
        } else {
          content.style.maxHeight = "0px";
          content.style.opacity = "0";
          header.querySelector(".collapse-icon")
            ?.classList.add("rotate");
        }
      });

      const cardFrag = document.createDocumentFragment();
      housePeople.forEach(p =>
        cardFrag.appendChild(createVoterCard(p))
      );

      content.appendChild(cardFrag);
      section.appendChild(header);
      section.appendChild(content);
      frag.appendChild(section);
    });

  resultsDiv.appendChild(frag);

  // =================================================
  // 📄 PAGINATION INFO
  // =================================================
  if (window.PAGINATION_ENABLED) {
    window.updatePageInfo?.(workingList.length);
    localStorage.setItem("lastPage", window.currentPage);
  }

  setTimeout(() => window.observeCards?.(), 0);

  // 📝 NOTE VISIBILITY
  const showNotes =
    localStorage.getItem("sidebar_swNotes") === "1";

  document.querySelectorAll(".note-container").forEach(box => {
    const body = box.querySelector(".note-body");
    const btn  = box.querySelector(".note-toggle-btn");
    if (!body || !btn) return;

    body.style.display = showNotes ? "block" : "none";
    btn.textContent = showNotes ? "📝 Hide Note" : "📝 Show Note";
  });
  // 🐞 update debug panel
window.updateDebugPanel?.();
}

// 🔓 🔥 VERY IMPORTANT FOR pagination.js
window.renderResults = renderResults;
// 🔁 notify jumps after re-render
window.dispatchEvent(new Event("renderResultsDone"));