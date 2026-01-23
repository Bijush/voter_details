// ✅ ALL IMPORTS MUST BE FIRST (NO CODE ABOVE THIS)
import {
  listenVoters,
  fbUpdate,
  fbPush,
  fbRemove,
  fbGet
} from "./firebase.js";

// 🔹 CORE UI + FEATURES
import "./ui.js";
import "./add_delete.js";
import "./pending-indicator.js";

// 🔹 FEATURE MODULES
import "./dup_muslim.js";
import "./breadcum_confetti.js";
import "./address_move_voter.js";
import "./pagination.js";
import "./report.js";
import "./sidebar.js";
import { showSpinner, updateSpinner } from "./spinner.js";
// 🔥 OFFLINE JSON (MUST BE INSIDE MAIN MODULE GRAPH)
import "./offline_json_loader.js";

// 📱 DEBUG LOGGER
function dlog(msg) {
  const box = document.getElementById("debugBox");
  if (box) box.textContent += "\n" + msg;
}

dlog("✅ main.js loaded (Offline JSON + Firebase mode)");

// ----------------------------
// 🌐 GLOBAL STATE
// ----------------------------
window.voterData = {};
window.deletedData = {};
window.pendingData = {};
window.recordsData = {};
window.voterListsData = {};
window.selectedVoters = new Map();

window.IS_DATA_LOADING = true;
let HAS_RENDERED_ONCE = false;   // 🔒 prevent double render
window.OFFLINE_JSON_LOADED = false;

// ----------------------------
// 📦 LOAD OFFLINE JSON (FIRST PRIORITY)
// ----------------------------




// ----------------------------
// 🔥 FIREBASE LIVE DATA LISTENER
// ----------------------------
dlog("🔗 Attaching Firebase listener...");


listenVoters((data) => {
  dlog("🔥 listenVoters fired");

  const freshData = data || {};

  // ✅ IF Firebase empty AND offline already loaded → DO NOTHING
  if (
    window.OFFLINE_JSON_LOADED &&
    Object.keys(freshData).length === 0
  ) {
    dlog("📴 Firebase empty → keeping offline JSON");
    return;
  }

  // ✅ Firebase has REAL data → override offline
  if (Object.keys(freshData).length > 0) {
    window.IS_DATA_LOADING = false; // ✅ ADD THIS LINE
    window.voterData = freshData;
    window.IS_DATA_LOADING = false;

    dlog("☁️ Firebase data applied");

    try {
      localStorage.setItem(
        "voters_cache",
        JSON.stringify(freshData)
      );
    } catch (e) {}

    if (typeof window.processData === "function") {
      window.processData();
    }
  }
});
// ----------------------------
// ⚡ FALLBACK: LOAD FROM CACHE (LAST OPTION)
// ----------------------------
// ===============================
// 🔁 MANUAL OFFLINE QUEUE SYNC
// ===============================
window.addEventListener("syncOfflineQueue", async () => {
  console.log("🔁 Manual sync fallback triggered");

  try {
    const req = indexedDB.open("voterDB", 2);

    req.onsuccess = async () => {
      const idb = req.result;

      if (!idb.objectStoreNames.contains("queue")) {
        console.warn("⚠️ No offline queue store found");
        return;
      }

      const tx = idb.transaction("queue", "readwrite");
      const store = tx.objectStore("queue");

      const getAllReq = store.getAll();

      getAllReq.onsuccess = async () => {
        const actions = getAllReq.result || [];

        if (!actions.length) {
          console.log("✅ No pending offline actions");
          return;
        }

        console.log("📦 Pending offline actions:", actions.length);

        for (const action of actions) {
          try {
            console.log("⏳ Syncing:", action.type, action.path);

            if (action.type === "update") {
              await import("./firebase.js").then(m =>
                m.fbUpdate(action.path, action.data)
              );
            }

            if (action.type === "push") {
              await import("./firebase.js").then(m =>
                m.fbPush(action.path, action.data)
              );
            }

            if (action.type === "remove") {
              await import("./firebase.js").then(m =>
                m.fbRemove(action.path)
              );
            }

            // ✅ Remove from queue only if success
            store.delete(action.id);
            console.log("✅ Synced & removed:", action.path);

          } catch (err) {
            console.warn("❌ Sync failed, will retry later:", err);
            return; // stop loop, retry next online
          }
        }

        console.log("🎉 All offline actions synced successfully");
      };
    };

    req.onerror = () => {
      console.warn("❌ IndexedDB open failed");
    };

  } catch (e) {
    console.error("❌ Manual offline sync failed", e);
  }
});
