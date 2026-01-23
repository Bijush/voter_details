// ===============================
// 📦 CACHE CONFIG
// ===============================
const CACHE_NAME = "voter-app-cache-v2";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./style.css",

  "./main.js",
  "./ui.js",
  "./render_result.js",
  "./card.js",
  "./pagination.js",
  "./sidebar.js",
  "./spinner.js",
  "./report.js",

  "./dup_muslim.js",
  "./breadcum_confetti.js",
  "./address_move_voter.js",
  "./add_delete.js",
  "./year.js",
  "./fss.js",
  "./caste.js",

  "./offline_json_loader.js",

  "./login.html",
  "./deleted.html",
  "./deleted.css",
  "./deleted.js",

  "./pending.html",
  "./pending.js",
  "./pending-indicator.js",

  "./manifest.json"
];

// ===============================
// 🔧 INSTALL
// ===============================
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      for (const file of FILES_TO_CACHE) {
        try {
          await cache.add(file);
        } catch {}
      }
    })
  );
});

// ===============================
// 🔁 ACTIVATE
// ===============================
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
});

// ===============================
// 🌐 FETCH
// ===============================
self.addEventListener("fetch", event => {

  if (event.request.method !== "GET") return;

  if (
    event.request.url.includes("firebaseio.com") ||
    event.request.url.includes("gstatic.com")
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(res => res || fetch(event.request))
  );
});