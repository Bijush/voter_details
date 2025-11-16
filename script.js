document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("search");
    const resultsDiv = document.getElementById("results");
    const suggestionsDiv = document.getElementById("suggestions");

    const genderFilter = document.getElementById("filterGender");
    const ageFilter = document.getElementById("filterAge");
    const houseFilter = document.getElementById("filterHouse");
    const sortFilter = document.getElementById("filterSort");

    let voterData = {};
    let flatList = []; // All voters in single array (for filters)
    let nameIndex = []; // For suggestions

    // ⬇️ Load master.json from data folder
    fetch("data/master.json")
        .then((res) => res.json())
        .then((data) => {
            voterData = data;
            console.log("JSON Loaded Successfully!");

            flatList = [];
            Object.keys(voterData).forEach((houseKey) => {
                voterData[houseKey].forEach((person) => {
                    flatList.push({ house: houseKey, ...person });

                    nameIndex.push({
                        searchName: (person.name || "").toLowerCase(),
                        house: houseKey,
                        ...person,
                    });
                });

                // Fill House Dropdown
                const option = document.createElement("option");
                option.value = houseKey;
                option.textContent = houseKey.replace("house_", "");
                houseFilter.appendChild(option);
            });
        })
        .catch((err) => {
            console.error("Error loading JSON:", err);
            resultsDiv.innerHTML =
                "<p style='color:red;'>Failed to load voter data.</p>";
        });

    // ⬇️ Helper for printing cards
    function render(matches) {
        resultsDiv.innerHTML = "";

        if (!matches || matches.length === 0) {
            resultsDiv.innerHTML = "<p>No results found.</p>";
            return;
        }

        matches.forEach((p) => {
            const card = document.createElement("div");
            card.className = "card";

            card.innerHTML = `
                <h3>${p.name} <span class="pill">Serial ${p.serial}</span></h3>
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

    // ⬇️ House Group (Full Group View)
    function showHouseGroup(houseNumber) {
        const prefix = "house_" + houseNumber;

        const groups = Object.keys(voterData).filter((key) =>
            key.toLowerCase().startsWith(prefix.toLowerCase())
        );

        if (groups.length === 0) return false;

        resultsDiv.innerHTML = `<h2>House No: ${houseNumber} – Full Group</h2>`;

        groups.forEach((hKey) => {
            const sub = hKey.replace(prefix, "") || "";
            const groupName = sub ? `${houseNumber}${sub.toUpperCase()}` : houseNumber;

            resultsDiv.innerHTML += `<h3>Group: ${groupName}</h3>`;

            voterData[hKey].forEach((p) => {
                const block = document.createElement("div");
                block.className = "card";
                block.innerHTML = `
                    <h3>${p.name}</h3>
                    <p><strong>Serial:</strong> ${p.serial}</p>
                    <p><strong>Age:</strong> ${p.age}</p>
                    <p><strong>Gender:</strong> ${p.gender}</p>
                    <p><strong>Father:</strong> ${p.father ?? "—"}</p>
                    <p><strong>Husband:</strong> ${p.husband ?? "—"}</p>
                    <p><strong>BYP:</strong> ${p.byp}</p>
                `;
                resultsDiv.appendChild(block);
            });
        });

        return true;
    }

    // ⬇️ Apply Filters
    function applyFilters(list) {
        let filtered = [...list];

        // Gender filter
        if (genderFilter.value) {
            filtered = filtered.filter((p) => p.gender === genderFilter.value);
        }

        // Age filter
        if (ageFilter.value) {
            let [min, max] = ageFilter.value.split("-").map(Number);
            filtered = filtered.filter((p) => Number(p.age) >= min && Number(p.age) <= max);
        }

        // House filter
        if (houseFilter.value) {
            filtered = filtered.filter((p) => p.house === houseFilter.value);
        }

        // Sort filter
        if (sortFilter.value === "name") {
            filtered.sort((a, b) => a.name.localeCompare(b.name));
        }
        if (sortFilter.value === "serial") {
            filtered.sort((a, b) => a.serial - b.serial);
        }
        if (sortFilter.value === "age") {
            filtered.sort((a, b) => (a.age || 0) - (b.age || 0));
        }

        return filtered;
    }

    // Re-Filter when any filter changed
    [genderFilter, ageFilter, houseFilter, sortFilter].forEach((el) => {
        el.addEventListener("change", () => {
            let result = applyFilters(flatList);
            render(result);
        });
    });

    // ⬇️ Search Input
    searchInput.addEventListener("input", () => {
        const text = searchInput.value.trim();
        const q = text.toLowerCase();

        resultsDiv.innerHTML = "";
        suggestionsDiv.innerHTML = "";
        suggestionsDiv.style.display = "none";

        if (!q) return;

        // Only numbers → show house group
        if (/^\d+$/.test(text)) {
            if (showHouseGroup(text)) return;
        }

        // Auto Suggestion
        const suggestions = nameIndex
            .filter((n) => n.searchName.includes(q))
            .slice(0, 10);

        if (suggestions.length > 0) {
            suggestionsDiv.style.display = "block";
            suggestionsDiv.innerHTML = "";

            suggestions.forEach((s) => {
                const div = document.createElement("div");
                div.className = "suggestion-item";
                div.textContent = `${s.name} (${s.house}, Serial ${s.serial})`;

                div.addEventListener("click", () => {
                    searchInput.value = s.name;
                    suggestionsDiv.innerHTML = "";
                    suggestionsDiv.style.display = "none";
                    render([s]);
                });

                suggestionsDiv.appendChild(div);
            });
        }

        // Full Search
        let result = flatList.filter((p) =>
            p.name.toLowerCase().includes(q) ||
            p.house.toLowerCase().includes(q) ||
            String(p.serial).includes(q) ||
            (p.father || "").toLowerCase().includes(q) ||
            (p.husband || "").toLowerCase().includes(q)
        );

        result = applyFilters(result);
        render(result);
    });

    // Hide suggestions on outside click
    document.addEventListener("click", (e) => {
        if (!e.target.closest(".search-wrapper")) {
            suggestionsDiv.style.display = "none";
        }
    });
});
