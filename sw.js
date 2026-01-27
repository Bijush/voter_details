// ===============================
// 📦 CACHE CONFIG
// ===============================
const CACHE_NAME = "voter-app-cache-v3";

const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./offline.html",
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
  console.log("📦 SW installing...");
  
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
});

// ===============================
// 🔁 ACTIVATE
// ===============================
self.addEventListener("activate", event => {
  console.log("⚡ SW activating...");
  event.waitUntil(
    Promise.all([
      caches.keys().then(keys =>
        Promise.all(
          keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
        )
      ),
      self.clients.claim() // 🔥 control open tabs
    ])
  );
});

// ===============================
// 🌐 FETCH
// ===============================
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const req = event.request;

  // ❌ Never cache Firebase / CDN
  if (
    req.url.includes("firebaseio.com") ||
    req.url.includes("gstatic.com") ||
    req.url.includes("googleapis.com")
  ) {
    return;
  }

  // 🌐 HTML → Network First
  if (req.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(req)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, clone));
          return res;
        })
        .catch(() => caches.match(req).then(r => r || caches.match("./offline.html")))
    );
    return;
  }

  // 📦 JS / CSS / Others → Cache First
  event.respondWith(
    caches.match(req).then(res => res || fetch(req))
  );
});
// ===============================
// 🔔 SKIP WAITING ON USER ACTION
// ===============================
self.addEventListener("message", event => {
  if (event.data?.action === "SKIP_WAITING") {
    console.log("⚡ Skip waiting received");
    self.skipWaiting();
  }
});