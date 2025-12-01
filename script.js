document.addEventListener("DOMContentLoaded", () => {
  // ----------------------------
  // CASTE AUTO-DETECT RULES
  // ----------------------------
  function detectCaste(nameRaw) {
    if (!nameRaw) return "General";
    const name = (" " + nameRaw.toLowerCase() + " ");

    const MUSLIM = [
      " laskar"," uddin"," hussain"," hossain"," ali"," ahmed"," ahmad",
      " begum"," khatun"," barbhuiya"," choudhury"," chowdhury"," mia "
    ];
    const SC  = [" das "," namashudra"," namasudra"," namsudra"," sarkar"," debnath"];
    const ST  = [" majhi "," tudu "," hansda "," murmu "," basumatary "];
    const OBC = [" roy "," mallick "," mallik "," dey "," sukla "," suklabaidya"," bhadra"," deb "];

    if (MUSLIM.some(k => name.includes(k))) return "Muslim";
    if (SC.some(k => name.includes(k)))     return "SC";
    if (ST.some(k => name.includes(k)))     return "ST";
    if (OBC.some(k => name.includes(k)))    return "OBC";
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
  const dupJumpBtn    = document.getElementById("dupJumpBtn");

  const statTotal     = document.getElementById("statTotal");
  const statMale      = document.getElementById("statMale");
  const statFemale    = document.getElementById("statFemale");
  const statDup       = document.getElementById("statDup");

  const statSC        = document.getElementById("statSC");
  const statOBC       = document.getElementById("statOBC");
  const statST        = document.getElementById("statST");
  const statMus       = document.getElementById("statMuslim");

  const breadcrumbHouse = document.getElementById("breadcrumbHouse");

  // DATA
  let voterData   = {};
  let allPeople   = [];
  let colors      = {};
  let duplicateBYPs = new Set();

  // For duplicate jumping
  let duplicateCards = [];
  let duplicateIndex = 0;

  // For lazy loading
  let lazyImages = [];
  let observer   = null;

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
      console.error(err);
      resultsDiv.innerHTML = `<p style="color:red;">Failed to load voter list.</p>`;
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
    updateHouseCountChip();
  }

  function updateHouseCountChip() {
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
    duplicateBYPs = new Set(
      Object.keys(map).filter(b => map[b] > 1)
    );
  }

  // ----------------------------
  // SORT HOUSE
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
  // LEFT NAV HOUSE LIST
  // ----------------------------
  function buildHouseNav() {
    houseNav.innerHTML = "";
    const houses = [...new Set(allPeople.map(p => p.house))].sort(sortHouseASC);

    houses.forEach(h => {
      const btn = document.createElement("button");
      btn.className = "house-nav-item";
      btn.dataset.house = h;
      btn.textContent = h.replace("house_", "");

      btn.addEventListener("click", () => {
        document
          .querySelectorAll(".house-nav-item")
          .forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        const sec = document.getElementById("house-section-" + h);
        if (sec) sec.scrollIntoView({ behavior:"smooth", block:"start" });
      });

      houseNav.appendChild(btn);
    });
  }

  // ----------------------------
  // NORMALIZE GENDER
  // ----------------------------
  function normalizeGender(g) {
    if (!g) return "";
    g = g.trim();
    if (["Male","পুরুষ"].includes(g)) return "Male";
    if (["Female","মহিলা","নারী"].includes(g)) return "Female";
    return g;
  }

  // ----------------------------
  // UPDATE STATS
  // ----------------------------
  function updateStats(list) {
    const total = list.length;

    statTotal.textContent  = total;
    statMale.textContent   = list.filter(p => normalizeGender(p.gender)==="Male").length;
    statFemale.textContent = list.filter(p => normalizeGender(p.gender)==="Female").length;

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
    lazyImages = [];
    duplicateCards = [];
    duplicateIndex = 0;

    if (!list.length) {
      resultsDiv.innerHTML = "<p>No results found.</p>";
      updateStats([]);
      updateDuplicateUI();
      return;
    }

    updateStats(list);

    const grouped = {};
    list.forEach(p => {
      (grouped[p.house] ||= []).push(p);
    });

    Object.keys(grouped)
      .sort(sortHouseASC)
      .forEach(h => {
        const housePeople = grouped[h].sort((a,b) => a.serial - b.serial);
        const houseNumber = h.replace("house_","");

        const houseSection = document.createElement("div");
        houseSection.className = "house-section";
        houseSection.id = "house-section-" + h;
        houseSection.style.background = colors[h];

        const header = document.createElement("div");
        header.className = "house-title";
        header.innerHTML = `
          <span>House: ${houseNumber}</span>
          <small>${housePeople.length} voters</small>
        `;
        houseSection.appendChild(header);

        const houseContent = document.createElement("div");
        houseContent.className = "house-content";
        houseContent.style.overflow = "hidden";
        houseContent.style.transition = "max-height 0.3s ease, opacity 0.3s ease";
        houseContent.style.opacity = "1";

        // Toggle collapse on header click
        let collapsed = false;
        header.style.cursor = "pointer";
        header.addEventListener("click", () => {
          collapsed = !collapsed;
          if (collapsed) {
            houseContent.style.maxHeight = "0px";
            houseContent.style.opacity = "0";
          } else {
            houseContent.style.maxHeight = houseContent.scrollHeight + "px";
            houseContent.style.opacity = "1";
          }
        });

        housePeople.forEach(p => {
          const card = document.createElement("div");
          card.className = "card";

          // small click highlight effect
          card.addEventListener("click", () => {
            card.style.boxShadow = "0 0 0 3px rgba(37,99,235,.4)";
            setTimeout(() => { card.style.boxShadow = "0 4px 14px rgba(0,0,0,.08)"; }, 250);
          });

          const img = document.createElement("img");
          img.className = "voter-photo";
          img.alt = p.name || "";
          img.dataset.src = `photos/${p.serial}.jpg`;
          img.loading = "lazy";
          img.addEventListener("click", e => {
            e.stopPropagation();
            if (typeof openPhoto === "function") openPhoto(img.src || img.dataset.src);
          });

          const duplicateBadge = duplicateBYPs.has(p.byp)
            ? `<span class="dup-badge">DUPLICATE</span>`
            : "";

          const genderLabel = normalizeGender(p.gender);
          const genderClass = genderLabel === "Male" ? "male" : "female";

          const casteColor = getCasteColor(p.caste);

          const fatherLine  = p.father  ? `<p><strong>Father:</strong> ${p.father}</p>`   : "";
          const husbandLine = p.husband ? `<p><strong>Husband:</strong> ${p.husband}</p>` : "";

          const content = document.createElement("div");
          content.className = "card-content";
          content.innerHTML = `
            <h3 class="card-header-line">
              <span>
                ${p.name}
                <span class="pill">#${p.serial}</span>
                ${duplicateBadge}
              </span>
              <span class="gender-pill ${genderClass}">${genderLabel}</span>
            </h3>
            ${fatherLine}
            ${husbandLine}
            <p><strong>BYP:</strong> ${p.byp}</p>
            <p><strong>Age:</strong> ${p.age}</p>
            <p><strong>Caste:</strong> 
              <span class="pill caste-pill" style="background:${casteColor.bg};color:${casteColor.text};">
                ${p.caste}
              </span>
            </p>
          `;

          card.appendChild(img);
          card.appendChild(content);
          houseContent.appendChild(card);

          lazyImages.push(img);
          if (duplicateBYPs.has(p.byp)) {
            duplicateCards.push(card);
          }
        });

        // set initial maxHeight for animation
        requestAnimationFrame(() => {
          houseContent.style.maxHeight = houseContent.scrollHeight + "px";
        });

        houseSection.appendChild(houseContent);
        resultsDiv.appendChild(houseSection);
      });

    setupLazyLoading();
    updateDuplicateUI();
  }

  // ----------------------------
  // CASTE COLOR MAP
  // ----------------------------
  function getCasteColor(caste) {
    switch (caste) {
      case "Muslim": return { bg:"#bbf7d0", text:"#166534" };
      case "SC":     return { bg:"#fee2e2", text:"#b91c1c" };
      case "ST":     return { bg:"#fef3c7", text:"#92400e" };
      case "OBC":    return { bg:"#dbeafe", text:"#1d4ed8" };
      default:       return { bg:"#e5e7ff", text:"#111827" };
    }
  }

  // ----------------------------
  // LAZY LOAD IMAGES
  // ----------------------------
  function setupLazyLoading() {
    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src && !img.src) {
              img.src = img.dataset.src;
            }
            observer.unobserve(img);
          }
        });
      },{
        root:null,
        rootMargin:"100px",
        threshold:0.01
      });

      lazyImages.forEach(img => observer.observe(img));
    } else {
      // fallback: load all
      lazyImages.forEach(img => {
        if (img.dataset.src) img.src = img.dataset.src;
      });
    }
  }

  // ----------------------------
  // FILTERS (Age + House)
  // ----------------------------
  function applyFilters() {
    let filtered = [...allPeople];

    const ageVal   = filterAge.value;
    const houseVal = filterHouse.value;

    if (houseVal) {
      filtered = filtered.filter(p => p.house === houseVal);
    }

    if (ageVal) {
      const [min, max] = ageVal.split("-").map(Number);
      filtered = filtered.filter(p => p.age >= min && p.age <= max);
    }

    renderResults(filtered);
  }

  filterAge.onchange   = applyFilters;
  filterHouse.onchange = applyFilters;

  // ----------------------------
  // SEARCH (debounced, includes caste)
  // ----------------------------
  let searchTimer = null;

  function handleSearch() {
    const q = searchInput.value.toLowerCase().trim();

    if (!q) {
      applyFilters();
      return;
    }

    const matched = allPeople.filter(p =>
      (p.name || "").toLowerCase().includes(q) ||
      (p.caste || "").toLowerCase().includes(q) ||
      String(p.serial).includes(q) ||
      (p.byp || "").toLowerCase().includes(q)
    );

    if (!matched.length) {
      renderResults([]);
      return;
    }

    const houses = new Set(matched.map(p => p.house));
    const list = allPeople.filter(p => houses.has(p.house));

    renderResults(list);

    filterAge.value = "";
    filterHouse.value = "";
  }

  searchInput.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(handleSearch, 150);  // instant feel
  });

  // ----------------------------
  // BACK TO TOP
  // ----------------------------
  window.addEventListener("scroll", () => {
    backToTop.style.display = window.scrollY > 200 ? "block" : "none";
    updateBreadcrumbAndNav();
  });

  backToTop.addEventListener("click", () => {
    window.scrollTo({ top:0, behavior:"smooth" });
  });

  // ----------------------------
  // BREADCRUMB + HOUSE NAV ACTIVE
  // ----------------------------
  function updateBreadcrumbAndNav() {
    const sections = document.querySelectorAll(".house-section");
    let current = "All Houses";
    let currentHouseKey = null;

    sections.forEach(sec => {
      const rect = sec.getBoundingClientRect();
      if (rect.top <= 140 && rect.bottom >= 140) {
        const titleSpan = sec.querySelector(".house-title span");
        if (titleSpan) {
          current = titleSpan.textContent.replace("House: ","");
          currentHouseKey = sec.id.replace("house-section-","");
        }
      }
    });

    breadcrumbHouse.textContent = current;

    // nav active
    document.querySelectorAll(".house-nav-item").forEach(btn => {
      if (currentHouseKey && btn.dataset.house === currentHouseKey) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });
  }

  // ----------------------------
  // DUPLICATE UI (button + stat click)
  // ----------------------------
  function updateDuplicateUI() {
    if (duplicateCards.length > 0) {
      dupJumpBtn.style.display = "block";
    } else {
      dupJumpBtn.style.display = "none";
    }
  }

  function jumpToNextDuplicate() {
    if (!duplicateCards.length) return;
    const card = duplicateCards[duplicateIndex];
    duplicateIndex = (duplicateIndex + 1) % duplicateCards.length;

    card.scrollIntoView({ behavior:"smooth", block:"center" });
    const oldShadow = card.style.boxShadow;
    card.style.boxShadow = "0 0 0 3px #f97316";
    setTimeout(() => { card.style.boxShadow = oldShadow || "0 4px 14px rgba(0,0,0,.08)"; }, 1500);
  }

  statDup.addEventListener("click", jumpToNextDuplicate);
  dupJumpBtn.addEventListener("click", jumpToNextDuplicate);
});