// ✅ ALL IMPORTS MUST BE FIRST
import { listenVoters } from './firebase.js'

// 🔹 CORE UI + FEATURES
import './ui.js'
import './add_delete.js'
import './pending-indicator.js'

// 🔹 FEATURE MODULES
import './dup_muslim.js'
import './breadcum_confetti.js'
import './address_move_voter.js'
import './pagination.js'
import './report.js'
import './sidebar.js'

// 🔹 SPINNER
import { showSpinner, updateSpinner } from './spinner.js'

// 🔥 OFFLINE JSON LOADER
import './offline_json_loader.js'

// 🔁 OFFLINE QUEUE
import { processQueue } from './offline_queue.js'
window.processQueue = processQueue

// ⬇️ FIREBASE → JSON DOWNLOAD
import { downloadFirebaseJSON } from './json_download.js'
window.downloadFirebaseJSON = downloadFirebaseJSON
import './debug.js'

// ----------------------------
// 📱 DEBUG LOGGER
// ----------------------------
function dlog(msg) {
  const box = document.getElementById('debugBox')
  if (box) box.textContent += '\n' + msg
  console.log(msg)
}

dlog('✅ main.js loaded (clean offline-first mode)')

// ----------------------------
// 🌐 GLOBAL STATE
// ----------------------------
window.voterData = {}
window.deletedData = {}
window.pendingData = {}
window.recordsData = {}
window.voterListsData = {}
window.selectedVoters = new Map()

window.IS_DATA_LOADING = true
window.OFFLINE_JSON_LOADED = false

// ----------------------------
// 🔥 FIREBASE LIVE LISTENER
// ----------------------------
dlog('🔗 Attaching Firebase listener...')

listenVoters(data => {
  dlog('🔥 listenVoters fired')

  const freshData = data || {}

  // 📴 If offline JSON already loaded & Firebase empty → keep offline
  if (
    window.OFFLINE_JSON_LOADED === true &&
    Object.keys(freshData).length === 0
  ) {
    dlog('📴 Firebase empty → keeping offline JSON')
    return
  }

  // ☁️ Firebase has real data → HARD REPLACE (NO MERGE)
  if (Object.keys(freshData).length > 0) {
    // 🔥 HARD SWITCH: now using Firebase only
    window.USING_FIREBASE_DATA = true
    window.OFFLINE_JSON_LOADED = false

    // 🔥 IMPORTANT: deep clone to avoid reference merge
    window.voterData = JSON.parse(JSON.stringify(freshData))

    window.IS_DATA_LOADING = false

    dlog('☁️ Firebase data applied | Houses:', Object.keys(freshData).length)

    // 💾 optional cache (clean data only)
    try {
      localStorage.setItem('voters_cache', JSON.stringify(freshData))
    } catch (e) {}

    // 🔁 re-render UI
    if (typeof window.processData === 'function') {
      window.processData()
    }
  }
})

// ----------------------------
// 🌐 ONLINE HANDLER (ONLY ONE)
// ----------------------------
window.addEventListener('online', async () => {
  console.log('🌐 Back online')

  try {
    // 1️⃣ FIRST → sync offline queue
    if (window.processQueue) {
      console.log('🔄 Syncing offline queue...')
      await window.processQueue()
    }

    // 2️⃣ SECOND → download fresh Firebase JSON
    if (window.downloadFirebaseJSON) {
      console.log('⬇️ Downloading fresh Firebase JSON...')
      await window.downloadFirebaseJSON()
    }
  } catch (e) {
    console.warn('❌ Online sync flow failed:', e)
  }
})

// ----------------------------
// 🌐 INITIAL ONLINE LOAD
// ----------------------------
if (navigator.onLine) {
  console.log('🌐 Initial online load')

  setTimeout(async () => {
    if (window.downloadFirebaseJSON) {
      console.log('⬇️ Initial Firebase JSON download')
      await window.downloadFirebaseJSON()
    }
  }, 1200) // wait for Firebase + offline loader
}
;(function setupOfflineBanner() {
  const banner = document.getElementById('offlineBanner')
  if (!banner) return

  let hideTimer = null

  function hideBanner() {
    if (hideTimer) clearTimeout(hideTimer)
    banner.classList.remove('show')
    banner.classList.remove('online')
  }

  function showOffline() {
    if (hideTimer) clearTimeout(hideTimer)

    banner.textContent = '📴 Internet নেই — Offline data দেখানো হচ্ছে'
    banner.classList.remove('online')
    banner.classList.add('show')
  }

  function showOnline() {
    if (hideTimer) clearTimeout(hideTimer)

    banner.textContent = '✅ Internet ফিরে এসেছে — Sync হচ্ছে…'
    banner.classList.add('online')
    banner.classList.add('show')

    hideTimer = setTimeout(() => {
      hideBanner()
    }, 2000)
  }

  // 🔥 INITIAL STATE (IMPORTANT FIX)
  if (navigator.onLine) {
    hideBanner() // ✅ internet থাকলে force hide
  } else {
    showOffline() // 📴 offline হলে show
  }

  window.addEventListener('offline', showOffline)
  window.addEventListener('online', showOnline)
})()
