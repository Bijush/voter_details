let voters = [];

// Load JSON file
fetch("master.json")
    .then(res => res.json())
    .then(data => voters = data)
    .catch(err => console.log("Error loading JSON", err));

function searchVoter() {
    let query = document.getElementById("searchBox").value.trim().toLowerCase();
    let resultsDiv = document.getElementById("results");

    if (query.length === 0) {
        resultsDiv.innerHTML = "";
        return;
    }

    let results = voters.filter(v =>
        v.name.toLowerCase().includes(query) ||
        v.house.toLowerCase().includes(query)
    );

    if (results.length === 0) {
        resultsDiv.innerHTML = "<p>No results found</p>";
        return;
    }

    resultsDiv.innerHTML = results
        .map(v => `
            <div class="result ${v.type === 'house' ? 'house' : ''}">
                <b>${v.serial}. ${v.name}</b><br>
                House: ${v.house}<br>
                ${v.relation_type}: ${v.relation_name}<br>
                Age: ${v.age}, Gender: ${v.gender}<br>
                EPIC: ${v.epic}
            </div>
        `).join("");
}