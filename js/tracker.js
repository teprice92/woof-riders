/* Live tracker: map, moving bus, stop markers and the Pupdates feed. */
(function () {
  const S = WR.state, t = WR.liveTrip() || S.trips.filter((x) => x.status === "done").sort((a, b) => b.date.localeCompare(a.date))[0];
  const pts = WR.route(t), locs = pts.map(WR.loc);
  let replayNow = null, replayTimer = null, filter = "all";

  document.getElementById("trip-name").textContent = t.name;
  document.getElementById("trip-date").textContent = WR.fmtDate(t.date, { weekday: "long", month: "long", day: "numeric" });
  document.getElementById("t-start").textContent = "Departs " + WR.fmtTime(t.times[0]);
  document.getElementById("t-end").textContent = "Home by " + WR.fmtTime(t.times[t.times.length - 1]);

  // ---------- map ----------
  let map = null, busMarker = null, stopMarkers = [];
  const curves = [];
  // Gentle arcs between stops (straight lines look robotic).
  for (let i = 0; i < locs.length - 1; i++) {
    const a = locs[i], b = locs[i + 1];
    const mx = (a.lat + b.lat) / 2, my = (a.lng + b.lng) / 2, dx = b.lat - a.lat, dy = b.lng - a.lng;
    curves.push({ a, b, c: { lat: mx - dy * 0.22, lng: my + dx * 0.22 } });
  }
  const bez = (s, f) => ({ lat: (1 - f) ** 2 * s.a.lat + 2 * (1 - f) * f * s.c.lat + f * f * s.b.lat, lng: (1 - f) ** 2 * s.a.lng + 2 * (1 - f) * f * s.c.lng + f * f * s.b.lng });

  if (window.L) {
    map = L.map("map", { scrollWheelZoom: false, zoomControl: true });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, attribution: "&copy; OpenStreetMap contributors" }).addTo(map);
    curves.forEach((s, i) => {
      const line = []; for (let k = 0; k <= 24; k++) { const p = bez(s, k / 24); line.push([p.lat, p.lng]); }
      s.line = L.polyline(line, { color: "#0f9c96", weight: 5, opacity: .85, dashArray: i === curves.length - 1 ? "2 10" : null, lineCap: "round" }).addTo(map);
    });
    pts.forEach((id, i) => {
      if (id === "clubhouse" && i > 0) return;
      const l = WR.loc(id);
      const m = L.marker([l.lat, l.lng], { icon: L.divIcon({ className: "", html: `<div class="stop-marker">${l.emoji}</div>`, iconSize: [40, 40], iconAnchor: [20, 20] }) }).addTo(map);
      m.on("click", () => setFilter(id));
      stopMarkers[i] = m;
    });
    busMarker = L.marker([locs[0].lat, locs[0].lng], { zIndexOffset: 1000, icon: L.divIcon({ className: "", html: `<div class="bus-marker"><img src="assets/favicon.png" alt="Woof Bus"></div>`, iconSize: [54, 54], iconAnchor: [27, 27] }) }).addTo(map);
    busMarker.bindTooltip("The Woof Bus", { direction: "top", offset: [0, -26] });
    map.fitBounds(L.latLngBounds(locs.map((l) => [l.lat, l.lng])).pad(0.25));
    WR.touchSafeMap(map, document.getElementById("map"));
  } else {
    document.getElementById("map").innerHTML = `<div class="empty">Map couldn't load. The itinerary below shows where the bus is.</div>`;
  }

  // ---------- render ----------
  function postsFor(p) {
    const clock = replayNow || (S.live.manualStop == null && t.status === "live" ? new Date() : null);
    const nowStr = clock ? `${String(clock.getHours()).padStart(2, "0")}:${String(clock.getMinutes()).padStart(2, "0")}` : null;
    const reachedIds = new Set(pts.slice(0, p.reached + 1));
    const sample = S.posts.filter((x) => x.trip === t.id && reachedIds.has(x.location) && (!nowStr || x.time <= nowStr));
    const ig = (S.igPosts || []).filter((x) => x.trip === t.id);
    return [...ig, ...sample].sort((a, b) => (b.time || "").localeCompare(a.time || ""));
  }
  function postHTML(x) {
    const l = WR.loc(x.location);
    const head = `<div class="post-head"><span class="avatar"><img src="assets/favicon.png" alt=""></span><div><strong>woofriders</strong><small>${WR.esc(l.short)}${x.time ? " · " + WR.fmtTime(x.time) : ""}</small></div></div>`;
    if (x.url) {
      return `<article class="post">${head}<blockquote class="instagram-media" data-instgrm-permalink="${WR.esc(x.url)}" data-instgrm-version="14"><a href="${WR.esc(x.url)}" target="_blank" rel="noopener">View this Pupdate on Instagram</a></blockquote></article>`;
    }
    const pups = (x.dogs || []).map(WR.dog).filter(Boolean);
    const art = x.image ? `<img src="${x.image}" alt="">` : WR.scene(l.scene, pups.slice(0, 3).map((d) => d.emoji).join("") || l.emoji, "Sample post");
    return `<article class="post">${head}<div class="post-art">${art}</div><div class="post-body">
      <span class="likes num">♥ ${x.likes || 0} likes</span><p>${WR.esc(x.caption)}</p>
      ${pups.length ? `<p class="where">${pups.map((d) => `<a href="pup.html#${d.id}">@${WR.esc(d.name.toLowerCase())}</a>`).join(" ")}</p>` : ""}</div></article>`;
  }
  let lastFeedKey = "";
  function renderFeed(p) {
    const all = postsFor(p);
    const list = filter === "all" ? all : all.filter((x) => x.location === filter);
    const key = filter + "|" + list.map((x) => x.id).join(",");
    if (key === lastFeedKey) return; lastFeedKey = key;
    const feed = document.getElementById("feed");
    feed.innerHTML = list.length ? list.map(postHTML).join("") : `<div class="empty"><strong>No Pupdates here yet</strong><span>Posts appear as soon as the crew shares them from this stop.</span></div>`;
    if (list.some((x) => x.url)) loadInstagram();
  }
  function setFilter(id) {
    filter = id;
    document.querySelectorAll("#feed-filter input").forEach((i) => (i.checked = i.value === id));
    render();
  }
  function renderFilter() {
    const opts = [["all", "All stops"], ...pts.filter((id, i) => !(id === "clubhouse" && i > 0)).map((id) => [id, WR.loc(id).short])];
    document.getElementById("feed-filter").innerHTML = opts.map(([v, label]) => `<label class="chip"><input type="radio" name="ff" value="${v}" ${v === filter ? "checked" : ""}><span>${WR.esc(label)}</span></label>`).join("");
    document.getElementById("feed-filter").addEventListener("change", (e) => setFilter(e.target.value));
  }

  function busPos(p) {
    const gps = S.live && S.live.gps;
    if (!replayNow && gps && Date.now() - gps.at < 10 * 60 * 1000) return { lat: gps.lat, lng: gps.lng, gps: true };
    if (p.phase === "driving") return bez(curves[p.at], Math.min(1, Math.max(0, p.frac)));
    const l = locs[Math.min(p.at, locs.length - 1)]; return { lat: l.lat, lng: l.lng };
  }

  function render() {
    const p = WR.progress(t, replayNow || undefined);
    const pill = document.getElementById("status-pill");
    if (t.status !== "live") { pill.className = "pill"; pill.textContent = "Last trip"; }
    else if (replayNow) { pill.className = "pill sea"; pill.textContent = "Replay · " + replayNow.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }); }
    else if (p.phase === "home") { pill.className = "pill good"; pill.textContent = "Trip complete"; }
    else if (p.phase === "boarding") { pill.className = "pill warn"; pill.textContent = "Boarding soon"; }
    else { pill.className = "pill live"; pill.textContent = "Live now"; }

    let where;
    if (p.phase === "boarding") where = `The bus leaves the clubhouse at ${WR.fmtTime(t.times[0])}. Pupdates start rolling in after that.`;
    else if (p.phase === "home" || p.phase === "done") where = "All pups are back at the clubhouse, tired and happy. Report cards are on the way.";
    else if (p.phase === "driving") where = `On the road to ${WR.loc(pts[p.to]).name}. Windows down, ears flapping.`;
    else where = `Exploring ${WR.loc(pts[p.at]).name}. ${WR.loc(pts[p.at]).blurb}`;
    document.getElementById("trip-where").textContent = where;

    const bar = document.getElementById("trip-progress");
    bar.style.setProperty("--n", pts.length - 1);
    bar.innerHTML = curves.map((_, i) => `<span class="${i < p.reached ? "done" : i === p.reached && p.phase !== "home" ? "here" : ""}"></span>`).join("");

    if (map) {
      const pos = busPos(p); busMarker.setLatLng([pos.lat, pos.lng]);
      stopMarkers.forEach((m, i) => {
        if (!m) return;
        const el = m.getElement() && m.getElement().querySelector(".stop-marker"); if (!el) return;
        el.className = "stop-marker" + (i < p.reached || (i === 0 && p.reached > 0) ? " done" : i === p.at && p.phase === "stop" ? " here" : i === p.reached + 1 ? " next" : "");
        const l = WR.loc(pts[i]), b = WR.state.badges.find((x) => x.location === pts[i]);
        const count = postsFor(p).filter((x) => x.location === pts[i]).length;
        m.bindPopup(`<h4>${l.emoji} ${WR.esc(l.name)}</h4><p class="muted">${WR.fmtTime(t.times[i])}</p><p>${WR.esc(l.blurb)}</p>${b ? `<p><strong>${b.emoji} ${WR.esc(b.name)}</strong> badge</p>` : ""}<p><strong>${count}</strong> Pupdate${count === 1 ? "" : "s"}</p>`);
      });
    }

    document.getElementById("itinerary").innerHTML = pts.map((id, i) => {
      const l = WR.loc(id), b = S.badges.find((x) => x.location === id);
      const st = i < p.reached || (p.phase === "home" && i <= p.reached) ? `<span class="pill good">Done</span>` : i === p.at && (p.phase === "stop" || p.phase === "boarding") ? `<span class="pill live">Here now</span>` : p.phase === "driving" && i === p.to ? `<span class="pill sea">Next stop</span>` : `<span class="pill">Coming up</span>`;
      return `<tr><td class="num">${WR.fmtTime(t.times[i])}</td><td><strong>${l.emoji} ${WR.esc(i === pts.length - 1 ? "Back to the " + l.short : l.short)}</strong></td><td>${b ? WR.esc(b.name) : "<span class='muted'>—</span>"}</td><td>${st}</td></tr>`;
    }).join("");
    renderFeed(p);
  }

  document.getElementById("riders").innerHTML = t.dogs.map(WR.dog).filter(Boolean).map((d) => `
    <a class="pup-card" href="pup.html#${d.id}"><div class="pup-photo">${WR.dogPhoto(d)}</div><div><h3>${WR.esc(d.name)}</h3><p class="muted" style="font-size:.88rem">${WR.esc(d.breed)}</p></div></a>`).join("");

  // ---------- replay ----------
  const btn = document.getElementById("replay-btn");
  function stopReplay() { clearInterval(replayTimer); replayTimer = null; replayNow = null; btn.textContent = "▶ Replay today's trip"; lastFeedKey = ""; render(); }
  btn.addEventListener("click", () => {
    if (replayTimer) return stopReplay();
    const [h0, m0] = t.times[0].split(":").map(Number), [h1, m1] = t.times[t.times.length - 1].split(":").map(Number);
    const start = new Date(); start.setHours(h0, m0 - 5, 0, 0);
    const end = new Date(); end.setHours(h1, m1 + 5, 0, 0);
    const step = (end - start) / (45 * 1000 / 100); // ~45 seconds total
    replayNow = new Date(start); btn.textContent = "■ Stop replay";
    replayTimer = setInterval(() => { replayNow = new Date(replayNow.getTime() + step); if (replayNow > end) return stopReplay(); render(); }, 100);
    render();
  });

  // ---------- instagram embeds ----------
  let igLoaded = false;
  function loadInstagram() {
    if (igLoaded) { window.instgrm && window.instgrm.Embeds.process(); return; }
    igLoaded = true;
    const s = document.createElement("script"); s.async = true; s.src = "https://www.instagram.com/embed.js";
    s.onload = () => window.instgrm && window.instgrm.Embeds.process();
    document.body.appendChild(s);
  }

  // Pick up changes made in Pack Leader HQ (another tab) without a reload.
  window.addEventListener("storage", () => location.reload());

  renderFilter();
  render();
  setInterval(() => { if (!replayNow) render(); }, 15000);
})();
