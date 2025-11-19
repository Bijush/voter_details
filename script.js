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

    // Render each house
    Object.keys(groupedByHouse)
      .sort(sortHouseASC)
      .forEach(h => {

        const housePeople = groupedByHouse[h];
        const houseHead = getHouseHead(housePeople);
        const houseNumber = h.replace("house_", "");

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

        // Group by family
        const familyGroups = groupFamily(housePeople);

        Object.keys(familyGroups).forEach(family => {

          const familyWrap = document.createElement("div");
          familyWrap.className = "family-wrap";

          const familyContent = document.createElement("div");
          familyContent.className = "family-content";

          // Sort family by serial
          const members = [...familyGroups[family]].sort((a, b) => a.serial - b.serial);
          const familyHead = members[0];

          members.forEach(p => {

  const card = document.createElement("div");
  card.className = "card";

  const isHouseHead = p.serial === houseHead.serial;

  const duplicateBadge = duplicateBYPs.has(p.byp)
    ? `<span class="dup-badge">DUPLICATE</span>`
    : "";

  const headBadge = isHouseHead
    ? `<span class="pill head-pill">HEAD</span>`
    : "";

  const genderLabel = normalizeGender(p.gender);
  const genderClass = genderLabel === "Male" ? "male" : "female";

  const arrow = isHouseHead
    ? `<span class="toggle-arrow">▼</span>`
    : "";     // ❗ NO ARROW for others

  card.innerHTML = `
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

    <p><strong>Father:</strong> ${p.father || "-"}</p>
    <p><strong>Husband:</strong> ${p.husband || "-"}</p>
    <p><strong>BYP:</strong> ${p.byp}</p>
    <p><strong>Age:</strong> ${p.age}</p>
  `;

  // Only HOUSE HEAD collapses members
  if (isHouseHead) {
    card.addEventListener("click", () => {
      familyContent.classList.toggle("hidden");
      const arrowEl = card.querySelector(".toggle-arrow");
      const collapsed = familyContent.classList.contains("hidden");
      if (arrowEl) arrowEl.textContent = collapsed ? "►" : "▼";
    });

    familyWrap.appendChild(card);
  } else {
    familyContent.appendChild(card);
  }
});
          

          familyWrap.appendChild(familyContent);
          houseSection.appendChild(familyWrap);
        });

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
  searchInput.addEventListener("input", () => {
    const q = searchInput.value.toLowerCase().trim();

    if (!q) return applyFilters();

    const matches = allPeople.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.house.toLowerCase().includes(q) ||
      (p.byp || "").toLowerCase().includes(q) ||
      String(p.serial).includes(q)
    );

    renderResults(matches);
  });


  // ----------------------------
  // BACK TO TOP
  // ----------------------------
  window.addEventListener("scroll", () => {
    backToTop.style.display = window.scrollY > 200 ? "block" : "none";
  });

  backToTop.onclick = () =>
    window.scrollTo({ top: 0, behavior: "smooth" });

});
