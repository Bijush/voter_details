document.addEventListener("DOMContentLoaded", () => {

  // DOM elements
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

  // ---------------------------
  // LOAD DATA
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
      voterData[h].forEach(p => allPeople.push({ house: h, ...p }));
    });

    fillHouseDropdown();
    generateColors();
    findDuplicateBYP();
    buildHouseNav();
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

  // HOUSE SORTING
  function sortHouseASC(a, b) {
    return parseInt(a.replace("house_", "")) - parseInt(b.replace("house_", ""));
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

  // SIDEBAR HOUSE NAV
  function buildHouseNav() {
    if (!houseNav) return;
    const houses = [...new Set(allPeople.map(p => p.house))].sort(sortHouseASC);
    houseNav.innerHTML = "";
    houses.forEach(h => {
      const btn = document.createElement("button");
      btn.className = "house-nav-item";
      const num = h.replace("house_", "");
      btn.textContent = num;

      btn.addEventListener("click", () => {
        document
          .querySelectorAll(".house-nav-item")
          .forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        const sec = document.getElementById("house-section-" + h);
        if (sec) {
          sec.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });

      houseNav.appendChild(btn);
    });
  }

  // GROUP BY FAMILY
  function groupFamily(peopleList) {
    const groups = {};
    peopleList.forEach(p => {
      const key = p.father || p.husband || "Unknown Family";
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
    return groups;
  }

  // GET HOUSE HEAD (lowest serial number in that house)
  function getHouseHead(housePeople) {
    return housePeople.reduce((min, p) => (p.serial < min.serial ? p : min));
  }

  // UPDATE STATS (for current visible list)
  function updateStats(list) {
    const total = list.length;
    const male  = list.filter(p => p.gender === "Male").length;
    const female= list.filter(p => p.gender === "Female").length;

    // count unique duplicate BYPs in current set
    const dupSet = new Set(
      list
        .filter(p => duplicateBYPs.has(p.byp))
        .map(p => p.byp)
    );

    statTotal.textContent  = total;
    statMale.textContent   = male;
    statFemale.textContent = female;
    statDup.textContent    = dupSet.size;
  }

  // ---------------------------
  // RENDER RESULTS
  // ---------------------------
  function renderResults(list) {

    resultsDiv.innerHTML = "";

    if (!list.length) {
      resultsDiv.innerHTML = "<p>No results found.</p>";
      updateStats([]);
      return;
    }

    updateStats(list);

    const groupedByHouse = {};
    list.forEach(p => {
      if (!groupedByHouse[p.house]) groupedByHouse[p.house] = [];
      groupedByHouse[p.house].push(p);
    });

    Object.keys(groupedByHouse)
      .sort(sortHouseASC)
      .forEach(h => {

        const housePeople = groupedByHouse[h];
        const houseHead   = getHouseHead(housePeople); // one HEAD per house
        const houseNumber = h.replace("house_", "");

        const houseSection = document.createElement("div");
        houseSection.className = "house-section";
        houseSection.id = "house-section-" + h; // for sidebar jump
        houseSection.style.background = colors[h] || "#eef2ff";

        houseSection.innerHTML = `
          <div class="house-title">
            <span>House: ${houseNumber}</span>
            <small>${housePeople.length} voters</small>
          </div>
        `;

        const familyGroups = groupFamily(housePeople);

        Object.keys(familyGroups).forEach(family => {

          const familyWrap = document.createElement("div");
          familyWrap.className = "family-wrap";

          const familyContent = document.createElement("div");
          familyContent.className = "family-content";
          familyContent.style.marginTop = "6px";

          // sort members by serial inside this family
          const members = [...familyGroups[family]].sort(
            (a, b) => a.serial - b.serial
          );
          const familyHead = members[0]; // family head controls collapse

          members.forEach(p => {
            const card = document.createElement("div");
            card.className = "card";

            const isFamilyHead = p.serial === familyHead.serial;
            const isHouseHead  = p.serial === houseHead.serial;

            const duplicateBadge = duplicateBYPs.has(p.byp)
              ? `<span class="dup-badge">DUPLICATE BYP</span>`
              : "";

            const headBadge = isHouseHead
              ? `<span class="pill head-pill">HEAD</span>`
              : "";

            const genderClass =
              p.gender === "Male"
                ? "male"
                : p.gender === "Female"
                ? "female"
                : "";

            const arrow = isFamilyHead
              ? `<span class="toggle-arrow">▼</span>`
              : "";

            card.innerHTML = `
              <h3>
                <div class="card-header-line">
                  <span class="card-main-label">
                    ${p.name}
                    <span class="pill">#${p.serial}</span>
                    ${headBadge}
                    ${duplicateBadge}
                  </span>
                  <span class="card-main-label">
                    <span class="gender-pill ${genderClass}">${p.gender || "-"}</span>
                    ${arrow}
                  </span>
                </div>
              </h3>
              <p><strong>Father:</strong> ${p.father || "-"}</p>
              <p><strong>Husband:</strong> ${p.husband || "-"}</p>
              <p><strong>BYP:</strong> ${p.byp}</p>
              <p><strong>Age:</strong> ${p.age}</p>
            `;

            if (duplicateBYPs.has(p.byp)) {
              card.style.border = "2px solid #f97316";
            }

            if (isFamilyHead) {
              // FAMILY HEAD: clicking toggles only this family's members
              card.addEventListener("click", () => {
                familyContent.classList.toggle("hidden");
                const arrowEl = card.querySelector(".toggle-arrow");
                const collapsed = familyContent.classList.contains("hidden");
                if (arrowEl) {
                  arrowEl.textContent = collapsed ? "►" : "▼";
                }
              });
              familyWrap.appendChild(card);      // head card outside
            } else {
              familyContent.appendChild(card);   // others inside collapsible
            }
          });

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
    const initial = filterInitial.value;
    const s = filterSort.value;

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

    // optional sort
    if (s === "name")  filtered.sort((x, y) => x.name.localeCompare(y.name));
    if (s === "serial")filtered.sort((x, y) => x.serial - y.serial);
    if (s === "age")   filtered.sort((x, y) => x.age - y.age);
    if (s === "house") filtered.sort((x, y) =>
      sortHouseASC(x.house, y.house)
    );
    if (s === "byp")   filtered.sort((x, y) => (x.byp || "").localeCompare(y.byp || ""));
    if (s === "nameLength") filtered.sort((x, y) => x.name.length - y.name.length);

    renderResults(filtered);
  }

  filterGender.onchange  = applyFilters;
  filterAge.onchange     = applyFilters;
  filterHouse.onchange   = applyFilters;
  filterSort.onchange    = applyFilters;
  filterInitial.onchange = applyFilters;

  // ---------------------------
  // SEARCH
  // ---------------------------
  searchInput.addEventListener("input", () => {
    const q = searchInput.value.toLowerCase().trim();

    if (!q) {
      applyFilters();
      return;
    }

    const matches = allPeople.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.house.toLowerCase().includes(q) ||
      (p.byp || "").toLowerCase().includes(q) ||
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
