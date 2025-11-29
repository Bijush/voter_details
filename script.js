document.addEventListener("DOMContentLoaded", () => {

  // ----------------------------
  // DOM ELEMENTS
  // ----------------------------
  const searchInput    = document.getElementById("search");
  const resultsDiv     = document.getElementById("results");

  const filterGender   = document.getElementById("filterGender");
  const filterAge      = document.getElementById("filterAge");
  const filterHouse    = document.getElementById("filterHouse");
  const filterSort     = document.getElementById("filterSort");
  const filterInitial  = document.getElementById("filterInitial");

  const backToTop      = document.getElementById("backToTop");
  const houseNav       = document.getElementById("houseNav");

  const statTotal      = document.getElementById("statTotal");
  const statMale       = document.getElementById("statMale");
  const statFemale     = document.getElementById("statFemale");
  const statDup        = document.getElementById("statDup");

  let voterData   = {};
  let allPeople   = [];
  let colors      = {};
  let duplicateBYPs = new Set();

  const JSON_FILE = window.PS_JSON || "data/master.json";


  // ----------------------------
  // LOAD DATA
  // ----------------------------
  fetch(JSON_FILE)
    .then(res => res.json())
    .then(data => {
      voterData = data;
      processData();
    })
    .catch(err => {
      resultsDiv.innerHTML = `<p style="color:red;">Failed to load voter list.</p>`;
      console.error(err);
    });


  // ----------------------------
  // PROCESS DATA
  // ----------------------------
  function processData() {
    allPeople = [];
    Object.keys(voterData).forEach(h => {
      voterData[h].forEach(p => allPeople.push({ house: h, ...p }));
    });

    fillHouseDropdown();
    generateColors();
    findDuplicateBYP();
    buildHouseNav();
    renderResults(allPeople);

    // -----------------------------
    // TOTAL HOUSE COUNT SYSTEM
    // -----------------------------
    const totalHouses = Object.keys(voterData).length;

    // Create or update house stat chip
    let houseChip = document.getElementById("statHouse");
    if (!houseChip) {
        houseChip = document.createElement("div");
        houseChip.className = "stat-chip";
        houseChip.id = "statHouse";
        houseChip.innerHTML = `Houses: <span class="value">${totalHouses}</span>`;
        document.querySelector(".stats-bar").appendChild(houseChip);
    } else {
        houseChip.querySelector(".value").textContent = totalHouses;
    }

    console.log("Total Houses:", totalHouses);
}


  // ----------------------------
  // DUPLICATE BYP
  // ----------------------------
  function findDuplicateBYP() {
    const map = {};
    allPeople.forEach(p => {
      if (!p.byp) return;
      map[p.byp] = (map[p.byp] || 0) + 1;
    });
    duplicateBYPs = new Set(Object.keys(map).filter(b => map[b] > 1));
  }


  // ----------------------------
  // SORT HOUSE
  // ----------------------------
  function sortHouseASC(a, b) {
    return parseInt(a.replace("house_", "")) - parseInt(b.replace("house_", ""));
  }


  // ----------------------------
  // COLORS PER HOUSE
  // ----------------------------
  function generateColors() {
    const houses = [...new Set(allPeople.map(p => p.house))].sort(sortHouseASC);
    houses.forEach((h, i) => {
      colors[h] = `hsla(${(i * 47) % 360}, 78%, 92%, 1)`;
    });
  }


  // ----------------------------
  // HOUSE DROPDOWN
  // ----------------------------
  function fillHouseDropdown() {
    const houses = Object.keys(voterData).sort(sortHouseASC);
    houses.forEach(h => {
      const op = document.createElement("option");
      op.value = h;
      op.textContent = "House " + h.replace("house_", "");
      filterHouse.appendChild(op);
    });
  }


  // ----------------------------
  // LEFT NAVIGATION (HOUSE LIST)
  // ----------------------------
  function buildHouseNav() {
    if (!houseNav) return;
    houseNav.innerHTML = "";

    const houses = [...new Set(allPeople.map(p => p.house))].sort(sortHouseASC);

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


  // ----------------------------
  // GROUP BY FAMILY (father/husband)
  // ----------------------------
  function groupFamily(peopleList) {
    const groups = {};
    peopleList.forEach(p => {
      const key = p.father || p.husband || "Unknown";
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
    return groups;
  }


  // ----------------------------
  // GET HOUSE HEAD = lowest serial
  // ----------------------------
  function getHouseHead(housePeople) {
    return housePeople.reduce((min, p) => (p.serial < min.serial ? p : min));
  }


  // ----------------------------
  // NORMALIZE GENDER TEXT (Bangla → English)
  // ----------------------------
  function normalizeGender(g) {
    if (!g) return "";
    g = g.trim();

    if (["Male", "পুরুষ"].includes(g)) return "Male";
    if (["Female", "মহিলা", "নারী"].includes(g)) return "Female";

    return g;
  }


  // ----------------------------
  // UPDATE STATS
  // ----------------------------
  function updateStats(list) {
    const total = list.length;

    const male = list.filter(p => normalizeGender(p.gender) === "Male").length;
    const female = list.filter(p => normalizeGender(p.gender) === "Female").length;

    const dupSet = new Set(
      list.filter(p => duplicateBYPs.has(p.byp)).map(p => p.byp)
    );

    statTotal.textContent = total;
    statMale.textContent = male;
    statFemale.textContent = female;
    statDup.textContent = dupSet.size;
  }

 // Photo mismatch function

/*
function cleanName(name) {
  return name
    .trim()                     // extra space remove
    .toLowerCase()              // lowercase convert
    .replace(/\s+/g, " ")       // multiple space → single space
    .replace(/[^a-z0-9 ]/g, "") // special char remove
    .replace(/ /g, "-");        // space → hyphen (for photo file)
}
*/
  // ----------------------------
  // RENDER RESULTS (MAIN)
  // ----------------------------
  function renderResults(list) {

  resultsDiv.innerHTML = "";
  if (!list.length) {
    resultsDiv.innerHTML = "<p>No results found.</p>";
    updateStats([]);
    return;
  }

  updateStats(list);

  // Group by house
  const groupedByHouse = {};
  list.forEach(p => {
    if (!groupedByHouse[p.house]) groupedByHouse[p.house] = [];
    groupedByHouse[p.house].push(p);
  });

  Object.keys(groupedByHouse)
    .sort(sortHouseASC)
    .forEach(h => {

      const housePeople = groupedByHouse[h].sort((a,b)=>a.serial-b.serial);
      const houseHead   = getHouseHead(housePeople);
      const houseNumber = h.replace("house_", "");

      // Main wrapper for house
      const houseSection = document.createElement("div");
      houseSection.className = "house-section";
      houseSection.id = "house-section-" + h;
      houseSection.style.background = colors[h];

      houseSection.innerHTML = `
        <div class="house-title">
          <span>House: ${houseNumber}</span>
          <small>${housePeople.length} voters</small>
        </div>
      `;

      // Container for members except head
      const houseContent = document.createElement("div");
      houseContent.className = "house-content";

      // Render each member
      housePeople.forEach(p => {
        const card = document.createElement("div");
        card.className = "card";
//const clean = cleanName(p.name);

// PHOTO BY SERIAL NUMBER

const photoPath = `photos/${p.serial}.jpg`;


        const isHead = p.serial === houseHead.serial;

        const duplicateBadge = duplicateBYPs.has(p.byp)
          ? `<span class="dup-badge">DUPLICATE</span>`
          : "";

        const headBadge = isHead
          ? `<span class="pill head-pill">HEAD</span>`
          : "";

        const genderLabel = normalizeGender(p.gender);
        const genderClass = genderLabel === "Male" ? "male" : "female";

        const arrow = isHead
          ? `<span class="toggle-arrow">▼</span>`
          : "";

        // CONDITIONAL FATHER / HUSBAND
let fatherLine = p.father ? `<p><strong>Father:</strong> ${p.father}</p>` : "";
let husbandLine = p.husband ? `<p><strong>Husband:</strong> ${p.husband}</p>` : "";

card.innerHTML = `
  <img src="${photoPath}" class="voter-photo" onclick="openPhoto(this.src)">
  <h3 class="card-header-line">
    <span>
      ${p.name}
      <span class="pill">#${p.serial}</span>
      ${headBadge}
      ${duplicateBadge}
    </span>
    <span class="gender-pill ${genderClass}">
      ${genderLabel}
    </span>
    ${arrow}
  </h3>

  ${fatherLine}
  ${husbandLine}

  <p><strong>BYP:</strong> ${p.byp}</p>
  <p><strong>Age:</strong> ${p.age}</p>
`;

        // If HEAD — put outside + add toggle effect
        if (isHead) {
          card.addEventListener("click", () => {
            houseContent.classList.toggle("hidden");

            const collapsed = houseContent.classList.contains("hidden");
            houseContent.style.display = collapsed ? "none" : "block";

            const arrowEl = card.querySelector(".toggle-arrow");
            if (arrowEl) arrowEl.textContent = collapsed ? "►" : "▼";
          });

          houseSection.appendChild(card);  // HEAD first

        } else {
          houseContent.appendChild(card);  // others inside collapsible box
        }
      });

      // Add remaining members
      houseSection.appendChild(houseContent);

      resultsDiv.appendChild(houseSection);
    });
}


  // ----------------------------
  // FILTERS
  // ----------------------------
  function applyFilters() {
    let filtered = [...allPeople];

    const g = filterGender.value;
    const a = filterAge.value;
    const h = filterHouse.value;
    const s = filterSort.value;
    const initial = filterInitial.value;

    if (g) filtered = filtered.filter(p => normalizeGender(p.gender) === g);
    if (h) filtered = filtered.filter(p => p.house === h);

    if (a) {
      const [min, max] = a.split("-").map(Number);
      filtered = filtered.filter(p => p.age >= min && p.age <= max);
    }

    if (initial) {
      filtered =
        initial === "#"
          ? filtered.filter(p => !/^[A-Z]/i.test(p.name))
          : filtered.filter(p => p.name.startsWith(initial));
    }

    // Sorting
    if (s === "name") filtered.sort((a, b) => a.name.localeCompare(b.name));
    if (s === "serial") filtered.sort((a, b) => a.serial - b.serial);
    if (s === "age") filtered.sort((a, b) => a.age - b.age);
    if (s === "house") filtered.sort((a, b) => sortHouseASC(a.house, b.house));
    if (s === "byp") filtered.sort((a, b) => (a.byp || "").localeCompare(b.byp || ""));
    if (s === "nameLength") filtered.sort((a, b) => a.name.length - b.name.length);

    renderResults(filtered);
  }

  filterGender.onchange  = applyFilters;
  filterAge.onchange     = applyFilters;
  filterHouse.onchange   = applyFilters;
  filterSort.onchange    = applyFilters;
  filterInitial.onchange = applyFilters;


  // ----------------------------
  // SEARCH FUNCTION
  // ----------------------------
  // ----------------------------
// ADVANCED SEARCH → SHOW FULL HOUSE OF MATCHES
// ----------------------------
searchInput.addEventListener("input", () => {
  const q = searchInput.value.toLowerCase().trim();

  if (!q) {
    applyFilters();
    return;
  }

  // Step 1: find matched people
  const matchedPeople = allPeople.filter(p =>
    p.name.toLowerCase().includes(q) ||
    String(p.serial).includes(q) ||
    (p.byp || "").toLowerCase().includes(q)
  );

  if (matchedPeople.length === 0) {
    renderResults([]); 
    return;
  }

  // Step 2: Collect houses of matched people
  const matchedHouses = new Set(matchedPeople.map(p => p.house));

  // Step 3: Build full list of ALL persons from those houses
  const finalList = allPeople.filter(p => matchedHouses.has(p.house));

  // Step 4: Render FULL families
  renderResults(finalList);

  // Clear filters (optional)
  filterGender.value = "";
  filterAge.value = "";
  filterHouse.value = "";
  filterSort.value = "";
  filterInitial.value = "";
});

  // ----------------------------
  // BACK TO TOP
  // ----------------------------
  window.addEventListener("scroll", () => {
    backToTop.style.display = window.scrollY > 200 ? "block" : "none";
  });

  backToTop.onclick = () =>
    window.scrollTo({ top: 0, behavior: "smooth" });
  


  // ----------------------------
  // DUPLICATE BYP JUMP SYSTEM
  // ----------------------------
  let duplicateJumpList = [];
  let duplicateJumpIndex = 0;

  // Build the list of duplicate items after rendering results
  function collectDuplicateCards() {
    duplicateJumpList = [];
    duplicateJumpIndex = 0;

    document.querySelectorAll(".dup-badge").forEach(badge => {
      const card = badge.closest(".card");
      if (card) duplicateJumpList.push(card);
    });
    updateDupButtonVisibility();
    setupDuplicateCardClicks();
  }

  // Override renderResults to collect duplicates each time it updates
  const originalRenderResults = renderResults;
  renderResults = function(list) {
    originalRenderResults(list);
    collectDuplicateCards(); 
  };

  // Click duplicate stat → jump one by one
  statDup.addEventListener("click", () => {
    if (!duplicateJumpList.length) return;

    const el = duplicateJumpList[duplicateJumpIndex];

    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.style.boxShadow = "0 0 0 3px #f97316";

    setTimeout(() => (el.style.boxShadow = ""), 1500);

    duplicateJumpIndex = (duplicateJumpIndex + 1) % duplicateJumpList.length;
  });
// ----------------------------
// FLOATING DUPLICATE BUTTON
// ----------------------------
function updateDupButtonVisibility() {
  const btn = document.getElementById("dupJumpBtn");
  if (duplicateJumpList.length > 0) {
    btn.style.display = "block";
  } else {
    btn.style.display = "none";
  }
}

// Floating button click → next duplicate
document.getElementById("dupJumpBtn").addEventListener("click", () => {
  if (!duplicateJumpList.length) return;

  const el = duplicateJumpList[duplicateJumpIndex];

  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.style.boxShadow = "0 0 0 3px #f97316";

  setTimeout(() => (el.style.boxShadow = ""), 1500);

  duplicateJumpIndex = (duplicateJumpIndex + 1) % duplicateJumpList.length;
});
  // ----------------------------
// CLICK DUPLICATE CARD → JUMP NEXT DUPLICATE
// ----------------------------
function setupDuplicateCardClicks() {
  const bypGroups = {};

  // Build groups based on BYP numbers
  duplicateJumpList.forEach(card => {
    const bypLine = card.querySelector("p:nth-child(4)");
    if (!bypLine) return;

    const raw = bypLine.textContent.replace("BYP:", "").trim();
    if (!bypGroups[raw]) bypGroups[raw] = [];
    bypGroups[raw].push(card);
  });

  // Add click listeners to each duplicate member
  Object.keys(bypGroups).forEach(byp => {
    const group = bypGroups[byp];

    group.forEach((card, index) => {
      card.addEventListener("click", () => {
        if (group.length <= 1) return;

        const nextIndex = (index + 1) % group.length;
        const nextCard = group[nextIndex];

        nextCard.scrollIntoView({ behavior: "smooth", block: "center" });
        nextCard.style.boxShadow = "0 0 0 3px #f97316";

        setTimeout(() => (nextCard.style.boxShadow = ""), 1500);
      });
    });
  });
}
// ----------------------------
// SIDEBAR TOGGLE SYSTEM
// ----------------------------
const sidebar = document.querySelector(".sidebar");
const toggleSidebarBtn = document.getElementById("toggleSidebarBtn");

// Default hidden
sidebar.classList.add("sidebar-hidden");

toggleSidebarBtn.addEventListener("click", () => {
  const isHidden = sidebar.classList.contains("sidebar-hidden");

  if (isHidden) {
    sidebar.classList.remove("sidebar-hidden");
    sidebar.classList.add("sidebar-visible");
    toggleSidebarBtn.textContent = "✖ Close";
  } else {
    sidebar.classList.add("sidebar-hidden");
    sidebar.classList.remove("sidebar-visible");
    toggleSidebarBtn.textContent = "☰ Houses";
  }
});
  
// DYNAMIC BREADCRUMB SYSTEM
// ----------------------------
const breadcrumbHouse = document.getElementById("breadcrumbHouse");

function updateBreadcrumbOnScroll() {
  const sections = document.querySelectorAll(".house-section");

  let current = "All Houses"; // default

  sections.forEach(sec => {
    const rect = sec.getBoundingClientRect();

    // If section is in view
    if (rect.top <= 150 && rect.bottom >= 150) {
      current = sec.querySelector(".house-title span").textContent.replace("House: ", "");
    }
  });

  breadcrumbHouse.textContent = current;
}

window.addEventListener("scroll", updateBreadcrumbOnScroll);

function setBreadcrumbHouse(num) {
  breadcrumbHouse.textContent = num;
}

});