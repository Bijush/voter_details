// ===============================
// 🐞 DEBUG PANEL LOGIC
// ===============================
console.log("🐞 debug.js loaded");

window.toggleDebugPanel = function () {
  const panel = document.getElementById("debugPanel");
  if (!panel) return;

  panel.style.display =
    panel.style.display === "none" || !panel.style.display
      ? "block"
      : "none";
};

window.updateDebugPanel = function () {
  const realEl  = document.getElementById("dbgReal");
  const fakeEl  = document.getElementById("dbgFake");
  const totalEl = document.getElementById("dbgTotal");
  const dupEl   = document.getElementById("dbgDup");
  const musEl   = document.getElementById("dbgMuslim");

  if (!realEl) return;

  let real = 0;
  let fake = 0;

  Object.values(window.voterData || {}).forEach(house => {
    Object.keys(house || {}).forEach(key => {
      if (key.startsWith("offline_")) fake++;
      else real++;
    });
  });

  realEl.textContent  = real;
  fakeEl.textContent  = fake;
  totalEl.textContent = window.allPeople?.length || 0;

  dupEl.textContent =
    window.allPeople?.filter(p => p.duplicateSerial).length || 0;

  musEl.textContent =
    window.allPeople?.filter(p => p.caste === "Muslim").length || 0;
};