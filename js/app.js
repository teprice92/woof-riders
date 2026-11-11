/* Woof Riders — shared app core: data store, helpers, header/footer.
   Storage: browser localStorage, so the site works as a static demo with no server.
   To go live for real customers, swap WR.load/WR.save for a hosted database
   (Supabase, Firebase, Airtable...). Every page only talks to the WR object. */
(function () {
  const KEY = "woofriders:v1";
  const SEED = window.WR_SEED;
  const clone = (o) => JSON.parse(JSON.stringify(o));

  function fresh() {
    const s = clone(SEED);
    s.reportCards = {};   // "dogId:tripId" -> { grades, note, facts }
    s.photos = {};        // "dogId:tripId:locId" -> dataURL
    s.awards = {};        // dogId -> [badgeId] (manual awards from HQ)
    s.igPosts = [];       // { id, trip, location, url, time }
    s.live = { manualStop: null, gps: null, replay: false };
    return s;
  }

  let state;
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s && s.version === SEED.version) {
          // Keep business data user-entered; refresh the reference lists from the seed file.
          ["clubhouse", "locations", "badges", "subjects", "pricing", "business", "reportNotes"].forEach((k) => (s[k] = clone(SEED[k])));
          // Keep sample trips' dates fresh relative to today.
          const seedTrips = Object.fromEntries(SEED.trips.map((t) => [t.id, t]));
          s.trips.forEach((t) => { if (seedTrips[t.id]) { t.date = seedTrips[t.id].date; t.status = seedTrips[t.id].status; t.times = seedTrips[t.id].times; } });
          s.live = s.live || { manualStop: null, gps: null };
          if (s.live.day !== SEED.trips.find((t) => t.status === "live")?.date) s.live = { manualStop: null, gps: null };
          return s;
        }
      }
    } catch (e) { /* storage blocked or corrupt; fall back to seed */ }
    return fresh();
  }
  function save() {
    try { state.live.day = state.trips.find((t) => t.status === "live")?.date; localStorage.setItem(KEY, JSON.stringify(state)); return true; }
    catch (e) { toast("Couldn't save in this browser (storage is full or blocked)."); return false; }
  }
  function reset() { try { localStorage.removeItem(KEY); } catch (e) {} state = fresh(); }
  state = load();

  // ---------- lookups ----------
  const byId = (list, id) => list.find((x) => x.id === id);
  const loc = (id) => (id === "clubhouse" ? state.clubhouse : byId(state.locations, id));
  const badge = (id) => byId(state.badges, id);
  const dog = (id) => byId(state.dogs, id);
  const trip = (id) => byId(state.trips, id);
  const liveTrip = () => state.trips.find((t) => t.status === "live");
  const upcoming = () => state.trips.filter((t) => t.status === "upcoming").sort((a, b) => a.date.localeCompare(b.date));

  // ---------- formatting ----------
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const parseDay = (iso) => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d); };
  const fmtDate = (iso, opts) => parseDay(iso).toLocaleDateString(undefined, opts || { weekday: "short", month: "short", day: "numeric" });
  const fmtTime = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); const d = new Date(); d.setHours(h, m); return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }); };
  const money = (n) => "$" + Number(n).toLocaleString();
  const uid = (p) => (p || "") + Math.random().toString(36).slice(2, 8);
  const ageOf = (birthday) => {
    if (!birthday) return "";
    const b = new Date(birthday), n = new Date();
    let y = n.getFullYear() - b.getFullYear(); if (n < new Date(n.getFullYear(), b.getMonth(), b.getDate())) y--;
    if (y < 1) { const m = Math.max(1, (n.getFullYear() - b.getFullYear()) * 12 + n.getMonth() - b.getMonth()); return m + " mo"; }
    return y + (y === 1 ? " yr" : " yrs");
  };
  const minutes = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
  function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

  // ---------- trip progress ----------
  // Route = clubhouse -> stops -> clubhouse; trip.times has one time per route point.
  function route(t) { return ["clubhouse", ...t.stops, "clubhouse"]; }
  function progress(t, now) {
    const pts = route(t), times = t.times.map(minutes);
    if (t.status === "done") return { phase: "done", at: pts.length - 1, reached: pts.length - 1, frac: 0 };
    if (t.status === "upcoming") return { phase: "upcoming", at: 0, reached: -1, frac: 0 };
    // An explicit "now" (replay mode) ignores HQ's manual override.
    if (state.live.manualStop != null && !now) {
      const i = Math.min(state.live.manualStop, pts.length - 1);
      return { phase: i >= pts.length - 1 ? "home" : i === 0 ? "boarding" : "stop", at: i, reached: i, frac: 0 };
    }
    now = now || new Date();
    const m = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
    if (m < times[0]) return { phase: "boarding", at: 0, reached: 0, frac: 0 };
    if (m >= times[times.length - 1]) return { phase: "home", at: pts.length - 1, reached: pts.length - 1, frac: 0 };
    // Bus spends 70% of each window at the stop, 30% driving to the next one.
    for (let i = 0; i < times.length - 1; i++) {
      if (m >= times[i] && m < times[i + 1]) {
        const span = times[i + 1] - times[i], into = (m - times[i]) / span;
        if (i === 0 || into < 0.7) {
          if (i === 0) return { phase: "driving", at: 0, reached: 0, frac: into, to: 1 };
          return { phase: "stop", at: i, reached: i, frac: 0 };
        }
        return { phase: "driving", at: i, reached: i, frac: (into - 0.7) / 0.3, to: i + 1 };
      }
    }
    return { phase: "home", at: pts.length - 1, reached: pts.length - 1, frac: 0 };
  }
  function visitedStops(t, dogId) {
    if (dogId && !t.dogs.includes(dogId)) return [];
    if (t.status === "done") return t.stops.slice();
    if (t.status === "live") { const p = progress(t); return t.stops.slice(0, Math.max(0, Math.min(p.reached, t.stops.length))); }
    return [];
  }

  // ---------- pups: trips, report cards, badges ----------
  function dogTrips(dogId) {
    return state.trips.filter((t) => t.dogs.includes(dogId) && (t.status === "done" || t.status === "live")).sort((a, b) => b.date.localeCompare(a.date));
  }
  const GRADES = ["A+", "A", "A", "A-", "B+", "A+", "B", "A", "A-", "B+"];
  function reportCard(dogId, tripId) {
    const saved = state.reportCards[dogId + ":" + tripId];
    if (saved) return Object.assign({ saved: true }, saved);
    const t = trip(tripId);
    if (!t || t.status === "upcoming") return null;
    if (t.status === "live") return { inProgress: true, grades: {}, note: "Report card arrives when the bus is back at the clubhouse.", facts: {} };
    const grades = {};
    state.subjects.forEach((s, i) => (grades[s.id] = GRADES[hash(dogId + tripId + s.id + i) % GRADES.length]));
    const notes = state.reportNotes[dogId] || ["Had a pawsome day with the pack!"];
    const h = hash(dogId + tripId);
    const buddies = t.dogs.filter((d) => d !== dogId && dog(d));
    return {
      generated: true, grades, note: notes[h % notes.length],
      facts: { miles: (2 + (h % 40) / 10).toFixed(1), treats: 3 + (h % 6), buddy: buddies.length ? dog(buddies[h % buddies.length]).name : "" }
    };
  }
  function earnedBadges(dogId) {
    const earned = new Map(); // badgeId -> { date, tripId }
    const trips = dogTrips(dogId).slice().reverse(); // oldest first
    let rides = 0;
    trips.forEach((t) => {
      visitedStops(t, dogId).forEach((l) => { const b = state.badges.find((x) => x.location === l); if (b && !earned.has(b.id)) earned.set(b.id, { date: t.date, tripId: t.id }); });
      if (t.status === "done" || progress(t).reached > 0) rides++;
      state.badges.filter((b) => b.kind === "milestone" && b.rides === rides).forEach((b) => { if (!earned.has(b.id)) earned.set(b.id, { date: t.date, tripId: t.id }); });
      const rc = reportCard(dogId, t.id);
      if (rc && rc.grades) state.badges.filter((b) => b.kind === "grade" && rc.grades[b.subject] === "A+").forEach((b) => { if (!earned.has(b.id)) earned.set(b.id, { date: t.date, tripId: t.id }); });
    });
    (state.awards[dogId] || []).forEach((id) => { if (!earned.has(id)) earned.set(id, { date: null, manual: true }); });
    return earned;
  }
  const gradePaws = (g) => ({ "A+": 5, A: 5, "A-": 4, "B+": 4, B: 3, "B-": 3, "C+": 2, C: 2, D: 1 }[g] || 0);
  const gradeClass = (g) => (g || "").charAt(0);
  function waiverStatus(d) { return d && d.waiver && d.waiver.signedAt ? "signed" : "missing"; }
  function vaccineStatus(d) {
    const today = new Date().toISOString().slice(0, 10);
    const v = (d && d.vaccines) || {};
    const keys = ["rabies", "dhpp", "bordetella"];
    if (keys.some((k) => !v[k])) return { level: "bad", text: "Vaccine records needed" };
    const expired = keys.filter((k) => v[k] < today);
    if (expired.length) return { level: "bad", text: "Expired: " + expired.map((k) => k.toUpperCase()).join(", ") };
    const soon = keys.filter((k) => (parseDay(v[k]) - new Date()) / 864e5 < 30);
    if (soon.length) return { level: "warn", text: "Due soon: " + soon.map((k) => k.toUpperCase()).join(", ") };
    return { level: "good", text: "Vaccines current" };
  }
  const seatsLeft = (t) => Math.max(0, (t.capacity || 12) - t.dogs.length);

  // ---------- art ----------
  const SCENES = {
    desert: ["#ffcf87", "#f28a4a", "#c8553d"], water: ["#9ee6f0", "#38bdf8", "#0f9c96"], park: ["#c9f2c1", "#7bd389", "#2f9e5b"],
    city: ["#ffd6e0", "#a78bfa", "#475569"], mountain: ["#fde4b4", "#e6a15a", "#8a5a3b"], sunset: ["#ffe08a", "#ff8c5a", "#b23a48"], home: ["#fff1c9", "#ffb21f", "#0f9c96"]
  };
  function scene(kind, emoji, tag) {
    const c = SCENES[kind] || SCENES.home;
    return `<div class="scene" style="background:
      radial-gradient(circle at 75% 28%, rgba(255,255,255,.85) 0 9%, transparent 9.5%),
      linear-gradient(180deg, ${c[0]} 0%, ${c[1]} 62%, ${c[2]} 62%, ${c[2]} 100%)"><span class="big" aria-hidden="true">${emoji}</span>${tag ? `<span class="tag">${esc(tag)}</span>` : ""}</div>`;
  }
  function dogPhoto(d) {
    if (d.photo) return `<img src="${d.photo}" alt="${esc(d.name)}">`;
    return `<div class="scene" style="background:radial-gradient(circle at 50% 40%, #fff8 0 30%, transparent 31%), ${d.avatarBg || "#ffe7b3"}"><span class="big" aria-hidden="true">${d.emoji || "🐶"}</span></div>`;
  }
  function stopPhoto(dogId, tripId, locId) {
    const p = state.photos[dogId + ":" + tripId + ":" + locId];
    const l = loc(locId);
    if (p) return `<img src="${p}" alt="${esc((dog(dogId) || {}).name)} at ${esc(l.short)}">`;
    return scene(l.scene, l.emoji, "Photo coming soon");
  }
  function medal(b, extra) {
    return `<div class="badge ${extra || ""}"><div class="medal" style="--c:${b.color}" aria-hidden="true">${b.emoji}</div><h4>${esc(b.name)}</h4><small>${esc(b.desc)}</small></div>`;
  }
  // Downscale an uploaded image so it fits comfortably in storage.
  function readImage(file, max) {
    max = max || 900;
    return new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onerror = rej;
      fr.onload = () => {
        const img = new Image();
        img.onload = () => {
          const k = Math.min(1, max / Math.max(img.width, img.height));
          const c = document.createElement("canvas"); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
          c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
          res(c.toDataURL("image/jpeg", 0.82));
        };
        img.onerror = rej; img.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  }

  // ---------- chrome ----------
  function toast(msg) {
    let host = document.querySelector(".toast-host");
    if (!host) { host = document.createElement("div"); host.className = "toast-host"; host.setAttribute("role", "status"); document.body.appendChild(host); }
    const el = document.createElement("div"); el.className = "toast"; el.textContent = msg; host.appendChild(el);
    setTimeout(() => el.remove(), 3800);
  }
  const NAV = [
    ["tracker.html", "Live Tracker", "live-link"], ["pack.html", "The Pack"], ["badges.html", "Merit Badges"],
    ["join.html", "Pup Passport"], ["index.html#pricing", "Pricing"], ["hq.html", "Pack Leader HQ"]
  ];
  function header() {
    const here = location.pathname.split("/").pop() || "index.html";
    const links = NAV.map(([href, label, cls]) => `<a href="${href}" class="${cls || ""}" ${href === here ? 'aria-current="page"' : ""}>${label}</a>`).join("");
    return `<nav class="site-nav" aria-label="Main"><div class="wrap">
      <a class="brand" href="index.html"><img src="assets/logo-sm.png" alt="" width="52" height="41"><span>Woof Riders</span></a>
      <button class="nav-toggle" aria-expanded="false" aria-controls="nav-links" aria-label="Menu"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
      <div class="nav-links" id="nav-links">${links}<a class="btn small" href="book.html">Book a Ride</a></div>
    </div></nav>`;
  }
  function footer() {
    const b = state.business;
    return `<footer class="site-footer"><div class="wrap">
      <div class="footer-grid">
        <div class="footer-brand"><img src="assets/logo-sm.png" alt="Woof Riders logo" width="120" height="95"><p class="muted">Field trip doggy day care. We pick up your pup, hit the best dog-friendly spots in the ${esc(b.city)} area, and bring home one tired, happy dog.</p></div>
        <div><h4>Ride along</h4><ul><li><a href="book.html">Book a ride</a></li><li><a href="tracker.html">Live tracker</a></li><li><a href="index.html#pricing">Pricing &amp; passes</a></li><li><a href="index.html#faq">FAQ</a></li></ul></div>
        <div><h4>Your pup</h4><ul><li><a href="join.html">Create a Pup Passport</a></li><li><a href="join.html#waiver">Sign the waiver</a></li><li><a href="pack.html">Find your pup</a></li><li><a href="badges.html">Merit badges</a></li></ul></div>
        <div><h4>Say woof</h4><ul><li><span class="num">${esc(b.phone)}</span></li><li>${esc(b.email)}</li><li><a href="https://instagram.com/${esc(b.instagram)}" rel="noopener" target="_blank">@${esc(b.instagram)}</a></li><li><a href="hq.html">Staff login</a></li></ul></div>
      </div>
      <div class="footer-bottom"><span>© ${new Date().getFullYear()} Woof Riders. All tails wagging.</span><span>Sample data shown for demonstration.</span></div>
    </div></footer>`;
  }
  function mountChrome() {
    const h = document.getElementById("site-header"); if (h) h.outerHTML = header();
    const f = document.getElementById("site-footer"); if (f) f.outerHTML = footer();
    const btn = document.querySelector(".nav-toggle"), links = document.getElementById("nav-links");
    if (btn) btn.addEventListener("click", () => { const open = links.classList.toggle("open"); btn.setAttribute("aria-expanded", open); });
  }
  document.addEventListener("DOMContentLoaded", mountChrome);

  window.WR = {
    get state() { return state; }, save, reset, toast, esc, uid, money, fmtDate, fmtTime, ageOf, parseDay, hash,
    loc, badge, dog, trip, liveTrip, upcoming, route, progress, visitedStops, dogTrips, reportCard, earnedBadges,
    gradePaws, gradeClass, waiverStatus, vaccineStatus, seatsLeft, scene, dogPhoto, stopPhoto, medal, readImage
  };
})();
