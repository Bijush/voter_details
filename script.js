document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("search");
  const resultsDiv = document.getElementById("results");
  const suggestionsDiv = document.getElementById("suggestions");

  let voterData = {};
  let nameIndex = []; // auto-suggestion এর জন্য নামের ইনডেক্স

  // master.json লোড
  fetch("master.json")
    .then((res) => res.json())
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
    })
    .catch((err) => {
      console.error("Error loading JSON:", err);
      resultsDiv.innerHTML =
        "<p style='color:red;'>Failed to load voter data.</p>";
    });

  // রেজাল্ট দেখানোর কমন ফাংশন
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

  // বাড়ী নম্বর দিয়ে পুরো গ্রুপ দেখানোর ফাংশন
  function renderHouseGroup(houseNumber) {
    const prefix = "house_" + houseNumber.toString();
    const matchingHouseKeys = Object.keys(voterData).filter((key) =>
      key.toLowerCase().startsWith(prefix.toLowerCase())
    );

    if (matchingHouseKeys.length === 0) {
      return false; // কোনো হাউস পাওয়া যায়নি
    }

    resultsDiv.innerHTML = "";
    const title = document.createElement("div");
    title.className = "house-header";
    title.textContent = `House No: ${houseNumber} - Full Group`;
    resultsDiv.appendChild(title);

    matchingHouseKeys.forEach((houseKey) => {
      const suffix = houseKey.slice(6); // "house_" বাদ
      const label = document.createElement("div");
      label.className = "group-label";
      const niceLabel = suffix
        ? `Sub-group: ${houseNumber}${suffix.replace(/^_/, "").toUpperCase()}`
        : `Main group: ${houseNumber}`;
      label.textContent = niceLabel;
      resultsDiv.appendChild(label);

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

    return true;
  }

  // ইনপুটে change হ্যান্ডলার
  searchInput.addEventListener("input", () => {
    const raw = searchInput.value.trim();
    const query = raw.toLowerCase();

    resultsDiv.innerHTML = "";
    suggestionsDiv.innerHTML = "";
    suggestionsDiv.style.display = "none";

    if (!query) return;

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
    const onlyDigits = raw.replace(/\s+/g, "");
    if (/^\d+$/.test(onlyDigits)) {
      const done = renderHouseGroup(parseInt(onlyDigits, 10));
      if (done) return; // হাউস গ্রুপ দেখানো হয়ে গেছে, আর কিছু করার দরকার নেই
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
