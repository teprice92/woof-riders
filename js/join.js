/* Pup Passport sign-up + liability waiver. */
(function () {
  const S = WR.state;
  const form = document.getElementById("passport-form");
  const sets = [...form.querySelectorAll("fieldset[data-step]")];
  const stepsEl = document.getElementById("steps");
  const back = document.getElementById("back"), next = document.getElementById("next"), submit = document.getElementById("submit");
  let step = 0, mode = "new", photo = null;

  // Temperament chips
  const TRAITS = ["Social butterfly", "Shy at first", "Food motivated", "Loves water", "Ball obsessed", "Gentle with small dogs", "Plays rough", "Talkative", "Escape artist", "Snuggler", "Herder", "Sniffer extraordinaire"];
  document.getElementById("temperament").innerHTML = TRAITS.map((t, i) => `<label class="chip"><input type="checkbox" name="temperament" value="${t}" id="tr-${i}"><span>${t}</span></label>`).join("");

  document.getElementById("f-sigdate").value = new Date().toISOString().slice(0, 10);

  // Photo
  document.getElementById("f-photo").addEventListener("change", async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try {
      photo = await WR.readImage(f, 600);
      const drop = document.getElementById("photo-drop");
      drop.querySelector("img")?.remove();
      drop.insertAdjacentHTML("afterbegin", `<img src="${photo}" alt="Your pup">`);
    } catch (err) { WR.toast("That photo didn't load. Try a JPG or PNG."); }
  });

  // ---------- steps ----------
  function visibleSteps() { return mode === "new" ? [0, 1, 2, 3, 4] : [4]; }
  function show() {
    const vs = visibleSteps();
    sets.forEach((s) => (s.hidden = Number(s.dataset.step) !== step));
    stepsEl.hidden = mode !== "new";
    [...stepsEl.children].forEach((li) => { const n = Number(li.dataset.step); li.className = n === step ? "active" : n < step ? "done" : ""; });
    const idx = vs.indexOf(step);
    back.style.visibility = idx > 0 ? "visible" : "hidden";
    next.hidden = idx === vs.length - 1; submit.hidden = !next.hidden;
    submit.textContent = mode === "new" ? "Sign & create Pup Passport" : "Sign waiver";
    document.getElementById("step-count").textContent = mode === "new" ? `Step ${idx + 1} of ${vs.length}` : "";
    document.getElementById("existing-pick").hidden = mode === "new";
    if (step === 4) sizeCanvas();
  }
  function valid() {
    const fs = sets.find((s) => Number(s.dataset.step) === step);
    const fields = [...fs.querySelectorAll("input, select, textarea")].filter((el) => !el.closest("[hidden]"));
    for (const el of fields) { if (!el.checkValidity()) { el.reportValidity(); el.focus(); return false; } }
    return true;
  }
  next.addEventListener("click", () => { if (!valid()) return; const vs = visibleSteps(); step = vs[vs.indexOf(step) + 1]; show(); form.scrollIntoView({ behavior: "smooth", block: "start" }); });
  back.addEventListener("click", () => { const vs = visibleSteps(); step = vs[Math.max(0, vs.indexOf(step) - 1)]; show(); });

  // ---------- mode tabs ----------
  const tabNew = document.getElementById("tab-new"), tabEx = document.getElementById("tab-existing");
  function setMode(m, preselect) {
    mode = m; tabNew.setAttribute("aria-selected", m === "new"); tabEx.setAttribute("aria-selected", m === "existing");
    step = m === "new" ? 0 : 4;
    if (m === "existing") {
      const sel = document.getElementById("f-existing");
      const list = S.dogs.slice().sort((a, b) => (WR.waiverStatus(a) === "missing" ? -1 : 1) - (WR.waiverStatus(b) === "missing" ? -1 : 1));
      sel.innerHTML = list.map((d) => `<option value="${d.id}" ${d.id === preselect ? "selected" : ""}>${WR.esc(d.name)} (${WR.esc(d.breed)})${WR.waiverStatus(d) === "missing" ? " · waiver needed" : " · already signed"}</option>`).join("");
    }
    show();
  }
  tabNew.addEventListener("click", () => setMode("new"));
  tabEx.addEventListener("click", () => setMode("existing"));

  // ---------- signature pad ----------
  const canvas = document.getElementById("sig"), ctx = canvas.getContext("2d");
  let drawing = false, hasInk = false, last = null;
  function sizeCanvas() {
    const r = canvas.getBoundingClientRect(); if (!r.width) return;
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width === Math.round(r.width * dpr)) return;
    canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
    ctx.scale(dpr, dpr); ctx.lineWidth = 2.4; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.strokeStyle = getComputedStyle(document.body).color; hasInk = false;
  }
  const pt = (e) => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  canvas.addEventListener("pointerdown", (e) => { sizeCanvas(); drawing = true; last = pt(e); canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener("pointermove", (e) => { if (!drawing) return; const p = pt(e); ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke(); last = p; hasInk = true; });
  ["pointerup", "pointercancel", "pointerleave"].forEach((ev) => canvas.addEventListener(ev, () => (drawing = false)));
  document.getElementById("sig-clear").addEventListener("click", () => { ctx.clearRect(0, 0, canvas.width, canvas.height); hasInk = false; });
  window.addEventListener("resize", () => { if (step === 4) { canvas.width = 0; sizeCanvas(); } });

  // ---------- submit ----------
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!valid()) return;
    if (!hasInk) { WR.toast("Please sign in the signature box."); canvas.scrollIntoView({ behavior: "smooth", block: "center" }); return; }
    const v = (id) => document.getElementById(id).value.trim();
    const waiver = {
      signedAt: new Date().toISOString().slice(0, 10), signer: v("f-signer"),
      initials: { s1: v("i-1"), s2: v("i-2"), s5: v("i-5"), s7: v("i-7") }, photoRelease: document.getElementById("f-photos").checked,
      signature: canvas.toDataURL("image/png"), version: "2026-1"
    };
    let d;
    if (mode === "existing") {
      d = WR.dog(v("f-existing")); d.waiver = waiver;
    } else {
      const fd = new FormData(form);
      const id = v("f-name").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + WR.uid();
      const emojis = ["🐕", "🐶", "🦮", "🐩"];
      d = {
        id, name: v("f-name"), breed: v("f-breed"), sex: v("f-sex"), fixed: v("f-fixed"), birthday: v("f-birthday"), weight: Number(v("f-weight")), color: v("f-color"),
        photo, emoji: emojis[WR.hash(id) % emojis.length], avatarBg: ["#ffd9a8", "#d6e4f0", "#ffe7b3", "#cfe3ea"][WR.hash(id) % 4],
        vaccines: { rabies: v("f-rabies"), dhpp: v("f-dhpp"), bordetella: v("f-bord") }, flea: v("f-flea"),
        vet: { name: v("f-vet"), phone: v("f-vetphone") }, allergies: v("f-allergies") || "None", meds: v("f-meds") || "None", medical: v("f-medical"),
        energy: fd.get("energy"), temperament: fd.getAll("temperament"), likes: v("f-likes"), fears: v("f-fears"), recall: v("f-recall"), biteHistory: document.getElementById("f-bite").checked,
        owner: { name: v("f-oname"), email: v("f-oemail"), phone: v("f-ophone"), instagram: v("f-oig"), address: v("f-addr"), texts: document.getElementById("f-texts").checked },
        emergency: { name: v("f-ename"), phone: v("f-ephone") }, waiver, createdAt: new Date().toISOString().slice(0, 10)
      };
      S.dogs.push(d);
    }
    if (!WR.save()) return;
    location.href = "pup.html#" + d.id + (mode === "new" ? "-welcome" : "-waiver");
  });

  const h = location.hash.slice(1);
  if (h.startsWith("waiver")) setMode("existing", h.split("waiver-")[1]); else setMode("new");
})();
