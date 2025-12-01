document.addEventListener("DOMContentLoaded", () => {

  // ----------------------------
  // CASTE AUTO-DETECT RULES
  // ----------------------------
  function detectCaste(nameRaw) {
    if (!nameRaw) return "General";
    const name = (" " + nameRaw.toLowerCase() + " ");

    const MUSLIM = [" laskar"," uddin"," hussain"," hossain"," ali"," ahmed"," ahmad",
      " begum"," khatun"," barbhuiya"," choudhury"," chowdhury"," mia "];

    const SC  = [" das "," namashudra"," namasudra"," namsudra"," sarkar"," debnath"];
    const ST  = [" majhi "," tudu "," hansda "," murmu "," basumatary "];
    const OBC = [" roy "," mallick "," mallik "," dey "," sukla "," suklabaidya"," bhadra"," deb "];

    if (MUSLIM.some(k => name.includes(k))) return "Muslim";
    if (SC.some(k => name.includes(k))) return "SC";
    if (ST.some(k => name.includes(k))) return "ST";
    if (OBC.some(k => name.includes(k))) return "OBC";

    return "General";
  }

  // ----------------------------
  // DOM ELEMENTS
  // ----------------------------
  const searchInput   = document.getElementById("search");
  const resultsDiv    = document.getElementById("results");

  const filterAge     = document.getElementById("filterAge");
  const filterHouse   = document.getElementById("filterHouse");

  const backToTop     = document.getElementById("backToTop");
  const houseNav      = document.getElementById("houseNav");

  const statTotal     = document.getElementById("statTotal");
  const statMale      = document.getElementById("statMale");
  const statFemale    = document.getElementById("statFemale");
  const statDup       = document.getElementById("statDup");

  const statSC        = document.getElementById("statSC");
  const statOBC       = document.getElementById("statOBC");
  const statST        = document.getElementById("statST");
  const statMus       = document.getElementById("statMuslim");

  let voterData = {};
  let allPeople = [];
  let colors    = {};
  let duplicateBYPs = new Set();

  const JSON_FILE = window.PS_JSON || "data/master.json";


  // ----------------------------
  // LOAD DATA
  // ----------------------------
  fetch(JSON_FILE)
    .then(res => res.json())
    .then(data => { voterData = data; processData(); })
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
      voterData[h].forEach(p => {
        allPeople.push({
          house: h,
          ...p,
          caste: detectCaste(p.name)
        });
      });
    });

    fillHouseDropdown();
    generateColors();
    findDuplicateBYP();
    buildHouseNav();
    renderResults(allPeople);

    // TOTAL HOUSES
    const totalHouses = Object.keys(voterData).length;
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
  // SORT HOUSE ACC
  // ----------------------------
  const sortHouseASC = (a, b) =>
    parseInt(a.replace("house_", "")) - parseInt(b.replace("house_", ""));


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
  // LEFT NAV (HOUSE LIST)
  // ----------------------------
  function buildHouseNav() {
    houseNav.innerHTML = "";

    const houses = [...new Set(allPeople.map(p => p.house))].sort(sortHouseASC);

    houses.forEach(h => {
      const btn = document.createElement("button");
      btn.className = "house-nav-item";
      btn.textContent = h.replace("house_", "");

      btn.addEventListener("click", () => {
        document.querySelectorAll(".house-nav-item")
          .forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        const sec = document.getElementById("house-section-" + h);
        if (sec) sec.scrollIntoView({ behavior: "smooth", block: "start" });
      });

      houseNav.appendChild(btn);
    });
  }

  // ----------------------------
  // CLEAN GENDER
  // ----------------------------
  function normalizeGender(g) {
    if (!g) return "";
    g = g.trim();
    if (["Male", "পুরুষ"].includes(g)) return "Male";
    if (["Female", "মহিলা", "নারী"].includes(g)) return "Female";
    return g;
  }

  // ----------------------------
  // UPDATE STATS (CASTE too)
  // ----------------------------
  function updateStats(list) {
    const total = list.length;

    statTotal.textContent = total;
    statMale.textContent  = list.filter(p => normalizeGender(p.gender)==="Male").length;
    statFemale.textContent= list.filter(p => normalizeGender(p.gender)==="Female").length;

    const dupSet = new Set(list.filter(p => duplicateBYPs.has(p.byp)).map(p => p.byp));
    statDup.textContent = dupSet.size;

    statSC.textContent  = list.filter(p => p.caste==="SC").length;
    statOBC.textContent = list.filter(p => p.caste==="OBC").length;
    statST.textContent  = list.filter(p => p.caste==="ST").length;
    statMus.textContent = list.filter(p => p.caste==="Muslim").length;
  }

  // ----------------------------
  // RENDER RESULTS
  // ----------------------------
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
      (groupedByHouse[p.house] ||= []).push(p);
    });

    Object.keys(groupedByHouse)
      .sort(sortHouseASC)
      .forEach(h => {

        const housePeople = groupedByHouse[h].sort((a,b)=>a.serial-b.serial);

        const houseSection = document.createElement("div");
        houseSection.className = "house-section";
        houseSection.id = "house-section-" + h;
        houseSection.style.background = colors[h];

        houseSection.innerHTML = `
          <div class="house-title">
            <span>House: ${h.replace("house_","")}</span>
            <small>${housePeople.length} voters</small>
          </div>
        `;

        const wrap = document.createElement("div");
        wrap.className = "house-content";

        housePeople.forEach(p => {
          const card = document.createElement("div");
          card.className = "card";

          const photo = `photos/${p.serial}.jpg`;

          const duplicateBadge = duplicateBYPs.has(p.byp)
            ? `<span class="dup-badge">DUPLICATE</span>`
            : "";

          const genderLabel = normalizeGender(p.gender);
          const genderClass = genderLabel === "Male" ? "male" : "female";

card.innerHTML = `
  <img src="${photo}" class="voter-photo" onclick="openPhoto(this.src)">
  <div class="card-content">
    <h3 class="card-header-line">
      <span>
        ${p.name}
        <span class="pill">#${p.serial}</span>
        ${duplicateBadge}
      </span>
      <span class="gender-pill ${genderClass}">
        ${genderLabel}
      </span>
    </h3>

    ${p.father ? `<p><strong>Father:</strong> ${p.father}</p>` : ""}
    ${p.husband? `<p><strong>Husband:</strong> ${p.husband}</p>` : ""}

    <p><strong>BYP:</strong> ${p.byp}</p>
    <p><strong>Age:</strong> ${p.age}</p>

    <p><strong>Caste:</strong> 
      <span class="pill" style="background:#e5e7ff;">${p.caste}</span>
    </p>
  </div>
`;

          wrap.appendChild(card);
        });

        houseSection.appendChild(wrap);
        resultsDiv.appendChild(houseSection);
      });
  }


  // ----------------------------
  // FILTERS — Only Age & House
  // ----------------------------
  function applyFilters() {
    let filtered = [...allPeople];

    const a = filterAge.value;
    const h = filterHouse.value;

    if (h) filtered = filtered.filter(p => p.house === h);

    if (a) {
      const [min, max] = a.split("-").map(Number);
      filtered = filtered.filter(p => p.age >= min && p.age <= max);
    }

    renderResults(filtered);
  }

  filterAge.onchange   = applyFilters;
  filterHouse.onchange = applyFilters;


  // ----------------------------
  // SEARCH — incl. caste
  // ----------------------------
  searchInput.addEventListener("input", () => {
    const q = searchInput.value.toLowerCase().trim();

    if (!q) {
      applyFilters();
      return;
    }

    const matched = allPeople.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.caste.toLowerCase().includes(q) ||
      String(p.serial).includes(q) ||
      (p.byp||"").toLowerCase().includes(q)
    );

    if (!matched.length) {
      renderResults([]);
      return;
    }

    const houses = new Set(matched.map(p => p.house));
    const fullList = allPeople.filter(p => houses.has(p.house));

    renderResults(fullList);

    filterAge.value = "";
    filterHouse.value = "";
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
  // BREADCRUMB
  // ----------------------------
  const breadcrumbHouse = document.getElementById("breadcrumbHouse");

  function updateBreadcrumbOnScroll() {
    const sections = document.querySelectorAll(".house-section");
    let current = "All Houses";

    sections.forEach(sec => {
      const rect = sec.getBoundingClientRect();
      if (rect.top <= 120 && rect.bottom >= 120) {
        const t = sec.querySelector(".house-title span").textContent;
        current = t.replace("House: ","");
      }
    });

    breadcrumbHouse.textContent = current;
  }

  window.addEventListener("scroll", updateBreadcrumbOnScroll);

});