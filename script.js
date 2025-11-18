document.addEventListener("DOMContentLoaded", () => {
  const searchInput     = document.getElementById("search");
  const resultsDiv      = document.getElementById("results");
  const suggestionsDiv  = document.getElementById("suggestions");
  const genderSel       = document.getElementById("filterGender");
  const ageSel          = document.getElementById("filterAge");
  const houseSel        = document.getElementById("filterHouse");
  const sortSel         = document.getElementById("filterSort");
  const bypInput        = document.getElementById("filterBYP");
  const fhInput         = document.getElementById("filterFH");
  const initialSel      = document.getElementById("filterInitial");
  const ageMinInput     = document.getElementById("ageMin");
  const ageMaxInput     = document.getElementById("ageMax");
  const serialMinInput  = document.getElementById("serialMin");
  const serialMaxInput  = document.getElementById("serialMax");
  const viewModeSel     = document.getElementById("viewMode");
  const psSelector      = document.getElementById("psSelector");
  const darkToggle      = document.getElementById("darkToggle");
  const houseJumpDiv    = document.getElementById("houseJump");
  const backToTopBtn    = document.getElementById("backToTop");
  const btnClear        = document.getElementById("btnClear");
  const btnExportCSV    = document.getElementById("btnExportCSV");
  const btnPrint        = document.getElementById("btnPrint");

  let voterData = {};      // original loaded object { house_x: [..] }
  let allPeople = [];      // flat array [{house, name, serial, ...}, ...]
  let currentList = [];    // last rendered list
  let duplicateBYP = new Set();
  let colorMap = {};       // house -> color
  const houseColors = [
    "#fef3c7", "#e0f2fe", "#f1f5f9", "#fce7f3",
    "#dcfce7", "#ede9fe", "#fee2e2", "#f5f5f4"
  ];

  const JSON_FILE = window.PS_JSON || "data/master.json";

  // ---- LOAD DATA ----
  fetch(JSON_FILE)
    .then(res => {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then(data => {
      voterData = data || {};

      // flatten
      Object.keys(voterData).forEach(house => {
        voterData[house].forEach(p => {
          allPeople.push({ house, ...p });
        });
      });

      buildDuplicateIndex();
      fillHouseDropdown();
      buildHouseJump();
      buildColorMap();

      currentList = [...allPeople];
      applyFiltersAndSearch();   // initial render
    })
    .catch(err => {
      console.error(err);
      resultsDiv.innerHTML = `<p style="color:red;">Failed to load voter list.</p>`;
    });

  // ---- UTILITIES ----

  function buildDuplicateIndex() {
    const bypCount = {};
    allPeople.forEach(p => {
      if (!p.byp) return;
      const key = String(p.byp).trim();
      bypCount[key] = (bypCount[key] || 0) + 1;
    });
    Object.keys(bypCount).forEach(k => {
      if (bypCount[k] > 1) duplicateBYP.add(k);
    });
  }

  function buildColorMap() {
    const houses = Array.from(new Set(allPeople.map(p => p.house))).sort();
    houses.forEach((h, idx) => {
      colorMap[h] = houseColors[idx % houseColors.length];
    });
  }

  function prettyHouseLabel(houseKey) {
    // "house_22K" -> "22K"
    return houseKey.replace(/^house_/i, "").toUpperCase();
  }

  function parseHouseNumber(houseKey) {
    // For sorting houses naturally: "house_22K" -> { num: 22, suffix: "K" }
    const raw = houseKey.replace(/^house_/i, "");
    const m = raw.match(/^(\d+)(.*)$/);
    if (!m) return { num: 9999, suffix: raw };
    return { num: parseInt(m[1], 10), suffix: (m[2] || "").toUpperCase() };
  }

  function fillHouseDropdown() {
    if (!houseSel) return;
    const houses = Array.from(new Set(allPeople.map(p => p.house))).sort((a, b) => {
      const pa = parseHouseNumber(a);
      const pb = parseHouseNumber(b);
      if (pa.num !== pb.num) return pa.num - pb.num;
      return pa.suffix.localeCompare(pb.suffix);
    });

    houses.forEach(h => {
      const op = document.createElement("option");
      op.value = h;
      op.textContent = prettyHouseLabel(h);
      houseSel.appendChild(op);
    });
  }

  function buildHouseJump() {
    if (!houseJumpDiv) return;
    houseJumpDiv.innerHTML = "";
    const houses = Array.from(new Set(allPeople.map(p => p.house))).sort((a, b) => {
      const pa = parseHouseNumber(a);
      const pb = parseHouseNumber(b);
      if (pa.num !== pb.num) return pa.num - pb.num;
      return pa.suffix.localeCompare(pb.suffix);
    });

    houses.forEach(h => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "house-chip";
      chip.textContent = prettyHouseLabel(h);
      chip.addEventListener("click", () => {
        const section = document.getElementById("house_" + prettyHouseLabel(h));
        if (section) {
          section.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
      houseJumpDiv.appendChild(chip);
    });
  }

  // ---- RENDER ----

  function renderResults(list) {
    currentList = list;
    const viewMode = viewModeSel ? viewModeSel.value : "list";

    resultsDiv.innerHTML = "";
    resultsDiv.classList.toggle("grid-view", viewMode === "grid");

    if (!list.length) {
      resultsDiv.innerHTML = `<p>No results found.</p>`;
      return;
    }

    // group by house
    const groups = {};
    list.forEach(p => {
      if (!groups[p.house]) groups[p.house] = [];
      groups[p.house].push(p);
    });

    const houseKeys = Object.keys(groups).sort((a, b) => {
      const pa = parseHouseNumber(a);
      const pb = parseHouseNumber(b);
      if (pa.num !== pb.num) return pa.num - pb.num;
      return pa.suffix.localeCompare(pb.suffix);
    });

    houseKeys.forEach(houseKey => {
      const houseList = groups[houseKey];
      const pretty = prettyHouseLabel(houseKey);

      const section = document.createElement("div");
      section.className = "house-section";
      section.id = "house_" + pretty;
      section.style.background = colorMap[houseKey] || "rgba(148,163,184,0.12)";

      const header = document.createElement("div");
      header.className = "house-title";
      header.innerHTML = `
        <span>House ${pretty}</span>
        <span class="house-sub">${houseList.length} voter(s)</span>
      `;
      section.appendChild(header);

      const cardListDiv = document.createElement("div");
      cardListDiv.className = "card-list";

      houseList.forEach(p => {
        const card = document.createElement("div");
        card.className = "card";

        // duplicate / missing markers
        const bypKey = p.byp ? String(p.byp).trim() : "";
        const isDup = duplicateBYP.has(bypKey);
        const isMissing = p.age == null || p.age === "" || !p.byp;

        if (isDup) card.classList.add("duplicate");
        if (isMissing) card.classList.add("missing-data");

        let badges = "";
        if (isDup) {
          badges += `<span class="badge">Duplicate BYP</span>`;
        }
        if (isMissing) {
          badges += `<span class="badge">Missing data</span>`;
        }

        card.innerHTML = `
          <h3>
            ${p.name || "-"}
            <span class="pill">Serial ${p.serial}</span>
            ${badges}
          </h3>
          <p><strong>Age:</strong> ${p.age ?? "-"}</p>
          <p><strong>Gender:</strong> ${p.gender ?? "-"}</p>
          <p><strong>House:</strong> ${pretty}</p>
          <p><strong>Father:</strong> ${p.father ?? "-"}</p>
          <p><strong>Husband:</strong> ${p.husband ?? "-"}</p>
          <p><strong>BYP:</strong> ${p.byp ?? "-"}</p>
        `;

        cardListDiv.appendChild(card);
      });

      section.appendChild(cardListDiv);
      resultsDiv.appendChild(section);
    });
  }

  // ---- FILTER + SEARCH ----

  function applyFiltersAndSearch() {
    let filtered = [...allPeople];

    const q      = (searchInput?.value || "").trim().toLowerCase();
    const g      = genderSel?.value || "";
    const aVal   = ageSel?.value || "";
    const houseV = houseSel?.value || "";
    const sortV  = sortSel?.value || "";
    const bypVal = (bypInput?.value || "").trim().toLowerCase();
    const fhVal  = (fhInput?.value  || "").trim().toLowerCase();
    const initV  = initialSel?.value || "";

    // search first (name / house / serial / BYP)
    if (q) {
      filtered = filtered.filter(p => {
        const name   = (p.name || "").toLowerCase();
        const house  = (p.house || "").toLowerCase();
        const serial = String(p.serial || "");
        const byp    = (p.byp || "").toLowerCase();
        return (
          name.includes(q) ||
          house.includes(q) ||
          serial.includes(q) ||
          byp.includes(q)
        );
      });
    }

    // gender
    if (g) {
      filtered = filtered.filter(p => (p.gender || "") === g);
    }

    // house
    if (houseV) {
      filtered = filtered.filter(p => p.house === houseV);
    }

    // father/husband text match
    if (fhVal) {
      filtered = filtered.filter(p => {
        const f = (p.father || "").toLowerCase();
        const h = (p.husband || "").toLowerCase();
        return f.includes(fhVal) || h.includes(fhVal);
      });
    }

    // BYP filter (contains)
    if (bypVal) {
      filtered = filtered.filter(p => (p.byp || "").toLowerCase().includes(bypVal));
    }

    // starting letter
    if (initV) {
      filtered = filtered.filter(p => {
        const n = (p.name || "").trim();
        if (!n) return false;
        const first = n[0].toUpperCase();
        if (initV === "#") {
          return first < "A" || first > "Z";
        }
        return first === initV;
      });
    }

    // age: dropdown OR custom range
    if (aVal) {
      const [min, max] = aVal.split("-").map(Number);
      filtered = filtered.filter(p => {
        if (p.age == null || p.age === "") return false;
        return p.age >= min && p.age <= max;
      });
    } else {
      const min = Number(ageMinInput?.value || "");
      const max = Number(ageMaxInput?.value || "");
      if (!Number.isNaN(min) && ageMinInput?.value !== "") {
        filtered = filtered.filter(p => p.age != null && p.age >= min);
      }
      if (!Number.isNaN(max) && ageMaxInput?.value !== "") {
        filtered = filtered.filter(p => p.age != null && p.age <= max);
      }
    }

    // serial range
    const sMin = Number(serialMinInput?.value || "");
    const sMax = Number(serialMaxInput?.value || "");
    if (!Number.isNaN(sMin) && serialMinInput?.value !== "") {
      filtered = filtered.filter(p => p.serial != null && p.serial >= sMin);
    }
    if (!Number.isNaN(sMax) && serialMaxInput?.value !== "") {
      filtered = filtered.filter(p => p.serial != null && p.serial <= sMax);
    }

    // sorting
    if (sortV === "name") {
      filtered.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } else if (sortV === "serial") {
      filtered.sort((a, b) => (a.serial || 0) - (b.serial || 0));
    } else if (sortV === "age") {
      filtered.sort((a, b) => (a.age || 0) - (b.age || 0));
    } else if (sortV === "house") {
      filtered.sort((a, b) => {
        const pa = parseHouseNumber(a.house);
        const pb = parseHouseNumber(b.house);
        if (pa.num !== pb.num) return pa.num - pb.num;
        return pa.suffix.localeCompare(pb.suffix);
      });
    } else if (sortV === "byp") {
      filtered.sort((a, b) => (String(a.byp || "")).localeCompare(String(b.byp || "")));
    } else if (sortV === "nameLength") {
      filtered.sort((a, b) => (a.name || "").length - (b.name || "").length);
    }

    renderResults(filtered);
  }

  // ---- EVENTS ----

  // search with suggestions
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const q = searchInput.value.trim().toLowerCase();

      if (!q) {
        suggestionsDiv.style.display = "none";
        suggestionsDiv.innerHTML = "";
        applyFiltersAndSearch();
        return;
      }

      // suggestion list (top 10 names)
      const suggest = allPeople
        .filter(p => (p.name || "").toLowerCase().includes(q))
        .slice(0, 10);

      if (suggest.length) {
        suggestionsDiv.innerHTML = "";
        suggestionsDiv.style.display = "block";

        suggest.forEach(p => {
          const item = document.createElement("div");
          item.className = "suggestion-item";
          item.textContent = `${p.name} (House ${prettyHouseLabel(p.house)}, Serial ${p.serial})`;
          item.addEventListener("click", () => {
            searchInput.value = p.name || "";
            suggestionsDiv.innerHTML = "";
            suggestionsDiv.style.display = "none";
            applyFiltersAndSearch();
          });
          suggestionsDiv.appendChild(item);
        });
      } else {
        suggestionsDiv.style.display = "none";
        suggestionsDiv.innerHTML = "";
      }

      applyFiltersAndSearch();
    });

    document.addEventListener("click", (e) => {
      if (!e.target.closest(".search-wrapper")) {
        suggestionsDiv.style.display = "none";
      }
    });
  }

  // filter changes
  [genderSel, ageSel, houseSel, sortSel, initialSel].forEach(el => {
    if (!el) return;
    el.addEventListener("change", applyFiltersAndSearch);
  });

  [bypInput, fhInput, ageMinInput, ageMaxInput, serialMinInput, serialMaxInput].forEach(el => {
    if (!el) return;
    el.addEventListener("input", () => {
      applyFiltersAndSearch();
    });
  });

  if (viewModeSel) {
    viewModeSel.addEventListener("change", () => {
      renderResults(currentList);
    });
  }

  if (btnClear) {
    btnClear.addEventListener("click", () => {
      if (genderSel) genderSel.value = "";
      if (ageSel) ageSel.value = "";
      if (houseSel) houseSel.value = "";
      if (sortSel) sortSel.value = "";
      if (initialSel) initialSel.value = "";
      if (bypInput) bypInput.value = "";
      if (fhInput) fhInput.value = "";
      if (ageMinInput) ageMinInput.value = "";
      if (ageMaxInput) ageMaxInput.value = "";
      if (serialMinInput) serialMinInput.value = "";
      if (serialMaxInput) serialMaxInput.value = "";
      if (searchInput) searchInput.value = "";
      applyFiltersAndSearch();
    });
  }

  // PS selector
  if (psSelector) {
    psSelector.addEventListener("change", () => {
      const ps = psSelector.value;
      window.location.href = `ps${ps}.html`;
    });
  }

  // dark mode
  if (darkToggle) {
    darkToggle.addEventListener("click", () => {
      document.body.classList.toggle("dark");
      darkToggle.classList.toggle("active");
    });
  }

  // back to top
  window.addEventListener("scroll", () => {
    if (window.scrollY > 200) {
      backToTopBtn.style.display = "block";
    } else {
      backToTopBtn.style.display = "none";
    }
  });

  backToTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // Export CSV (Excel)
  if (btnExportCSV) {
    btnExportCSV.addEventListener("click", () => {
      const rows = [
        ["Name", "Serial", "House", "Age", "Gender", "Father", "Husband", "BYP"]
      ];
      currentList.forEach(p => {
        rows.push([
          p.name || "",
          p.serial || "",
          prettyHouseLabel(p.house),
          p.age || "",
          p.gender || "",
          p.father || "",
          p.husband || "",
          p.byp || ""
        ]);
      });

      const csv = rows.map(r =>
        r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")
      ).join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "voter_list_ps87.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  // Print / PDF
  if (btnPrint) {
    btnPrint.addEventListener("click", () => {
      window.print();  // user can choose "Save as PDF"
    });
  }

});
