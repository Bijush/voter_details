// ===============================
// 🧾 OFFLINE ACTION QUEUE (localStorage)
// ===============================
const QUEUE_KEY = "offlineActionQueue";

function getQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveQueue(queue) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

// ===============================
// 📥 QUEUE ACTION (OFFLINE)
// ===============================
export function queueAction(action) {
  const queue = getQueue();
  queue.push({
    ...action,
    time: Date.now()
  });
  saveQueue(queue);

  console.log("📦 Action queued offline:", action.type);
}

// ===============================
// 🔁 PROCESS QUEUE (ONLINE ONLY)
// ===============================
export async function processQueue() {
  if (!navigator.onLine) return;

  const queue = getQueue();
  if (!queue.length) {
    console.log("✅ No offline actions to sync");
    return;
  }

  console.log("🔄 Processing offline queue:", queue.length);

  const remaining = [];

  for (const action of queue) {
    try {
      await handleAction(action);
    } catch (e) {
      console.warn(
        "❌ Action failed, keeping in queue:",
        action.type,
        e
      );
      remaining.push(action);
      break; // 🔥 stop here, retry later
    }
  }

  saveQueue(remaining);

  if (!remaining.length) {
    console.log("🎉 All offline actions synced");
  }
}

// ===============================
// 🔧 APPLY ACTION TO FIREBASE
// ===============================
async function handleAction(action) {

  switch (action.type) {

    // ===========================
    // ➕ ADD VOTER (FAKE → REAL KEY MERGE)
    // ===========================
    case "ADD_VOTER": {
      const { path, data } = action.payload;

      // 1️⃣ Push to Firebase
      const ref = await window.fbPush(path, data);
      const realKey = ref.key;

      console.log("🧩 Firebase real key:", realKey);

      // 2️⃣ Replace offline fake key using clientId
      if (window.voterData && data.clientId) {

        Object.keys(window.voterData).forEach(house => {
          Object.keys(window.voterData[house]).forEach(k => {

            const v = window.voterData[house][k];

            if (
              k.startsWith("offline_") &&
              v?.clientId === data.clientId
            ) {
              delete window.voterData[house][k];

              window.voterData[house][realKey] = {
                ...v,
                syncedAt: Date.now()
              };

              console.log(
                "🔁 Offline key replaced:",
                k,
                "→",
                realKey
              );
            }

          });
        });

        window.processData?.();
      }

      break;
    }

    // ===========================
    // ✏️ EDIT VOTER (FIXED)
    // ===========================
    case "EDIT_VOTER": {
      const { oldPath, newPath, data, houseChanged } = action.payload;

      if (houseChanged) {
        await window.fbRemove(oldPath);
        await window.fbUpdate(newPath, data);
      } else {
        await window.fbUpdate(oldPath, data);
      }

      console.log("✏️ Offline edit synced:", oldPath);
      break;
    }

    // ===========================
    // 🗑️ DELETE VOTER
    // ===========================
    case "DELETE_VOTER": {
      const { deletePath, archivePath, data } = action.payload;

      await window.fbPush(archivePath, data);
      await window.fbRemove(deletePath);

      console.log("🗑️ Offline delete synced:", deletePath);
      break;
    }

    default:
      console.warn("⚠️ Unknown action type:", action.type);
  }
}