document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("search");
  const resultsDiv = document.getElementById("results");
  const suggestionsDiv = document.getElementById("suggestions");

  let voterData = {};
  let allPeople = [];

  const JSON_FILE = window.PS_JSON || "data/master.json";

  fetch(JSON_FILE)
    .then(res => {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then(data => {
      voterData = data;

      Object.keys(voterData).forEach(house => {
        voterData[house].forEach(p => {
          allPeople.push({ house, ...p });
        });
      });

      fillHouseDropdown();
      renderResults(allPeople);
    })
    .catch(err => {
      resultsDiv.innerHTML = `<p style="color:red;">Failed to load voter list.</p>`;
      console.error(err);
    });

  function fillHouseDropdown() {
    const houseSelect = document.getElementById("filterHouse");
    const houses = Object.keys(voterData).sort();

    houses.forEach(h => {
      const op = document.createElement("option");
      op.value = h;
      op.textContent = h;
      houseSelect.appendChild(op);
    });
  }

  function renderResults(list) {
    resultsDiv.innerHTML = "";

    if (!list.length) {
      resultsDiv.innerHTML = `<p>No results found.</p>`;
      return;
    }

    list.forEach(p => {
      const card = document.createElement("div");
      card.className = "card";

      card.innerHTML = `
        <h3>${p.name} <span class="pill">Serial ${p.serial}</span></h3>
        <p><strong>House:</strong> ${p.house}</p>
        <p><strong>Age:</strong> ${p.age}</p>
        <p><strong>Gender:</strong> ${p.gender}</p>
        <p><strong>Father:</strong> ${p.father ?? "-"}</p>
        <p><strong>Husband:</strong> ${p.husband ?? "-"}</p>
        <p><strong>BYP:</strong> ${p.byp}</p>
      `;

      resultsDiv.appendChild(card);
    });
  }

  function applyFilters() {
    let filtered = [...allPeople];

    const g = document.getElementById("filterGender").value;
    const a = document.getElementById("filterAge").value;
    const h = document.getElementById("filterHouse").value;
    const s = document.getElementById("filterSort").value;

    if (g) filtered = filtered.filter(p => p.gender === g);
    if (h) filtered = filtered.filter(p => p.house === h);

    if (a) {
      const [min, max] = a.split("-").map(Number);
      filtered = filtered.filter(p => p.age >= min && p.age <= max);
    }

    if (s === "name") filtered.sort((a, b) => a.name.localeCompare(b.name));
    if (s === "serial") filtered.sort((a, b) => a.serial - b.serial);
    if (s === "age") filtered.sort((a, b) => a.age - b.age);

    renderResults(filtered);
  }

  document.getElementById("filterGender").onchange = applyFilters;
  document.getElementById("filterAge").onchange = applyFilters;
  document.getElementById("filterHouse").onchange = applyFilters;
  document.getElementById("filterSort").onchange = applyFilters;

  searchInput.addEventListener("input", () => {
    const q = searchInput.value.toLowerCase();

    suggestionsDiv.innerHTML = "";
    suggestionsDiv.style.display = "none";

    if (!q) {
      renderResults(allPeople);
      return;
    }

    const matches = allPeople.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.house.toLowerCase().includes(q) ||
      String(p.serial).includes(q)
    );

    renderResults(matches);
  });
});
