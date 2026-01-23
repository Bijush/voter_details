// fss.js — FINAL SAFE VERSION
console.log("✅ fss.js loaded");

// ===============================
// 🔍 SEARCH
// ===============================
export function applySearch({ query, data, renderResults, setPage }) {

  if (!Array.isArray(data)) return;

  if (!query) {
    setPage?.();
    renderResults(data);
    return;
  }

  const q = query.toLowerCase();

  const list = data.filter(p =>
    p.name?.toLowerCase().includes(q) ||
    String(p.serial).includes(q) ||
    (p.byp || "").toLowerCase().includes(q) ||
    (p.caste || "").toLowerCase().includes(q) ||
    (p.note || "").toLowerCase().includes(q)
  );

  setPage?.();
  renderResults(list);
}

// ===============================
// 🎛️ FILTERS
// ===============================
export function applyFiltersCore({
  data,
  filters,
  renderResults,
  resetPage
}) {

  if (!Array.isArray(data)) return;

  let list = [...data];

  // AGE
  if (filters.age) {
    const [min, max] = filters.age.split("-").map(Number);
    list = list.filter(p => p.age >= min && p.age <= max);
  }

  // MOBILE
  if (filters.mobile === "has")
    list = list.filter(p => p.mobile && p.mobile.trim());

  if (filters.mobile === "none")
    list = list.filter(p => !p.mobile || !p.mobile.trim());

  // VERIFIED
  if (filters.verified === "yes")
    list = list.filter(p => p.verified === true);

  if (filters.verified === "no")
    list = list.filter(p => !p.verified);

  // HOUSE RANGE
  // HOUSE (SMART SEARCH + RANGE)
if (filters.house) {

  const input = filters.house.trim().toLowerCase();

  // 🔢 numeric / range search
  if (/^\d+(\s*(to|-)\s*\d+)?$/.test(input)) {

    const raw = input.replace(/\s+/g, "").replace(/to/g, "-");
    const parts = raw.split("-").map(Number);

    list = list.filter(p => {
      const n = Number(p.house.replace("house_", ""));
      if (parts.length === 1) return n === parts[0];
      if (parts.length === 2) return n >= parts[0] && n <= parts[1];
      return true;
    });

  } else {
    // 🔤 text search (house_12, House 12, etc.)
    list = list.filter(p =>
      p.house.toLowerCase().includes(input.replace(/\s+/g, ""))
    );
  }
}

  resetPage?.();
  renderResults(list);
}

// ===============================
// ↕️ SORT
// ===============================
export function applySort({
  mode,
  data,
  renderResults,
  setPage
}) {

  if (!Array.isArray(data)) return;

  const list = [...data];

  if (mode === "serial-asc")
    list.sort((a, b) => a.serial - b.serial);

  if (mode === "serial-desc")
    list.sort((a, b) => b.serial - a.serial);

  setPage?.();
  renderResults(list);
}