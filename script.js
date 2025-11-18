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

  // ---------------------------
  // LOAD JSON DATA
  // ---------------------------
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


  // ---------------------------
  // PROCESS DATA
  // ---------------------------
  function processData() {
    allPeople = [];

    Object.keys(voterData).forEach(h => {
      voterData[h].forEach(p => {
        allPeople.push({ house: h, ...p });
      });
    });

    fillHouseDropdown();
    generateColors();
    findDuplicateBYP();
    renderResults(allPeople);
  }


  // ---------------------------
  // DUPLICATE BYP DETECTOR
  // ---------------------------
  function findDuplicateBYP() {
    const map = {};

    allPeople.forEach(p => {
      map[p.byp] = (map[p.byp] || 0) + 1;
    });

    duplicateBYPs = new Set(
      Object.keys(map).filter(b => map[b] > 1 && b.trim() !== "")
    );
  }


  // ---------------------------
  // AUTO HOUSE COLORS
  // ---------------------------
  function generateColors() {
    const houses = [...new Set(allPeople.map(p => p.house))].sort(sortHouseASC);

    houses.forEach((h, i) => {
      const hue = (i * 47) % 360;
      colors[h] = `hsla(${hue}, 80%, 92%, 1)`;
    });
  }


  // ---------------------------
  // NUMERIC SORT HELPER
  // ---------------------------
  function sortHouseASC(a, b) {
    const n1 = parseInt(a.replace("house_", ""));
    const n2 = parseInt(b.replace("house_", ""));
    return n1 - n2;
  }


  // ---------------------------
  // HOUSE DROPDOWN
  // ---------------------------
  function fillHouseDropdown() {
    const houses = Object.keys(voterData).sort(sortHouseASC);

    houses.forEach(h => {
      const op = document.createElement("option");
      op.value = h;
      op.textContent = "House " + h.replace("house_", "");
      filterHouse.appendChild(op);
    });
  }


  // ---------------------------
  // GROUP BY FAMILY
  // ---------------------------
  function groupFamily(peopleList) {
    const groups = {};

    peopleList.forEach(p => {
      let key = p.father || p.husband || "Unknown Family";
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });

    return groups;
  }


  // ---------------------------
  // RENDER RESULTS
  // ---------------------------
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

    Object.keys(groupedByHouse)
      .sort(sortHouseASC)
      .forEach(h => {

        const houseSection = document.createElement("div");
        houseSection.className = "house-section";
        houseSection.style.background = colors[h];

        const houseNumber = h.replace("house_", "");

        houseSection.innerHTML = `
          <div class="house-title" style="display:flex;justify-content:space-between;">
            <span>House: ${houseNumber}</span>
            <span>${groupedByHouse[h].length} voters</span>
          </div>
        `;

        // FAMILY TREE
        const familyGroups = groupFamily(groupedByHouse[h]);

        Object.keys(familyGroups).forEach(family => {

          const familyWrap = document.createElement("div");
          familyWrap.className = "family-wrap";

          const familyHeader = document.createElement("div");
          familyHeader.className = "family-header";
          familyHeader.style.cssText =
            "padding:8px;background:#fff2;border-radius:8px;margin-top:8px;cursor:pointer;font-weight:600;display:flex;justify-content:space-between;align-items:center;";

          familyHeader.innerHTML = `
            <span>👨‍👩‍👧 ${family}</span>
            <span class="arrow">▼</span>
          `;

          const familyContent = document.createElement("div");
          familyContent.className = "family-content";
          familyContent.style.marginTop = "8px";

          const headOfFamily = familyGroups[family][0]?.name;

          familyGroups[family].forEach(p => {
            const card = document.createElement("div");
            card.className = "card";
            card.style.marginBottom = "10px";

            const duplicateBadge = duplicateBYPs.has(p.byp)
              ? `<span class="dup-badge" style="background:#f97316;color:white;padding:2px 6px;border-radius:6px;font-size:10px;">DUPLICATE BYP</span>`
              : "";

            const headBadge =
              p.name === headOfFamily
                ? `<span class="pill" style="background:#2563eb;color:white;">HEAD</span>`
                : "";

            card.innerHTML = `
              <h3>${p.name}
                <span class="pill">#${p.serial}</span>
                ${headBadge}
                ${duplicateBadge}
              </h3>

              <p><strong>House:</strong> ${houseNumber}</p>
              <p><strong>Age:</strong> ${p.age}</p>
              <p><strong>Gender:</strong> ${p.gender}</p>
              <p><strong>Father:</strong> ${p.father || "-"}</p>
              <p><strong>Husband:</strong> ${p.husband || "-"}</p>
              <p><strong>BYP:</strong> ${p.byp}</p>
            `;

            if (duplicateBYPs.has(p.byp)) {
              card.style.border = "2px solid #f97316";
            }

            familyContent.appendChild(card);
          });

          // COLLAPSE TOGGLE
          familyHeader.addEventListener("click", () => {
            familyContent.classList.toggle("hidden");

            familyContent.style.display =
              familyContent.classList.contains("hidden") ? "none" : "block";

            familyHeader.querySelector(".arrow").textContent =
              familyContent.classList.contains("hidden") ? "►" : "▼";
          });

          familyWrap.appendChild(familyHeader);
          familyWrap.appendChild(familyContent);
          houseSection.appendChild(familyWrap);
        });

        resultsDiv.appendChild(houseSection);
      });
  }


  // ---------------------------
  // FILTERS
  // ---------------------------
  function applyFilters() {
    let filtered = [...allPeople];

    const g = filterGender.value;
    const a = filterAge.value;
    const h = filterHouse.value;
    const s = filterSort.value;
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

    if (s === "name") filtered.sort((a, b) => a.name.localeCompare(b.name));
    if (s === "serial") filtered.sort((a, b) => a.serial - b.serial);
    if (s === "age") filtered.sort((a, b) => a.age - b.age);
    if (s === "house") filtered.sort(sortHouseASC);
    if (s === "byp") filtered.sort((a, b) => a.byp.localeCompare(b.byp));
    if (s === "nameLength") filtered.sort((a, b) => a.name.length - b.name.length);

    renderResults(filtered);
  }

  filterGender.onchange = applyFilters;
  filterAge.onchange = applyFilters;
  filterHouse.onchange = applyFilters;
  filterSort.onchange = applyFilters;
  filterInitial.onchange = applyFilters;


  // ---------------------------
  // SEARCH
  // ---------------------------
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


  // ---------------------------
  // BACK TO TOP
  // ---------------------------
  window.addEventListener("scroll", () => {
    backToTop.style.display = window.scrollY > 200 ? "block" : "none";
  });

  backToTop.onclick = () =>
    window.scrollTo({ top: 0, behavior: "smooth" });

});
