// ===============================
// am.js
// Address + Move History Module (FINAL)
// ===============================

console.log("✅ address_move_voter loaded");

import { fbUpdate, fbRemove } from "./firebase.js";
import { showSpinner, updateSpinner } from "./spinner.js";

const ADDRESS_PROGRESS_KEY = "bulk_address_progress";

// ===============================

function nowIST() {
  return new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour12: true
  });
}

// ===============================
// 🏠 BULK ADDRESS UPDATE (ALL)
// ===============================
window.bulkUpdateAddressForAllVoters = async function () {

  if (!window.voterData || !Object.keys(window.voterData).length) {
    alert("❌ Data not ready");
    return;
  }

  const ADDRESS_PAYLOAD = {
    village: "Chibita Bichia- V",
    po: "Chibita Bichia",
    pin: "788150",
    dist: "Cachar",
    part: "Chibita Bichia-5"
  };

  const flat = [];
  Object.entries(window.voterData).forEach(([house, voters]) => {
    Object.entries(voters || {}).forEach(([key, p]) => {
      flat.push({ house, key, p });
    });
  });

  let cursor = Number(localStorage.getItem(ADDRESS_PROGRESS_KEY)) || 0;
  if (cursor >= flat.length) {
    alert("✅ All voters already updated");
    return;
  }

  if (!confirm(`Resume address update from ${cursor + 1} / ${flat.length}?`)) {
    return;
  }

  showSpinner(true);
  const start = Date.now();

  for (let i = cursor; i < flat.length; i++) {
    const { house, key } = flat[i];

    await fbUpdate(`voters/${house}/${key}`, {
      address: ADDRESS_PAYLOAD,
      addressUpdated: true,
      updatedAt: nowIST()
    });

    // 🔥 UPDATE LOCAL DATA
    if (window.voterData?.[house]?.[key]) {
      window.voterData[house][key].address = ADDRESS_PAYLOAD;
      window.voterData[house][key].addressUpdated = true;
      window.voterData[house][key].updatedAt = nowIST();
    }

    localStorage.setItem(ADDRESS_PROGRESS_KEY, i + 1);
    updateSpinner(i + 1, flat.length, start);
  }

  showSpinner(false);
  localStorage.removeItem(ADDRESS_PROGRESS_KEY);

  // 💾 UPDATE CACHE + UI
  localStorage.setItem(
    "voters_cache",
    JSON.stringify(window.voterData)
  );
  window.processData?.();

  alert("🎉 Address update completed!");
};

// ===============================
// 🏠 FIX ADDRESS (SELECTED)
// ===============================
window.confirmFixSelectedAddress = function () {

  if (!window.selectedVoters || selectedVoters.size === 0) {
    alert("❌ No voters selected");
    return;
  }

  // ✅ popup open
  document.getElementById("fixAddressPopup").style.display = "flex";
};
window.applyFixSelectedAddress = async function (e) {

  if (e?.preventDefault) e.preventDefault();

  const addrVillage = document.getElementById("addrVillage");
  const addrPO      = document.getElementById("addrPO");
  const addrPIN     = document.getElementById("addrPIN");
  const addrDist    = document.getElementById("addrDist");
  const addrPart    = document.getElementById("addrPart");

  const village = addrVillage.value.trim();
  const po      = addrPO.value.trim();
  const pin     = addrPIN.value.trim();
  const dist    = addrDist.value.trim();
  const part    = addrPart.value.trim();

  if (!village || !po || !pin || !dist || !part) {
    alert("❌ All address fields required");
    return;
  }

  if (!selectedVoters.size) {
    alert("❌ No voters selected");
    return;
  }

  if (!confirm(`Update address for ${selectedVoters.size} voters?`)) return;

  // ✅ SPINNER START
  showSpinner(true);
  const start = Date.now();
  let done = 0;
  const total = selectedVoters.size;

  const payload = {
    address: { village, po, pin, dist, part },
    addressUpdated: true,
    updatedAt: new Date().toLocaleString("en-IN")
  };

  try {
    for (const [, v] of selectedVoters.entries()) {
      await fbUpdate(`voters/${v.house}/${v.key}`, payload);
      done++;
      updateSpinner(done, total, start);
    }

    selectedVoters.clear();
    document.querySelectorAll(".voter-select").forEach(cb => cb.checked = false);
    document.getElementById("fixAddressPopup").style.display = "none";

    alert("✅ Selected voters updated");
    window.processData?.();

  } catch (err) {
    console.error(err);
    alert("❌ Address update failed");

  } finally {
    // ✅ SPINNER END
    showSpinner(false);
  }
};

// ===============================
// 🔁 MOVE VOTER WITH HISTORY
// ===============================
async function moveVoterWithHistory(v, newHouseNumber) {

  const oldHouse = v.house;
  const key = v.key;

  // ✅ GET FULL VOTER DATA
  const voter = window.voterData?.[oldHouse]?.[key];
  if (!voter) {
    console.warn("❌ Voter data missing:", oldHouse, key);
    return;
  }

  const history = voter.shiftHistory || [];
  history.push({
    from: oldHouse,
    to: `house_${newHouseNumber}`,
    time: nowIST()
  });

  // ✅ MOVE WITH FULL DATA
  await fbUpdate(`voters/house_${newHouseNumber}/${key}`, {
    ...voter,
    house: `house_${newHouseNumber}`,
    shiftHistory: history,
    updatedAt: nowIST()
  });

  await fbRemove(`voters/${oldHouse}/${key}`);
}

// ===============================
// 🔀 BULK MOVE BUTTON
// ===============================
document.addEventListener("DOMContentLoaded", () => {

  const bulkBtn = document.getElementById("bulkMoveBtnFloating");
  if (!bulkBtn) return;

  bulkBtn.addEventListener("click", async () => {

    if (!window.selectedVoters || selectedVoters.size === 0) {
      alert("⚠️ No voters selected");
      return;
    }

    const voters = [...selectedVoters.values()];
    const presentHouse = voters[0].house?.replace("house_", "") || "";

    const newHouse = prompt(
      `Move ${voters.length} voters to which house number?`,
      presentHouse
    );
    if (!newHouse) return;

    if (!confirm(`Confirm move to house ${newHouse}?`)) return;

    showSpinner(true);
    const start = Date.now();
    let done = 0;

    for (const v of voters) {
      await moveVoterWithHistory(v, newHouse);
      done++;
      updateSpinner(done, voters.length, start);
    }

    showSpinner(false);
    selectedVoters.clear();
    document.querySelectorAll(".voter-select").forEach(cb => cb.checked = false);

    alert("✅ Bulk move completed");
  });
});

// ===============================
// 📜 MOVE HISTORY POPUP
// ===============================
window.openMoveHistory = function (voter) {

  const box = document.getElementById("moveHistoryList");
  box.innerHTML = "";

  if (!voter.shiftHistory || !voter.shiftHistory.length) {
    box.innerHTML = "<p>No move history found.</p>";
  } else {
    voter.shiftHistory.forEach((h, i) => {
      const div = document.createElement("div");
      div.style.padding = "8px";
      div.style.marginBottom = "8px";
      div.style.border = "1px solid #e5e7eb";
      div.style.borderRadius = "8px";
      div.style.background = "#f8fafc";

      div.innerHTML = `
        <b>#${i + 1}</b><br>
        🏠 ${h.from.replace("house_", "")}
        ➡️ ${h.to.replace("house_", "")}<br>
        🕒 <small>${h.time}</small>
      `;
      box.appendChild(div);
    });
  }

  document.getElementById("moveHistoryPopup").style.display = "flex";
};

window.closeMoveHistory = function () {
  document.getElementById("moveHistoryPopup").style.display = "none";
};