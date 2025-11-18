document.addEventListener("DOMContentLoaded", () => {

  // Elements
  const searchInput = document.getElementById("search");
  const resultsDiv = document.getElementById("results");

  const filterGender = document.getElementById("filterGender");
  const filterHouse = document.getElementById("filterHouse");
  const filterSort = document.getElementById("filterSort");
  const viewMode = document.getElementById("viewMode");
  const psSelector = document.getElementById("psSelector");
  const backToTop = document.getElementById("backToTop");

  let voterData = {};
  let allPeople = [];
  let colors = {};

  const JSON_FILE = window.PS_JSON || "data/master.json";

  // Load data
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

  // Process Data
  function processData() {
    allPeople = [];

    Object.keys(voterData).forEach(h => {
      voterData[h].forEach(p => {
        allPeople.push({ house: h, ...p });
      });
    });

    fillHouseDropdown();
    generateColors();
    renderResults(allPeople);
  }

  // Auto house background colors
  function generateColors() {
    const houses = [...new Set(allPeople.map(p => p.house))];
    houses.forEach((h, i) => {
      const hue = (i * 45) % 360;
      colors[h] = `hsla(${hue}, 80%, 92%, 1)`;
    });
  }

  function fillHouseDropdown() {
    const houses = Object.keys(voterData).sort();
    houses.forEach(h => {
      const op = document.createElement("option");
      op.value = h;
      op.textContent = h.replace("house_", "House ");
      filterHouse.appendChild(op);
    });
  }

  // Render grouped results
  function renderResults(list) {
    resultsDiv.classList.toggle("grid-view", viewMode.value === "grid");
    resultsDiv.innerHTML = "";

    if (!list.length) {
      resultsDiv.innerHTML = "<p>No results found.</p>";
      return;
    }

    const grouped = {};
    list.forEach(p => {
      if (!grouped[p.house]) grouped[p.house] = [];
      grouped[p.house].push(p);
    });

    Object.keys(grouped).forEach(h => {
      const section = document.createElement("div");
      section.className = "house-section";
      section.style.background = colors[h];

      section.innerHTML = `
        <div class="house-title">
            <span>House: ${h.replace("house_", "")}</span>
            <span class="house-sub">${grouped[h].length} voters</span>
        </div>
      `;

      const cardList = document.createElement("div");
      cardList.className = "card-list";

      grouped[h].forEach(p => {
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

  // Apply Filters
  function applyFilters() {
    let filtered = [...allPeople];

    const g = filterGender.value;
    const h = filterHouse.value;
    const s = filterSort.value;

    if (g) filtered = filtered.filter(p => p.gender === g);
    if (h) filtered = filtered.filter(p => p.house === h);

    if (s === "name") filtered.sort((a, b) => a.name.localeCompare(b.name));
    if (s === "serial") filtered.sort((a, b) => a.serial - b.serial);
    if (s === "age") filtered.sort((a, b) => a.age - b.age);
    if (s === "byp") filtered.sort((a, b) => a.byp.localeCompare(b.byp));

    renderResults(filtered);
  }

  // Event Listeners
  filterGender.onchange = applyFilters;
  filterHouse.onchange = applyFilters;
  filterSort.onchange = applyFilters;
  viewMode.onchange = applyFilters;

  // Search
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

  // PS Selector
  psSelector.onchange = () => {
    window.location.href = `ps${psSelector.value}.html`;
  };

  // Back to top
  window.addEventListener("scroll", () => {
    backToTop.style.display = window.scrollY > 200 ? "block" : "none";
  });

  backToTop.onclick = () =>
    window.scrollTo({ top: 0, behavior: "smooth" });

});
