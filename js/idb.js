// js/idb.js
const DB_NAME = "voterDB";
const DB_VERSION = 1;
const STORE = "voters";

let dbPromise = null;

export function openDB() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  return dbPromise;
}

export async function idbSet(key, value) {
  const db = await openDB();
  const tx = db.transaction(STORE, "readwrite");
  tx.objectStore(STORE).put(value, key);
  return tx.complete;
}

export async function idbGet(key) {
  const db = await openDB();
  const tx = db.transaction(STORE, "readonly");
  return tx.objectStore(STORE).get(key);
}
// ensure queue store exists
const req = indexedDB.open("voterDB", 2);

req.onupgradeneeded = () => {
  const db = req.result;
  if (!db.objectStoreNames.contains("queue")) {
    db.createObjectStore("queue", { keyPath: "id", autoIncrement: true });
  }
};