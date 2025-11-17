document.addEventListener("DOMContentLoaded", () => {

    const page = location.pathname.split("/").pop();
    const psNumber = page.replace("ps", "").replace(".html", "");

    const JSON_PATH = `data/ps${psNumber}.json`;

    const searchInput = document.getElementById("search");
    const resultsDiv = document.getElementById("results");
    const suggestionsDiv = document.getElementById("suggestions");

    const filterGender = document.getElementById("filterGender");
    const filterAge = document.getElementById("filterAge");
    const filterHouse = document.getElementById("filterHouse");
    const filterSort = document.getElementById("filterSort");

    let voterData = [];
    let nameIndex = [];

    fetch(JSON_PATH)
        .then(res => res.json())
        .then(data => {
            voterData = data;
            nameIndex = data;

            loadHouseFilter();
            renderList(data);
        })
        .catch(() => {
            resultsDiv.innerHTML = "<p style='color:red'>Failed to load voter list.</p>";
        });

    function loadHouseFilter() {
        const unique = [...new Set(voterData.map(v => v.house))];
        unique.forEach(h => {
            let opt = document.createElement("option");
            opt.value = h;
            opt.textContent = h;
            filterHouse.appendChild(opt);
        });
    }

    function renderList(list) {
        resultsDiv.innerHTML = "";
        list.forEach(p => {
            const card = document.createElement("div");
            card.className = "card";
            card.innerHTML = `
                <h3>${p.name} <span class="pill">Serial ${p.serial}</span></h3>
                <p><b>House:</b> ${p.house}</p>
                <p><b>Gender:</b> ${p.gender}</p>
                <p><b>Age:</b> ${p.age}</p>
                <p><b>Father:</b> ${p.father ?? "-"}</p>
                <p><b>Husband:</b> ${p.husband ?? "-"}</p>
                <p><b>BYP:</b> ${p.byp}</p>
            `;
            resultsDiv.appendChild(card);
        });
    }

    function applyFilters() {
        let list = [...voterData];

        if (filterGender.value)
            list = list.filter(v => v.gender === filterGender.value);

        if (filterAge.value) {
            const [min,max] = filterAge.value.split("-").map(Number);
            list = list.filter(v => v.age >= min && v.age <= max);
        }

        if (filterHouse.value)
            list = list.filter(v => v.house === filterHouse.value);

        if (filterSort.value)
            list.sort((a,b) => (a[filterSort.value] > b[filterSort.value] ? 1 : -1));

        renderList(list);
    }

    searchInput.addEventListener("input", () => {
        const q = searchInput.value.toLowerCase();

        if (!q) return renderList(voterData);

        const match = voterData.filter(p =>
            p.name.toLowerCase().includes(q) ||
            String(p.serial).includes(q) ||
            p.house.toLowerCase().includes(q)
        );

        renderList(match);
    });

    filterGender.onchange =
    filterAge.onchange =
    filterHouse.onchange =
    filterSort.onchange = applyFilters;

});