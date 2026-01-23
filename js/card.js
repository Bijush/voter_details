// card.js
console.log("✅ card.js loaded");

export function createVoterCard(p) {

  const card = document.createElement("div");
  card.className = "card";
  card.style.position = "relative";

  // ===============================
  // 🔲 MULTI SELECT CHECKBOX
  // ===============================
  const selectBox = document.createElement("input");
selectBox.type = "checkbox";
selectBox.className = "voter-select";
selectBox.style.display = window.BULK_MODE_ON ? "block" : "none";

selectBox.style.position = "absolute";
selectBox.style.top = "10px";
selectBox.style.left = "10px";
selectBox.style.zIndex = "5";

  selectBox.addEventListener("change", () => {
    if (selectBox.checked) {
      window.selectedVoters?.set(p.key, {
        key: p.key,
        house: p.house
      });
    } else {
      window.selectedVoters?.delete(p.key);
    }
  });

  // ===============================
  // DATASET FLAGS
  // ===============================
  card.dataset.house = p.house;
  card.dataset.key   = p.key;
  card.dataset.caste = p.caste;
  card.dataset.verified = p.verified ? "yes" : "no";

  if (p.duplicateSerial) {
    card.dataset.dupserial = "yes";
  }

  // ⭐ Highlight if note exists
  if (p.note && p.note.trim()) {
    card.style.border = "2px solid #f59e0b";
    card.style.boxShadow = "0 0 0 3px rgba(245,158,11,.35)";
  }

  // ✅ Verified glow
  if (p.verified === true) {
    card.classList.add("verified-glow");
  }

  const photoPath = `photos/${p.serial}.jpg`;

  const duplicateBadge =
    window.duplicateBYPs?.has(p.byp)
      ? `<span class="dup-badge">DUPLICATE</span>`
      : "";

  const photoExists =
    p.photo !== false && p.photo !== "no" && p.photo !== "";

  const photoBadge = photoExists
    ? ""
    : `<span class="dup-badge" style="background:#dc2626">NO PHOTO</span>`;

  // ===============================
  // HTML
  // ===============================
  card.innerHTML = `
    <img src="${photoPath}" class="voter-photo" style="cursor:pointer;">
    <div class="card-content">

      <h3 class="card-header-line">
        <span class="name-text">
          ${p.name}
          <span class="pill">#${p.serial}</span>
          ${p.duplicateSerial ? `<span class="dup-badge">DUP SERIAL</span>` : ""}
          ${p.verified ? `<span class="verified-badge">✔ Verified</span>` : ""}
        </span>
        <div class="badge-line">${duplicateBadge}${photoBadge}</div>
      </h3>

      ${p.father ? `<p><b>Father:</b> ${p.father}</p>` : ""}
      ${p.mother ? `<p><b>Mother:</b> ${p.mother}</p>` : ""}
      ${p.husband ? `<p><b>Husband:</b> ${p.husband}</p>` : ""}
      <p class="byp-field"><b>BYP:</b> ${p.byp || "—"}</p>

      <p><b>House:</b> <span class="pill">${p.house.replace("house_","")}</span></p>
      <p><b>Age:</b> ${p.age ?? "—"}</p>
      <p><b>Caste:</b> <span class="pill">${p.caste || "General"}</span></p>
      <p><b>Gender:</b> ${p.gender || "—"}</p>

${p.address ? `
  <p style="font-size:13px;line-height:1.4">
    <b>Address:</b><br>
    ${p.address.village || ""}<br>
    PO: ${p.address.po || ""}, PIN: ${p.address.pin || ""}<br>
    ${p.address.dist || ""} (${p.address.part || ""})
  </p>
` : ""}

      ${p.mobile ? `<p><b>Mobile:</b> <a href="tel:${p.mobile}">${p.mobile} 📞</a></p>` : ""}

      <p style="font-size:12px;color:#2563eb"><b>Updated:</b> ${p.updatedAt || "—"}</p>

      <div class="card-actions" style="display:flex;gap:10px;margin-top:10px;"></div>
    </div>
  `;

  card.appendChild(selectBox);

  // ===============================
  // PHOTO CLICK
  // ===============================
  card.querySelector(".voter-photo")
    ?.addEventListener("click", () => window.openPhoto?.(photoPath));

  // ===============================
  // ACTION BUTTONS
  // ===============================
  const actions = card.querySelector(".card-actions");

  const editBtn = document.createElement("button");
  editBtn.textContent = "✏️ Edit";
  editBtn.onclick = () => {
    if (typeof window.openEditVoter !== "function") {
      alert("❌ openEditVoter function missing");
      return;
    }
    window.openEditVoter(card.dataset.house, card.dataset.key, p);
  };

  const delBtn = document.createElement("button");
  delBtn.textContent = "🗑️ Delete";
  delBtn.onclick = () =>
    window.deleteVoter?.(card.dataset.house, card.dataset.key);

  actions.appendChild(editBtn);
  actions.appendChild(delBtn);

  if (p.shiftHistory?.length) {
    const historyBtn = document.createElement("button");
    historyBtn.textContent = "📜 History";
    historyBtn.onclick = () => window.openMoveHistory?.(p);
    actions.appendChild(historyBtn);
  }

  // ===============================
  // 📝 NOTE BOX (RESTORED DEFAULT TEXT)
  // ===============================
  const defaultNote =
    window.DEFAULT_NOTE_TEMPLATE ||
    `FormType:
New House:
Old House:`;

  const noteBox = document.createElement("div");
  noteBox.className = "note-container";
  noteBox.innerHTML = `
    <button class="note-toggle-btn">📝 Show Note</button>
    <div class="note-body" style="display:none">
      <textarea class="voter-note">${
        p.note && p.note.trim() ? p.note : defaultNote
      }</textarea>
      <button class="save-note-btn">💾 Save Note</button>
      <button class="delete-note-btn">🗑️ Delete Note</button>
    </div>
  `;

  const toggleBtn = noteBox.querySelector(".note-toggle-btn");
  const noteBody  = noteBox.querySelector(".note-body");

  toggleBtn.onclick = () => {
    const open = noteBody.style.display === "block";
    noteBody.style.display = open ? "none" : "block";
    toggleBtn.textContent = open ? "📝 Show Note" : "📝 Hide Note";
  };

  noteBox.querySelector(".save-note-btn").onclick = () =>
    window.saveNote?.(
      p.house,
      p.key,
      noteBox.querySelector(".voter-note").value
    );

  noteBox.querySelector(".delete-note-btn").onclick = () =>
    window.deleteNote?.(p.house, p.key);

  card.querySelector(".card-content").appendChild(noteBox);

  // ===============================
  // DOUBLE CLICK → VERIFIED
  // ===============================
  card.ondblclick = () =>
    window.toggleVerified?.(
      card.dataset.house,
      card.dataset.key,
      p.verified,
      p.birthYear
    );

  return card;
}