document.addEventListener("DOMContentLoaded", () => {

  // Elements
  const searchInput = document.getElementById("search");
  const resultsDiv = document.getElementById("results");
  const suggestionsDiv = document.getElementById("suggestions");

  const filterGender = document.getElementById("filterGender");
  const filterAge = document.getElementById("filterAge");
  const filterHouse = document.getElementById("filterHouse");
  const filterSort = document.getElementById("filterSort");
  const filterBYP = document.getElementById("filterBYP");
  const filterInitial = document.getElementById("filterInitial");
  const viewMode = document.getElementById("viewMode");

  const psSelector = document.getElementById("psSelector");
  const houseJump = document.getElementById("houseJump");
  const backToTop = document.getElementById("backToTop");

  let voterData = {};
  let allPeople = [];
  let colors = {};

  const JSON_FILE = window.PS_JSON || "data/master.json";

  // Load data
  fetch(JSON_FILE)
    .then(res => {
      if (!res.ok) throw new Error("HTTP " + res.status);
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

  // Process Data
  function processData() {
    allPeople = [];

    const houseKeys = Object.keys(voterData).sort();

    houseKeys.forEach(h => {
      voterData[h].forEach(p => {
        allPeople.push({ house: h, ...p });
      });
    });

    fillHouseDropdown();
    generateHouseJump();
    generateColors();
    renderResults(allPeople);
  }

  // Generate unique background colors per house
  function generateColors() {
    const uniqueHouses = [...new Set(allPeople.map(p => p.house))];
    uniqueHouses.forEach((h, i) => {
      const hue = (i * 47) % 360;
      colors[h] = `hsla(${hue}, 80%, 92%, 1)`;
    });
  }

  // Fill dropdown houses
  function fillHouseDropdown() {
    const houses = Object.keys(voterData).sort();

    houses.forEach(h => {
      const op = document.createElement("option");
      op.value = h;
      op.textContent = h.replace("house_", "House ");
      filterHouse.appendChild(op);
    });
  }

  // Generate quick jump
  function generateHouseJump() {
    houseJump.innerHTML = "";
    const houses = Object.keys(voterData).sort();

    houses.forEach(h => {
      const chip = document.createElement("div");
      chip.className = "house-chip";
      chip.textContent = h.replace("house_", "");
      chip.onclick = () => scrollToHouse(h);
      houseJump.appendChild(chip);
    });
  }

  function scrollToHouse(houseKey) {
    const section = document.getElementById("sec_" + houseKey);
    if (section) section.scrollIntoView({ behavior: "smooth" });
  }

  // Render Results
  function renderResults(list) {
    resultsDiv.classList.toggle("grid-view", viewMode.value === "grid");

    resultsDiv.innerHTML = "";

    if (!list.length) {
      resultsDiv.innerHTML = "<p>No results found.</p>";
      return;
    }

    // Group by house
    const grouped = {};
    list.forEach(p => {
      if (!grouped[p.house]) grouped[p.house] = [];
      grouped[p.house].push(p);
    });

    Object.keys(grouped).forEach(house => {
      const section = document.createElement("div");
      section.className = "house-section";
      section.id = "sec_" + house;
      section.style.background = colors[house];

      const title = document.createElement("div");
      title.className = "house-title";
      title.innerHTML = `
        <span>House: ${house.replace("house_", "")}</span>
        <span class="house-sub">${grouped[house].length} voters</span>
      `;
      section.appendChild(title);

      const cardList = document.createElement("div");
      cardList.className = "card-list";

      grouped[house].forEach(p => {
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
          <h3>${p.name} <span class="pill">#${p.serial}</span></h3>
          <p><strong>Age:</strong> ${p.age}</p>
          <p><strong>Gender:</strong> ${p.gender}</p>
          <p><strong>BYP:</strong> ${p.byp}</p>
        `;
        cardList.appendChild(card);
      });

      section.appendChild(cardList);
      resultsDiv.appendChild(section);
    });
  }

  // FILTER LOGIC
  function applyFilters() {
    let filtered = [...allPeople];

    const g = filterGender.value;
    const a = filterAge.value;
    const h = filterHouse.value;
    const s = filterSort.value;
    const byp = filterBYP.value.toLowerCase();
    const initial = filterInitial.value;

    if (g) filtered = filtered.filter(p => p.gender === g);

    if (h) filtered = filtered.filter(p => p.house === h);

    if (a) {
      const [min, max] = a.split("-").map(Number);
      filtered = filtered.filter(p => p.age >= min && p.age <= max);
    }

    if (byp) filtered = filtered.filter(p => p.byp.toLowerCase().includes(byp));

    if (initial) {
      if (initial === "#") {
        filtered = filtered.filter(p => !/^[A-Z]/i.test(p.name));
      } else {
        filtered = filtered.filter(p => p.name.startsWith(initial));
      }
    }

    // Sorting
    if (s === "name") filtered.sort((a, b) => a.name.localeCompare(b.name));
    if (s === "serial") filtered.sort((a, b) => a.serial - b.serial);
    if (s === "age") filtered.sort((a, b) => a.age - b.age);
    if (s === "house") filtered.sort((a, b) => a.house.localeCompare(b.house));
    if (s === "byp") filtered.sort((a, b) => a.byp.localeCompare(b.byp));
    if (s === "nameLength") filtered.sort((a, b) => a.name.length - b.name.length);

    renderResults(filtered);
  }

  // Event Listeners for filters
  filterGender.onchange = applyFilters;
  filterAge.onchange = applyFilters;
  filterHouse.onchange = applyFilters;
  filterSort.onchange = applyFilters;
  filterBYP.oninput = applyFilters;
  filterInitial.onchange = applyFilters;

  // Search
  searchInput.addEventListener("input", () => {
    const q = searchInput.value.toLowerCase();
    suggestionsDiv.innerHTML = "";
    suggestionsDiv.style.display = "none";

    if (!q) {
      applyFilters();
      return;
    }

    const matches = allPeople.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.house.toLowerCase().includes(q) ||
      p.byp.toLowerCase().includes(q) ||
      String(p.serial).includes(q)
    );

    renderResults(matches);
  });

  // View mode toggle
  viewMode.onchange = () => applyFilters();

  // PS selector
  psSelector.onchange = () => {
    const ps = psSelector.value;
    window.location.href = `ps${ps}.html`;
  };

  // Back to Top
  window.addEventListener("scroll", () => {
    backToTop.style.display = window.scrollY > 200 ? "block" : "none";
  });
  backToTop.onclick = () => window.scrollTo({ top: 0, behavior: "smooth" });

});
