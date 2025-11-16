document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("search");
  const resultsDiv = document.getElementById("results");
  const suggestionsDiv = document.getElementById("suggestions");

  let voterData = {};
  let nameIndex = [];

  // ---- master.json load ----
  fetch("master.json")
    .then((res) => res.json())
    .then((data) => {
      voterData = data;
      console.log("JSON Loaded Successfully!");

      // Name index for auto suggestion
      Object.keys(voterData).forEach((houseKey) => {
        voterData[houseKey].forEach((person) => {
          nameIndex.push({
            house: houseKey,
            searchName: (person.name || "").toLowerCase(),
            ...person,
          });
        });
      });

      // JSON লোড হয়ে গেলে → Home Page এ Full list দেখাও
      showFullList();
    })
    .catch((err) => {
      console.error("Error loading JSON:", err);
      resultsDiv.innerHTML =
        "<p style='color:red;'>Failed to load voter data.</p>";
    });

  // ---- Full Home Page List ----
  function showFullList() {
    resultsDiv.innerHTML = "<h2>All House – Full Voter List</h2>";

    Object.keys(voterData).forEach((houseKey) => {
      const houseTitle = document.createElement("h3");
      houseTitle.textContent = `🏠 ${houseKey}`;
      houseTitle.className = "group-title";
      resultsDiv.appendChild(houseTitle);

      voterData[houseKey].forEach((p) => {
        const card = document.createElement("div");
        card.className = "card";

        card.innerHTML = `
          <h3>${p.name} <span class="pill">Serial ${p.serial}</span></h3>
          <p><strong>Age:</strong> ${p.age ?? "—"}</p>
          <p><strong>Gender:</strong> ${p.gender ?? "—"}</p>
          <p><strong>Father:</strong> ${p.father ?? "—"}</p>
          <p><strong>Husband:</strong> ${p.husband ?? "—"}</p>
          <p><strong>BYP:</strong> ${p.byp ?? "—"}</p>
        `;

        resultsDiv.appendChild(card);
      });
    });
  }

  // ---- Normal Search + Auto Suggest ----
  searchInput.addEventListener("input", () => {
    const raw = searchInput.value.trim();
    const query = raw.toLowerCase();

    resultsDiv.innerHTML = "";
    suggestionsDiv.innerHTML = "";
    suggestionsDiv.style.display = "none";

    if (!query) {
      showFullList(); // search box empty → আবার full list দেখাও
      return;
    }

    // ------ Auto suggestion ------
    const suggestList = nameIndex
      .filter((p) => p.searchName.includes(query))
      .slice(0, 10);

    if (suggestList.length > 0) {
      suggestionsDiv.style.display = "block";
      suggestionsDiv.innerHTML = "";

      suggestList.forEach((s) => {
        const item = document.createElement("div");
        item.className = "suggestion-item";
        item.textContent = `${s.name} (${s.house}, Serial ${s.serial})`;

        item.addEventListener("click", () => {
          searchInput.value = s.name;
          suggestionsDiv.style.display = "none";
          renderMatches([s]);
        });

        suggestionsDiv.appendChild(item);
      });
    }

    // ---- House Number Only → Full Group ----
    if (/^\d+$/.test(raw)) {
      const houseNum = "house_" + raw;

      const groupKeys = Object.keys(voterData).filter((key) =>
        key.startsWith(houseNum)
      );

      if (groupKeys.length > 0) {
        resultsDiv.innerHTML = `<h2>House No: ${raw} – Full Group</h2>`;

        groupKeys.forEach((hKey) => {
          const groupName = hKey.replace("house_", "");
          resultsDiv.innerHTML += `<h3>Group: ${groupName}</h3>`;

          voterData[hKey].forEach((p) => {
            const card = document.createElement("div");
            card.className = "card";
            card.innerHTML = `
              <h3>${p.name}</h3>
              <p><strong>Serial:</strong> ${p.serial}</p>
              <p><strong>Age:</strong> ${p.age}</p>
              <p><strong>Gender:</strong> ${p.gender}</p>
              <p><strong>Father:</strong> ${p.father ?? "—"}</p>
              <p><strong>Husband:</strong> ${p.husband ?? "—"}</p>
              <p><strong>BYP:</strong> ${p.byp}</p>
            `;
            resultsDiv.appendChild(card);
          });
        });

        return;
      }
    }

    // ----- General Search -----
    let matches = [];
    Object.keys(voterData).forEach((houseKey) => {
      voterData[houseKey].forEach((person) => {
        if (
          (person.name && person.name.toLowerCase().includes(query)) ||
          (person.father && person.father.toLowerCase().includes(query)) ||
          (person.husband && person.husband.toLowerCase().includes(query)) ||
          houseKey.toLowerCase().includes(query) ||
          String(person.serial).includes(query)
        ) {
          matches.push({ house: houseKey, ...person });
        }
      });
    });

    renderMatches(matches);
  });

  // Show matched search result
  function renderMatches(matches) {
    resultsDiv.innerHTML = "";

    if (matches.length === 0) {
      resultsDiv.innerHTML = "<p>No results found.</p>";
      return;
    }

    matches.forEach((m) => {
      const card = document.createElement("div");
      card.className = "card";

      card.innerHTML = `
        <h3>${m.name}</h3>
        <p><strong>House:</strong> ${m.house}</p>
        <p><strong>Serial:</strong> ${m.serial}</p>
        <p><strong>Age:</strong> ${m.age ?? "—"}</p>
        <p><strong>Gender:</strong> ${m.gender ?? "—"}</p>
        <p><strong>Father:</strong> ${m.father ?? "—"}</p>
        <p><strong>Husband:</strong> ${m.husband ?? "—"}</p>
        <p><strong>BYP:</strong> ${m.byp ?? "—"}</p>
      `;
      resultsDiv.appendChild(card);
    });
  }

  // Click outside → hide suggestions
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-wrapper")) {
      suggestionsDiv.style.display = "none";
    }
  });
});
