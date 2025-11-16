document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("search");
  const resultsDiv = document.getElementById("results");
  const suggestionsDiv = document.getElementById("suggestions");

  let voterData = {};
  let nameIndex = []; // auto-suggestion এর জন্য নামের ইনডেক্স

  // master.json লোড (data ফোল্ডার থেকে)
  const JSON_PATH = "data/master.json";

  fetch(JSON_PATH)
    .then((res) => {
      if (!res.ok) {
        throw new Error("HTTP " + res.status);
      }
      return res.json();
    })
    .then((data) => {
      voterData = data;
      console.log("JSON Loaded Successfully!");

      // নামের ইনডেক্স বানানো (suggestion এর জন্য)
      Object.keys(voterData).forEach((houseKey) => {
        voterData[houseKey].forEach((person) => {
          nameIndex.push({
            house: houseKey,
            searchName: (person.name || "").toLowerCase(),
            ...person,
          });
        });
      });

      // প্রথমে home page-এ পুরো voter list দেখাও
      renderAllVoters();
    })
    .catch((err) => {
      console.error("Error loading JSON:", err);
      resultsDiv.innerHTML =
        "<p style='color:red;'>Failed to load voter data.</p>";
    });

  // 🔹 প্রথমে পুরো voter list দেখানোর ফাংশন
  function renderAllVoters() {
    resultsDiv.innerHTML = "";

    const houseKeys = Object.keys(voterData).sort((a, b) =>
      a.localeCompare(b, "en", { numeric: true })
    );

    houseKeys.forEach((houseKey) => {
      const header = document.createElement("div");
      header.className = "house-header";
      header.textContent = houseKey.replace(/^house_/i, "House ");
      resultsDiv.appendChild(header);

      voterData[houseKey].forEach((person) => {
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
          <h3>${person.name} <span class="pill">Serial ${person.serial}</span></h3>
          <p><strong>Age:</strong> ${person.age ?? "—"}</p>
          <p><strong>Gender:</strong> ${person.gender ?? "—"}</p>
          <p><strong>Father:</strong> ${person.father ?? "—"}</p>
          <p><strong>Husband:</strong> ${person.husband ?? "—"}</p>
          <p><strong>BYP:</strong> ${person.byp ?? "—"}</p>
        `;
        resultsDiv.appendChild(card);
      });
    });
  }

  // রেজাল্ট দেখানোর কমন ফাংশন (search রেজাল্ট)
  function renderMatches(matches) {
    resultsDiv.innerHTML = "";

    if (!matches || matches.length === 0) {
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

  // ইনপুটে change হ্যান্ডলার
  searchInput.addEventListener("input", () => {
    const raw = searchInput.value.trim();
    const query = raw.toLowerCase();

    resultsDiv.innerHTML = "";
    suggestionsDiv.innerHTML = "";
    suggestionsDiv.style.display = "none";

    // যদি ইনপুট ফাঁকা হয় → আবার full voter list দেখাও
    if (!query) {
      if (Object.keys(voterData).length > 0) {
        renderAllVoters();
      }
      return;
    }

    // ১) আগে auto-suggestion বানাই (নামের জন্য)
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
          // suggestion ক্লিক করলে – ইনপুটে নাম বসিয়ে, suggestion hide করে, শুধু ওই voter show
          searchInput.value = s.name;
          suggestionsDiv.innerHTML = "";
          suggestionsDiv.style.display = "none";
          renderMatches([s]);
        });
        suggestionsDiv.appendChild(item);
      });
    }

    // ২) যদি শুধু বাড়ীর নম্বর লেখা হয় (যেমন "26"), তাহলে পুরো গ্রুপ দেখাই
    if (/^\d+$/.test(raw)) {
      const houseNum = "house_" + raw;

      // যেসব key এই house number দিয়ে শুরু
      const groupKeys = Object.keys(voterData).filter((key) =>
        key.toLowerCase().startsWith(houseNum.toLowerCase())
      );

      if (groupKeys.length > 0) {
        resultsDiv.innerHTML = `<h2>House No: ${raw} – Full Group</h2>`;

        groupKeys.forEach((hKey) => {
          const sub = hKey.replace(houseNum, "") || "";
          const groupName = sub ? `${raw}${sub.toUpperCase()}` : raw;

          const groupLabel = document.createElement("h3");
          groupLabel.textContent = `Group: ${groupName}`;
          resultsDiv.appendChild(groupLabel);

          voterData[hKey].forEach((p) => {
            const card = document.createElement("div");
            card.className = "card";
            card.innerHTML = `
              <h3>${p.name}</h3>
              <p><strong>Serial:</strong> ${p.serial}</p>
              <p><strong>Age:</strong> ${p.age ?? "—"}</p>
              <p><strong>Gender:</strong> ${p.gender ?? "—"}</p>
              <p><strong>Father:</strong> ${p.father ?? "—"}</p>
              <p><strong>Husband:</strong> ${p.husband ?? "—"}</p>
              <p><strong>BYP:</strong> ${p.byp ?? "—"}</p>
            `;
            resultsDiv.appendChild(card);
          });
        });

        return; // full group shown, no further search
      }
    }

    // ৩) general search (নাম, father, husband, serial, house key সব মিলিয়ে)
    let matches = [];

    Object.keys(voterData).forEach((houseKey) => {
      voterData[houseKey].forEach((person) => {
        const inName =
          person.name && person.name.toLowerCase().includes(query);
        const inFather =
          person.father && person.father.toLowerCase().includes(query);
        const inHusband =
          person.husband && person.husband.toLowerCase().includes(query);
        const inHouse = houseKey.toLowerCase().includes(query);
        const inSerial = String(person.serial).includes(query);

        if (inName || inFather || inHusband || inHouse || inSerial) {
          matches.push({
            house: houseKey,
            ...person,
          });
        }
      });
    });

    renderMatches(matches);
  });

  // ইনপুটের বাইরে ক্লিক করলে suggestion লুকিয়ে দাও
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-wrapper")) {
      suggestionsDiv.style.display = "none";
    }
  });
});
