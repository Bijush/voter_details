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
      voterData[h].forEach(p =>
        allPeople.push({ house: h, ...p })
      );
    });

    fillHouseDropdown();
    generateColors();
    findDuplicateBYP();
    renderResults(allPeople);
  }

  // DUPLICATE BYP DETECTION
  function findDuplicateBYP() {
    const map = {};
    allPeople.forEach(p => {
      if (!p.byp) return;
      map[p.byp] = (map[p.byp] || 0) + 1;
    });
    duplicateBYPs = new Set(Object.keys(map).filter(b => map[b] > 1));
  }

  // HOUSE SORT
  function sortHouseASC(a, b) {
    return parseInt(a.replace("house_", "")) -
           parseInt(b.replace("house_", ""));
  }

  // COLORS
  function generateColors() {
    const houses = [...new Set(allPeople.map(p => p.house))].sort(sortHouseASC);
    houses.forEach((h, i) => {
      colors[h] = `hsla(${(i * 47) % 360}, 80%, 92%, 1)`;
    });
  }

  // FILL DROPDOWN
  function fillHouseDropdown() {
    const houses = Object.keys(voterData).sort(sortHouseASC);
    houses.forEach(h => {
      const op = document.createElement("option");
      op.value = h;
      op.textContent = "House " + h.replace("house_", "");
      filterHouse.appendChild(op);
    });
  }

  // GROUP FAMILY (for showing only)
  function groupFamily(peopleList) {
    const groups = {};
    peopleList.forEach(p => {
      let key = p.father || p.husband || "Unknown Family";
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
    return groups;
  }

  // HOUSE HEAD = lowest serial in house
  function getHouseHead(housePeople) {
    return housePeople.reduce((min, p) =>
      p.serial < min.serial ? p : min
    );
  }

  // RENDER RESULTS
  function renderResults(list) {

    resultsDiv.innerHTML = "";

    const groupedByHouse = {};
    list.forEach(p => {
      if (!groupedByHouse[p.house]) groupedByHouse[p.house] = [];
      groupedByHouse[p.house].push(p);
    });

    Object.keys(groupedByHouse)
      .sort(sortHouseASC)
      .forEach(h => {

        const housePeople = groupedByHouse[h];
        const houseHead = getHouseHead(housePeople);
        const houseNumber = h.replace("house_", "");

        const houseSection = document.createElement("div");
        houseSection.className = "house-section";
        houseSection.style.background = colors[h];

        // COLLAPSIBLE CONTENT HOLDER
        const houseContent = document.createElement("div");
        houseContent.className = "house-content";
        houseContent.style.marginTop = "10px";

        // HOUSE TITLE WITH ONE HEAD & ARROW
        const headCard = document.createElement("div");
        headCard.className = "card";
        headCard.style.marginBottom = "10px";
        headCard.style.cursor = "pointer";

        headCard.innerHTML = `
          <h3 style="display:flex;justify-content:space-between;">
            <span>
              ${houseHead.name}
              <span class="pill">#${houseHead.serial}</span>
              <span class="pill" style="background:#2563eb;color:white;">HEAD</span>
            </span>
            <span class="toggle-arrow" style="font-size:20px;">▼</span>
          </h3>

          <p><strong>Age:</strong> ${houseHead.age}</p>
          <p><strong>Gender:</strong> ${houseHead.gender}</p>
          <p><strong>Father:</strong> ${houseHead.father || "-"}</p>
          <p><strong>Husband:</strong> ${houseHead.husband || "-"}</p>
          <p><strong>BYP:</strong> ${houseHead.byp}</p>
        `;

        // FAMILY GROUPS (ONLY FOR DISPLAY)
        const families = groupFamily(housePeople);

        Object.keys(families).forEach(family => {
          const members = families[family]
            .filter(m => m.serial !== houseHead.serial)
            .sort((a, b) => a.serial - b.serial);

          members.forEach(p => {
            const card = document.createElement("div");
            card.className = "card";
            card.style.marginBottom = "10px";

            const duplicateBadge = duplicateBYPs.has(p.byp)
              ? `<span class="pill" style="background:#f97316;color:white;">DUPLICATE</span>`
              : "";

            card.innerHTML = `
              <h3>${p.name}
                <span class="pill">#${p.serial}</span>
                ${duplicateBadge}
              </h3>
              <p><strong>Age:</strong> ${p.age}</p>
              <p><strong>Gender:</strong> ${p.gender}</p>
              <p><strong>Father:</strong> ${p.father || "-"}</p>
              <p><strong>Husband:</strong> ${p.husband || "-"}</p>
              <p><strong>BYP:</strong> ${p.byp}</p>
            `;

            houseContent.appendChild(card);
          });
        });

        // TOGGLE COLLAPSE
        headCard.addEventListener("click", () => {
          houseContent.classList.toggle("hidden");

          const arrow = headCard.querySelector(".toggle-arrow");
          const collapsed = houseContent.classList.contains("hidden");

          arrow.textContent = collapsed ? "►" : "▼";
          houseContent.style.display = collapsed ? "none" : "block";
        });

        // APPEND
        houseSection.appendChild(
          `<div class="house-title" style="display:flex;justify-content:space-between;">
            <span>House: ${houseNumber}</span>
            <span>${housePeople.length} voters</span>
          </div>`
        );

        houseSection.appendChild(headCard);
        houseSection.appendChild(houseContent);

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
          ? filtered.filter(p => !/^[A-Z]/.test(p.name))
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
      (p.byp || "").toLowerCase().includes(q) ||
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
