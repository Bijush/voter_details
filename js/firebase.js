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
// 🔥 PURE FIREBASE HELPERS
// ===============================
export const fbPush = (path, data) => {
  return push(ref(db, path), data);
};

export const fbUpdate = (path, data) => {
  return update(ref(db, path), data);
};

export const fbRemove = (path) => {
  return remove(ref(db, path));
};

export const fbGet = (path) => {
  return get(ref(db, path));
};

// ===============================
// 🌍 EXPOSE FOR OFFLINE QUEUE
// ===============================
window.fbPush   = fbPush;
window.fbUpdate = fbUpdate;
window.fbRemove = fbRemove;
window.fbGet    = fbGet;