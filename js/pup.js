/* Pup Passport page: profile, badges, report cards, stop photos, map. */
(function () {
  const S = WR.state;
  const raw = decodeURIComponent(location.hash.slice(1));
  const flag = (raw.match(/-(welcome|waiver)$/) || [])[1];
  const id = raw.replace(/-(welcome|waiver)$/, "");
  const d = WR.dog(id) || S.dogs[0];
  if (!WR.dog(id) && raw) WR.toast("We couldn't find that pup, so here's " + d.name + ".");
  document.title = d.name + "'s Pup Passport";

  const passNo = "WR-" + String(WR.hash(d.id) % 90000 + 10000);
  const issued = d.createdAt || new Date().toISOString().slice(0, 10);
  const stampDate = (iso) => WR.fmtDate(iso, { day: "2-digit", month: "short", year: "2-digit" }).toUpperCase();

  if (flag) {
    const w = document.getElementById("welcome"); w.hidden = false;
    w.className = "notice sea welcome-stamp";
    w.innerHTML = (flag === "welcome"
      ? `<div class="pstamp ink thump" style="--c:var(--sea);--r:-8deg"><span class="top">Passport</span><span class="em">🐾</span><span class="name">Issued</span><span class="date">${stampDate(issued)}</span></div>
         <div class="stack" style="gap:6px; flex:1 1 260px"><strong style="font-size:1.2rem">Welcome aboard, ${WR.esc(d.name)}!</strong><p>Pup Passport ${passNo} is issued and the waiver is on file. Next up: <a href="book.html#${d.id}">book a first ride</a> to earn the First Ride badge and your first stamp.</p></div>`
      : `<div class="pstamp ink thump rect" style="--c:var(--good);--r:6deg"><span class="top">Waiver</span><span class="em">✓</span><span class="name">Approved</span><span class="date">${stampDate(new Date().toISOString().slice(0, 10))}</span></div>
         <div class="stack" style="gap:6px; flex:1 1 260px"><strong style="font-size:1.2rem">Waiver signed.</strong><p>${WR.esc(d.name)} is cleared for field trips. <a href="book.html#${d.id}">Book a ride</a>.</p></div>`);
    history.replaceState(null, "", "#" + d.id);
  }
  document.getElementById("issued").innerHTML = `Passport<b>${passNo}</b>Issued ${stampDate(issued)}`;
  document.getElementById("passport-no").textContent = "No. " + passNo;

  // ---------- hero ----------
  document.getElementById("pup-photo").innerHTML = WR.dogPhoto(d);
  document.getElementById("pup-name").textContent = d.name;
  document.getElementById("pup-sub").textContent = [d.breed, d.sex, WR.ageOf(d.birthday), d.weight ? d.weight + " lbs" : ""].filter(Boolean).join(" · ");
  const vac = WR.vaccineStatus(d);
  document.getElementById("pup-pills").innerHTML =
    (d.temperament || []).map((t) => `<span class="pill">${WR.esc(t)}</span>`).join("") +
    (WR.waiverStatus(d) === "signed" ? `<span class="pill good">Waiver signed</span>` : `<a class="pill bad" href="join.html#waiver-${d.id}">Waiver needed · sign now</a>`) +
    `<span class="pill ${vac.level}">${WR.esc(vac.text)}</span>`;

  const trips = WR.dogTrips(d.id);
  const earned = WR.earnedBadges(d.id);
  const places = new Set(); trips.forEach((t) => WR.visitedStops(t, d.id).forEach((l) => places.add(l)));
  const miles = trips.reduce((sum, t) => { const rc = WR.reportCard(d.id, t.id); return sum + (rc && rc.facts && Number(rc.facts.miles) || 0); }, 0);
  document.getElementById("pup-stats").innerHTML = [
    [trips.length, "field trips"], [earned.size + "/" + S.badges.length, "badges earned"], [places.size, "places explored"], [miles.toFixed(1), "miles sniffed"]
  ].map(([n, l]) => `<div class="stat"><strong>${n}</strong><span>${l}</span></div>`).join("");

  // ---------- passport stamps ----------
  const firstVisit = {};
  trips.slice().reverse().forEach((t) => WR.visitedStops(t, d.id).forEach((l) => { if (!firstVisit[l]) firstVisit[l] = t.date; }));
  const shapes = ["", "rect", "oval"];
  const visitedLocs = S.locations.filter((l) => firstVisit[l.id]).sort((a, b) => firstVisit[a.id].localeCompare(firstVisit[b.id]));
  const notYet = S.locations.filter((l) => !firstVisit[l.id]);
  document.getElementById("stamp-head").textContent = `${visitedLocs.length} of ${S.locations.length} stamps collected`;
  document.getElementById("stamps").innerHTML = visitedLocs.map((l) => {
    const h = WR.hash(d.id + l.id), b = S.badges.find((x) => x.location === l.id);
    return `<div class="pstamp ink ${shapes[h % 3]}" style="--c:${b ? b.color : "var(--sunset)"};--r:${(h % 17) - 8}deg" title="${WR.esc(l.name)}"><span class="top">Woof Riders</span><span class="em" aria-hidden="true">${l.emoji}</span><span class="name">${WR.esc(l.short)}</span><span class="date">${stampDate(firstVisit[l.id])}</span></div>`;
  }).join("") + notYet.map((l) => `<div class="pstamp empty"><span class="top">Not yet</span><span class="em" aria-hidden="true">${l.emoji}</span><span class="name">${WR.esc(l.short)}</span></div>`).join("");

  // ---------- badges ----------
  document.getElementById("badge-head").textContent = earned.size ? `${earned.size} earned, ${S.badges.length - earned.size} to go` : "First badge is one ride away";
  const sorted = S.badges.slice().sort((a, b) => (earned.has(b.id) ? 1 : 0) - (earned.has(a.id) ? 1 : 0));
  document.getElementById("pup-badges").innerHTML = sorted.map((b) => {
    const e = earned.get(b.id);
    const b2 = Object.assign({}, b, { desc: e ? (e.date ? "Earned " + WR.fmtDate(e.date, { month: "short", day: "numeric" }) : "Awarded by the crew") : b.desc });
    return WR.medal(b2, e ? "" : "locked");
  }).join("");

  // ---------- trip journal ----------
  const pick = document.getElementById("trip-pick");
  let current = (trips.find((t) => t.status === "done") || trips[0] || {}).id;
  function renderPick() {
    pick.innerHTML = trips.length ? trips.map((t) => `<button type="button" aria-pressed="${t.id === current}" data-id="${t.id}">${WR.esc(t.name)}${t.status === "live" ? " · <span style='color:var(--sunset)'>live</span>" : ""}<small>${WR.fmtDate(t.date)}</small></button>`).join("") : "";
  }
  pick.addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; current = b.dataset.id; renderPick(); renderReport(); });

  function verdict(grades) {
    const vals = Object.values(grades || {}).map(WR.gradePaws); if (!vals.length) return "";
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const [label, c] = avg >= 4.6 ? ["Top Dog", "var(--good)"] : avg >= 3.8 ? ["Good Pup", "var(--sea)"] : ["Getting There", "var(--sunset)"];
    return `<div class="mini-stamp ink" style="--c:${c}">Verdict<b>${label}</b></div>`;
  }
  function renderReport() {
    const box = document.getElementById("report");
    if (!current) {
      box.innerHTML = `<div class="card empty" style="grid-column:1/-1"><strong>No field trips yet</strong><span>${WR.esc(d.name)}'s first report card shows up here after their first ride.</span><a class="btn" href="book.html#${d.id}">Book the first ride</a></div>`;
      return;
    }
    const t = WR.trip(current), rc = WR.reportCard(d.id, t.id);
    let card;
    if (rc.inProgress) {
      card = `<div class="report-card"><header><div><h3>${WR.esc(t.name)}</h3><span class="muted" style="color:inherit;opacity:.75">${WR.fmtDate(t.date, { weekday: "long", month: "long", day: "numeric" })}</span></div><span class="pill live">On the bus now</span></header>
        <div class="report-note"><p>${WR.esc(rc.note)}</p><a class="link-arrow" href="tracker.html">Follow the bus live</a></div></div>`;
    } else {
      const rows = S.subjects.map((s) => {
        const g = rc.grades[s.id] || "–", paws = WR.gradePaws(g);
        return `<div class="grade-row"><div><strong>${WR.esc(s.name)}</strong><div class="muted" style="font-size:.85rem">${WR.esc(s.hint)}</div></div>
          <span class="paws" aria-label="${paws} of 5 paws">${"🐾".repeat(paws)}<span class="off">${"🐾".repeat(5 - paws)}</span></span><span class="grade ${WR.gradeClass(g)}">${g}</span></div>`;
      }).join("");
      const f = rc.facts || {};
      card = `<div class="report-card"><header><div><h3>${WR.esc(t.name)}</h3><span style="opacity:.75">${WR.fmtDate(t.date, { weekday: "long", month: "long", day: "numeric" })}</span></div><span class="script">Pupdate Report</span></header>
        ${rows}
        <div class="report-note">${verdict(rc.grades)}<span class="script">Notes from the Pack Leader</span><p>${WR.esc(rc.note)}</p></div>
        <div class="report-facts">${f.miles ? `<span class="pill sea num">${f.miles} miles sniffed</span>` : ""}${f.treats ? `<span class="pill num">${f.treats} treats</span>` : ""}${f.buddy ? `<span class="pill">Best bus buddy: ${WR.esc(f.buddy)}</span>` : ""}</div></div>`;
    }
    const stops = t.status === "live" ? WR.visitedStops(t, d.id) : t.stops;
    const photos = stops.length ? stops.map((l) => {
      const L = WR.loc(l), b = S.badges.find((x) => x.location === l);
      return `<figure class="stop-photo" style="margin:0"><div class="post-art">${WR.stopPhoto(d.id, t.id, l)}</div><footer><strong>${L.emoji} ${WR.esc(L.short)}</strong>${b ? `<span class="pill" title="${WR.esc(b.name)} badge">${b.emoji}</span>` : ""}</footer></figure>`;
    }).join("") : `<div class="card empty" style="grid-column:1/-1"><span>Stop photos appear as the bus reaches each stop.</span></div>`;
    box.innerHTML = card + `<div class="stop-photos">${photos}</div>`;
  }
  renderPick(); renderReport();

  // ---------- map ----------
  if (window.L) {
    const map = L.map("map", { scrollWheelZoom: false });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, attribution: "&copy; OpenStreetMap contributors" }).addTo(map);
    const all = [S.clubhouse, ...S.locations];
    all.forEach((l) => {
      const been = l.id === "clubhouse" || places.has(l.id);
      L.marker([l.lat, l.lng], { icon: L.divIcon({ className: "", html: `<div class="stop-marker ${been ? "done" : ""}" style="${been ? "" : "opacity:.4;filter:grayscale(1)"}">${l.emoji}</div>`, iconSize: [40, 40], iconAnchor: [20, 20] }) })
        .addTo(map).bindPopup(`<h4>${WR.esc(l.name)}</h4><p>${been ? (l.id === "clubhouse" ? "Home base" : "Visited! Badge earned.") : "Not yet. Next adventure?"}</p>`);
    });
    // Most stops are in the metro; keep the far road trip from shrinking the view unless visited.
    const fit = all.filter((l) => l.id !== "sedona" || places.has("sedona"));
    map.fitBounds(L.latLngBounds(fit.map((l) => [l.lat, l.lng])).pad(0.15));
  }

  // ---------- facts ----------
  const row = (k, v) => v ? `<div class="row between" style="padding-block:10px; border-bottom:1px solid var(--line); flex-wrap:nowrap; align-items:start"><span class="muted" style="flex-shrink:0">${k}</span><strong style="text-align:right; min-width:0">${WR.esc(v)}</strong></div>` : "";
  document.getElementById("facts").innerHTML =
    row("Favorite things", d.likes) + row("Fears & triggers", d.fears) + row("Energy", d.energy) + row("Recall", d.recall) +
    row("Allergies", d.allergies) + row("Medications", d.meds) + row("Vet", d.vet && d.vet.name) + row("Pup parent", d.owner && d.owner.name) +
    `<div class="row" style="margin-top:16px"><a class="btn small" href="book.html#${d.id}">Book ${WR.esc(d.name)}'s next ride</a><button class="btn ghost small" type="button" id="share">Copy brag link</button></div>`;
  document.getElementById("share").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(location.href.split("#")[0] + "#" + d.id); WR.toast("Link copied. Go brag!"); }
    catch (e) { WR.toast("Copy didn't work here. The link is in your address bar."); }
  });
  window.addEventListener("hashchange", () => location.reload());
})();
