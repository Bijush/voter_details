// ===============================
// 🔥 FIREBASE SDK IMPORTS
// ===============================
import { initializeApp } from
  "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";

import {
  getDatabase,
  ref,
  onValue,
  push,
  update,
  remove,
  get
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// ===============================
// 🔥 FIREBASE INIT
// ===============================
const app = initializeApp({
  apiKey: "AIzaSyCybmzCk3M8jV_255SbRGkGPWLAz2lgayE",
  authDomain: "bijus-app-52978.firebaseapp.com",
  databaseURL: "https://bijus-app-52978.firebaseio.com",
  projectId: "bijus-app-52978",
  storageBucket: "bijus-app-52978.firebasestorage.app",
  messagingSenderId: "796288544713",
  appId: "1:796288544713:web:643d5dee81c51e5aaec218"
});

export const db = getDatabase(app);

// ===============================
// 🔔 REALTIME LISTENERS
// ===============================
export function listenVoters(cb) {
  return onValue(ref(db, "voters"), s => cb(s.val() || {}));
}

export function listenPath(path, cb) {
  return onValue(ref(db, path), s => cb(s.val() || {}));
}

// ===============================
// 🗃️ INDEXEDDB (OFFLINE QUEUE)
// ===============================
function openQueueDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("voterDB", 2);

    req.onupgradeneeded = () => {
      const idb = req.result;
      if (!idb.objectStoreNames.contains("queue")) {
        idb.createObjectStore("queue", {
          keyPath: "id",
          autoIncrement: true
        });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ===============================
// 🛡️ SAFE CLONE (CRITICAL FIX)
// ===============================
function safeClone(data) {
  if (data === undefined || data === null) return null;
  try {
    return JSON.parse(JSON.stringify(data));
  } catch {
    return null;
  }
}

// ===============================
// 📴 QUEUE OFFLINE ACTION
// ===============================
async function queueOfflineAction(type, path, data) {
  try {
    const idb = await openQueueDB();
    const tx = idb.transaction("queue", "readwrite");
    const store = tx.objectStore("queue");

    store.add({
      type,                  // update | push | remove
      path: String(path),    // always string
      data: safeClone(data), // 🔥 FIXED
      time: Date.now()
    });

    console.log("📥 Offline action queued:", type, path);

  } catch (e) {
    console.error("❌ Failed to queue offline action", e);
  }
}

// ===============================
// 🔥 HYBRID FIREBASE OPERATIONS
// ===============================
export const fbUpdate = async (path, data) => {
  if (navigator.onLine) {
    return update(ref(db, path), data);
  }
  await queueOfflineAction("update", path, data);
};

export const fbPush = async (path, data) => {
  if (navigator.onLine) {
    return push(ref(db, path), data);
  }
  await queueOfflineAction("push", path, data);
};

export const fbRemove = async (path) => {
  if (navigator.onLine) {
    return remove(ref(db, path));
  }
  await queueOfflineAction("remove", path, null);
};

export const fbGet = (path) => {
  return get(ref(db, path));
};

// ===============================
// 🔁 MANUAL OFFLINE QUEUE SYNC
// ===============================
async function syncOfflineQueue() {
  console.log("🔁 Manual offline sync started");

  try {
    const idb = await openQueueDB();
    const tx = idb.transaction("queue", "readwrite");
    const store = tx.objectStore("queue");

    const allReq = store.getAll();
    allReq.onsuccess = async () => {
      const actions = allReq.result || [];

      if (!actions.length) {
        console.log("✅ No offline actions to sync");
        return;
      }

      for (const action of actions) {
        try {
          console.log("⏳ Syncing:", action.type, action.path);

          if (action.type === "update") {
            await update(ref(db, action.path), action.data);
          }

          if (action.type === "push") {
            await push(ref(db, action.path), action.data);
          }

          if (action.type === "remove") {
            await remove(ref(db, action.path));
          }

          store.delete(action.id);
          console.log("✅ Synced & removed:", action.path);

        } catch (e) {
          console.warn("❌ Sync failed, will retry later", e);
          return; // stop loop, retry next online
        }
      }

      console.log("🎉 All offline actions synced");
    };

  } catch (e) {
    console.error("❌ Offline sync failed", e);
  }
}

// ===============================
// 🌐 AUTO SYNC WHEN ONLINE
// ===============================
window.addEventListener("online", () => {
  console.log("🌐 Back online → syncing offline queue");
  syncOfflineQueue();
});