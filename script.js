document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("search");
    const resultsDiv = document.getElementById("results");

    let voterData = {};

    // Load master.json
    fetch("data/master.json")
        .then((res) => res.json())
        .then((data) => {
            voterData = data;
            console.log("JSON Loaded Successfully!");
        })
        .catch((err) => {
            console.error("Error loading JSON:", err);
            resultsDiv.innerHTML = "<p style='color:red;'>Failed to load voter data.</p>";
        });

    // Search Function
    searchInput.addEventListener("input", () => {
        const query = searchInput.value.trim().toLowerCase();
        resultsDiv.innerHTML = "";

        if (!query) return;

        let matches = [];

        Object.keys(voterData).forEach((houseKey) => {
            voterData[houseKey].forEach((person) => {
                if (
                    person.name.toLowerCase().includes(query) ||
                    (person.father && person.father.toLowerCase().includes(query)) ||
                    (person.husband && person.husband.toLowerCase().includes(query)) ||
                    houseKey.toLowerCase().includes(query) ||
                    String(person.serial).includes(query)
                ) {
                    matches.push({
                        house: houseKey,
                        ...person
                    });
                }
            });
        });

        if (matches.length === 0) {
            resultsDiv.innerHTML = "<p>No results found.</p>";
            return;
        }

        // Show results
        matches.forEach((m) => {
            const card = document.createElement("div");
            card.className = "card";

            card.innerHTML = `
                <h3>${m.name}</h3>
                <p><strong>House:</strong> ${m.house}</p>
                <p><strong>Serial:</strong> ${m.serial}</p>
                <p><strong>Age:</strong> ${m.age}</p>
                <p><strong>Gender:</strong> ${m.gender}</p>
                <p><strong>Father:</strong> ${m.father ?? "—"}</p>
                <p><strong>Husband:</strong> ${m.husband ?? "—"}</p>
                <p><strong>BYP:</strong> ${m.byp}</p>
            `;
            resultsDiv.appendChild(card);
        });
    });
});
