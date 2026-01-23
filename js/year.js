// year.js
console.log("✅ year.js loaded");

// ===============================
// 🎂 CALCULATE AGE FROM BIRTH YEAR
// ===============================
export function calculateAgeFromYear(year) {
  if (!year) return "—";
  return new Date().getFullYear() - Number(year);
}

// ===============================
// 🔄 SYNC AGE WITH BIRTH YEAR (MEMORY ONLY)
// ===============================
export function syncAgeWithBirthYear(data) {
  let changed = false;

  Object.values(data).forEach(house => {
    Object.values(house).forEach(p => {
      if (!p.birthYear) return;

      const correctAge = calculateAgeFromYear(p.birthYear);

      if (p.age !== correctAge) {
        p.age = correctAge;
        changed = true;
      }
    });
  });

  if (changed) {
    console.log("✅ Age auto-synced from birthYear");
  }
}

// ===============================
// 🔁 ONE-TIME CONVERT OLD AGE (2025) → BIRTH YEAR
// ===============================
export function convertAgeToBirthYear_2025(data) {
  const BASE_YEAR = 2025;
  const convertedList = [];

  Object.entries(data).forEach(([house, voters]) => {
    Object.entries(voters).forEach(([key, p]) => {

      if (p.birthYear) return;
      if (!p.age) return;

      const birthYear = BASE_YEAR - Number(p.age);
      const newAge = calculateAgeFromYear(birthYear);

      convertedList.push({
        house,
        key,
        birthYear,
        age: newAge
      });

      // TEMP memory update only
      p.birthYear = birthYear;
      p.age = newAge;
    });
  });

  return convertedList;
}

// ===============================
// 🔥 COMMIT CONVERTED DATA TO FIREBASE
// ===============================
export async function commitConvertedBirthYear(list, fbUpdate) {
  for (const item of list) {
    const { house, key, birthYear, age } = item;

    await fbUpdate(`voters/${house}/${key}`, {
      birthYear,
      age
    });
  }
}