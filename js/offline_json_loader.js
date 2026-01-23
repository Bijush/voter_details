console.log("📦 offline_json_loader loaded");

// ===============================
// 🔐 CONFIG
// ===============================
const LS_KEY  = "offline_voters_ps90";
const IDB_DB  = "voterDB";
const IDB_VER = 1;
const IDB_STORE = "voters";
const IDB_KEY = "ps90";

// ===============================
// 🧱 INDEXEDDB HELPERS
// ===============================
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_DB, IDB_VER);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key, value) {
  try {
    const db = await openDB();
    const tx = db.transaction(IDB_STORE, "readwrite");
    tx.objectStore(IDB_STORE).put(value, key);
    return new Promise(r => (tx.oncomplete = r));
  } catch {
    return false;
  }
}

async function idbGet(key) {
  try {
    const db = await openDB();
    const tx = db.transaction(IDB_STORE, "readonly");
    return new Promise(r => {
      const req = tx.objectStore(IDB_STORE).get(key);
      req.onsuccess = () => r(req.result);
      req.onerror = () => r(null);
    });
  } catch {
    return null;
  }
}

// ===============================
// 🔄 NORMALIZE VOTERS
// ===============================
function normalizeVoters(voters) {
  const fixed = {};
  Object.entries(voters || {}).forEach(([house, data]) => {
    if (!data) return;
    fixed[house] = {};
    if (Array.isArray(data)) {
      data.forEach((p, i) => {
        if (!p || typeof p !== "object") return;
        fixed[house]["offline_" + i] = { ...p, house };
      });
    } else {
      Object.entries(data).forEach(([key, p]) => {
        if (!p || typeof p !== "object") return;
        fixed[house][key] = { ...p, house };
      });
    }
  });
  return fixed;
}

// ===============================
// 🔧 APPLY DATA
// ===============================
function applyOfflineData(json) {
  let voterRoot = null;

  if (json.voters && Object.keys(json.voters).length) {
    voterRoot = json.voters;
  } else if (Object.keys(json).some(k => k.startsWith("house_"))) {
    voterRoot = json;
  }

  if (!voterRoot) {
    console.warn("❌ No voter data found");
    return;
  }

  const voters = normalizeVoters(voterRoot);

  window.voterData = voters;
  window.OFFLINE_JSON_LOADED = true;
  window.IS_DATA_LOADING = false;

  console.log(
    "✅ Offline JSON applied | Houses:",
    Object.keys(voters).length
  );

  waitForRender();
}

// ===============================
// ⏳ WAIT & RENDER
// ===============================
function waitForRender() {
  if (!window.currentPage) window.currentPage = 1;

  if (
    typeof window.processData === "function" &&
    document.getElementById("results")
  ) {
    console.log("🚀 Rendering offline voters");
    window.processData();
    return;
  }
  setTimeout(waitForRender, 100);
}

// ===============================
// 🌐 ONLINE: FETCH & CACHE (IDB + LS)
// ===============================
async function onlineLoad() {
  try {
    const res = await fetch("./ps90.json", { cache: "no-store" });
    if (!res.ok) throw new Error("ps90.json missing");

    const json = await res.json();

    // save both
    await idbSet(IDB_KEY, json);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(json));
    } catch {}

    console.log("💾 Cached to IndexedDB + localStorage");
    applyOfflineData(json);
  } catch (e) {
    console.warn("❌ Online load failed:", e.message);
  }
}

// ===============================
// 📴 OFFLINE: IDB → LS FALLBACK
// ===============================
async function offlineLoad() {
  // 1️⃣ Try IndexedDB
  const idbData = await idbGet(IDB_KEY);
  if (idbData) {
    console.log("📴 Offline → loaded from IndexedDB");
    applyOfflineData(idbData);
    return;
  }

  // 2️⃣ Fallback localStorage
  const cached = localStorage.getItem(LS_KEY);
  if (cached) {
    console.log("📴 Offline → loaded from localStorage");
    applyOfflineData(JSON.parse(cached));
    return;
  }

  console.warn("❌ No offline cache found");
}

// ===============================
// 🔥 ENTRY POINT
// ===============================
if (navigator.onLine) {
  console.log("🌐 Online mode → fetch & cache");
  onlineLoad();
} else {
  console.log("📴 Offline mode → IDB → localStorage fallback");
  offlineLoad();
}

// ===============================
// 🧹 CLEAR OFFLINE CACHE (IDB + LS)
// ===============================
window.clearOfflineCache = function () {

  const ok = confirm(
    "⚠️ Clear Offline Cache?\n\n" +
    "IndexedDB + localStorage data will be deleted.\n" +
    "App will reload fresh."
  );

  if (!ok) return;

  // 🔴 Clear localStorage
  try {
    localStorage.removeItem("offline_voters_ps90");
    console.log("🧹 localStorage cache cleared");
  } catch (e) {}

  // 🔴 Clear IndexedDB
  try {
    const req = indexedDB.deleteDatabase("voterDB");

    req.onsuccess = () => {
      console.log("🧹 IndexedDB cleared");
    };

    req.onerror = () => {
      console.warn("❌ IndexedDB clear failed");
    };

    req.onblocked = () => {
      alert("⚠️ Please close other tabs using this app");
    };
  } catch (e) {
    console.warn("❌ IndexedDB not supported");
  }

  alert("✅ Offline cache cleared.\n\nReloading app...");
  location.reload();
};

// ===============================
// 🔁 AUTO RE-SYNC WHEN ONLINE
// ===============================
window.addEventListener("online", () => {
  console.log("🌐 Back online → re-syncing offline data");
  onlineLoad();
});