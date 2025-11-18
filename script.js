document.addEventListener("DOMContentLoaded", () => {

  const searchInput = document.getElementById("search");
  const resultsDiv = document.getElementById("results");

  const filterGender = document.getElementById("filterGender");
  const filterAge = document.getElementById("filterAge");
  const filterHouse = document.getElementById("filterHouse");
  const filterSort = document.getElementById("filterSort");
  const filterInitial = document.getElementById("filterInitial");

  const backToTop = document.getElementById("backToTop");

  let voterData = {};
  let allPeople = [];
  let colors = {};
  let duplicateBYPs = new Set();

  const JSON_FILE = window.PS_JSON || "data/master.json";

  // LOAD DATA
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

  // PROCESS DATA
  function processData() {
    allPeople = [];
    Object.keys(voterData).forEach(h => {
      voterData[h].forEach(p => allPeople.push({ house: h, ...p }));
    });

    fillHouseDropdown();
    generateColors();
    findDuplicateBYP();
    renderResults(allPeople);
  }

  // DUPLICATE BYP DETECTION
  function findDuplicateBYP() {
    const map = {};
    allPeople.forEach(p => map[p.byp] = (map[p.byp] || 0) + 1);
    duplicateBYPs = new Set(Object.keys(map).filter(b => map[b] > 1));
  }

  // HOUSE SORTING
  function sortHouseASC(a, b) {
    return parseInt(a.replace("house_", "")) - parseInt(b.replace("house_", ""));
  }

  // AUTO COLORS
  function generateColors() {
    const houses = [...new Set(allPeople.map(p => p.house))].sort(sortHouseASC);
    houses.forEach((h, i) => colors[h] = `hsla(${(i * 47) % 360}, 80%, 92%, 1)`);
  }

  // DROPDOWN
  function fillHouseDropdown() {
    const houses = Object.keys(voterData).sort(sortHouseASC);
    houses.forEach(h => {
      const op = document.createElement("option");
      op.value = h;
      op.textContent = "House " + h.replace("house_", "");
      filterHouse.appendChild(op);
    });
  }

  // GROUP BY FAMILY
  function groupFamily(peopleList) {
    const groups = {};
    peopleList.forEach(p => {
      let key = p.father || p.husband || "Unknown Family";
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
    return groups;
  }

  // GET HOUSE HEAD (lowest serial)
  function getHouseHead(housePeople) {
    return housePeople.reduce((min, p) => p.serial < min.serial ? p : min);
  }

  // RENDER RESULTS
  function renderResults(list) {

    resultsDiv.innerHTML = "";

    if (!list.length) {
      resultsDiv.innerHTML = "<p>No results found.</p>";
      return;
    }

    const groupedByHouse = {};
    list.forEach(p => {
      if (!groupedByHouse[p.house]) groupedByHouse[p.house] = [];
      groupedByHouse[p.house].push(p);
    });

    Object.keys(groupedByHouse).sort(sortHouseASC).forEach(h => {

      const housePeople = groupedByHouse[h];
      const houseHead = getHouseHead(housePeople);
      const houseNumber = h.replace("house_", "");

      const houseSection = document.createElement("div");
      houseSection.className = "house-section";
      houseSection.style.background = colors[h];

      houseSection.innerHTML = `
        <div class="house-title" style="display:flex;justify-content:space-between;">
          <span>House: ${houseNumber}</span>
          <span>${housePeople.length} voters</span>
        </div>
      `;

      const familyGroups = groupFamily(housePeople);

      Object.keys(familyGroups).forEach(family => {

        const familyWrap = document.createElement("div");
        const familyContent = document.createElement("div");
        familyContent.className = "family-content";
        familyContent.style.marginTop = "8px";

        // FIRST: Render HEAD card alone with arrow
        familyGroups[family]
          .sort((a, b) => a.serial - b.serial)
          .forEach(p => {

            const card = document.createElement("div");
            card.className = "card";
            card.style.marginBottom = "10px";

            const duplicateBadge = duplicateBYPs.has(p.byp)
              ? `<span class="dup-badge" style="background:#f97316;color:white;padding:2px 6px;border-radius:6px;font-size:10px;">DUPLICATE BYP</span>`
              : "";

            const isHead = p.serial === houseHead.serial;

            const headBadge = isHead
              ? `<span class="pill" style="background:#2563eb;color:white;">HEAD</span>`
              : "";

            const arrow = isHead
              ? `<span class="toggle-arrow" style="font-size:18px;cursor:pointer;">▼</span>`
              : "";

            card.innerHTML = `
              <h3 style="display:flex;justify-content:space-between;">
                <span>
                  ${p.name} <span class="pill">#${p.serial}</span> ${headBadge} ${duplicateBadge}
                </span>
                ${arrow}
              </h3>
              <p><strong>Age:</strong> ${p.age}</p>
              <p><strong>Gender:</strong> ${p.gender}</p>
              <p><strong>Father:</strong> ${p.father || "-"}</p>
              <p><strong>Husband:</strong> ${p.husband || "-"}</p>
              <p><strong>BYP:</strong> ${p.byp}</p>
            `;

            if (duplicateBYPs.has(p.byp)) {
              card.style.border = "2px solid #f97316";
            }

            // If HEAD → collapse/expand control
            if (isHead) {
              card.addEventListener("click", () => {
                familyContent.classList.toggle("hidden");

                const arrowEl = card.querySelector(".toggle-arrow");
                arrowEl.textContent = familyContent.classList.contains("hidden") ? "►" : "▼";

                familyContent.style.display =
                  familyContent.classList.contains("hidden") ? "none" : "block";
              });
            }

            // Append HEAD card first
            if (isHead) {
              familyWrap.appendChild(card);
            } else {
              // Other members go inside familyContent
              familyContent.appendChild(card);
            }
          });

        familyWrap.appendChild(familyContent);
        houseSection.appendChild(familyWrap);
      });

      resultsDiv.appendChild(houseSection);
    });
  }

  // FILTERS
  function applyFilters() {
    let filtered = [...allPeople];

    const g = filterGender.value;
    const a = filterAge.value;
    const h = filterHouse.value;
    const initial = filterInitial.value;

    if (g) filtered = filtered.filter(p => p.gender === g);
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

    renderResults(filtered);
  }

  filterGender.onchange = applyFilters;
  filterAge.onchange = applyFilters;
  filterHouse.onchange = applyFilters;
  filterSort.onchange = applyFilters;
  filterInitial.onchange = applyFilters;

  // SEARCH
  searchInput.addEventListener("input", () => {
    const q = searchInput.value.toLowerCase();

    if (!q) return applyFilters();

    const matches = allPeople.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.house.toLowerCase().includes(q) ||
      p.byp.toLowerCase().includes(q) ||
      String(p.serial).includes(q)
    );

    renderResults(matches);
  });

  // BACK TO TOP
  window.addEventListener("scroll", () => {
    backToTop.style.display = window.scrollY > 200 ? "block" : "none";
  });

  backToTop.onclick = () =>
    window.scrollTo({ top: 0, behavior: "smooth" });

});
