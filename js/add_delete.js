// ===============================
// 🔥 ADD / EDIT / DELETE VOTER
// ===============================

import {
  fbPush,
  fbUpdate,
  fbRemove,
  fbGet
} from "./firebase.js";

/* ===============================
   🔑 GLOBAL EDIT CONTEXT
=============================== */
window.editHouse = null;
window.editKey = null;

/* ===============================
   🧮 HELPERS
=============================== */

function nowIST() {
  return new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour12: true
  });
}

function calculateAgeFromYear(year) {
  if (!year) return "";
  return new Date().getFullYear() - Number(year);
}

/* ===============================
   ➕ ADD NEW VOTER
=============================== */

window.saveAddVoter = async function () {

  const serial     = Number(avSerial.value);
  const houseNo    = avHouse.value.trim();
  const name       = avName.value.trim();
  const father     = avFather.value.trim();
  const husband    = avHusband.value.trim();
  const birthYear  = Number(avBirthYear.value);
  const gender     = avGender.value.trim();
  const byp        = avBYP.value.trim();
  const mobile     = avMobile.value.trim();

  if (!serial || !houseNo || !name || !birthYear) {
    alert("❌ Serial, House, Name & Birth Year required");
    return;
  }

  await fbPush(`voters/house_${houseNo}`, {
    serial,
    house: `house_${houseNo}`,
    name,
    father: father || "",
    husband: husband || "",
    birthYear,
    age: calculateAgeFromYear(birthYear),
    gender,
    byp,
    mobile,
    verified: false,
    addedAt: nowIST(),
    updatedAt: nowIST()
  });

  document.getElementById("addVoterPopup").style.display = "none";
  alert("✅ Voter added successfully");
};

/* ===============================
   ✏️ OPEN EDIT POPUP (CALLED FROM UI)
=============================== */

window.openEditVoter = function (house, key, voter) {

  editHouse = house;
  editKey = key;

  evSerial.value     = voter.serial || "";
  evHouse.value      = house.replace("house_", "");
  evName.value       = voter.name || "";
  evFather.value     = voter.father || "";
  evMother.value     = voter.mother || "";
  evHusband.value    = voter.husband || "";
  evBirthYear.value  = voter.birthYear || "";
  evGender.value     = voter.gender || "";
  evBYP.value        = voter.byp || "";
  evMobile.value     = voter.mobile || "";

  document.getElementById("editVoterPopup").style.display = "flex";
};

/* ===============================
   ✏️ SAVE EDITED VOTER
=============================== */

window.saveEditVoter = async function () {

  if (!editHouse || !editKey) {
    alert("❌ Edit context missing");
    return;
  }

  const serial     = Number(evSerial.value);
  const newHouseNo = evHouse.value.trim();
  const name       = evName.value.trim();
  const father     = evFather.value.trim();
  const mother     = evMother.value.trim();
  const husband    = evHusband.value.trim();
  const birthYear  = Number(evBirthYear.value);
  const gender     = evGender.value.trim();
  const byp        = evBYP.value.trim();
  const mobile     = evMobile.value.trim();

  if (!serial || !name || !birthYear || !newHouseNo) {
    alert("❌ Serial, Name, Birth Year & House required");
    return;
  }

  const payload = {
    serial,
    house: `house_${newHouseNo}`,
    name,
    father,
    mother,
    husband,
    birthYear,
    age: calculateAgeFromYear(birthYear),
    gender,
    byp,
    mobile,
    updatedAt: nowIST()
  };

  const oldPath = `voters/${editHouse}/${editKey}`;
  const newPath = `voters/house_${newHouseNo}/${editKey}`;

  // 🔁 House changed
  if (editHouse !== `house_${newHouseNo}`) {
    await fbRemove(oldPath);
    await fbUpdate(newPath, payload);
  } else {
    await fbUpdate(oldPath, payload);
  }

  document.getElementById("editVoterPopup").style.display = "none";
  alert("✅ Voter updated successfully");
};

/* ===============================
   🗑️ DELETE VOTER (SAFE)
=============================== */

window.deleteVoter = async function (house, key) {

  const code = prompt("Enter secret code:");
  if (code !== "bijush") {
    alert("❌ Wrong code");
    return;
  }

  if (!confirm("⚠️ Are you sure you want to delete this voter?")) return;

  const reasonInput = prompt(
    "Delete reason:\n1 = Shifted\n2 = Dead\n3 = Duplicate"
  );

  let deleteReason = "";
  if (reasonInput === "1") deleteReason = "Shifted";
  else if (reasonInput === "2") deleteReason = "Dead";
  else if (reasonInput === "3") deleteReason = "Duplicate";
  else {
    alert("❌ Invalid reason");
    return;
  }

  const path = `voters/${house}/${key}`;
  const snap = await fbGet(path);

  if (!snap.exists()) {
    alert("❌ Voter not found");
    return;
  }

  await fbPush("deleted_voters", {
    ...snap.val(),
    house,
    originalKey: key,
    deleteReason,
    deletedAt: nowIST()
  });

  await fbRemove(path);

  alert("🗑️ Voter deleted successfully");
};

/* ===============================
   ✔️ TOGGLE VERIFIED
=============================== */

window.toggleVerified = async function (house, key, currentStatus, birthYear) {

  await fbUpdate(`voters/${house}/${key}`, {
    verified: !currentStatus,
    age: calculateAgeFromYear(birthYear),
    updatedAt: nowIST()
  });
};

/* ===============================
   📝 NOTES
=============================== */

window.saveNote = async function (house, key, noteText) {
  await fbUpdate(`voters/${house}/${key}`, {
    note: noteText,
    updatedAt: nowIST()
  });
};

window.deleteNote = async function (house, key) {
  await fbUpdate(`voters/${house}/${key}`, {
    note: "",
    updatedAt: nowIST()
  });
};