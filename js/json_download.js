// ===============================
// ⬇️ FIREBASE → JSON DOWNLOAD
// ===============================

// expose globally (so main.js can call safely)
export async function downloadFirebaseJSON() {

  console.log("⬇️ Downloading latest data from Firebase...");

  // 🔒 safety check
  if (typeof window.fbGet !== "function") {
    console.warn("❌ fbGet not available");
    return;
  }

  try {
    // 1️⃣ fetch voters from Firebase
    const snap = await window.fbGet("voters");

    if (!snap.exists()) {
      console.warn("❌ No voters found in Firebase");
      return;
    }

    const firebaseData = snap.val();

    // 2️⃣ normalize format (same as ps90.json)
    const json = {
      voters: firebaseData
    };

    // 3️⃣ save to localStorage (offline fallback)
    try {
      localStorage.setItem(
        "offline_voters_ps90",
        JSON.stringify(json)
      );
      console.log("💾 Firebase JSON saved to localStorage");
    } catch (e) {
      console.warn("❌ localStorage save failed", e);
    }

    // 4️⃣ apply directly to memory (UI replace)
    applyDownloadedJSON(json);

  } catch (err) {
    console.warn("❌ Firebase JSON download failed", err);
  }
}

// ===============================
// 🔁 APPLY DOWNLOADED JSON
// ===============================
function applyDownloadedJSON(json) {

  const voterRoot = json?.voters || json;

  if (!voterRoot || typeof voterRoot !== "object") {
    console.warn("❌ Invalid JSON format");
    return;
  }

  // 🔁 hard replace old data
  window.voterData = voterRoot;
  window.OFFLINE_JSON_LOADED = true;
  window.IS_DATA_LOADING = false;

  console.log(
    "✅ Firebase JSON applied | Houses:",
    Object.keys(voterRoot).length
  );

  // 5️⃣ re-render UI
  if (typeof window.processData === "function") {
    window.processData();
  }
}

// ===============================
// 🌍 EXPOSE FOR GLOBAL ACCESS
// ===============================
window.downloadFirebaseJSON = downloadFirebaseJSON;