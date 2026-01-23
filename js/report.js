// ===============================
// report.js
// Handles:
// - Survey report
// - Charts
// - Daily New Voter UI
// - Daily Shift Voter UI
// ===============================

console.log("✅ report.js loaded");

// ===============================
// 📊 SURVEY REPORT
// ===============================
window.calculateSurveyReport = function () {

  if (!window.allPeople) return;

  const totalHouses =
    new Set(window.allPeople.map(p => p.house)).size;

  const totalVoters = window.allPeople.length;

  const today = new Date().toLocaleDateString("en-GB");

  // ⭐ New voters
  const newStore =
    JSON.parse(localStorage.getItem("daily_new_voters") || "{}");
  const newCount = (newStore[today] || []).length;

  // ⭐ Shift voters
  const shiftStore =
    JSON.parse(localStorage.getItem("daily_shift_voters") || "{}");
  const shiftCount = (shiftStore[today] || []).length;

  document.getElementById("rptHouse").textContent = totalHouses;
  document.getElementById("rptVoters").textContent = totalVoters;
  document.getElementById("rptNew").textContent = newCount;
  document.getElementById("rptShift").textContent = shiftCount;
};

// ===============================
// 📈 CHARTS
// ===============================
let genderChart, ageChart, casteChart;

window.renderCharts = function () {

  if (!window.allPeople) return;

  const totalM =
    allPeople.filter(p => p.gender === "Male").length;
  const totalF =
    allPeople.filter(p => p.gender === "Female").length;

  const age18 = allPeople.filter(p => p.age >= 18 && p.age <= 25).length;
  const age26 = allPeople.filter(p => p.age >= 26 && p.age <= 40).length;
  const age41 = allPeople.filter(p => p.age >= 41 && p.age <= 60).length;
  const age60 = allPeople.filter(p => p.age > 60).length;

  const totalSC =
    allPeople.filter(p => p.caste === "SC").length;
  const totalOBC =
    allPeople.filter(p => p.caste === "OBC").length;
  const totalST =
    allPeople.filter(p => p.caste === "ST").length;
  const totalMuslim =
    allPeople.filter(p => p.caste === "Muslim").length;
  const totalGeneral =
    allPeople.filter(p => p.caste === "General").length;

  genderChart?.destroy();
  ageChart?.destroy();
  casteChart?.destroy();

  genderChart = new Chart(
    document.getElementById("genderChart"),
    {
      type: "pie",
      data: {
        labels: ["Male", "Female"],
        datasets: [{
          data: [totalM, totalF]
        }]
      }
    }
  );

  ageChart = new Chart(
    document.getElementById("ageChart"),
    {
      type: "bar",
      data: {
        labels: ["18–25", "26–40", "41–60", "60+"],
        datasets: [{
          label: "Voters",
          data: [age18, age26, age41, age60]
        }]
      },
      options: {
        scales: { y: { beginAtZero: true } }
      }
    }
  );

  casteChart = new Chart(
    document.getElementById("casteChart"),
    {
      type: "pie",
      data: {
        labels: ["SC", "OBC", "ST", "Muslim", "General"],
        datasets: [{
          data: [
            totalSC,
            totalOBC,
            totalST,
            totalMuslim,
            totalGeneral
          ]
        }]
      }
    }
  );
};

// ===============================
// 🆕 DAILY NEW VOTERS
// ===============================
window.renderDailyNewVoterNames = function () {

  const box = document.getElementById("dailyReportList");
  if (!box) return;

  const store =
    JSON.parse(localStorage.getItem("daily_new_voters") || "{}");

  box.innerHTML = "";

  Object.keys(store).forEach(date => {

    const header = document.createElement("li");
    header.textContent = `${date}:`;
    header.style.fontWeight = "700";
    header.style.marginTop = "12px";
    box.appendChild(header);

    store[date].forEach((v, index) => {

      const row = document.createElement("li");
      row.style.display = "flex";
      row.style.justifyContent = "space-between";
      row.style.padding = "8px 10px";
      row.style.background = "#f8fafc";
      row.style.borderRadius = "8px";
      row.style.marginTop = "6px";

      row.innerHTML = `
        <span>
          • <b>${v.name}</b>,
          House: <b>${v.house}</b>,
          Father: <b>${v.father}</b>
        </span>
      `;

      const actions = document.createElement("span");

      const edit = document.createElement("span");
      edit.textContent = "✏️";
      edit.style.cursor = "pointer";
      edit.onclick = () => editNewVoter(date, index);

      const del = document.createElement("span");
      del.textContent = "🗑️";
      del.style.cursor = "pointer";
      del.onclick = () => deleteNewVoter(date, index);

      actions.append(edit, del);
      row.appendChild(actions);

      box.appendChild(row);
    });
  });
};

window.saveNewVoter = function () {

  const name   = nvName.value.trim();
  const house  = nvHouse.value.trim();
  const father = nvFather.value.trim();

  if (!name || !house || !father) {
    alert("Fill Name, House & Father");
    return;
  }

  const today = new Date().toLocaleDateString("en-GB");

  const store =
    JSON.parse(localStorage.getItem("daily_new_voters") || "{}");

  if (!store[today]) store[today] = [];

  store[today].push({ name, house, father });

  localStorage.setItem(
    "daily_new_voters",
    JSON.stringify(store)
  );

  nvName.value = "";
  nvHouse.value = "";
  nvFather.value = "";

  document.getElementById("newVoterPopup").style.display = "none";

  renderDailyNewVoterNames();
  calculateSurveyReport();
};

window.editNewVoter = function (date, index) {

  const store =
    JSON.parse(localStorage.getItem("daily_new_voters") || "{}");

  const item = store[date][index];

  const name = prompt("Edit Name", item.name);
  if (!name) return;

  item.name = name.trim();

  localStorage.setItem(
    "daily_new_voters",
    JSON.stringify(store)
  );

  renderDailyNewVoterNames();
};

window.deleteNewVoter = function (date, index) {

  if (!confirm("Delete entry?")) return;

  const store =
    JSON.parse(localStorage.getItem("daily_new_voters") || "{}");

  store[date].splice(index, 1);
  if (!store[date].length) delete store[date];

  localStorage.setItem(
    "daily_new_voters",
    JSON.stringify(store)
  );

  renderDailyNewVoterNames();
  calculateSurveyReport();
};

// ===============================
// 🔁 DAILY SHIFT VOTERS
// ===============================
window.renderDailyShiftVoterList = function () {

  const box = document.getElementById("dailyShiftList");
  if (!box) return;

  const store =
    JSON.parse(localStorage.getItem("daily_shift_voters") || "{}");

  box.innerHTML = "";

  Object.keys(store).forEach(date => {

    const header = document.createElement("li");
    header.textContent = `${date}:`;
    header.style.fontWeight = "700";
    header.style.marginTop = "12px";
    box.appendChild(header);

    store[date].forEach((name, index) => {

      const row = document.createElement("li");
      row.style.display = "flex";
      row.style.justifyContent = "space-between";
      row.style.padding = "8px 10px";
      row.style.background = "#f8fafc";
      row.style.borderRadius = "8px";
      row.style.marginTop = "6px";

      row.innerHTML = `<span>• ${name}</span>`;

      const del = document.createElement("span");
      del.textContent = "🗑️";
      del.style.cursor = "pointer";
      del.onclick = () => deleteShiftVoter(date, index);

      row.appendChild(del);
      box.appendChild(row);
    });
  });
};

window.saveShiftVoter = function () {

  const name = svName.value.trim();
  if (!name) return alert("Enter name");

  const today = new Date().toLocaleDateString("en-GB");

  const store =
    JSON.parse(localStorage.getItem("daily_shift_voters") || "{}");

  if (!store[today]) store[today] = [];
  store[today].push(name);

  localStorage.setItem(
    "daily_shift_voters",
    JSON.stringify(store)
  );

  document.getElementById("shiftVoterPopup").style.display = "none";

  renderDailyShiftVoterList();
  calculateSurveyReport();
};

window.deleteShiftVoter = function (date, index) {

  const store =
    JSON.parse(localStorage.getItem("daily_shift_voters") || "{}");

  store[date].splice(index, 1);
  if (!store[date].length) delete store[date];

  localStorage.setItem(
    "daily_shift_voters",
    JSON.stringify(store)
  );

  renderDailyShiftVoterList();
  calculateSurveyReport();
};