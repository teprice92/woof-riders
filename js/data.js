/* Woof Riders — starter data.
   Everything here is SAMPLE content so the site looks alive on day one.
   Edit locations, badges and prices to match the real business.
   Dates are generated relative to "today" so the demo never goes stale. */
(function () {
  const day = (offset) => {
    const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10);
  };

  // Pickup / drop-off base. Lat/lng are in the Phoenix metro (matches the desert in the logo).
  const clubhouse = { id: "clubhouse", name: "Woof Riders Clubhouse", short: "Clubhouse", lat: 33.4255, lng: -111.9400, emoji: "🏠", scene: "home", blurb: "Boarding, tail-wag check and sunscreen for the humans." };

  const locations = [
    { id: "papago", name: "Papago Park · Hole-in-the-Rock", short: "Papago Park", lat: 33.4533, lng: -111.9453, emoji: "🌵", scene: "desert", badge: "desert-dog", blurb: "Red-rock buttes, desert sniffs and the best group photo spot in town." },
    { id: "tempe-lake", name: "Tempe Beach Park", short: "Tempe Beach Park", lat: 33.4318, lng: -111.9433, emoji: "🌊", scene: "water", badge: "splash-pawty", blurb: "Shoreline splashing, sprinkler zoomies and a towel-off." },
    { id: "chaparral", name: "Chaparral Dog Park", short: "Chaparral Dog Park", lat: 33.5085, lng: -111.9104, emoji: "🦋", scene: "park", badge: "social-butterfly", blurb: "Off-leash meet-and-greets with new best friends." },
    { id: "old-town", name: "Old Town Scottsdale Patios", short: "Old Town Patios", lat: 33.4942, lng: -111.9261, emoji: "☕", scene: "city", badge: "patio-pup", blurb: "Puppuccinos, people-watching and polite patio manners." },
    { id: "south-mtn", name: "South Mountain · Desert Classic Trail", short: "South Mountain", lat: 33.3460, lng: -112.0280, emoji: "🥾", scene: "mountain", badge: "trailblazer", blurb: "A shaded morning hike with plenty of water breaks." },
    { id: "saguaro-lake", name: "Saguaro Lake", short: "Saguaro Lake", lat: 33.5650, lng: -111.5330, emoji: "🛶", scene: "water", badge: "lake-legend", blurb: "Lake wading, life-vest practice and canyon views." },
    { id: "usery", name: "Usery Mountain Wind Cave Lookout", short: "Usery Mountain", lat: 33.4747, lng: -111.6106, emoji: "🌅", scene: "sunset", badge: "sunset-snoozer", blurb: "Golden-hour lookout, then a well-earned bus nap." },
    { id: "roosevelt", name: "Roosevelt Row Arts District", short: "Roosevelt Row", lat: 33.4580, lng: -112.0680, emoji: "🏙️", scene: "city", badge: "big-city-barker", blurb: "Mural walks, city sounds and street-smart leash work." },
    { id: "fountain-hills", name: "Fountain Park, Fountain Hills", short: "Fountain Park", lat: 33.6050, lng: -111.7250, emoji: "⛲", scene: "park", badge: "fountain-frenzy", blurb: "Lawn games beside one of the tallest fountains in the world." },
    { id: "sedona", name: "Sedona · Bell Rock Pathway", short: "Sedona", lat: 34.7990, lng: -111.7650, emoji: "🪨", scene: "desert", badge: "red-rock-rover", blurb: "Our big road-trip day: red rocks, cool air and epic views." }
  ];

  const badges = [
    // Location badges: earned automatically the first time a pup visits the stop.
    { id: "desert-dog", name: "Desert Dog", emoji: "🌵", color: "#2f9e5b", kind: "place", location: "papago", desc: "Explored the red rocks of Papago Park." },
    { id: "splash-pawty", name: "Splash Pawty", emoji: "🌊", color: "#1a9fd6", kind: "place", location: "tempe-lake", desc: "Made a splash at Tempe Beach Park." },
    { id: "social-butterfly", name: "Social Butterfly", emoji: "🦋", color: "#8b5cf6", kind: "place", location: "chaparral", desc: "Made new friends at Chaparral Dog Park." },
    { id: "patio-pup", name: "Patio Pup", emoji: "☕", color: "#a0673a", kind: "place", location: "old-town", desc: "Mastered patio manners in Old Town." },
    { id: "trailblazer", name: "Trailblazer", emoji: "🥾", color: "#c2410c", kind: "place", location: "south-mtn", desc: "Hiked South Mountain like a pro." },
    { id: "lake-legend", name: "Lake Legend", emoji: "🛶", color: "#0e7490", kind: "place", location: "saguaro-lake", desc: "Paddled paws at Saguaro Lake." },
    { id: "sunset-snoozer", name: "Sunset Snoozer", emoji: "🌅", color: "#f97316", kind: "place", location: "usery", desc: "Caught golden hour at Usery Mountain." },
    { id: "big-city-barker", name: "Big City Barker", emoji: "🏙️", color: "#475569", kind: "place", location: "roosevelt", desc: "Strutted the murals of Roosevelt Row." },
    { id: "fountain-frenzy", name: "Fountain Frenzy", emoji: "⛲", color: "#0891b2", kind: "place", location: "fountain-hills", desc: "Played by the big fountain." },
    { id: "red-rock-rover", name: "Red Rock Rover", emoji: "🪨", color: "#b91c1c", kind: "place", location: "sedona", desc: "Conquered the Sedona road trip." },
    // Milestone badges: earned by number of rides or great grades.
    { id: "first-ride", name: "First Ride", emoji: "🚌", color: "#f2602f", kind: "milestone", rides: 1, desc: "Took a first ride on the Woof Bus." },
    { id: "road-dog", name: "Road Dog", emoji: "🛣️", color: "#334155", kind: "milestone", rides: 5, desc: "Rode along on 5 field trips." },
    { id: "legend", name: "Legendary Woof Rider", emoji: "👑", color: "#d4a017", kind: "milestone", rides: 10, desc: "Rode along on 10 field trips." },
    { id: "gold-star", name: "Gold Star Passenger", emoji: "⭐", color: "#eab308", kind: "grade", subject: "bus", desc: "Earned an A+ in Bus Manners." },
    { id: "pack-leader", name: "Pack Leader", emoji: "🐾", color: "#0f9c96", kind: "grade", subject: "play", desc: "Earned an A+ in Plays Well With Paws." }
  ];

  const subjects = [
    { id: "bus", name: "Bus Manners", hint: "Stays seated, calm boarding, no seat-hopping" },
    { id: "play", name: "Plays Well With Paws", hint: "Friendly greetings, shares toys, reads the room" },
    { id: "recall", name: "Recall", hint: "Comes when called, even mid-sniff" },
    { id: "leash", name: "Leash Lounging", hint: "Loose-leash walking, waits at doors" },
    { id: "adventure", name: "Adventure Spirit", hint: "Curious, brave and up for new things" },
    { id: "nap", name: "Nap Quality", hint: "Recharges on the ride home" }
  ];

  const dogs = [
    { id: "biscuit", name: "Biscuit", breed: "Pembroke Welsh Corgi", sex: "Male", birthday: "2021-04-02", weight: 27, color: "Red & white", emoji: "🐕", avatarBg: "#ffd9a8",
      temperament: ["Social butterfly", "Food motivated", "Loves water"], likes: "Tennis balls, belly rubs, the front seat", fears: "Leaf blowers", allergies: "None", meds: "None",
      vet: { name: "Desert Paws Vet Clinic", phone: "(480) 555-0142" }, vaccines: { rabies: day(220), dhpp: day(180), bordetella: day(95) },
      owner: { name: "Sample Owner", email: "owner@example.com", phone: "(480) 555-0101" }, emergency: { name: "Backup Human", phone: "(480) 555-0102" },
      waiver: { signedAt: day(-90), signer: "Sample Owner" }, createdAt: day(-90), sample: true },
    { id: "juniper", name: "Juniper", breed: "Siberian Husky", sex: "Female", birthday: "2020-11-15", weight: 44, color: "Grey & white", emoji: "🐺", avatarBg: "#d6e4f0",
      temperament: ["High energy", "Talkative", "Escape artist"], likes: "Zoomies, snow cones, howling with the bus horn", fears: "Thunder", allergies: "Chicken", meds: "None",
      vet: { name: "Camelback Animal Hospital", phone: "(602) 555-0177" }, vaccines: { rabies: day(300), dhpp: day(120), bordetella: day(14) },
      owner: { name: "Sample Owner", email: "owner@example.com", phone: "(602) 555-0110" }, emergency: { name: "Backup Human", phone: "(602) 555-0111" },
      waiver: { signedAt: day(-75), signer: "Sample Owner" }, createdAt: day(-75), sample: true },
    { id: "waffles", name: "Waffles", breed: "Golden Retriever", sex: "Male", birthday: "2022-02-20", weight: 68, color: "Golden", emoji: "🦮", avatarBg: "#ffe7b3",
      temperament: ["Gentle", "Loves everyone", "Water dog"], likes: "Sticks, swimming, stealing socks", fears: "Vacuum cleaners", allergies: "None", meds: "Joint chew with lunch",
      vet: { name: "Desert Paws Vet Clinic", phone: "(480) 555-0142" }, vaccines: { rabies: day(400), dhpp: day(200), bordetella: day(160) },
      owner: { name: "Sample Owner", email: "owner@example.com", phone: "(480) 555-0120" }, emergency: { name: "Backup Human", phone: "(480) 555-0121" },
      waiver: { signedAt: day(-60), signer: "Sample Owner" }, createdAt: day(-60), sample: true },
    { id: "domino", name: "Domino", breed: "Dalmatian", sex: "Female", birthday: "2019-07-08", weight: 52, color: "White with black spots", emoji: "🐕‍🦺", avatarBg: "#ececec",
      temperament: ["Athletic", "Bit shy at first", "Loyal"], likes: "Running alongside, squeaky toys", fears: "Skateboards", allergies: "Beef", meds: "None",
      vet: { name: "Scottsdale Pet Care", phone: "(480) 555-0190" }, vaccines: { rabies: day(150), dhpp: day(-5), bordetella: day(40) },
      owner: { name: "Sample Owner", email: "owner@example.com", phone: "(480) 555-0130" }, emergency: { name: "Backup Human", phone: "(480) 555-0131" },
      waiver: { signedAt: day(-45), signer: "Sample Owner" }, createdAt: day(-45), sample: true },
    { id: "pepper", name: "Pepper", breed: "French Bulldog", sex: "Female", birthday: "2023-01-12", weight: 22, color: "Brindle", emoji: "🐶", avatarBg: "#e8d5c4",
      temperament: ["Snuggler", "Snores loudly", "Short walks only"], likes: "Shade, laps, peanut butter", fears: "Big hills", allergies: "None", meds: "None",
      vet: { name: "Camelback Animal Hospital", phone: "(602) 555-0177" }, vaccines: { rabies: day(320), dhpp: day(260), bordetella: day(70) },
      owner: { name: "Sample Owner", email: "owner@example.com", phone: "(602) 555-0140" }, emergency: { name: "Backup Human", phone: "(602) 555-0141" },
      waiver: null, createdAt: day(-12), sample: true },
    { id: "maple", name: "Maple", breed: "Australian Shepherd", sex: "Female", birthday: "2021-09-30", weight: 46, color: "Blue merle", emoji: "🐕", avatarBg: "#cfe3ea",
      temperament: ["Herds the pack", "Smart", "Frisbee champ"], likes: "Frisbees, puzzles, being in charge", fears: "None known", allergies: "None", meds: "None",
      vet: { name: "Scottsdale Pet Care", phone: "(480) 555-0190" }, vaccines: { rabies: day(250), dhpp: day(210), bordetella: day(130) },
      owner: { name: "Sample Owner", email: "owner@example.com", phone: "(480) 555-0150" }, emergency: { name: "Backup Human", phone: "(480) 555-0151" },
      waiver: { signedAt: day(-120), signer: "Sample Owner" }, createdAt: day(-120), sample: true }
  ];

  // Trip schedule. "live" = today. Times are 24h local.
  const stdTimes = ["08:30", "09:30", "11:00", "12:45", "14:15", "16:00"];
  const trips = [
    { id: "t-past-8", name: "Sedona Red Rock Road Trip", date: day(-26), status: "done", stops: ["sedona"], dogs: ["biscuit", "juniper", "waffles", "maple"] },
    { id: "t-past-7", name: "Lake Day Loop", date: day(-21), status: "done", stops: ["saguaro-lake", "usery"], dogs: ["biscuit", "waffles", "domino", "maple"] },
    { id: "t-past-6", name: "Desert & Splash Loop", date: day(-17), status: "done", stops: ["papago", "tempe-lake", "chaparral"], dogs: ["biscuit", "juniper", "domino", "maple"] },
    { id: "t-past-5", name: "City Strut", date: day(-14), status: "done", stops: ["roosevelt", "old-town"], dogs: ["biscuit", "waffles", "maple"] },
    { id: "t-past-4", name: "Trail Mix Tuesday", date: day(-10), status: "done", stops: ["south-mtn", "tempe-lake"], dogs: ["juniper", "waffles", "domino", "maple"] },
    { id: "t-past-3", name: "Fountain Frolic", date: day(-7), status: "done", stops: ["fountain-hills", "chaparral", "old-town"], dogs: ["biscuit", "juniper", "waffles", "domino"] },
    { id: "t-past-2", name: "Sunset Safari", date: day(-3), status: "done", stops: ["papago", "usery"], dogs: ["biscuit", "maple", "waffles"] },
    { id: "t-live", name: "Desert & Splash Loop", date: day(0), status: "live", stops: ["papago", "tempe-lake", "chaparral", "old-town"], dogs: ["biscuit", "juniper", "waffles", "domino", "maple"], capacity: 12 },
    { id: "t-up-1", name: "Trail Mix Tuesday", date: day(1), status: "upcoming", stops: ["south-mtn", "tempe-lake"], dogs: ["juniper", "maple"], capacity: 12 },
    { id: "t-up-2", name: "City Strut", date: day(2), status: "upcoming", stops: ["roosevelt", "old-town", "chaparral"], dogs: ["biscuit"], capacity: 12 },
    { id: "t-up-3", name: "Lake Day Loop", date: day(3), status: "upcoming", stops: ["saguaro-lake", "usery"], dogs: ["waffles", "domino", "maple", "biscuit", "juniper", "pepper", "x1", "x2", "x3", "x4", "x5"], capacity: 12 },
    { id: "t-up-4", name: "Fountain Frolic", date: day(6), status: "upcoming", stops: ["fountain-hills", "chaparral"], dogs: [], capacity: 12 },
    { id: "t-up-5", name: "Sunset Safari", date: day(7), status: "upcoming", stops: ["papago", "usery"], dogs: ["maple"], capacity: 12 },
    { id: "t-up-6", name: "Sedona Red Rock Road Trip", date: day(10), status: "upcoming", stops: ["sedona"], dogs: ["biscuit", "waffles"], capacity: 8, premium: true },
    { id: "t-up-7", name: "Desert & Splash Loop", date: day(13), status: "upcoming", stops: ["papago", "tempe-lake", "chaparral", "old-town"], dogs: [], capacity: 12 }
  ];
  trips.forEach((t) => { t.times = t.times || stdTimes.slice(0, t.stops.length + 2); if (t.stops.length + 2 > stdTimes.length) t.times = stdTimes; });
  trips.forEach((t) => { if (t.stops.length === 1) t.times = ["07:30", "10:00", "16:30"]; });

  // Sample Instagram-style "Pupdates" for today's live trip, keyed by location.
  // Add real Instagram post URLs in Pack Leader HQ and they'll embed instead.
  const posts = [
    { id: "p1", trip: "t-live", location: "clubhouse", time: "08:34", caption: "All aboard! 5 pups buckled in and ready to roll. 🚌 #WoofRiders", likes: 48, dogs: ["biscuit", "juniper", "waffles", "domino", "maple"] },
    { id: "p2", trip: "t-live", location: "papago", time: "09:41", caption: "Biscuit found the best seat in the house at Hole-in-the-Rock. Desert Dog badges for everyone! 🌵", likes: 112, dogs: ["biscuit"] },
    { id: "p3", trip: "t-live", location: "papago", time: "10:12", caption: "Group photo attempt #7. Juniper is singing again.", likes: 87, dogs: ["juniper", "maple"] },
    { id: "p4", trip: "t-live", location: "tempe-lake", time: "11:08", caption: "Splash Pawty is officially in session. Waffles has never been happier. 🌊", likes: 134, dogs: ["waffles"] },
    { id: "p5", trip: "t-live", location: "tempe-lake", time: "11:52", caption: "Towel-off line. Domino is supervising.", likes: 76, dogs: ["domino"] }
  ];

  // Sample report cards for past trips. Unlisted dog/trip pairs get a generated card.
  const reportNotes = {
    biscuit: ["Biscuit greeted every single dog at the park and then took a 40-minute nap. Perfect day.", "Rode shotgun and supervised navigation. Excellent snout-out-the-window form.", "Shared his tennis ball (twice!). Huge growth moment."],
    juniper: ["Juniper led the bus in a group howl at every red light. Morale: excellent.", "Great recall at the lake today — came back on the first call.", "Tested the gate latch twice. We're onto you, June."],
    waffles: ["Waffles made friends with a family of ducks and a very patient toddler.", "Swam laps for 20 minutes then fell asleep mid-lunch.", "Carried a stick the entire hike. It was a very big stick."],
    domino: ["Domino was shy at the first stop, then ran the zoomie loop with the whole pack.", "Fantastic leash manners on the patio. A model citizen.", "Spotted a skateboard and checked in with us instead of reacting. Big win!"],
    maple: ["Maple herded the pack back to the bus every single time. We may hire her.", "Caught 14 frisbees in a row. Unofficial park record.", "Solved the treat puzzle in under a minute."],
    pepper: ["Pepper snored the entire drive home. 10/10 nap.", "Loved the shade tent and made friends with Biscuit."]
  };

  window.WR_SEED = {
    version: 3,
    business: { name: "Woof Riders", tagline: "Field Trip Doggy Day Care", city: "Phoenix Metro, AZ", phone: "(480) 555-0199", email: "hello@woofriders.example", instagram: "woofriders" },
    clubhouse, locations, badges, subjects, dogs, trips, posts, reportNotes,
    reservations: [
      { id: "R-1042", tripId: "t-up-1", dogIds: ["juniper", "maple"], addons: ["bath"], pickup: "door", ownerName: "Sample Owner", ownerEmail: "owner@example.com", notes: "Juniper needs her chicken-free treats.", total: 155, status: "confirmed", createdAt: day(-2) },
      { id: "R-1043", tripId: "t-up-2", dogIds: ["biscuit"], addons: [], pickup: "clubhouse", ownerName: "Sample Owner", ownerEmail: "owner@example.com", notes: "", total: 65, status: "pending", createdAt: day(-1) }
    ],
    pricing: { ride: 65, premium: 95, addons: [
      { id: "door", name: "Door-to-door pickup", price: 12, desc: "We swing by your place in the Woof Bus." },
      { id: "bath", name: "Post-trip Pupicure bath", price: 25, desc: "Rinse, towel-dry and a bandana. Back home smelling fresh." },
      { id: "photos", name: "Pupparazzi photo pack", price: 20, desc: "15+ edited, full-resolution photos from the trip." },
      { id: "barkday", name: "Barkday Bash", price: 30, desc: "Birthday crown, pup-safe cake and a song from the whole bus." }
    ] }
  };
})();
