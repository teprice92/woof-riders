/* Pack Leader HQ: add and edit stops, design merit badges, schedule trips. */
window.WRStops = (function () {
  const $ = (id) => document.getElementById(id);
  const EMOJIS = ["🌵", "🌊", "🦋", "☕", "🥾", "🛶", "🌅", "🏙️", "⛲", "🪨", "🎃", "🌲", "🏖️", "🏞️", "🐟", "🦆", "🌻", "🍦", "🎡", "🏜️", "⛰️", "🌳", "🎾", "🥏", "🦴", "🍕", "🎨", "🚂", "🏟️", "🌮", "🐴", "🌈", "❄️", "🌸", "🏕️", "🎉"];
  const COLORS = ["#2f9e5b", "#1a9fd6", "#0e7490", "#0f9c96", "#8b5cf6", "#d946ef", "#f2602f", "#f97316", "#eab308", "#c2410c", "#b91c1c", "#a0673a", "#475569", "#10283d"];
  const IDEAS = {
    desert: ["Desert Dog", "Cactus Cruiser", "Mesa Mutt", "Dust Devil", "Canyon Canine", "Roadrunner Rover"],
    water: ["Splash Pawty", "Wave Woofer", "Puddle Jumper", "Dock Diver", "Paddle Paws", "Lake Legend"],
    park: ["Park Pal", "Zoomie Champ", "Fetch Fanatic", "Grass Roller", "Tail Wag Triumph", "Sniff Scout"],
    city: ["Big City Barker", "Patio Pup", "Street Sniffer", "Mural Mutt", "Downtown Doggo", "Sidewalk Strutter"],
    mountain: ["Trailblazer", "Peak Pup", "Summit Sniffer", "Ridge Rover", "Switchback Scout", "Boulder Buddy"],
    sunset: ["Sunset Snoozer", "Golden Hour Hound", "Dusk Dasher", "Twilight Tail", "Starlight Sniffer"],
    home: ["Adventure Pup", "Explorer Extraordinaire", "Road Trip Rookie", "Curious Canine", "Wanderwoof"]
  };
  const PATTERNS = ["{s} Sniffer", "{s} Explorer", "{s} Rover", "{s} Legend", "{s} Pup", "{s} Champ"];

  let S, onChange, editing = null, pin = null, map = null, marker = null, color = COLORS[0], spColor = COLORS[6], route = [];
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const slug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24) || "stop";
  const stampDate = (iso) => WR.fmtDate(iso, { day: "2-digit", month: "short", year: "2-digit" }).toUpperCase();
  const today = () => new Date().toISOString().slice(0, 10);

  function swatches(el, current, set) {
    el.innerHTML = COLORS.map((c) => `<button type="button" style="background:${c}" data-c="${c}" aria-label="Color ${c}" aria-pressed="${c === current}"></button>`).join("") +
      `<input type="color" value="${current}" aria-label="Custom color">`;
    el.onclick = (e) => { const b = e.target.closest("button[data-c]"); if (!b) return; set(b.dataset.c); swatches(el, b.dataset.c, set); };
    el.querySelector("input").oninput = (e) => { set(e.target.value); el.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", "false")); };
  }

  // ---------- preview ----------
  function preview() {
    const name = $("b-name").value.trim() || "Badge name", emoji = $("s-emoji").value.trim() || "🐾";
    const short = $("s-short").value.trim() || "New stop";
    $("b-preview").innerHTML = `<div class="medal" style="--c:${color}" aria-hidden="true">${WR.esc(emoji)}</div><h4>${WR.esc(name)}</h4><small>${WR.esc($("b-desc").value.trim() || "Badge description")}</small>`;
    $("stamp-preview").innerHTML = `<div class="pstamp worn" style="--c:${color};--r:-6deg"><span class="top">Woof Riders</span><span class="em" aria-hidden="true">${WR.esc(emoji)}</span><span class="name">${WR.esc(short)}</span><span class="date">${stampDate(today())}</span></div>`;
    if (marker) marker.setIcon(icon());
  }
  const icon = () => L.divIcon({ className: "", html: `<div class="stop-marker here">${WR.esc($("s-emoji").value.trim() || "📍")}</div>`, iconSize: [40, 40], iconAnchor: [20, 20] });

  function setPin(lat, lng, zoom) {
    pin = { lat: +lat.toFixed(5), lng: +lng.toFixed(5) };
    if (map) {
      if (!marker) { marker = L.marker([pin.lat, pin.lng], { draggable: true, icon: icon() }).addTo(map); marker.on("dragend", () => { const p = marker.getLatLng(); setPin(p.lat, p.lng); }); }
      else marker.setLatLng([pin.lat, pin.lng]);
      if (zoom) map.setView([pin.lat, pin.lng], zoom);
    }
    $("s-coords").textContent = `Pin at ${pin.lat}, ${pin.lng}. Drag it to fine-tune.`;
  }

  function initMap() {
    if (map || !window.L) return;
    map = L.map("pick-map", { scrollWheelZoom: false });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, attribution: "&copy; OpenStreetMap contributors" }).addTo(map);
    // Show existing stops faintly for reference.
    [S.clubhouse, ...S.locations].forEach((l) => L.marker([l.lat, l.lng], { interactive: false, icon: L.divIcon({ className: "", html: `<div class="stop-marker" style="opacity:.45;transform:scale(.8)">${l.emoji}</div>`, iconSize: [40, 40], iconAnchor: [20, 20] }) }).addTo(map));
    map.fitBounds(L.latLngBounds(S.locations.filter((l) => l.id !== "sedona").map((l) => [l.lat, l.lng])).pad(0.2));
    map.on("click", (e) => setPin(e.latlng.lat, e.latlng.lng));
    WR.touchSafeMap(map, $("pick-map"));
    if (pin) setPin(pin.lat, pin.lng, 13);
  }

  // ---------- stop form ----------
  function resetForm() {
    editing = null; pin = null; if (marker && map) { map.removeLayer(marker); marker = null; }
    $("stop-form").reset(); $("s-emoji").value = "🎃"; color = pick(COLORS);
    $("stop-form-title").textContent = "Add a stop"; $("stop-save").textContent = "Add stop & badge"; $("stop-cancel").hidden = true;
    $("s-coords").textContent = "Tap the map to drop the pin, then drag it to fine-tune.";
    renderEmoji(); swatches($("b-colors"), color, (c) => { color = c; preview(); }); preview();
  }
  function renderEmoji() {
    const cur = $("s-emoji").value.trim();
    $("emoji-pick").innerHTML = EMOJIS.map((e) => `<button type="button" aria-pressed="${e === cur}" aria-label="${e}">${e}</button>`).join("");
  }
  function surprise() {
    const scene = $("s-scene").value, short = $("s-short").value.trim() || $("s-name").value.trim();
    const taken = new Set(S.badges.map((b) => b.name.toLowerCase()));
    const word = short.split(/\s+/)[0];
    const options = [...IDEAS[scene], ...(word ? PATTERNS.map((p) => p.replace("{s}", word)) : [])].filter((n) => !taken.has(n.toLowerCase()) && n !== $("b-name").value);
    $("b-name").value = options.length ? pick(options) : "Adventure Pup " + (S.badges.length + 1);
    if (!$("b-desc").value.trim() || $("b-desc").dataset.auto === "1") { $("b-desc").value = short ? `Explored ${short}.` : ""; $("b-desc").dataset.auto = "1"; }
    preview();
  }
  function edit(id) {
    const l = WR.loc(id), b = S.badges.find((x) => x.location === id);
    editing = id; document.querySelector('[data-panel="stops"]').scrollIntoView({ behavior: "smooth" });
    $("s-name").value = l.name; $("s-short").value = l.short; $("s-blurb").value = l.blurb; $("s-scene").value = l.scene; $("s-emoji").value = l.emoji;
    $("b-name").value = b ? b.name : ""; $("b-desc").value = b ? b.desc : ""; color = b ? b.color : color;
    $("stop-form-title").textContent = "Edit " + l.short; $("stop-save").textContent = "Save changes"; $("stop-cancel").hidden = false;
    renderEmoji(); swatches($("b-colors"), color, (c) => { color = c; preview(); });
    setPin(l.lat, l.lng, 13); preview();
  }
  function save(e) {
    e.preventDefault();
    for (const id of ["s-name", "s-short", "s-blurb", "s-emoji", "b-name", "b-desc"]) { const el = $(id); if (!el.value.trim()) { el.setCustomValidity("Please fill this in."); el.reportValidity(); el.setCustomValidity(""); return; } }
    if (!pin) { WR.toast("Drop a pin on the map so the bus knows where to go."); $("pick-map").scrollIntoView({ behavior: "smooth", block: "center" }); return; }
    const v = (id) => $(id).value.trim();
    const dupe = S.badges.find((b) => b.name.toLowerCase() === v("b-name").toLowerCase() && b.location !== editing);
    if (dupe) { WR.toast(`There's already a badge called ${dupe.name}. Try another name.`); return; }
    if (editing) {
      const l = WR.loc(editing);
      Object.assign(l, { name: v("s-name"), short: v("s-short"), blurb: v("s-blurb"), scene: v("s-scene"), emoji: v("s-emoji"), lat: pin.lat, lng: pin.lng, edited: true });
      let b = S.badges.find((x) => x.location === editing);
      if (!b) { b = { id: slug(v("b-name")) + "-" + WR.uid(), kind: "place", location: editing }; S.badges.push(b); l.badge = b.id; }
      Object.assign(b, { name: v("b-name"), emoji: v("s-emoji"), color, desc: v("b-desc"), edited: true });
      if (WR.save()) WR.toast(`${l.short} updated.`);
    } else {
      const id = slug(v("s-short")) + "-" + WR.uid(), bid = slug(v("b-name")) + "-" + WR.uid();
      S.locations.push({ id, name: v("s-name"), short: v("s-short"), lat: pin.lat, lng: pin.lng, emoji: v("s-emoji"), scene: v("s-scene"), badge: bid, blurb: v("s-blurb"), custom: true, edited: true });
      S.badges.push({ id: bid, name: v("b-name"), emoji: v("s-emoji"), color, kind: "place", location: id, desc: v("b-desc"), custom: true, edited: true });
      if (WR.save()) WR.toast(`${v("s-short")} added with the ${v("b-name")} badge. Add it to a trip on the Trips tab.`);
    }
    resetForm(); renderStops(); renderTripStops(); onChange && onChange();
  }

  function renderStops() {
    $("stops-body").innerHTML = S.locations.map((l) => {
      const b = S.badges.find((x) => x.location === l.id), n = S.trips.filter((t) => t.stops.includes(l.id)).length;
      return `<tr style="${l.retired ? "opacity:.55" : ""}"><td><strong>${l.emoji} ${WR.esc(l.short)}</strong><br><small class="muted">${WR.esc(l.name)}</small></td>
        <td>${b ? `<span class="row" style="gap:8px;flex-wrap:nowrap"><span class="medal" style="--c:${b.color};width:34px;height:34px;font-size:.95rem;border-width:3px" aria-hidden="true">${b.emoji}</span>${WR.esc(b.name)}</span>` : "—"}</td>
        <td class="num">${n}</td><td>${l.retired ? '<span class="pill">Retired</span>' : '<span class="pill good">Active</span>'}${l.custom ? ' <span class="pill sea">New</span>' : ""}</td>
        <td><div class="row" style="flex-wrap:nowrap;gap:6px"><button class="btn ghost small" type="button" data-edit="${l.id}">Edit</button><button class="btn ghost small" type="button" data-retire="${l.id}">${l.retired ? "Restore" : "Retire"}</button></div></td></tr>`;
    }).join("");
  }

  // ---------- special badges ----------
  function saveSpecial(e) {
    e.preventDefault();
    for (const id of ["sp-name", "sp-emoji", "sp-desc"]) { const el = $(id); if (!el.value.trim()) { el.setCustomValidity("Please fill this in."); el.reportValidity(); el.setCustomValidity(""); return; } }
    const name = $("sp-name").value.trim();
    if (S.badges.some((b) => b.name.toLowerCase() === name.toLowerCase())) return WR.toast(`There's already a badge called ${name}.`);
    S.badges.push({ id: slug(name) + "-" + WR.uid(), name, emoji: $("sp-emoji").value.trim(), color: spColor, kind: "special", desc: $("sp-desc").value.trim(), custom: true, edited: true });
    if (WR.save()) { WR.toast(`${name} created. Award it from Report cards.`); $("special-form").reset(); onChange && onChange(); }
  }

  // ---------- trips ----------
  function renderTripStops() {
    const active = S.locations.filter((l) => !l.retired);
    route = route.filter((id) => active.some((l) => l.id === id));
    $("t-stops").innerHTML = active.map((l) => { const i = route.indexOf(l.id); return `<label class="chip"><input type="checkbox" value="${l.id}" ${i >= 0 ? "checked" : ""}><span>${i >= 0 ? `<b class="ord">${i + 1}</b>` : ""}${l.emoji} ${WR.esc(l.short)}</span></label>`; }).join("");
    $("t-order").textContent = route.length ? "Route: Clubhouse → " + route.map((id) => WR.loc(id).short).join(" → ") + " → Clubhouse" : "Tap stops to add them to the route, in order.";
  }
  function renderTrips() {
    const list = S.trips.filter((t) => t.status !== "done").sort((a, b) => a.date.localeCompare(b.date));
    $("trips-body").innerHTML = list.map((t) => `<tr><td class="num">${WR.fmtDate(t.date)}${t.status === "live" ? ' <span class="pill live">Today</span>' : ""}</td><td><strong>${WR.esc(t.name)}</strong>${t.custom ? ' <span class="pill sea">New</span>' : ""}</td>
      <td><small>${t.stops.map((id) => WR.loc(id).emoji + " " + WR.esc(WR.loc(id).short)).join(" → ")}</small></td><td class="num">${WR.seatsLeft(t)}</td>
      <td>${t.custom && !t.dogs.length ? `<button class="btn ghost small" type="button" data-deltrip="${t.id}">Remove</button>` : ""}</td></tr>`).join("");
  }
  function saveTrip(e) {
    e.preventDefault();
    for (const id of ["t-name", "t-date", "t-start", "t-end", "t-cap"]) { const el = $(id); if (!el.checkValidity() || !el.value.trim()) { el.reportValidity(); return; } }
    if (!route.length) return WR.toast("Add at least one stop to the route.");
    const toMin = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
    const a = toMin($("t-start").value), z = toMin($("t-end").value);
    if (z - a < 60 * (route.length)) return WR.toast("Leave at least an hour per stop between departure and home time.");
    const step = (z - a) / (route.length + 1);
    const times = [...Array(route.length + 1)].map((_, i) => { const m = Math.round((a + i * step) / 5) * 5; return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`; });
    times.push($("t-end").value);
    const date = $("t-date").value;
    S.trips.push({ id: "trip-" + WR.uid(), name: $("t-name").value.trim(), date, status: WR.statusFor(date), stops: route.slice(), times, dogs: [], capacity: Number($("t-cap").value), premium: $("t-premium").checked, custom: true });
    if (WR.save()) { const nm = $("t-name").value.trim(); WR.toast(WR.statusFor(date) === "live" ? `${nm} is running today and showing on the live tracker.` : `${nm} is on the schedule and open for booking.`); $("trip-form").reset(); setDefaultDate(); $("t-start").value = "08:30"; $("t-end").value = "16:00"; $("t-cap").value = 12; route = []; renderTripStops(); renderTrips(); renderStops(); }
  }

  function setDefaultDate() { const d = new Date(); d.setDate(d.getDate() + 7); $("t-date").min = today(); $("t-date").value = d.toISOString().slice(0, 10); }

  function init(cb) {
    S = WR.state; onChange = cb;
    resetForm(); renderStops(); renderTripStops(); renderTrips();
    swatches($("sp-colors"), spColor, (c) => (spColor = c));
    setDefaultDate();

    ["s-name", "s-short", "s-blurb", "b-name"].forEach((id) => $(id).addEventListener("input", preview));
    $("b-desc").addEventListener("input", () => { $("b-desc").dataset.auto = "0"; preview(); });
    $("s-emoji").addEventListener("input", () => { renderEmoji(); preview(); });
    $("emoji-pick").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; $("s-emoji").value = b.textContent; renderEmoji(); preview(); });
    $("s-scene").addEventListener("change", () => { if (!$("b-name").value.trim()) surprise(); });
    $("s-short").addEventListener("change", () => { if (!$("b-name").value.trim()) surprise(); });
    $("b-surprise").addEventListener("click", surprise);
    $("stop-form").addEventListener("submit", save);
    $("stop-cancel").addEventListener("click", resetForm);
    $("special-form").addEventListener("submit", saveSpecial);
    $("trip-form").addEventListener("submit", saveTrip);
    $("t-stops").addEventListener("change", (e) => { const id = e.target.value; route = e.target.checked ? [...route, id] : route.filter((x) => x !== id); renderTripStops(); });
    $("stops-body").addEventListener("click", (e) => {
      const ed = e.target.closest("[data-edit]"), rt = e.target.closest("[data-retire]");
      if (ed) edit(ed.dataset.edit);
      if (rt) { const l = WR.loc(rt.dataset.retire); l.retired = !l.retired; l.edited = true; if (WR.save()) WR.toast(l.retired ? `${l.short} retired. Pups keep the badges they earned there.` : `${l.short} is back in rotation.`); renderStops(); renderTripStops(); }
    });
    $("trips-body").addEventListener("click", (e) => { const b = e.target.closest("[data-deltrip]"); if (!b) return; S.trips = S.trips.filter((t) => t.id !== b.dataset.deltrip); if (WR.save()) WR.toast("Trip removed."); renderTrips(); });

    $("s-find").addEventListener("click", async () => {
      const q = $("s-search").value.trim(); if (!q) return;
      try {
        const r = await fetch("https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" + encodeURIComponent(q));
        const [hit] = await r.json();
        if (!hit) return WR.toast("No match for that address. Try adding the city, or tap the map.");
        setPin(Number(hit.lat), Number(hit.lon), 15);
        if (!$("s-name").value.trim()) $("s-name").value = hit.display_name.split(",").slice(0, 2).join(",");
        preview();
      } catch (err) { WR.toast("Address search isn't available right now. Tap the map to drop the pin."); }
    });
    $("s-here").addEventListener("click", () => {
      if (!navigator.geolocation) return WR.toast("This device can't share its location.");
      navigator.geolocation.getCurrentPosition((p) => setPin(p.coords.latitude, p.coords.longitude, 15), () => WR.toast("Location permission was denied. Tap the map instead."));
    });
    // Leaflet needs a visible container to size itself.
    document.getElementById("tabs").addEventListener("click", (e) => { const b = e.target.closest("[data-tab]"); if (b && b.dataset.tab === "stops") setTimeout(() => { initMap(); map && map.invalidateSize(); }, 30); });
  }
  return { init };
})();
