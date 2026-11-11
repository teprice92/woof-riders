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
    const first = WR.loc(c.t.stops[0]);
    const seats = c.pups.map((p, i) => (2 + (WR.hash(id + p.id) % 5)) + "ABCD"[(WR.hash(p.id) + i) % 4]);
    // Barcode drawn from the confirmation code so each pass looks unique.
    let x = 0; const bars = []; const bits = (WR.hash(id) >>> 0).toString(2).padStart(32, "1") + (WR.hash(id + "x") >>> 0).toString(2).padStart(32, "0");
    for (const bit of bits) { const w = bit === "1" ? 3 : 1.5; bars.push(`var(--ink) ${x}px ${x + w}px`, `transparent ${x + w}px ${x + w + 2}px`); x += w + 2; }
    const barcode = `background: linear-gradient(90deg, ${bars.join(", ")}) 0 0 / ${x}px 100% repeat-x;`;
    const dateStr = WR.fmtDate(c.t.date, { weekday: "short", month: "short", day: "numeric" });
    done.innerHTML = `<div class="stack-lg">
      <div class="stack" style="justify-items:center; text-align:center; gap:10px"><p class="eyebrow">You're booked</p><h2>${c.pups.map((p) => WR.esc(p.name)).join(" & ")} ${c.pups.length > 1 ? "are" : "is"} on the list.</h2>
        <p class="muted">Your request is pending until our crew confirms it, usually within a couple of hours. We'll text you a payment link.</p></div>
      <article class="boarding" aria-label="Boarding pass">
        <div class="bp-main">
          <div class="bp-head"><img src="assets/logo-sm.png" alt=""><strong>Woof Bus</strong><span>Boarding pass</span></div>
          <div class="bp-route">
            <div><div class="code">${c.door ? "Home" : "Club"}</div><div class="place">${c.door ? "Your front door" : WR.esc(WR.state.clubhouse.name)}</div></div>
            <div class="bus" aria-hidden="true">🚌</div>
            <div class="to"><div class="code">${WR.esc(first.short.split(" ")[0])}</div><div class="place">${WR.esc(first.name)}${c.t.stops.length > 1 ? ` + ${c.t.stops.length - 1} more` : ""}</div></div>
          </div>
          <div class="bp-fields">
            <div class="bp-field wide"><small>Passenger${c.pups.length > 1 ? "s" : ""}</small><strong>${c.pups.map((p) => WR.esc(p.name)).join(", ")}</strong></div>
            <div class="bp-field"><small>Seat${seats.length > 1 ? "s" : ""}</small><strong>${seats.join(" ")}</strong></div>
            <div class="bp-field"><small>Class</small><strong>${c.t.premium ? "Road trip" : "Field trip"}</strong></div>
            <div class="bp-field wide"><small>Trip</small><strong>${WR.esc(c.t.name)}</strong></div>
            <div class="bp-field"><small>Date</small><strong>${dateStr}</strong></div>
            <div class="bp-field"><small>${c.door ? "Pickup" : "Boards"}</small><strong>${c.door ? "Window by text" : WR.fmtTime(c.t.times[0])}</strong></div>
            <div class="bp-field wide"><small>Extras</small><strong>${c.addons.map((a) => WR.esc(a.name)).join(", ") || "None"}</strong></div>
            <div class="bp-field"><small>Home by</small><strong>${WR.fmtTime(c.t.times[c.t.times.length - 1])}</strong></div>
            <div class="bp-field"><small>Total</small><strong>${WR.money(c.total)}</strong></div>
          </div>
        </div>
        <div class="bp-stub">
          <div class="bp-field"><small>Confirmation</small><strong style="font-size:1.6rem">${id}</strong></div>
          <div class="bp-field"><small>Passengers</small><strong>${c.pups.length} pup${c.pups.length > 1 ? "s" : ""} · ${dateStr}</strong></div>
          <div class="mini-stamp ink">Status<b>Pending</b></div>
          <div class="barcode" style="${barcode}" role="img" aria-label="Barcode for ${id}"></div>
        </div>
      </article>
      <div class="row" style="justify-content:center"><a class="btn" href="pup.html#${c.pups[0].id}">View ${WR.esc(c.pups[0].name)}'s Pup Passport</a><a class="btn ghost" href="book.html">Book another ride</a></div>
    </div>`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // Preselect the first open trip so the summary isn't empty.
  const open = [...form.querySelectorAll('input[name="trip"]:not(:disabled)')];
  const first = open.find((i) => !WR.trip(i.value).dogs.includes(pre)) || open[0]; if (first) first.checked = true;
  render();
})();
