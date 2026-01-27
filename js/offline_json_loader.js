console.log('📦 offline_json_loader loaded')

// ===============================
// 🔐 CONFIG
// ===============================
const LS_KEY = 'offline_voters_ps90'
const IDB_DB = 'voterDB'
const IDB_VER = 1
const IDB_STORE = 'voters'
const IDB_KEY = 'ps90'

// ===============================
// 🧱 INDEXEDDB HELPERS
// ===============================
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_DB, IDB_VER)

    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE)
      }
    }

    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function idbSet(key, value) {
  try {
    const db = await openDB()
    const tx = db.transaction(IDB_STORE, 'readwrite')
    tx.objectStore(IDB_STORE).put(value, key)
    return new Promise(r => (tx.oncomplete = r))
  } catch {
    return false
  }
}

async function idbGet(key) {
  try {
    const db = await openDB()
    const tx = db.transaction(IDB_STORE, 'readonly')
    return new Promise(r => {
      const req = tx.objectStore(IDB_STORE).get(key)
      req.onsuccess = () => r(req.result)
      req.onerror = () => r(null)
    })
  } catch {
    return null
  }
}

// ===============================
// 🔄 NORMALIZE VOTERS
// ===============================
function normalizeVoters(voters) {
  const fixed = {}
  Object.entries(voters || {}).forEach(([house, data]) => {
    if (!data) return
    fixed[house] = {}

    if (Array.isArray(data)) {
      data.forEach((p, i) => {
        if (!p || typeof p !== 'object') return
        fixed[house]['offline_' + i] = { ...p, house }
      })
    } else {
      Object.entries(data).forEach(([key, p]) => {
        if (!p || typeof p !== 'object') return
        fixed[house][key] = { ...p, house }
      })
    }
  })
  return fixed
}

// ===============================
// 🔧 APPLY OFFLINE DATA
// ===============================
function applyOfflineData(json) {
  // 🔥 HARD RULE: Firebase active হলে offline JSON apply করবে না
  if (window.USING_FIREBASE_DATA === true) {
    console.warn('⛔ Firebase active → offline JSON ignored')
    return
  }

  let voterRoot = null

  if (json?.voters && Object.keys(json.voters).length) {
    voterRoot = json.voters
  } else if (Object.keys(json || {}).some(k => k.startsWith('house_'))) {
    voterRoot = json
  }

  if (!voterRoot) {
    console.warn('❌ No voter data found in offline JSON')
    return
  }

  const voters = normalizeVoters(voterRoot)

  window.voterData = voters

  // 🔒 OFFLINE MODE FLAGS
  window.OFFLINE_JSON_LOADED = true
  window.USING_FIREBASE_DATA = false
  window.IS_DATA_LOADING = false

  console.log('✅ Offline JSON applied | Houses:', Object.keys(voters).length)

  waitForRender()
}

// ===============================
// ⏳ WAIT & RENDER
// ===============================
function waitForRender() {
  if (!window.currentPage) window.currentPage = 1

  if (
    typeof window.processData === 'function' &&
    document.getElementById('results')
  ) {
    console.log('🚀 Rendering offline voters')
    window.processData()
    return
  }
  setTimeout(waitForRender, 100)
}

// ===============================
// 🌐 ONLINE: FETCH & CACHE ONLY
// ===============================
async function onlineLoad() {
  try {
    const res = await fetch('./ps90.json', { cache: 'no-store' })
    if (!res.ok) throw new Error('ps90.json missing')

    const json = await res.json()

    // 💾 Cache only (DO NOT APPLY if Firebase is active)
    await idbSet(IDB_KEY, json)
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(json))
    } catch {}

    console.log('💾 Cached offline JSON (IDB + localStorage)')

    if (!window.USING_FIREBASE_DATA) {
      applyOfflineData(json)
    }
  } catch (e) {
    console.warn('❌ Online JSON load failed:', e.message)
  }
}

// ===============================
// 📴 OFFLINE: LOAD FROM CACHE
// ===============================
async function offlineLoad() {
  const idbData = await idbGet(IDB_KEY)
  if (idbData) {
    console.log('📴 Offline → loaded from IndexedDB')
    applyOfflineData(idbData)
    return
  }

  const cached = localStorage.getItem(LS_KEY)
  if (cached) {
    console.log('📴 Offline → loaded from localStorage')
    applyOfflineData(JSON.parse(cached))
    return
  }

  console.warn('❌ No offline cache found')
}

// ===============================
// 🔥 ENTRY POINT
// ===============================
if (navigator.onLine) {
  console.log('🌐 Online mode → cache JSON only')
  onlineLoad()
} else {
  console.log('📴 Offline mode → load cached JSON')
  offlineLoad()
}

// ===============================
// 🧹 CLEAR OFFLINE CACHE
// ===============================
window.clearOfflineCache = function () {
  const ok = confirm(
    '⚠️ Clear Offline Cache?\n\n' +
      'IndexedDB + localStorage will be deleted.\n' +
      'App will reload fresh.'
  )

  if (!ok) return

  try {
    localStorage.removeItem(LS_KEY)
    console.log('🧹 localStorage cleared')
  } catch {}

  try {
    indexedDB.deleteDatabase(IDB_DB)
    console.log('🧹 IndexedDB cleared')
  } catch {}

  // 🔄 reset flags
  window.OFFLINE_JSON_LOADED = false
  window.USING_FIREBASE_DATA = false

  alert('✅ Offline cache cleared.\n\nReloading app…')
  location.reload()
}

// ===============================
// 🔓 expose for controlled reload
window.onlineLoad = onlineLoad
