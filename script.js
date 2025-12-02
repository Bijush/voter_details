document.addEventListener("DOMContentLoaded", () => {

  // ----------------------------
  // CASTE AUTO-DETECT RULES
  // ----------------------------
  function detectCaste(nameRaw) {
  if (!nameRaw) return "General";

  const name = nameRaw.trim().toLowerCase();
  const parts = name.split(/\s+/);
  const last = " " + parts[parts.length - 1] + " "; // last name only

  const MUSLIM = [" laskar "," uddin "," hussain "," hossain "," ali "," ahmed "," ahmad "," begum "," khatun "," barbhuiya "," mia "];
  const SC     = [" roy "," das "," namashudra "," namasudra "," namsudra "," sarkar "," debnath "];
  const ST     = [" majhi "," tudu "," hansda "," murmu "," basumatary "];
  const OBC    = [" mallick "," mallik "," dey "," sukla "," suklabaidya "," bhadra "," deb "];

  if (MUSLIM.some(k => last.includes(k))) return "Muslim";
  if (SC.some(k => last.includes(k)))     return "SC";
  if (ST.some(k => last.includes(k)))     return "ST";
  if (OBC.some(k => last.includes(k)))    return "OBC";

  return "General";
}

  // ----------------------------
  // DOM ELEMENTS
  // ----------------------------
  const searchInput    = document.getElementById("search");
  const resultsDiv     = document.getElementById("results");
  const filterAge      = document.getElementById("filterAge");
  const filterHouse    = document.getElementById("filterHouse");

  const statTotal  = document.getElementById("statTotal");
  const statMale   = document.getElementById("statMale");
  const statFemale = document.getElementById("statFemale");
  const statDup    = document.getElementById("statDup");

  const statSC  = document.getElementById("statSC");
  const statOBC = document.getElementById("statOBC");
  const statST  = document.getElementById("statST");
  const statMus = document.getElementById("statMuslim");

  const houseNav = document.getElementById("houseNav");
  const breadcrumbHouse = document.getElementById("breadcrumbHouse");
  const dupBtn = document.getElementById("dupJumpBtn");
  const backToTop = document.getElementById("backToTop"); // ✅ FIX: backToTop defined

  let voterData = {};
  let allPeople = [];
  let colors = {};
  let duplicateBYPs = new Set();

  let dupCycle = [];     // one-by-one cycle list
  let dupIndex = 0;      // pointer

  const JSON_FILE = window.PS_JSON || "data/master.json";

  // ----------------------------
  // LOAD DATA
  // ----------------------------
  fetch(JSON_FILE)
    .then(res => res.json())
    .then(data => {
      voterData = data;
      processData();
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

    buildDuplicateCycle(); // NEW
  }

  function normalizeGender(g) {
    if (!g) return "";
    g = g.trim();
    if (["Male"].includes(g)) return "Male";
    if (["Female"].includes(g)) return "Female";
    return g;
  }

  function findDuplicateBYP() {
    const map = {};
    allPeople.forEach(p => {
      if (!p.byp) return;
      map[p.byp] = (map[p.byp] || 0) + 1;
    });
    duplicateBYPs = new Set(Object.keys(map).filter(b => map[b] > 1));
  }

  function sortHouseASC(a, b) {
    return parseInt(a.replace("house_", "")) - parseInt(b.replace("house_", ""));
  }

  function generateColors() {
    const houses = [...new Set(allPeople.map(p => p.house))].sort(sortHouseASC);
    houses.forEach((h, i) => {
      colors[h] = `hsla(${(i * 40) % 360}, 70%, 92%, 1)`;
    });
  }

  function fillHouseDropdown() {
    Object.keys(voterData).sort(sortHouseASC).forEach(h => {
      const op = document.createElement("option");
      op.value = h;
      op.textContent = "House " + h.replace("house_", "");
      filterHouse.appendChild(op);
    });
  }

  // ----------------------------
  // BUILD LEFT HOUSE NAV
  // ----------------------------
  function buildHouseNav() {
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
  // UPDATE STATS
  // ----------------------------
  function updateStats(list) {
    statTotal.textContent  = list.length;
    statMale.textContent   = list.filter(p => normalizeGender(p.gender) === "Male").length;
    statFemale.textContent = list.filter(p => normalizeGender(p.gender) === "Female").length;
    statDup.textContent    = list.filter(p => duplicateBYPs.has(p.byp)).length;

    statSC.textContent  = list.filter(p => p.caste === "SC").length;
    statOBC.textContent = list.filter(p => p.caste === "OBC").length;
    statST.textContent  = list.filter(p => p.caste === "ST").length;
    statMus.textContent = list.filter(p => p.caste === "Muslim").length;
  }

  // ----------------------------
  // RENDER RESULTS
  // ----------------------------
  function renderResults(list) {

    resultsDiv.innerHTML = "";
    if (!list.length) {
      resultsDiv.innerHTML = "<p>No results found.</p>";
      return;
    }

    updateStats(list);

    const grouped = {};
    list.forEach(p => {
      if (!grouped[p.house]) grouped[p.house] = [];
      grouped[p.house].push(p);
    });

    Object.keys(grouped).sort(sortHouseASC).forEach(h => {

      const housePeople = grouped[h].sort((a,b) => a.serial - b.serial);
      const houseNumber = h.replace("house_", "");

      const section = document.createElement("div");
      section.className = "house-section";
      section.id = "house-section-" + h;
      section.style.background = colors[h];

      const header = document.createElement("div");
      header.className = "house-title";
      header.innerHTML = `
        <span>
          House: ${houseNumber}
          <i class="bi bi-chevron-up collapse-icon"></i>
        </span>
        <small>${housePeople.length} voters</small>
      `;

      const content = document.createElement("div");
      content.className = "house-content";
      content.style.maxHeight = "unset";

      let collapsed = false;
      const arrow = header.querySelector(".collapse-icon");

      header.style.cursor = "pointer";

      header.addEventListener("click", () => {
        collapsed = !collapsed;

        if (collapsed) {
          content.style.maxHeight = "0px";
          content.style.opacity = "0";
          arrow.classList.add("rotate");
        } else {
          content.style.maxHeight = content.scrollHeight + "px";
          content.style.opacity = "1";
          arrow.classList.remove("rotate");
        }
        startConfetti();
      });

      // Add Voters
      housePeople.forEach(p => {
        const card = document.createElement("div");
        card.className = "card";

        const photoPath = `photos/${p.serial}.jpg`;

        const duplicateBadge = duplicateBYPs.has(p.byp)
          ? `<span class="dup-badge" data-byp="${p.byp}">DUPLICATE</span>`
          : "";

        card.innerHTML = `
          <img src="${photoPath}" class="voter-photo" onclick="openPhoto(this.src)">
          <div class="card-content">
            <h3 class="card-header-line">
              <span>
                ${p.name} <span class="pill">#${p.serial}</span> 
                ${duplicateBadge}
              </span>
              <span class="gender-pill ${normalizeGender(p.gender).toLowerCase()}">
                ${normalizeGender(p.gender)}
              </span>
            </h3>

            ${p.father ? `<p><strong>Father:</strong> ${p.father}</p>` : ""}
            ${p.husband ? `<p><strong>Husband:</strong> ${p.husband}</p>` : ""}

            <p class="byp-field"><strong>BYP:</strong> ${p.byp}</p>
            <p><strong>Age:</strong> ${p.age}</p>
            ${p.mobile ? `<p><strong>Mobile:</strong> ${p.mobile}</p>` : ""}

            <p><strong>Caste:</strong> <span class="pill">${p.caste}</span></p>
          </div>
        `;

        content.appendChild(card);
      });

      section.appendChild(header);
      section.appendChild(content);
      resultsDiv.appendChild(section);
    });
  }

  // ----------------------------
  // FILTERS
  // ----------------------------
  function applyFilters() {
    let filtered = [...allPeople];

    if (filterAge.value) {
      const [min, max] = filterAge.value.split("-").map(Number);
      filtered = filtered.filter(p => p.age >= min && p.age <= max);
    }

    if (filterHouse.value) {
      filtered = filtered.filter(p => p.house === filterHouse.value);
    }

    renderResults(filtered);
    buildDuplicateCycle();
  }

  filterAge.onchange = applyFilters;
  filterHouse.onchange = applyFilters;

  // ----------------------------
  // SEARCH
  // ----------------------------
  searchInput.addEventListener("input", () => {
    const q = searchInput.value.toLowerCase().trim();
    if (!q) {
      renderResults(allPeople);
      buildDuplicateCycle();
      return;
    }

    const matched = allPeople.filter(p =>
      p.name.toLowerCase().includes(q) ||
      String(p.serial).includes(q) ||
      (p.byp || "").toLowerCase().includes(q) ||
      p.caste.toLowerCase().includes(q)
    );

    renderResults(matched);
    buildDuplicateCycle();
  });

  // ----------------------------
  // BACK TO TOP
  // ----------------------------
  window.addEventListener("scroll", () => {
    if (!backToTop) return;
    backToTop.style.display = window.scrollY > 200 ? "block" : "none";
  });

  if (backToTop) {
    backToTop.onclick = () => window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ----------------------------
  // BREADCRUMB UPDATE
  // ----------------------------
  function updateBreadcrumbOnScroll() {
    const sections = document.querySelectorAll(".house-section");
    let current = "All Houses";

    sections.forEach(sec => {
      const r = sec.getBoundingClientRect();
      if (r.top <= 130 && r.bottom >= 130) {
        current = sec.querySelector(".house-title span").textContent.replace("House: ", "");
      }
    });

    breadcrumbHouse.textContent = current;
  }

  window.addEventListener("scroll", updateBreadcrumbOnScroll);

  // ----------------------------
  // PREMIUM CONFETTI SYSTEM
  // ----------------------------
  function startConfetti() {
    const confettiCount = 120;
    const canvas = document.createElement("canvas");
    canvas.style.position = "fixed";
    canvas.style.left = 0;
    canvas.style.top = 0;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "999999";
    document.body.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    const w = canvas.width = innerWidth;
    const h = canvas.height = innerHeight;

    const conf = [];
    for (let i = 0; i < confettiCount; i++) {
      conf.push({
        x: Math.random() * w,
        y: Math.random() * h - h,
        r: Math.random() * 6 + 4,
        d: Math.random() * confettiCount,
        color: `hsl(${Math.random()*360},100%,60%)`
      });
    }

    function draw() {
      ctx.clearRect(0,0,w,h);
      conf.forEach((c,i)=>{
        ctx.beginPath();
        ctx.arc(c.x,c.y,c.r,0,Math.PI*2);
        ctx.fillStyle=c.color;
        ctx.fill();
        c.y+=Math.cos(c.d)+1+c.r/2;
        c.x+=Math.sin(c.d);
        if(c.y>h) conf[i]={...c,y:-10,x:Math.random()*w};
      });
      requestAnimationFrame(draw);
    }
    draw();

    setTimeout(()=>canvas.remove(),2000);
  }

  // ----------------------------------------------------
  // 🔁 DUPLICATE SYSTEM — FINAL FIXED VERSION
  // ----------------------------------------------------

  function buildDuplicateCycle() {
    dupCycle = [...duplicateBYPs];
    dupIndex = 0;
    dupBtn.style.display = dupCycle.length ? "block" : "none";
  }

  // Jump Button (one-by-one)
  dupBtn.addEventListener("click", () => {
    if (!dupCycle.length) return;

    const bypID = dupCycle[dupIndex];
    scrollToDuplicate(bypID);

    dupIndex = (dupIndex + 1) % dupCycle.length;
  });

  // Badge click → highlight + show all duplicates
  document.addEventListener("click", e => {
    if (e.target.classList.contains("dup-badge")) {
      const bypID = e.target.dataset.byp;

      // Reset cycle index so next button click works correctly
      const idx = dupCycle.indexOf(bypID);
      if (idx !== -1) dupIndex = idx;

      scrollToDuplicate(bypID);
    }
  });

  // Scroll function
  function scrollToDuplicate(bypID) {

    const cards = [...document.querySelectorAll(".card")].filter(card => {
      const bypField = card.querySelector(".byp-field"); // ✅ FIX: not nth-of-type
      if (!bypField) return false;

      const text = bypField.innerText.replace("BYP:", "").trim().toLowerCase();
      return text === String(bypID).toLowerCase();
    });

    if (!cards.length) return;

    // Highlight ALL duplicates
    cards.forEach(card => {
      card.style.boxShadow = "0 0 0 4px #ff8800";
      setTimeout(() => card.style.boxShadow = "", 1500);
    });

    // Scroll to first duplicate
    cards[0].scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }
// CLICK ANY DUPLICATE CARD → JUMP TO ITS OTHER DUPLICATES
document.addEventListener("click", e => {
  const card = e.target.closest(".card");
  if (!card) return;

  const bypField = card.querySelector(".byp-field");
  if (!bypField) return;

  const bypID = bypField.innerText.replace("BYP:", "").trim();

  if (!duplicateBYPs.has(bypID)) return; // Not duplicate → do nothing

  // Find all duplicate cards
  const cards = [...document.querySelectorAll(".card")].filter(c => {
    const f = c.querySelector(".byp-field");
    if (!f) return false;
    return f.innerText.replace("BYP:", "").trim() === bypID;
  });

  if (cards.length < 2) return;

  const currentIndex = cards.indexOf(card);
  const nextCard = cards[(currentIndex + 1) % cards.length];

  // Highlight all duplicates
  cards.forEach(c => {
    c.style.boxShadow = "0 0 0 4px #ff8800";
    setTimeout(() => c.style.boxShadow = "", 1500);
  });

  // Scroll to the next duplicate
  nextCard.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
});

});
