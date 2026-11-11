/* Pack Leader HQ: staff dashboard.
   The PIN gate is a speed bump for the demo, NOT real security. When the site
   moves to a hosted database, protect this page with real staff accounts. */
(function () {
  const S = WR.state;
  const PIN = "WOOF";
  const $ = (id) => document.getElementById(id);
  const opt = (v, label, sel) => `<option value="${WR.esc(v)}" ${sel ? "selected" : ""}>${WR.esc(label)}</option>`;

  function unlock() { $("gate").hidden = true; $("hq").hidden = false; try { sessionStorage.setItem("wr:hq", "1"); } catch (e) {} init(); }
  $("gate").addEventListener("submit", (e) => { e.preventDefault(); if ($("pin").value.trim().toUpperCase() === PIN) unlock(); else WR.toast("That PIN didn't match. Try WOOF for the demo."); });
  try { if (sessionStorage.getItem("wr:hq") === "1") unlock(); } catch (e) {}

  function init() {
    const live = WR.liveTrip();
    S.checkins = S.checkins || {};

    // ---------- tabs ----------
    $("tabs").addEventListener("click", (e) => {
      const b = e.target.closest("button[data-tab]"); if (!b) return;
      document.querySelectorAll("#tabs button").forEach((x) => x.setAttribute("aria-selected", x === b));
      document.querySelectorAll("[data-panel]").forEach((p) => (p.hidden = p.dataset.panel !== b.dataset.tab));
    });

    // ---------- KPIs ----------
    function kpis() {
      const pending = S.reservations.filter((r) => r.status === "pending").length;
      const missing = S.dogs.filter((d) => WR.waiverStatus(d) === "missing").length;
      const vax = S.dogs.filter((d) => WR.vaccineStatus(d).level !== "good").length;
      const aboard = live ? live.dogs.filter(WR.dog).length : 0;
      $("kpis").innerHTML = [[aboard, "pups on today's bus"], [pending, "reservations to confirm"], [missing, "waivers missing"], [vax, "vaccine alerts"]]
        .map(([n, l]) => `<div class="card kpi"><strong>${n}</strong><span>${l}</span></div>`).join("");
    }
    kpis();

    // ---------- today's trip ----------
    if (live) {
      const pts = WR.route(live);
      $("bus-at").innerHTML = opt("auto", "Follow the schedule", S.live.manualStop == null) +
        pts.map((id, i) => opt(i, `${WR.fmtTime(live.times[i])} · ${i === pts.length - 1 ? "Back at clubhouse" : WR.loc(id).short}`, S.live.manualStop === i)).join("");
      const status = () => {
        const p = WR.progress(live);
        $("bus-status").textContent = `${live.name}: ` + (p.phase === "driving" ? `driving to ${WR.loc(pts[p.to]).short}` : p.phase === "home" ? "back at the clubhouse" : p.phase === "boarding" ? "boarding" : `at ${WR.loc(pts[p.at]).short}`) + (S.live.gps ? " · GPS sharing on" : "");
      };
      status();
      $("bus-at").addEventListener("change", (e) => { S.live.manualStop = e.target.value === "auto" ? null : Number(e.target.value); WR.save(); status(); WR.toast("Bus location updated on the tracker."); });

      let watch = null;
      $("gps-btn").addEventListener("click", () => {
        if (!navigator.geolocation) return WR.toast("This device can't share location.");
        watch = navigator.geolocation.watchPosition((pos) => { S.live.gps = { lat: pos.coords.latitude, lng: pos.coords.longitude, at: Date.now() }; WR.save(); status(); },
          () => WR.toast("Location permission was denied."), { enableHighAccuracy: true, maximumAge: 15000 });
        $("gps-btn").hidden = true; $("gps-stop").hidden = false; WR.toast("Sharing GPS. Keep this page open.");
      });
      $("gps-stop").addEventListener("click", () => { if (watch != null) navigator.geolocation.clearWatch(watch); S.live.gps = null; WR.save(); $("gps-btn").hidden = false; $("gps-stop").hidden = true; status(); });

      $("pu-stop").innerHTML = pts.filter((id, i) => !(id === "clubhouse" && i > 0)).map((id) => opt(id, WR.loc(id).short)).join("");
      const p = WR.progress(live); $("pu-stop").value = pts[Math.min(p.at, pts.length - 2)];
      $("pu-tags").innerHTML = live.dogs.map(WR.dog).filter(Boolean).map((d) => `<label class="chip"><input type="checkbox" value="${d.id}"><span>${WR.esc(d.name)}</span></label>`).join("");
      $("pu-post").addEventListener("click", async () => {
        const url = $("pu-url").value.trim(), cap = $("pu-cap").value.trim(), file = $("pu-img").files[0];
        const now = new Date(), time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
        const tags = [...document.querySelectorAll("#pu-tags input:checked")].map((i) => i.value);
        if (url) {
          if (!/^https:\/\/(www\.)?instagram\.com\/(p|reel)\//.test(url)) return WR.toast("That doesn't look like an Instagram post link.");
          S.igPosts.push({ id: WR.uid("ig"), trip: live.id, location: $("pu-stop").value, url, time });
        } else if (cap || file) {
          let image = null; if (file) { try { image = await WR.readImage(file, 900); } catch (e) { return WR.toast("That photo didn't load."); } }
          S.posts.push({ id: WR.uid("p"), trip: live.id, location: $("pu-stop").value, time, caption: cap, image, likes: 0, dogs: tags });
        } else return WR.toast("Add an Instagram link, or a caption or photo.");
        if (WR.save()) { WR.toast("Posted! It's live on the tracker."); ["pu-url", "pu-cap", "pu-img"].forEach((id) => ($(id).value = "")); }
      });

      const ck = (S.checkins[live.id] = S.checkins[live.id] || {});
      const roster = () => {
        const list = live.dogs.map(WR.dog).filter(Boolean);
        $("roster").innerHTML = list.map((d) => `<label><input type="checkbox" data-id="${d.id}" ${ck[d.id] ? "checked" : ""} style="width:20px;height:20px;accent-color:var(--sea)"><span class="avatar" style="background:${d.avatarBg}">${d.photo ? `<img src="${d.photo}" alt="">` : d.emoji}</span><span><strong>${WR.esc(d.name)}</strong><br><small class="muted">${WR.esc(d.allergies && d.allergies !== "None" ? "Allergy: " + d.allergies : d.breed)}</small></span></label>`).join("");
        $("checkin-count").textContent = `${list.filter((d) => ck[d.id]).length} of ${list.length} aboard`;
      };
      roster();
      $("roster").addEventListener("change", (e) => { ck[e.target.dataset.id] = e.target.checked; WR.save(); roster(); });
    } else {
      document.querySelector('[data-panel="trip"]').innerHTML = `<div class="card empty"><strong>No trip running today</strong><span>Enjoy the day off, Pack Leader.</span></div>`;
    }

    // ---------- report cards ----------
    const gradable = S.trips.filter((t) => t.status !== "upcoming").sort((a, b) => b.date.localeCompare(a.date));
    $("rc-trip").innerHTML = gradable.map((t) => opt(t.id, `${WR.fmtDate(t.date)} · ${t.name}${t.status === "live" ? " (today)" : ""}`)).join("");
    const GR = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "D"];
    function fillDogs() { const t = WR.trip($("rc-trip").value); $("rc-dog").innerHTML = t.dogs.map(WR.dog).filter(Boolean).map((d) => opt(d.id, d.name)).join(""); fillCard(); }
    function fillCard() {
      const t = WR.trip($("rc-trip").value), d = WR.dog($("rc-dog").value); if (!d) return;
      const rc = WR.reportCard(d.id, t.id) || {}; const g = rc.grades || {}; const f = rc.facts || {};
      $("rc-grades").innerHTML = S.subjects.map((s) => `<div class="grade-select"><label for="g-${s.id}"><strong>${WR.esc(s.name)}</strong><br><small class="muted">${WR.esc(s.hint)}</small></label><select id="g-${s.id}">${GR.map((x) => opt(x, x, (g[s.id] || "A") === x)).join("")}</select></div>`).join("");
      $("rc-note").value = rc.inProgress ? "" : rc.note || "";
      $("rc-miles").value = f.miles || ""; $("rc-treats").value = f.treats || "";
      $("rc-buddy").innerHTML = opt("", "None") + t.dogs.filter((x) => x !== d.id).map(WR.dog).filter(Boolean).map((b) => opt(b.name, b.name, f.buddy === b.name)).join("");
      const have = WR.earnedBadges(d.id);
      $("rc-award").innerHTML = opt("", "No bonus badge") + S.badges.filter((b) => !have.has(b.id)).map((b) => opt(b.id, `${b.emoji} ${b.name}`)).join("");
      const stops = t.stops;
      $("rc-photos").innerHTML = stops.map((l) => {
        const key = `${d.id}:${t.id}:${l}`, L = WR.loc(l);
        return `<label class="photo-drop">${S.photos[key] ? `<img src="${S.photos[key]}" alt="">` : `<span>${L.emoji}<br>Upload photo</span>`}<span class="cap">${WR.esc(L.short)}</span><input type="file" accept="image/*" data-key="${key}" aria-label="Photo for ${WR.esc(L.short)}"></label>`;
      }).join("");
    }
    $("rc-trip").addEventListener("change", fillDogs);
    $("rc-dog").addEventListener("change", fillCard);
    $("rc-photos").addEventListener("change", async (e) => {
      const f = e.target.files[0], key = e.target.dataset.key; if (!f) return;
      try { S.photos[key] = await WR.readImage(f, 900); } catch (err) { return WR.toast("That photo didn't load."); }
      if (WR.save()) { WR.toast("Photo added to the Pup Passport."); fillCard(); }
    });
    $("rc-save").addEventListener("click", () => {
      const t = $("rc-trip").value, d = $("rc-dog").value, grades = {};
      S.subjects.forEach((s) => (grades[s.id] = $("g-" + s.id).value));
      S.reportCards[`${d}:${t}`] = { grades, note: $("rc-note").value.trim() || "Had a pawsome day with the pack!", facts: { miles: $("rc-miles").value, treats: $("rc-treats").value, buddy: $("rc-buddy").value } };
      const award = $("rc-award").value; if (award) { S.awards[d] = S.awards[d] || []; S.awards[d].push(award); }
      if (WR.save()) { WR.toast(`Report card saved for ${WR.dog(d).name}.`); fillCard(); }
    });
    fillDogs();

    // ---------- reservations ----------
    function res() {
      const list = S.reservations.slice().sort((a, b) => (WR.trip(a.tripId)?.date || "").localeCompare(WR.trip(b.tripId)?.date || ""));
      $("res-body").innerHTML = list.length ? list.map((r) => {
        const t = WR.trip(r.tripId);
        return `<tr><td class="num"><strong>${WR.esc(r.id)}</strong></td><td>${t ? `${WR.fmtDate(t.date)}<br><small class="muted">${WR.esc(t.name)}</small>` : "—"}</td>
          <td>${r.dogIds.map((id) => WR.dog(id)).filter(Boolean).map((d) => `<a href="pup.html#${d.id}">${WR.esc(d.name)}</a>`).join(", ")}</td>
          <td>${WR.esc(r.ownerName)}<br><small class="muted">${WR.esc(r.ownerPhone || r.ownerEmail || "")}</small></td>
          <td><small>${[r.pickup === "door" ? "Door pickup" : "", ...r.addons.map((a) => (S.pricing.addons.find((x) => x.id === a) || {}).name)].filter(Boolean).map(WR.esc).join("<br>") || "—"}</small></td>
          <td class="num">${WR.money(r.total)}</td>
          <td><select data-res="${r.id}" aria-label="Status for ${r.id}">${["pending", "confirmed", "cancelled"].map((s) => opt(s, s[0].toUpperCase() + s.slice(1), r.status === s)).join("")}</select></td></tr>`;
      }).join("") : `<tr><td colspan="7" class="muted">No reservations yet.</td></tr>`;
    }
    res();
    $("res-body").addEventListener("change", (e) => {
      const r = S.reservations.find((x) => x.id === e.target.dataset.res); if (!r) return;
      const t = WR.trip(r.tripId);
      if (e.target.value === "cancelled" && t) t.dogs = t.dogs.filter((id) => !r.dogIds.includes(id));
      if (r.status === "cancelled" && e.target.value !== "cancelled" && t) r.dogIds.forEach((id) => { if (!t.dogs.includes(id)) t.dogs.push(id); });
      r.status = e.target.value; if (WR.save()) { WR.toast(`${r.id} marked ${r.status}.`); kpis(); }
    });

    // ---------- pups ----------
    $("pups-body").innerHTML = S.dogs.map((d) => {
      const v = WR.vaccineStatus(d), w = WR.waiverStatus(d);
      return `<tr><td><strong>${WR.esc(d.name)}</strong><br><small class="muted">${WR.esc(d.breed)}</small></td>
        <td>${WR.esc(d.owner?.name || "")}<br><small class="muted">${WR.esc(d.owner?.phone || "")}</small></td>
        <td>${w === "signed" ? `<span class="pill good">Signed ${WR.fmtDate(d.waiver.signedAt, { month: "short", day: "numeric" })}</span>` : `<span class="pill bad">Missing</span>`}</td>
        <td><span class="pill ${v.level}">${WR.esc(v.text)}</span></td>
        <td><small>${WR.esc([d.allergies, d.meds].filter((x) => x && x !== "None").join(" · ") || "None")}</small></td>
        <td><a class="link-arrow" href="pup.html#${d.id}">Passport</a></td></tr>`;
    }).join("");

    // ---------- settings ----------
    $("reset-ask").addEventListener("click", () => { $("reset-yes").hidden = false; });
    $("reset-yes").addEventListener("click", () => { WR.reset(); WR.save(); location.reload(); });
  }
})();
