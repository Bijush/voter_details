

// ✅ FIREBASE IMPORT (TOP OF FILE)
import { ref, onValue, push, update, remove }
from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

const db = window.db;

// AUTO-FIX: remove duplicate shift popup if exists
document.addEventListener("DOMContentLoaded", () => {
  const popups = document.querySelectorAll("#shiftVoterPopup");
  if (popups.length > 1) {
    for (let i = 1; i < popups.length; i++) {
      popups[i].remove();
    }
  }



// ⭐ REPORT SECTION TOGGLE
const rptBtn = document.getElementById("toggleReportBtn");
const rptBox = document.getElementById("reportSection");

rptBtn.addEventListener("click", () => {
    if (rptBox.style.display === "none") {
        rptBox.style.display = "block";
        rptBtn.textContent = "📊 Hide Report";
    } else {
        rptBox.style.display = "none";
        rptBtn.textContent = "📊 Show Report";
    }
});

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
  const sortBy = document.getElementById("sortBy");
  let sortMode = "default";

  const searchInput    = document.getElementById("search");
  const resultsDiv     = document.getElementById("results");
  const filterAge      = document.getElementById("filterAge");
  const filterHouse    = document.getElementById("filterHouse");
  const filterMobile   = document.getElementById("filterMobile");

  const statTotal  = document.getElementById("statTotal");
  const statMale   = document.getElementById("statMale");
  const statFemale = document.getElementById("statFemale");
  const statDup    = document.getElementById("statDup");

  const statSC  = document.getElementById("statSC");
  const statOBC = document.getElementById("statOBC");
  const statST  = document.getElementById("statST");
  const statMus = document.getElementById("statMuslim");
  const statHouses = document.getElementById("statHouses");

  const houseNav        = document.getElementById("houseNav");
  const breadcrumbHouse = document.getElementById("breadcrumbHouse");
  const dupBtn          = document.getElementById("dupJumpBtn");
  const backToTop       = document.getElementById("backToTop");

  const sidebar          = document.querySelector(".sidebar");
  const sidebarOverlay   = document.getElementById("sidebarOverlay");
  const toggleSidebarBtn = document.getElementById("toggleSidebarBtn");
  const sidebarCloseBtn  = document.querySelector(".sidebar-close-btn");

  let voterData = {};
  let allPeople = [];
  let colors = {};
  let duplicateBYPs = new Set();

  let dupCycle = [];     // one-by-one cycle list
  let dupIndex = 0;      // pointer

  // ----------------------------
// ✅ LOAD DATA FROM FIREBASE (LIVE)
// ----------------------------
onValue(ref(db, "voters"), snapshot => {
  voterData = snapshot.val() || {};
  processData();
});

  // ----------------------------
  // PROCESS DATA
  // ----------------------------
  function processData() {
    allPeople = [];

    Object.keys(voterData).forEach(h => {
  Object.entries(voterData[h]).forEach(([key, p]) => {
  allPeople.push({
    key: key,          // ✅ Firebase key
    house: h,
    ...p,
    age: Number(p.age) || 0,
    caste: detectCaste(p.name)
  });
});
});

    generateColors();
    findDuplicateBYP();
    buildHouseNav();
    renderResults(allPeople);
    buildDuplicateCycle();
    calculateSurveyReport();
    renderDailyNewVoterNames();
    renderDailyShiftVoterList();
    renderCharts();
  }

  function normalizeGender(g) {
    if (!g) return "";
    g = g.trim();
    if (g === "Male") return "Male";
    if (g === "Female") return "Female";
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
    statHouses.textContent = new Set(list.map(p => p.house)).size;
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
  // CARD BUILDER
  // ----------------------------
  function createVoterCard(p) {
  const card = document.createElement("div");
  card.className = "card";

  const photoPath = `photos/${p.serial}.jpg`;

  const duplicateBadge = duplicateBYPs.has(p.byp)
    ? `<span class="dup-badge" data-byp="${p.byp}">DUPLICATE</span>`
    : "";

  const photoExists = (p.photo !== false && p.photo !== "no" && p.photo !== "" && p.photo !== null);

  const photoBadge = photoExists
    ? ""
    : `<span class="dup-badge" style="background:#dc2626">NO PHOTO</span>`;

  card.innerHTML = `
    <img src="${photoPath}" class="voter-photo" onclick="openPhoto(this.src)">
    <div class="card-content">
      <h3 class="card-header-line">
        <span>
          ${p.name} <span class="pill">#${p.serial}</span>
          ${duplicateBadge}
          ${photoBadge}
        </span>
        <span class="gender-pill ${(p.gender || "").toLowerCase()}">
  ${p.gender || "—"}
</span>
      </h3>

      ${p.father ? `<p><strong>Father:</strong> ${p.father}</p>` : ""}
      ${p.husband ? `<p><strong>Husband:</strong> ${p.husband}</p>` : ""}
      <p class="byp-field"><strong>BYP:</strong> ${p.byp}</p>
      <p><strong>Age:</strong> ${p.age}</p>
      <p><strong>Caste:</strong> <span class="pill">${p.caste}</span></p>

      ${p.mobile ? `<p><strong>Mobile:</strong>
        <a href="tel:${p.mobile}" style="color:#2563eb;font-weight:600">
          ${p.mobile} 📞
        </a></p>` : ""}

      <!-- ✅ EDIT / DELETE BUTTONS -->
      <div style="display:flex;gap:10px;margin-top:10px;">
        <button
          style="flex:1;padding:6px;border-radius:8px;border:1px solid #93c5fd;background:#dbeafe;cursor:pointer;"
          onclick="editVoter('${p.house}','${p.key}')">
          ✏️ Edit
        </button>

        <button
          style="flex:1;padding:6px;border-radius:8px;border:1px solid #fecaca;background:#fee2e2;cursor:pointer;"
          onclick="deleteVoter('${p.house}','${p.key}')">
          🗑️ Delete
        </button>
      </div>
    </div>
  `;

  return card;
}
  // ----------------------------
  // RENDER RESULTS
  // ----------------------------
  function renderResults(list) {
  resultsDiv.innerHTML = "";

  if (!list.length) {
    resultsDiv.innerHTML = "<p>No results found.</p>";
    updateStats(list);
    return;
  }

  updateStats(list);

  // ⭐ SERIAL SORT MODE — FLAT LIST
  if (sortMode === "serial") {
    list.sort((a, b) => a.serial - b.serial);

    const frag = document.createDocumentFragment();
    list.forEach(p => frag.appendChild(createVoterCard(p)));
    resultsDiv.appendChild(frag);

    return;
  }

  // ⭐ DEFAULT MODE — GROUP BY HOUSE
  const grouped = {};
  list.forEach(p => {
    if (!grouped[p.house]) grouped[p.house] = [];
    grouped[p.house].push(p);
  });

  const frag = document.createDocumentFragment();

  Object.keys(grouped).sort(sortHouseASC).forEach(h => {
    const housePeople = grouped[h].sort((a, b) => a.serial - b.serial);
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
    content.style.opacity = "1";

    let collapsed = false;
    const arrow = header.querySelector(".collapse-icon");
    arrow.classList.remove("rotate");

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

    // Add voter cards fast
    const cardFrag = document.createDocumentFragment();
    housePeople.forEach(p => cardFrag.appendChild(createVoterCard(p)));
    content.appendChild(cardFrag);

    section.appendChild(header);
    section.appendChild(content);

    frag.appendChild(section);
  });

  resultsDiv.appendChild(frag);
}

  // ----------------------------
  // FILTERS
  // ----------------------------
  function applyFilters() {
    let filtered = [...allPeople];

    // AGE FILTER
    if (filterAge.value) {
      const [min, max] = filterAge.value.split("-").map(Number);
      filtered = filtered.filter(p => p.age >= min && p.age <= max);
    }

    // MOBILE FILTER
    if (filterMobile.value === "has") {
      filtered = filtered.filter(p => p.mobile && p.mobile.trim() !== "");
    }
    if (filterMobile.value === "none") {
      filtered = filtered.filter(p => !p.mobile || p.mobile.trim() === "");
    }

    // ----------------------------------------
    // ⭐ HOUSE RANGE FILTER — supports:
    // "1-30", "1to30", "1 to 30", "7"
    // ----------------------------------------
    // ----------------------------------------
// ⭐ FINAL HOUSE RANGE FILTER (22, 22K, 25CH works)
// ----------------------------------------
if (filterHouse.value.trim() !== "") {

  let raw = filterHouse.value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/house_/g, "")
      .replace(/to/g, "-");   // allow 1 to 30

  const parts = raw.split("-").map(n => Number(n));

  filtered = filtered.filter(p => {

    // extract numeric prefix: 22K → 22, 25CH → 25
    const num = parseInt(p.house.replace("house_", ""), 10);

    if (isNaN(num)) return false;

    // single number (22)
    if (parts.length === 1) {
      return num === parts[0];
    }

    // range (22-30)
    if (parts.length === 2) {
      let start = parts[0];
      let end   = parts[1];
      return num >= start && num <= end;
    }

    return true;
  });
}
    renderResults(filtered);
    buildDuplicateCycle();
  }

  filterAge.onchange    = applyFilters;
  filterMobile.onchange = applyFilters;
  // Text input → live filter
  filterHouse.addEventListener("input", applyFilters);
  filterHouse.addEventListener("change", applyFilters);

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

  dupBtn.addEventListener("click", () => {
    if (!dupCycle.length) return;

    const bypID = dupCycle[dupIndex];
    scrollToDuplicate(bypID);

    dupIndex = (dupIndex + 1) % dupCycle.length;
  });

  function scrollToDuplicate(bypID) {
    const cards = [...document.querySelectorAll(".card")].filter(card => {
      const bypField = card.querySelector(".byp-field");
      if (!bypField) return false;

      const text = bypField.innerText.replace("BYP:", "").trim().toLowerCase();
      return text === String(bypID).toLowerCase();
    });

    if (!cards.length) return;

    cards.forEach(card => {
      card.style.boxShadow = "0 0 0 4px #ff8800";
      setTimeout(() => card.style.boxShadow = "", 1500);
    });

    cards[0].scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }

  document.addEventListener("click", e => {
    const card = e.target.closest(".card");
    if (!card) return;

    const bypField = card.querySelector(".byp-field");
    if (!bypField) return;

    const bypID = bypField.innerText.replace("BYP:", "").trim();

    if (!duplicateBYPs.has(bypID)) return;

    const cards = [...document.querySelectorAll(".card")].filter(c => {
      const f = c.querySelector(".byp-field");
      if (!f) return false;
      return f.innerText.replace("BYP:", "").trim() === bypID;
    });

    if (cards.length < 2) return;

    const currentIndex = cards.indexOf(card);
    const nextCard = cards[(currentIndex + 1) % cards.length];

    cards.forEach(c => {
      c.style.boxShadow = "0 0 0 4px #ff8800";
      setTimeout(() => c.style.boxShadow = "", 1500);
    });

    nextCard.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  });

  // Side bar Code
  toggleSidebarBtn.addEventListener("click", () => {
    sidebar.classList.add("open");
    sidebarOverlay.style.display = "block";
  });

  sidebarCloseBtn.addEventListener("click", () => {
    sidebar.classList.remove("open");
    sidebarOverlay.style.display = "none";
  });

  sidebarOverlay.addEventListener("click", () => {
    sidebar.classList.remove("open");
    sidebarOverlay.style.display = "none";
  });

  sortBy.addEventListener("change", () => {
    sortMode = sortBy.value;
    renderResults(allPeople);
  });

  // 🔍 SHOW MISSING SERIALS IN ALERT — MOBILE FRIENDLY
  window.showMissingSerials = function () {
    const serials = allPeople.map(p => Number(p.serial));
    const maxSerial = Math.max(...serials);
    const serialSet = new Set(serials);

    const missing = [];
    for (let i = 1; i <= maxSerial; i++) {
      if (!serialSet.has(i)) missing.push(i);
    }

    alert("Missing Serials (" + missing.length + "):\n\n" + missing.join(", "));
  };
  
  
  function isNewVoter(p) {
  return !p.byp || p.byp.trim() === "";
}
  
  // Survey Report 
  function calculateSurveyReport() {

  // Total Houses
  const totalHouses = new Set(allPeople.map(p => p.house)).size;

  // Total Voters
  const totalVoters = allPeople.length;

  // ⭐ NEW VOTERS (localStorage)
  const store = JSON.parse(localStorage.getItem("daily_new_voters") || "{}");
  const today = new Date().toLocaleDateString("en-GB");
  const todayList = store[today] || [];
  const newVoterCount = todayList.length;

  // ⭐ SHIFT VOTERS (ONLY LOCALSTORAGE — user entered)
  const shiftStore = JSON.parse(localStorage.getItem("daily_shift_voters") || "{}");
  const shiftTodayList = shiftStore[today] || [];
  const shiftVoterCount = shiftTodayList.length;

  // Put in UI
  document.getElementById("rptHouse").textContent = totalHouses;
  document.getElementById("rptVoters").textContent = totalVoters;
  document.getElementById("rptNew").textContent = newVoterCount;
  document.getElementById("rptShift").textContent = shiftVoterCount;
}


// New Voter count


// New Voter popup open / close
// New Voter popup open / close
document.getElementById("addNewVoterBtn").onclick = () => {
  document.getElementById("newVoterPopup").style.display = "flex";
};
document.getElementById("newVoterPopup").onclick = e => {
  if (e.target.id === "newVoterPopup") {
    e.target.style.display = "none";
  }
};

// ⭐ MAKE GLOBAL so HTML onclick can see it
window.saveNewVoter = function () {

  let name = nvName.value.trim();
  let house = nvHouse.value.trim();
  let father = nvFather.value.trim();

  if (!name || !house || !father) {
    alert("Please fill all fields: Name, House, Father/Husband");
    return;
  }

  const today = new Date().toLocaleDateString("en-GB");

  let all = JSON.parse(localStorage.getItem("daily_new_voters") || "{}");

  if (!all[today]) all[today] = [];

  all[today].push({
    name: name,
    house: house,
    father: father
  });

 
 // ✅ ADD TO FIREBASE ALSO
push(ref(db, "voters/house_" + house), {
  name: name,
  father: father,
  age: 0,
  gender: "",
  byp: ""
});
 
  localStorage.setItem("daily_new_voters", JSON.stringify(all));

  alert("New voter added!");
  document.getElementById("newVoterPopup").style.display = "none";

  nvName.value = "";
  nvHouse.value = "";
  nvFather.value = "";

  renderDailyNewVoterNames();
  calculateSurveyReport();
};

// Edit a new voter name
window.editNewVoter = function (date, index) {
  let all = JSON.parse(localStorage.getItem("daily_new_voters") || "{}");

  let item = all[date][index];

  let newName = prompt("Edit Name:", item.name);
  if (!newName) return;

  let newHouse = prompt("Edit House Number:", item.house);
  if (!newHouse) return;

  let newFather = prompt("Edit Father/Husband:", item.father);
  if (!newFather) return;

  all[date][index] = {
    name: newName.trim(),
    house: newHouse.trim(),
    father: newFather.trim()
  };

  localStorage.setItem("daily_new_voters", JSON.stringify(all));

  renderDailyNewVoterNames();
  calculateSurveyReport();
};
// Delete a new voter
window.deleteNewVoter = function (date, index) {
  if (!confirm("Delete this entry?")) return;

  let all = JSON.parse(localStorage.getItem("daily_new_voters") || "{}");

  all[date].splice(index, 1);

  // If that date is empty → remove the date entry
  if (all[date].length === 0) {
    delete all[date];
  }

  localStorage.setItem("daily_new_voters", JSON.stringify(all));

  renderDailyNewVoterNames();
  calculateSurveyReport();
};

// ⭐ MUST BE OUTSIDE saveNewVoter — FIXED POSITION
function renderDailyNewVoterNames() {
  const box = document.getElementById("dailyReportList");
  let all = JSON.parse(localStorage.getItem("daily_new_voters") || "{}");

  box.innerHTML = "";

  Object.keys(all).forEach(date => {
    const items = all[date];

    // DATE HEADER
    let liHeader = document.createElement("li");
    liHeader.style.fontWeight = "700";
    liHeader.style.marginTop = "12px";
    liHeader.style.fontSize = "15px";
    liHeader.style.color = "#1e293b";
    liHeader.textContent = `${date}:`;
    box.appendChild(liHeader);

    // EACH ENTRY
    items.forEach((obj, index) => {
      let row = document.createElement("li");
      row.style.marginLeft = "12px";
      row.style.display = "flex";
      row.style.justifyContent = "space-between";
      row.style.alignItems = "center";
      row.style.padding = "10px 12px";
      row.style.borderRadius = "10px";
      row.style.background = "#f8fafc";
      row.style.marginTop = "6px";
      row.style.boxShadow = "0 2px 6px rgba(0,0,0,0.08)";
      row.style.border = "1px solid #e2e8f0";

      row.innerHTML = `
        <span>• <b>${obj.name}</b>, Voters : <b>${obj.house || "-"}</b>,<br> Total: <b>${obj.father || "-"}</b></span>
      `;

      // ACTION BUTTONS WRAPPER
      let actions = document.createElement("span");
      actions.style.display = "flex";
      actions.style.gap = "10px";

      // EDIT ICON
      let edit = document.createElement("span");
      edit.innerHTML = "✏️";
      edit.style.padding = "6px 10px";
      edit.style.borderRadius = "50%";
      edit.style.background = "#dbeafe";
      edit.style.border = "1px solid #93c5fd";
      edit.style.cursor = "pointer";
      edit.style.transition = "0.2s";

      edit.onmouseover = () => edit.style.background = "#bfdbfe";
      edit.onmouseout = () => edit.style.background = "#dbeafe";
      edit.onclick = () => editNewVoter(date, index);

      // DELETE ICON
      let del = document.createElement("span");
      del.innerHTML = "🗑️";
      del.style.padding = "6px 10px";
      del.style.borderRadius = "50%";
      del.style.background = "#fee2e2";
      del.style.border = "1px solid #fecaca";
      del.style.cursor = "pointer";
      del.style.transition = "0.2s";

      del.onmouseover = () => del.style.background = "#fecaca";
      del.onmouseout = () => del.style.background = "#fee2e2";
      del.onclick = () => deleteNewVoter(date, index);

      actions.appendChild(edit);
      actions.appendChild(del);

      row.appendChild(actions);
      box.appendChild(row);
    });
  });
}
// Shift Voters
// ------------------------------
// SHIFT VOTER SYSTEM (ONLY NAME)
// ------------------------------

// ⭐ SHIFT VOTER POPUP OPEN
document.getElementById("addShiftVoterBtn").onclick = () => {
    document.getElementById("shiftVoterPopup").style.display = "flex";
};

// ⭐ CLOSE POPUP WHEN CLICK OUTSIDE
document.getElementById("shiftVoterPopup").onclick = (e) => {
    if (e.target.id === "shiftVoterPopup") {
        document.getElementById("shiftVoterPopup").style.display = "none";
    }
};

// Save shift voter
window.saveShiftVoter = function () {
  let name = svName.value.trim();
  if (!name) {
    alert("Enter name");
    return;
  }

  const today = new Date().toLocaleDateString("en-GB");

  let all = JSON.parse(localStorage.getItem("daily_shift_voters") || "{}");

  if (!all[today]) all[today] = [];

  all[today].push(name);

  localStorage.setItem("daily_shift_voters", JSON.stringify(all));

  alert("Shift voter added!");
  document.getElementById("shiftVoterPopup").style.display = "none";

  renderDailyShiftVoterList();
  calculateSurveyReport();
};

// Render shift voter daily list
function renderDailyShiftVoterList() {
  const box = document.getElementById("dailyShiftList");
  let all = JSON.parse(localStorage.getItem("daily_shift_voters") || "{}");

  box.innerHTML = "";

  Object.keys(all).forEach(date => {
    const names = all[date];

    // DATE HEADER
    let liHeader = document.createElement("li");
    liHeader.style.fontWeight = "700";
    liHeader.style.marginTop = "12px";
    liHeader.style.fontSize = "15px";
    liHeader.style.color = "#1e293b";
    liHeader.textContent = `${date}:`;
    box.appendChild(liHeader);

    // EACH ENTRY
    names.forEach((name, index) => {
      let row = document.createElement("li");
      row.style.marginLeft = "12px";
      row.style.display = "flex";
      row.style.justifyContent = "space-between";
      row.style.alignItems = "center";
      row.style.padding = "10px 12px";
      row.style.borderRadius = "10px";
      row.style.background = "#f8fafc";
      row.style.marginTop = "6px";
      row.style.boxShadow = "0 2px 6px rgba(0,0,0,0.08)";
      row.style.border = "1px solid #e2e8f0";

      // TEXT
      let nameSpan = document.createElement("span");
      nameSpan.style.fontSize = "15px";
      nameSpan.style.color = "#0f172a";
      nameSpan.textContent = `• ${name}`;

      // ACTION BUTTONS WRAPPER
      let actionWrap = document.createElement("span");
      actionWrap.style.display = "flex";
      actionWrap.style.gap = "10px";

      // EDIT BUTTON
      let editBtn = document.createElement("span");
      editBtn.innerHTML = "✏️";
      editBtn.style.padding = "6px 10px";
      editBtn.style.borderRadius = "50%";
      editBtn.style.background = "#dbeafe";
      editBtn.style.border = "1px solid #93c5fd";
      editBtn.style.cursor = "pointer";
      editBtn.style.transition = "0.2s";
      editBtn.title = "Edit";

      editBtn.onmouseover = () => {
        editBtn.style.background = "#bfdbfe";
      };
      editBtn.onmouseout = () => {
        editBtn.style.background = "#dbeafe";
      };

      editBtn.onclick = () => editShiftVoter(date, index);

      // DELETE BUTTON
      let delBtn = document.createElement("span");
      delBtn.innerHTML = "🗑️";
      delBtn.style.padding = "6px 10px";
      delBtn.style.borderRadius = "50%";
      delBtn.style.background = "#fee2e2";
      delBtn.style.border = "1px solid #fecaca";
      delBtn.style.cursor = "pointer";
      delBtn.style.transition = "0.2s";
      delBtn.title = "Delete";

      delBtn.onmouseover = () => {
        delBtn.style.background = "#fecaca";
      };
      delBtn.onmouseout = () => {
        delBtn.style.background = "#fee2e2";
      };

      delBtn.onclick = () => deleteShiftVoter(date, index);

      // APPEND BUTTONS
      actionWrap.appendChild(editBtn);
      actionWrap.appendChild(delBtn);

      // APPEND TO ROW
      row.appendChild(nameSpan);
      row.appendChild(actionWrap);

      // ADD ROW TO UI
      box.appendChild(row);
    });
  });
}
// Edit shift voter
window.editShiftVoter = function(date, index) {
  let all = JSON.parse(localStorage.getItem("daily_shift_voters") || "{}");
  let currentName = all[date][index];

  let newName = prompt("Edit name:", currentName);
  if (!newName) return;

  all[date][index] = newName.trim();
  localStorage.setItem("daily_shift_voters", JSON.stringify(all));

  renderDailyShiftVoterList();
  calculateSurveyReport();
};

// Delete shift voter
window.deleteShiftVoter = function(date, index) {
  let all = JSON.parse(localStorage.getItem("daily_shift_voters") || "{}");

  all[date].splice(index, 1);
  if (all[date].length === 0) delete all[date];

  localStorage.setItem("daily_shift_voters", JSON.stringify(all));

  renderDailyShiftVoterList();
  calculateSurveyReport();
};
let genderChart, ageChart, casteChart;

function renderCharts() {

  // ==== Gender Count ====
  const totalM = allPeople.filter(p => p.gender === "Male").length;
  const totalF = allPeople.filter(p => p.gender === "Female").length;

  // ==== Age Count ====
  const age18 = allPeople.filter(p => p.age >= 18 && p.age <= 25).length;
  const age26 = allPeople.filter(p => p.age >= 26 && p.age <= 40).length;
  const age41 = allPeople.filter(p => p.age >= 41 && p.age <= 60).length;
  const age60 = allPeople.filter(p => p.age > 60).length;

  // ==== Caste Count ====
  const totalSC     = allPeople.filter(p => p.caste === "SC").length;
  const totalOBC    = allPeople.filter(p => p.caste === "OBC").length;
  const totalST     = allPeople.filter(p => p.caste === "ST").length;
  const totalMuslim = allPeople.filter(p => p.caste === "Muslim").length;
  const totalGeneral = allPeople.filter(p => p.caste === "General").length;

  // ==== Destroy old charts to avoid duplicate ====
  if (genderChart) genderChart.destroy();
  if (ageChart) ageChart.destroy();
  if (casteChart) casteChart.destroy();

  // =========================
  // 1️⃣ GENDER CHART
  // =========================
  genderChart = new Chart(document.getElementById("genderChart"), {
    type: "pie",
    data: {
      labels: ["Male", "Female"],
      datasets: [{
        data: [totalM, totalF]
      }]
    }
  });

  // =========================
  // 2️⃣ AGE CHART
  // =========================
  ageChart = new Chart(document.getElementById("ageChart"), {
    type: "bar",
    data: {
      labels: ["18–25", "26–40", "41–60", "60+"],
      datasets: [{
        label: "Voters",
        data: [age18, age26, age41, age60]
      }]
    },
    options: {
      scales: { y: { beginAtZero: true } }
    }
  });

  // =========================
  // 3️⃣ CASTE CHART
  // =========================
  casteChart = new Chart(document.getElementById("casteChart"), {
    type: "pie",
    data: {
      labels: ["SC", "OBC", "ST", "Muslim", "General"],
      datasets: [{
        data: [totalSC, totalOBC, totalST, totalMuslim, totalGeneral]
      }]
    }
  });
}

window.editVoter = function(house, key) {

  const voter = allPeople.find(p => p.key === key);
  if (!voter) return;

  // ✅ SERIAL EDIT
  const serial = Number(prompt("Serial Number:", voter.serial));
  if (!serial) return alert("Serial required");

  // ❌ DUPLICATE SERIAL CHECK (except current voter)
  const duplicate = allPeople.some(p =>
    Number(p.serial) === serial && p.key !== key
  );
  if (duplicate) {
    alert("❌ This serial number already exists!");
    return;
  }

  const name = prompt("Name:", voter.name);
  if (!name) return;

  const father  = prompt("Father Name (blank if not):", voter.father || "");
  const husband = prompt("Husband Name (blank if not):", voter.husband || "");
  const age     = Number(prompt("Age:", voter.age || "")) || 0;
  const gender  = prompt("Gender (Male/Female):", voter.gender || "");
  const byp     = prompt("BYP:", voter.byp || "");
  const mobile  = prompt("Mobile Number:", voter.mobile || "");

  // ✅ UPDATE FIREBASE
  update(ref(db, `voters/${house}/${key}`), {
    serial,
    name: name.trim(),
    father: father.trim(),
    husband: husband.trim(),
    age,
    gender,
    byp,
    mobile
  });

  alert("✅ Voter updated successfully");
};

window.deleteVoter = function(house, key) {

  // ✅ SECRET CONFIRMATION
  const secret = prompt("Type SECRET word to delete voter:");

  if (secret !== "bijush") {
    alert("❌ Wrong secret word. Delete cancelled.");
    return;
  }

  // ✅ FINAL CONFIRM
  if (!confirm("⚠️ Are you sure? This voter will be deleted permanently.")) {
    return;
  }

  // ✅ DELETE FROM FIREBASE
  remove(ref(db, `voters/${house}/${key}`));

  alert("✅ Voter deleted successfully");
};

// ✅ OPEN ADD VOTER POPUP (MAIN GREEN BUTTON)
document.getElementById("openAddVoter").onclick = () => {
  document.getElementById("addVoterPopup").style.display = "flex";
};

// ✅ CLOSE ADD VOTER POPUP
window.closeAddVoter = function () {
  document.getElementById("addVoterPopup").style.display = "none";
};

// ✅ SAVE NEW VOTER (MANUAL SERIAL)
window.saveAddVoter = function () {

  const serial  = Number(avSerial.value);
  const house   = avHouse.value.trim();
  const name    = avName.value.trim();
  const father  = avFather.value.trim();
  const husband = avHusband.value.trim();
  const age     = Number(avAge.value) || 0;
  const gender  = avGender.value.trim();
  const byp     = avBYP.value.trim();
  const mobile  = avMobile.value.trim();

  // ✅ BASIC VALIDATION
  if (!serial || !house || !name) {
    alert("Serial, House & Name are required");
    return;
  }

  // ✅ DUPLICATE SERIAL CHECK
  const exists = allPeople.some(p => Number(p.serial) === serial);
  if (exists) {
    alert("❌ This serial number already exists!");
    return;
  }

  // ✅ PUSH TO FIREBASE
  push(ref(db, "voters/house_" + house), {
    serial,
    name,
    father: father || "",
    husband: husband || "",
    age,
    gender,
    byp,
    mobile
  });

  // ✅ CLEAR FORM
  avSerial.value = "";
  avHouse.value = "";
  avName.value = "";
  avFather.value = "";
  avHusband.value = "";
  avAge.value = "";
  avGender.value = "";
  avBYP.value = "";
  avMobile.value = "";

  closeAddVoter();

  alert("✅ Voter added with Serial #" + serial);
};


});