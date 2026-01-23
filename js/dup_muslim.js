// ===============================
// dup_muslim.js (FINAL – NO AUTO MUSLIM SHOW)
// ===============================

console.log("✅ dup_muslim.js loaded");

// ===============================
// 🔧 HELPERS
// ===============================
export function expandHouseForCard(card) {
  const section = card.closest(".house-section");
  if (!section) return;

  const content = section.querySelector(".house-content");
  const arrow   = section.querySelector(".collapse-icon");

  if (content && content.style.maxHeight === "0px") {
    content.style.maxHeight = content.scrollHeight + "px";
    content.style.opacity = "1";
    arrow && arrow.classList.remove("rotate");
  }
}

function highlightCard(card, color = "#22c55e", time = 1200) {
  card.style.boxShadow = `0 0 0 4px ${color}`;
  setTimeout(() => (card.style.boxShadow = ""), time);
}

// ===============================
// 🔘 AUTO SHOW (ONLY DUPLICATE SERIAL)
// ===============================
function toggleDupButtonOnly() {
  const dupCards =
    document.querySelectorAll(".card[data-dupserial='yes']");
  const dupBtn = document.getElementById("dupJumpBtn");

  if (dupBtn) {
    dupBtn.style.display = dupCards.length ? "block" : "none";
  }
}

// ===============================
// ☪️ MUSLIM JUMP (NO AUTO SHOW)
// ===============================
let muslimIndex = 0;

function getMuslimCards() {
  return [...document.querySelectorAll(".card")]
    .filter(c => c.dataset.caste === "Muslim");
}

const muslimBtn   = document.getElementById("muslimJumpBtn");
const muslimFloat = document.getElementById("muslimFloatCounter");

if (muslimBtn) {
  muslimBtn.onclick = () => {
    const list = getMuslimCards();
    if (!list.length) return;

    if (muslimIndex >= list.length) muslimIndex = 0;

    const card = list[muslimIndex];
    expandHouseForCard(card);
    highlightCard(card, "#16a34a");

    card.scrollIntoView({ behavior: "smooth", block: "center" });

    if (muslimFloat) {
      muslimFloat.style.display = "block";
      muslimFloat.textContent =
        `☪️ ${muslimIndex + 1} / ${list.length}`;
    }

    muslimIndex++;
  };
}

if (muslimFloat) {
  muslimFloat.onclick = () => {
    const list = getMuslimCards();
    if (!list.length) return;

    const n = Number(prompt(`Enter Muslim number (1–${list.length})`));
    if (!n || n < 1 || n > list.length) return;

    muslimIndex = n - 1;
    const card = list[muslimIndex];

    expandHouseForCard(card);
    highlightCard(card, "#16a34a");
    card.scrollIntoView({ behavior: "smooth", block: "center" });

    muslimFloat.textContent = `☪️ ${n} / ${list.length}`;
    muslimIndex++;
  };
}

// ===============================
// ☪️❌ UNVERIFIED MUSLIM JUMP (NO AUTO SHOW)
// ===============================
let unverifiedMuslimIndex = 0;

const unverifiedBtn =
  document.getElementById("unverifiedMuslimJumpBtn");

function getUnverifiedMuslimCards() {
  return [...document.querySelectorAll(".card")]
    .filter(c =>
      c.dataset.caste === "Muslim" &&
      c.dataset.verified === "no"
    );
}

if (unverifiedBtn) {
  unverifiedBtn.onclick = () => {
    const list = getUnverifiedMuslimCards();
    if (!list.length) return;

    if (unverifiedMuslimIndex >= list.length)
      unverifiedMuslimIndex = 0;

    const card = list[unverifiedMuslimIndex];
    expandHouseForCard(card);
    highlightCard(card, "#f59e0b");

    card.scrollIntoView({ behavior: "smooth", block: "center" });
    unverifiedMuslimIndex++;
  };
}

// ===============================
// 🔁 DUPLICATE SERIAL JUMP (AUTO SHOW OK)
// ===============================
let dupSerialIndex = 0;

const dupBtn = document.getElementById("dupJumpBtn");
const dupCounter = document.getElementById("dupSerialCounter");

function getDuplicateSerialCards() {
  return [...document.querySelectorAll(".card")]
    .filter(c => c.dataset.dupserial === "yes");
}

if (dupBtn) {
  dupBtn.onclick = () => {
    const list = getDuplicateSerialCards();
    if (!list.length) return;

    if (dupSerialIndex >= list.length) dupSerialIndex = 0;

    const card = list[dupSerialIndex];
    expandHouseForCard(card);
    highlightCard(card, "#f97316");

    card.scrollIntoView({ behavior: "smooth", block: "center" });

    if (dupCounter) {
      dupCounter.style.display = "block";
      dupCounter.textContent =
        `${dupSerialIndex + 1} / ${list.length}`;
    }

    dupSerialIndex++;
  };
}

// ===============================
// 👀 CURRENT VISIBLE CARD HIGHLIGHT
// ===============================
let currentVisibleCard = null;

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      if (currentVisibleCard && currentVisibleCard !== entry.target) {
        currentVisibleCard.classList.remove("current-voter");
      }
      currentVisibleCard = entry.target;
      currentVisibleCard.classList.add("current-voter");
    }
  });
}, { threshold: 0.6 });

// ===============================
// 🔁 OBSERVE AFTER EVERY RENDER
// ===============================
window.observeCards = function () {
  document.querySelectorAll(".card").forEach(card => {
    observer.observe(card);
  });

  // ✅ ONLY duplicate serial auto toggle
  toggleDupButtonOnly();
};