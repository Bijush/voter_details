let jsonData = {};

fetch("master.json")
    .then(res => res.json())
    .then(data => {
        jsonData = data;
        console.log("JSON Loaded");
    });

function searchVoter() {
    let q = document.getElementById("searchBox").value.trim();

    let resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "";

    if (q === "") return;

    q = q.toLowerCase();

    // NAME SEARCH
    for (let house in jsonData) {
        jsonData[house].forEach(voter => {
            if (voter.name.toLowerCase().includes(q)) {
                resultsDiv.innerHTML += renderResult(voter, house);
            }
        });
    }

    // HOUSE NUMBER SEARCH (supports 24, 24K, 24KH, 3KH etc)
    let houseSearch = "house_" + q;

    for (let house in jsonData) {
        if (house.toLowerCase().startsWith(houseSearch)) {
            resultsDiv.innerHTML += `<div class="result house"><b>House: ${house.replace("house_", "")}</b></div>`;
            jsonData[house].forEach(voter => {
                resultsDiv.innerHTML += renderResult(voter, house);
            });
        }
    }
}

function renderResult(v, house) {
    return `
        <div class="result">
            <b>${v.serial}. ${v.name}</b><br>
            Father: ${v.father ?? "-"}<br>
            Husband: ${v.husband ?? "-"}<br>
            Age: ${v.age ?? "-"}<br>
            Gender: ${v.gender}<br>
            BYP: ${v.byp}<br>
            <small>House: ${house.replace("house_","")}</small>
        </div>
    `;
}