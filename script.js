document.addEventListener("DOMContentLoaded", () => {

  const searchInput   = document.getElementById("search");
  const resultsDiv    = document.getElementById("results");

  const filterGender  = document.getElementById("filterGender");
  const filterAge     = document.getElementById("filterAge");
  const filterHouse   = document.getElementById("filterHouse");
  const filterSort    = document.getElementById("filterSort");
  const filterInitial = document.getElementById("filterInitial");

  const backToTop     = document.getElementById("backToTop");

  let voterData   = {};
  let allPeople   = [];
  let colors      = {};
  let duplicateBYPs = new Set();

  const JSON_FILE = window.PS_JSON || "data/master.json";

  // -----------------------------
  // LOAD DATA
  // -----------------------------
  fetch(JSON_FILE)
    .then(res => {
      if (!res.ok) throw new Error("HTTP " + res.status + " for " + JSON_FILE);
      return res.json();
    })
    .then(data => {
      voterData = data;
      processData();
    })
    .catch(err => {
      resultsDiv.innerHTML = `<p style="color:red;">Failed to load voter list.</p>`;
      console.error(err);
    });

  // -----------------------------
  // PREPARE DATA
  // -----------------------------
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
    allPeople.forEach(p => {
      if (!p.byp) return;
      map[p.byp] = (map[p.byp] || 0) + 1;
    });
    duplicateBYPs = new Set(Object.keys(map).filter(b => map[b] > 1));
  }

  // SORT HOUSE NUMERICALLY
  function sortHouseASC(a, b) {
    return parseInt(a.replace("house_", "")) -
           parseInt(b.replace("house_", ""));
  }

  // AUTO COLORS PER HOUSE
  function generateColors() {
    const houses = [...new Set(allPeople.map(p => p.house))].sort(sortHouseASC);
    houses.forEach((h, i) => {
      const hue = (i * 47) % 360;
      colors[h] = `hsla(${hue}, 80%, 92%, 1)`;
    });
  }

  // HOUSE DROPDOWN
  function fillHouseDropdown() {
    const houses = Object.keys(voterData).sort(sortHouseASC);
    houses.forEach(h => {
      const op = document.createElement("option");
      op.value = h;
      op.textContent = "House " + h.replace("house_", "");
      filterHouse.appendChild(op);
    });
  }

  // GROUP BY FAMILY (for showing tree)
  function groupFamily(peopleList) {
    const groups = {};
    peopleList.forEach(p => {
      const key = p.father || p.husband || "Unknown Family";
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
    return groups;
  }

  // ONE HEAD PER HOUSE (lowest serial)
  function getHouseHead(housePeople) {
    return housePeople.reduce((min, p) => (p.serial < min.serial ? p : min));
  }

  // -----------------------------
  // RENDER RESULTS
  // -----------------------------
  function renderResults(list) {
    resultsDiv.innerHTML = "";

    if (!list.length) {
      resultsDiv.innerHTML = "<p>No results found.</p>";
      return;
    }

    // group by house
    const groupedByHouse = {};
    list.forEach(p => {
      if (!groupedByHouse[p.house]) groupedByHouse[p.house] = [];
      groupedByHouse[p.house].push(p);
    });

    Object.keys(groupedByHouse)
      .sort(sortHouseASC)
      .forEach(h => {
        const housePeople = groupedByHouse[h];
        const houseHead   = getHouseHead(housePeople);   // ✔ one head per house
        const houseNumber = h.replace("house_", "");

        const houseSection = document.createElement("div");
        houseSection.className = "house-section";
        houseSection.style.background = colors[h];

        // title row
        const titleDiv = document.createElement("div");
        titleDiv.className = "house-title";
        titleDiv.style.display = "flex";
        titleDiv.style.justifyContent = "space-between";
        titleDiv.innerHTML = `
          <span>House: ${houseNumber}</span>
          <span>${housePeople.length} voters</span>
        `;
        houseSection.appendChild(titleDiv);

        // HEAD card (always visible)
        const headCard = document.createElement("div");
        headCard.className = "card";
        headCard.style.marginBottom = "10px";
        headCard.style.cursor = "pointer";

        headCard.innerHTML = `
          <h3 style="display:flex;justify-content:space-between;align-items:center;">
            <span>
              ${houseHead.name}
              <span class="pill">#${houseHead.serial}</span>
              <span class="pill" style="background:#2563eb;color:white;">HEAD</span>
            </span>
            <span class="toggle-arrow" style="font-size:18px;">▼</span>
          </h3>
          <p><strong>Age:</strong> ${houseHead.age}</p>
          <p><strong>Gender:</strong> ${houseHead.gender}</p>
          <p><strong>Father:</strong> ${houseHead.father || "-"}</p>
          <p><strong>Husband:</strong> ${houseHead.husband || "-"}</p>
          <p><strong>BYP:</strong> ${houseHead.byp}</p>
        `;

        // container for other members of this house
        const houseContent = document.createElement("div");
        houseContent.className = "house-content";
        houseContent.style.marginTop = "8px";

        // FAMILY TREE (for display only)
        // FAMILY TREE (clean version)
const familyGroups = groupFamily(housePeople);

Object.keys(familyGroups).forEach(family => {

  // SHOW FAMILY LABEL ONLY ONCE  
  const famLabel = document.createElement("div");
  famLabel.style.fontWeight = "600";
  famLabel.style.margin = "10px 0 5px";
  famLabel.textContent = "👨‍👩‍👧 Family: " + family;
  houseContent.appendChild(famLabel);

  // Sort family members
  const members = [...familyGroups[family]].sort(
    (a, b) => a.serial - b.serial
  );

  // Skip HOUSE HEAD
  const otherMembers = members.filter(p => p.serial !== houseHead.serial);

  otherMembers.forEach(p => {
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

    if (duplicateBYPs.has(p.byp)) {
      card.style.border = "2px solid #f97316";
    }

    houseContent.appendChild(card);
  });
});

        // click on HEAD = collapse / expand ALL other members in that house
        headCard.addEventListener("click", () => {
          houseContent.classList.toggle("hidden");
          const collapsed = houseContent.classList.contains("hidden");

          houseContent.style.display = collapsed ? "none" : "block";
          const arrow = headCard.querySelector(".toggle-arrow");
          if (arrow) arrow.textContent = collapsed ? "►" : "▼";
        });

        houseSection.appendChild(headCard);
        houseSection.appendChild(houseContent);

        resultsDiv.appendChild(houseSection);
      });
  }

  // -----------------------------
  // FILTERS
  // -----------------------------
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

  filterGender.onchange  = applyFilters;
  filterAge.onchange     = applyFilters;
  filterHouse.onchange   = applyFilters;
  filterSort.onchange    = applyFilters; // kept for future if you want sort by select
  filterInitial.onchange = applyFilters;

  // -----------------------------
  // SEARCH
  // -----------------------------
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

  // -----------------------------
  // BACK TO TOP
  // -----------------------------
  window.addEventListener("scroll", () => {
    backToTop.style.display = window.scrollY > 200 ? "block" : "none";
  });

  backToTop.onclick = () =>
    window.scrollTo({ top: 0, behavior: "smooth" });

});
