// Load JSON and flatten grouped structure
async function loadVoters() {
    try {
        const response = await fetch("master.json");
        const data = await response.json();

        let voters = [];

        // Loop through each house group
        for (const house_key in data) {
            if (Array.isArray(data[house_key])) {
                const houseNumber = house_key.replace("house_", "");
                
                data[house_key].forEach(person => {
                    voters.push({
                        serial: person.serial || null,
                        name: person.name || "",
                        house: houseNumber,
                        father: person.father || null,
                        husband: person.husband || null,
                        mother: person.mother || null,
                        age: person.age || "",
                        gender: person.gender || "",
                        epic: person.byp || ""
                    });
                });
            }
        }

        return voters;

    } catch (error) {
        console.error("Error loading JSON:", error);
        return [];
    }
}


// Search function
async function searchVoter() {
    const query = document.getElementById("searchInput").value.trim().toLowerCase();
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "Searching...";

    const voters = await loadVoters();

    if (!query) {
        resultsDiv.innerHTML = "<p>Please enter name, EPIC, or house number.</p>";
        return;
    }

    const results = voters.filter(voter =>
        (voter.name && voter.name.toLowerCase().includes(query)) ||
        (voter.epic && voter.epic.toLowerCase() === query) ||
        (voter.house && voter.house.toLowerCase() === query)
    );

    if (results.length === 0) {
        resultsDiv.innerHTML = "<p>No matching voter found.</p>";
        return;
    }

    let html = "";

    results.forEach(voter => {
        html += `
        <div class="card">
            <h3>${voter.name}</h3>
            <p><strong>House:</strong> ${voter.house}</p>
            <p><strong>Serial:</strong> ${voter.serial}</p>
            ${voter.father ? `<p><strong>Father:</strong> ${voter.father}</p>` : ""}
            ${voter.husband ? `<p><strong>Husband:</strong> ${voter.husband}</p>` : ""}
            ${voter.mother ? `<p><strong>Mother:</strong> ${voter.mother}</p>` : ""}
            <p><strong>Age:</strong> ${voter.age}</p>
            <p><strong>Gender:</strong> ${voter.gender}</p>
            <p><strong>EPIC:</strong> ${voter.epic}</p>
        </div>
        `;
    });

    resultsDiv.innerHTML = html;
}