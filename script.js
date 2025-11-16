document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("search");
    const resultsDiv = document.getElementById("results");
    const suggestionsDiv = document.getElementById("suggestions");

    const genderFilter = document.getElementById("genderFilter");
    const ageFilter = document.getElementById("ageFilter");
    const houseFilter = document.getElementById("houseFilter");
    const sortFilter = document.getElementById("sortFilter");

    let voterData = {};
    let flatList = [];
    let nameIndex = [];

    // master.json loads from: data/master.json
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

                // populate house dropdown
                const option = document.createElement("option");
                option.value = houseKey;
                option.textContent = houseKey.replace("house_", "");
                houseFilter.appendChild(option);
            });

            // ⭐ Show all voters on page load
            render(flatList);
        })
        .catch((err) => {
            console.error("Error loading JSON:", err);
            resultsDiv.innerHTML =
                "<p style='color:red;'>Failed to load voter data.</p>";
        });

    // ------------------ RENDER FUNCTION ------------------
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

    // ------------------ APPLY FILTERS ------------------
    function applyFilters(baseList) {
        let filtered = [...baseList];

        // GENDER filter
        if (genderFilter.value !== "all") {
            filtered = filtered.filter((p) => p.gender === genderFilter.value);
        }

        // AGE filter
        if (ageFilter.value !== "all") {
            let [min, max] = ageFilter.value.split("-").map(Number);
            filtered = filtered.filter((p) => p.age >= min && p.age <= max);
        }

        // HOUSE filter
        if (houseFilter.value !== "all") {
            filtered = filtered.filter((p) => p.house === houseFilter.value);
        }

        // SORT
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

    // ------------------ SEARCH INPUT LOGIC ------------------
    searchInput.addEventListener("input", () => {
        const raw = searchInput.value.trim();
        const query = raw.toLowerCase();
        suggestionsDiv.innerHTML = "";
        suggestionsDiv.style.display = "none";

        if (!query) {
            render(applyFilters(flatList));
            return;
        }

        // --- Auto Suggestion ---
        const suggestList = nameIndex
            .filter((p) => p.searchName.includes(query))
            .slice(0, 10);

        if (suggestList.length > 0) {
            suggestionsDiv.style.display = "block";

            suggestList.forEach((s) => {
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

        // --- General Search ---
        let matches = flatList.filter((p) =>
            p.name.toLowerCase().includes(query) ||
            p.house.toLowerCase().includes(query) ||
            String(p.serial).includes(query)
        );

        render(applyFilters(matches));
    });

    // ------------------ FILTER CHANGE EVENT ------------------
    [genderFilter, ageFilter, houseFilter, sortFilter].forEach((f) => {
        f.addEventListener("change", () => {
            render(applyFilters(flatList));
        });
    });

    // Hide suggestion on outside click
    document.addEventListener("click", (e) => {
        if (!e.target.closest(".search-wrapper")) {
            suggestionsDiv.style.display = "none";
        }
    });
});
