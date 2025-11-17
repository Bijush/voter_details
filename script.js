document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("search");
  const resultsDiv = document.getElementById("results");
  const suggestionsDiv = document.getElementById("suggestions");

  const genderFilter = document.getElementById("filterGender");
  const ageFilter = document.getElementById("filterAge");
  const houseFilter = document.getElementById("filterHouse");
  const sortFilter = document.getElementById("filterSort");

  let voterData = {};
  let flatList = [];
  let nameIndex = [];

  // Load JSON
  fetch("data/master_beng.json")
    .then((res) => res.json())
    .then((data) => {
      voterData = data;
      console.log("JSON Loaded Successfully!");

      flatList = [];

      Object.keys(voterData).forEach((houseKey) => {
        // Fill dropdown
        const option = document.createElement("option");
        option.value = houseKey;
        option.textContent = houseKey.replace("house_", "");
        houseFilter.appendChild(option);

        // Flat list
        voterData[houseKey].forEach((person) => {
          flatList.push({ house: houseKey, ...person });

          nameIndex.push({
            searchName: (person.name || "").toLowerCase(),
            house: houseKey,
            ...person,
          });
        });
      });

      render(applyFilters(flatList));
    })
    .catch((err) => {
      console.error(err);
      resultsDiv.innerHTML =
        "<p style='color:red;'>Failed to load voter data.</p>";
    });

  // Render function
  function render(list) {
    resultsDiv.innerHTML = "";

    if (list.length === 0) {
      resultsDiv.innerHTML = "<p>No results found.</p>";
      return;
    }

    list.forEach((p) => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <h3>${p.name} <span class='pill'>Serial ${p.serial}</span></h3>
        <p><strong>House:</strong> ${p.house}</p>
        <p><strong>Age:</strong> ${p.age ?? "—"}</p>
        <p><strong>Gender:</strong> ${p.gender ?? "—"}</p>
        <p><strong>Father:</strong> ${p.father ?? "—"}</p>
        <p><strong>Husband:</strong> ${p.husband ?? "—"}</p>
        <p><strong>BYP:</strong> ${p.byp ?? "—"}</p>
      `;
      resultsDiv.appendChild(card);
    });
  }

  // Filter Logic
  function applyFilters(dataList) {
    let filtered = [...dataList];

    // Gender filter
    if (genderFilter.value) {
      filtered = filtered.filter((p) => p.gender === genderFilter.value);
    }

    // Age filter
    if (ageFilter.value) {
      let [min, max] = ageFilter.value.split("-").map(Number);
      filtered = filtered.filter((p) => p.age >= min && p.age <= max);
    }

    // House filter
    if (houseFilter.value) {
      filtered = filtered.filter((p) => p.house === houseFilter.value);
    }

    // Sort
    if (sortFilter.value === "name") {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }
    if (sortFilter.value === "age") {
      filtered.sort((a, b) => (a.age || 0) - (b.age || 0));
    }
    if (sortFilter.value === "serial") {
      filtered.sort((a, b) => a.serial - b.serial);
    }

    return filtered;
  }

  // Search
  searchInput.addEventListener("input", () => {
    const raw = searchInput.value.trim();
    const q = raw.toLowerCase();

    suggestionsDiv.innerHTML = "";
    suggestionsDiv.style.display = "none";

    if (!q) {
      render(applyFilters(flatList));
      return;
    }

    // Auto suggestion
    const sList = nameIndex
      .filter((p) => p.searchName.includes(q))
      .slice(0, 10);

    if (sList.length > 0) {
      suggestionsDiv.style.display = "block";
      sList.forEach((s) => {
        const item = document.createElement("div");
        item.className = "suggestion-item";
        item.textContent = `${s.name} (${s.house}, Serial ${s.serial})`;

        item.addEventListener("click", () => {
          searchInput.value = s.name;
          suggestionsDiv.style.display = "none";
          render([s]);
        });

        suggestionsDiv.appendChild(item);
      });
    }

    // Normal search
    const matches = flatList.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.house.toLowerCase().includes(q) ||
        String(p.serial).includes(q)
    );

    render(applyFilters(matches));
  });

  // On filter change
  [genderFilter, ageFilter, houseFilter, sortFilter].forEach((f) => {
    f.addEventListener("change", () => {
      render(applyFilters(flatList));
    });
  });

  // Hide suggestions when clicking outside
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-wrapper")) {
      suggestionsDiv.style.display = "none";
    }
  });
});
