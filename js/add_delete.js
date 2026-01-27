// ===============================
// 🔥 ADD / EDIT / DELETE VOTER
// ===============================

import {
  fbPush,
  fbUpdate,
  fbRemove,
  fbGet
} from './firebase.js'

// 🆕 OFFLINE QUEUE
import {
  queueAction
} from './offline_queue.js'

/* ===============================
   🔑 GLOBAL EDIT CONTEXT
=============================== */
window.editHouse = null
window.editKey = null
// 🔥 delete context
let DELETE_CTX = {
  house: null,
  key: null,
  voter: null // 🔥 full voter object
}

/* ===============================
   🧮 HELPERS
=============================== */

function nowIST() {
  return new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour12: true
  })
}

function calculateAgeFromYear(year) {
  if (!year) return ''
  return new Date().getFullYear() - Number(year)
}

/* ===============================
   🧩 OFFLINE CACHE HELPERS
=============================== */

function rerender() {
  if (typeof window.processData === 'function') {
    window.processData()
  }
}

async function addVoterToOffline(houseKey, key, payload) {
  if (!window.voterData) window.voterData = {}
  if (!window.voterData[houseKey]) window.voterData[houseKey] = {}
  window.voterData[houseKey][key] = payload
  rerender()
}

async function removeVoterOffline(houseKey, key) {
  if (window.voterData?.[houseKey]?.[key]) {
    delete window.voterData[houseKey][key]
    rerender()
  }
}

/* ===============================
   ➕ ADD NEW VOTER
=============================== */

window.saveAddVoter = async function () {
  const serial = Number(avSerial.value)
  const houseNo = avHouse.value.trim()
  const name = avName.value.trim()
  const father = avFather.value.trim()
  const mother = avMother.value.trim()
  const husband = avHusband.value.trim()
  const birthYear = Number(avBirthYear.value)
  const gender = avGender.value.trim()
  const byp = avBYP.value.trim()
  const mobile = avMobile.value.trim()

  if (!serial || !houseNo || !name || !birthYear) {
    alert('❌ Serial, House, Name & Birth Year required')
    return
  }

  const clientId =
  'cid_' + Date.now() + '_' + Math.random().toString(36).slice(2)

  const payload = {
    serial,
    house: `house_${houseNo}`,
    name,
    father: father || '',
    mother: mother || '',
    husband: husband || '',
    birthYear,
    age: calculateAgeFromYear(birthYear),
    gender,
    byp,
    mobile,
    verified: false,
    clientId,
    addedAt: nowIST(),
    updatedAt: nowIST()
  }

  const houseKey = `house_${houseNo}`

  if (!navigator.onLine) {
    const fakeKey = 'offline_' + Date.now()

    await queueAction( {
      type: 'ADD_VOTER',
      payload: {
        path: `voters/${houseKey}`,
        data: payload
      }
    })

    await addVoterToOffline(houseKey, fakeKey, payload)
    alert('📴 Offline: voter added')
  } else {
    await fbPush(`voters/${houseKey}`, payload)
    alert('✅ Voter added successfully')
  }

  document.getElementById('addVoterPopup').style.display = 'none'
}

/* ===============================
   ✏️ OPEN EDIT VOTER POPUP
=============================== */

window.openEditVoter = function (house, key, voter) {
  // 🔑 set global edit context
  window.editHouse = house
  window.editKey = key

  // 🧾 fill edit form inputs
  evSerial.value = voter.serial || ''
  evHouse.value = house.replace('house_', '')
  evName.value = voter.name || ''
  evFather.value = voter.father || ''
  evMother.value = voter.mother || ''
  evHusband.value = voter.husband || ''
  evBirthYear.value = voter.birthYear || ''
  evGender.value = voter.gender || ''
  evBYP.value = voter.byp || ''
  evMobile.value = voter.mobile || ''

  // 🪟 show popup
  document.getElementById('editVoterPopup').style.display = 'flex'
}

/* ===============================
   ✏️ SAVE EDITED VOTER (FIXED)
=============================== */

window.saveEditVoter = async function () {
  if (!editHouse || !editKey) {
    alert('❌ Edit context missing')
    return
  }

  const newHouseNo = evHouse.value.trim()
  const houseKey = `house_${newHouseNo}`
  const houseChanged = editHouse !== houseKey

  const payload = {
    serial: Number(evSerial.value),
    house: houseKey,
    name: evName.value.trim(),
    father: evFather.value.trim(),
    mother: evMother.value.trim(),
    husband: evHusband.value.trim(),
    birthYear: Number(evBirthYear.value),
    age: calculateAgeFromYear(evBirthYear.value),
    gender: evGender.value.trim(),
    byp: evBYP.value.trim(),
    mobile: evMobile.value.trim(),
    updatedAt: nowIST()
  }

  const oldPath = `voters/${editHouse}/${editKey}`
  const newPath = `voters/${houseKey}/${editKey}`

  if (!navigator.onLine) {
    // ✅ QUEUE EDIT FOR ONLINE SYNC
    await queueAction( {
      type: 'EDIT_VOTER',
      payload: {
        oldPath,
        newPath,
        data: payload,
        houseChanged
      }
    })

    // 🔥 optimistic local update
    await removeVoterOffline(editHouse, editKey)
    await addVoterToOffline(houseKey, editKey, payload)

    alert('📴 Offline: edit saved (will sync online)')
  } else {
    if (houseChanged) {
      await fbRemove(oldPath)
      await fbUpdate(newPath, payload)
    } else {
      await fbUpdate(oldPath, payload)
    }

    alert('✅ Voter updated')
  }

  document.getElementById('editVoterPopup').style.display = 'none'
}

/* ===============================
   ✔️ TOGGLE VERIFIED (OFFLINE SAFE)
=============================== */

window.toggleVerified = async function (house, key, currentStatus, birthYear) {
  const payload = {
    verified: !currentStatus,
    age: calculateAgeFromYear(birthYear),
    updatedAt: nowIST()
  }

  if (!navigator.onLine) {
    await queueAction( {
      type: 'EDIT_VOTER',
      payload: {
        oldPath: `voters/${house}/${key}`,
        newPath: `voters/${house}/${key}`,
        data: payload,
        houseChanged: false
      }
    })

    if (window.voterData?.[house]?.[key]) {
      Object.assign(window.voterData[house][key], payload)
      rerender()
    }

    return
  }

  await fbUpdate(`voters/${house}/${key}`, payload)
}

/* ===============================
   📝 NOTES (OFFLINE SAFE)
=============================== */

window.saveNote = async function (house, key, noteText) {
  const payload = {
    note: noteText,
    updatedAt: nowIST()
  }

  if (!navigator.onLine) {
    await queueAction( {
      type: 'EDIT_VOTER',
      payload: {
        oldPath: `voters/${house}/${key}`,
        newPath: `voters/${house}/${key}`,
        data: payload,
        houseChanged: false
      }
    })

    if (window.voterData?.[house]?.[key]) {
      Object.assign(window.voterData[house][key], payload)
      rerender()
    }
    return
  }

  await fbUpdate(`voters/${house}/${key}`, payload)
}

window.deleteNote = async function (house, key) {
  const payload = {
    note: '',
    updatedAt: nowIST()
  }

  if (!navigator.onLine) {
    await queueAction( {
      type: 'EDIT_VOTER',
      payload: {
        oldPath: `voters/${house}/${key}`,
        newPath: `voters/${house}/${key}`,
        data: payload,
        houseChanged: false
      }
    })

    if (window.voterData?.[house]?.[key]) {
      Object.assign(window.voterData[house][key], payload)
      rerender()
    }
    return
  }

  await fbUpdate(`voters/${house}/${key}`, payload)
}

/* ===============================
   🗑️ DELETE VOTER (UNCHANGED)
=============================== */

window.deleteVoter = function (house, key, voter) {

  DELETE_CTX.house = house
  DELETE_CTX.key = key
  DELETE_CTX.voter = voter

  // 🔎 show voter info
  document.getElementById('delSerial').textContent = voter?.serial ?? '—'
  document.getElementById('delAge').textContent = voter?.age ?? '—'
  document.getElementById('delBYP').textContent = voter?.byp || '—'

  document.getElementById('deleteReasonSelect').value = ''
  document.getElementById('deleteReasonPopup').style.display = 'flex'
}

window.closeDeletePopup = function () {
  document.getElementById('deleteReasonPopup').style.display = 'none'

  DELETE_CTX.house = null
  DELETE_CTX.key = null
  DELETE_CTX.voter = null
}

window.confirmDeleteVoter = async function () {
  const reason = document.getElementById('deleteReasonSelect').value

  if (!reason) {
    alert('❌ Please select a delete reason')
    return
  }

  const {
    house,
    key,
    voter
  } = DELETE_CTX
  if (!house || !key || !voter) return

  const path = `voters/${house}/${key}`

  const deletedPayload = {
    ...voter,
    // 🔥 keeps name, serial, age, byp, etc
    house,
    originalKey: key,
    deleteReason: reason,
    deletedAt: nowIST()
  }

  if (!navigator.onLine) {
    await queueAction( {
      type: 'DELETE_VOTER',
      payload: {
        deletePath: path,
        archivePath: 'deleted_voters',
        data: deletedPayload
      }
    })

    await removeVoterOffline(house, key)
    alert('📴 Offline: voter deleted')
  } else {
    await fbPush('deleted_voters', deletedPayload)
    await fbRemove(path)
    alert('🗑️ Voter deleted')
  }

  closeDeletePopup()
}
console.log("✅ deleteVoter registered:", typeof window.deleteVoter);