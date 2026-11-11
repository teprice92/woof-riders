/* Reservations: choose trip, pups, pickup, add-ons; saves a reservation. */
(function () {
  const S = WR.state, P = S.pricing;
  const form = document.getElementById("book-form");
  const pre = decodeURIComponent(location.hash.slice(1));

  const trips = WR.upcoming();
  document.getElementById("trips").innerHTML = trips.map((t, i) => {
    const left = WR.seatsLeft(t), price = t.premium ? P.premium : P.ride;
    return `<label class="choice"><input type="radio" name="trip" value="${t.id}" ${left ? "" : "disabled"} required><span class="face">
      <small class="num">${WR.fmtDate(t.date, { weekday: "long", month: "short", day: "numeric" })} · ${WR.fmtTime(t.times[0])}–${WR.fmtTime(t.times[t.times.length - 1])}</small>
      <strong>${WR.esc(t.name)}</strong>
      <span class="stop-chips">${t.stops.map((s) => `<span>${WR.loc(s).emoji} ${WR.esc(WR.loc(s).short)}</span>`).join("")}</span>
      <span class="row between" style="margin-top:8px"><span class="num" style="font-weight:700">${WR.money(price)}<small class="muted"> / pup</small></span>
      <span class="seats" style="color:var(${left === 0 ? "--bad" : left <= 3 ? "--sunset" : "--good"})">${left === 0 ? "Sold out" : left <= 3 ? `Only ${left} seat${left === 1 ? "" : "s"} left` : `${left} seats open`}</span></span>
    </span></label>`;
  }).join("");

  document.getElementById("pups").innerHTML = S.dogs.map((d) => {
    const ok = WR.waiverStatus(d) === "signed", vac = WR.vaccineStatus(d);
    const blocked = !ok || vac.level === "bad";
    return `<div class="stack" style="gap:6px"><label class="choice pup-choice"><input type="checkbox" name="pup" value="${d.id}" ${blocked ? "disabled" : ""} ${d.id === pre && !blocked ? "checked" : ""}><span class="face">
      <span class="avatar" style="background:${d.avatarBg || "var(--sun-soft)"}">${d.photo ? `<img src="${d.photo}" alt="">` : d.emoji}</span>
      <strong>${WR.esc(d.name)}</strong>
      <small>${!ok ? `Waiver needed` : vac.level === "bad" ? WR.esc(vac.text) : WR.esc(d.breed)}</small>
    </span></label>${!ok ? `<a href="join.html#waiver-${d.id}" style="font-size:.85rem; font-weight:700">Sign ${WR.esc(d.name)}'s waiver</a>` : vac.level === "bad" ? `<span class="muted" style="font-size:.85rem">Email updated records to get ${WR.esc(d.name)} riding.</span>` : ""}</div>`;
  }).join("");

  document.getElementById("addons").innerHTML = P.addons.filter((a) => a.id !== "door").map((a) => `
    <label class="choice"><input type="checkbox" name="addon" value="${a.id}"><span class="face"><strong>${WR.esc(a.name)}</strong><small>${WR.esc(a.desc)}</small><span class="num" style="font-weight:700; margin-top:4px">+${WR.money(a.price)} / pup</span></span></label>`).join("");

  function calc() {
    const fd = new FormData(form);
    const t = WR.trip(fd.get("trip")), pups = fd.getAll("pup").map(WR.dog), addons = fd.getAll("addon").map((id) => P.addons.find((a) => a.id === id));
    const door = fd.get("pickup") === "door";
    const lines = []; let total = 0;
    if (t) {
      const price = t.premium ? P.premium : P.ride;
      if (pups.length) { lines.push([`${pups.length} × ${t.premium ? "Road trip" : "Field trip"} ride`, price * pups.length]); total += price * pups.length; }
      addons.forEach((a) => { if (pups.length) { lines.push([`${a.name} × ${pups.length}`, a.price * pups.length]); total += a.price * pups.length; } });
      if (door) { const a = P.addons.find((x) => x.id === "door"); lines.push([a.name, a.price]); total += a.price; }
    }
    return { t, pups, addons, door, lines, total, fd };
  }
  function render() {
    const c = calc();
    document.getElementById("sum-trip").innerHTML = c.t
      ? `<h3>${WR.esc(c.t.name)}</h3><p class="muted num">${WR.fmtDate(c.t.date, { weekday: "long", month: "long", day: "numeric" })}</p><p style="margin-top:6px">${c.pups.length ? c.pups.map((p) => WR.esc(p.name)).join(", ") : '<span class="muted">No pups selected yet</span>'}</p>`
      : `<p class="muted">Choose a field trip to get started.</p>`;
    document.getElementById("sum-lines").innerHTML = c.lines.map(([l, v]) => `<div class="line"><span>${WR.esc(l)}</span><span class="num">${WR.money(v)}</span></div>`).join("");
    document.getElementById("sum-total").textContent = WR.money(c.total);
    const warn = document.getElementById("sum-warn");
    const over = c.t && c.pups.length > WR.seatsLeft(c.t);
    const already = c.t ? c.pups.filter((p) => c.t.dogs.includes(p.id)) : [];
    warn.hidden = !(over || already.length);
    warn.textContent = over ? `Only ${WR.seatsLeft(c.t)} seats left on this trip.` : already.length ? `${already.map((p) => p.name).join(", ")} already ${already.length > 1 ? "have seats" : "has a seat"} on this trip.` : "";
    document.getElementById("reserve").disabled = !c.t || !c.pups.length || over || already.length > 0;
  }
  form.addEventListener("change", render);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    for (const el of form.querySelectorAll("input[required], textarea[required]")) { if (el.type !== "radio" && !el.checkValidity()) { el.reportValidity(); return; } }
    const c = calc();
    const id = "R-" + (1000 + S.reservations.length + 44 + (WR.hash(Date.now() + "") % 50));
    const v = (x) => document.getElementById(x).value.trim();
    S.reservations.push({ id, tripId: c.t.id, dogIds: c.pups.map((p) => p.id), addons: c.addons.map((a) => a.id), pickup: c.door ? "door" : "clubhouse",
      ownerName: v("b-name"), ownerEmail: v("b-email"), ownerPhone: v("b-phone"), passCode: v("b-pass"), notes: v("b-notes"), total: c.total, status: "pending", createdAt: new Date().toISOString().slice(0, 10) });
    c.pups.forEach((p) => c.t.dogs.push(p.id));
    if (!WR.save()) return;
    form.hidden = true;
    const done = document.getElementById("done"); done.hidden = false;
    done.innerHTML = `<div class="form-card stack-lg" style="max-width:760px; margin-inline:auto; text-align:center; justify-items:center">
      <div class="medal" style="--c:#f2602f">🚌</div>
      <div class="stack" style="justify-items:center"><span class="script" style="font-size:2rem">Pawsome!</span><h2>${c.pups.map((p) => WR.esc(p.name)).join(" & ")} ${c.pups.length > 1 ? "are" : "is"} on the list.</h2>
      <p class="lede">${WR.esc(c.t.name)} · ${WR.fmtDate(c.t.date, { weekday: "long", month: "long", day: "numeric" })}. ${c.door ? "We'll text you a pickup window the night before." : `Drop-off at the clubhouse by ${WR.fmtTime(c.t.times[0])}.`}</p></div>
      <p class="pill sea num" style="font-size:1rem; padding:10px 16px">Confirmation ${id} · ${WR.money(c.total)}</p>
      <p class="muted">Your request is pending until our crew confirms it, usually within a couple of hours.</p>
      <div class="row" style="justify-content:center"><a class="btn" href="pup.html#${c.pups[0].id}">View ${WR.esc(c.pups[0].name)}'s Pup Passport</a><a class="btn ghost" href="book.html">Book another ride</a></div></div>`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // Preselect the first open trip so the summary isn't empty.
  const open = [...form.querySelectorAll('input[name="trip"]:not(:disabled)')];
  const first = open.find((i) => !WR.trip(i.value).dogs.includes(pre)) || open[0]; if (first) first.checked = true;
  render();
})();
