# Woof Riders 🚌🐾

Website for **Woof Riders — Field Trip Doggy Day Care**. Pups ride the Woof Bus to dog-friendly spots around town, earn merit badges at every stop, and come home with a report card.

It's a static site (plain HTML, CSS and JavaScript, no build step), so it can be hosted free on GitHub Pages, Netlify or Cloudflare Pages.

## Pages

| Page | What it does |
| --- | --- |
| `index.html` | Home: hero, today's live trip, features, a day on the bus, badges, pricing, FAQ |
| `tracker.html` | **Live Tracker**: map with the moving bus, stop markers and an Instagram "Pupdates" feed for each stop. Includes a *Replay today's trip* button |
| `join.html` | **Pup Passport** sign-up in 5 steps (basics, health and vaccines, personality, humans) plus the **liability waiver** with initials and a signature pad. `join.html#waiver` signs a waiver for a pup that's already registered |
| `pup.html#<id>` | **Pup profile**: stats, merit badge sash (earned and locked), report cards per trip, a photo from every stop, a passport map and pup facts |
| `pack.html` | All pups, search, and the "Top Dogs" badge leaderboard |
| `badges.html` | The Badge Book: adventure, milestone and honor-roll badges |
| `book.html` | **Reservations**: choose a trip (seats left), pups (checks waiver and vaccines), pickup, add-ons; live price summary |
| `hq.html` | **Pack Leader HQ** for staff (demo PIN `WOOF`): move the bus or share phone GPS, post Pupdates (Instagram link or photo), roster check-in, grade report cards, upload stop photos, award bonus badges, **add and edit stops with their merit badges, create special event badges, schedule trips**, manage reservations, see waiver and vaccine status |

## How badges work

- **Adventure badges**: one per stop, earned on a pup's first visit.
- **Milestone badges**: First Ride, Road Dog (5 rides), Legendary Woof Rider (10 rides).
- **Honor roll**: A+ in Bus Manners (Gold Star Passenger) or Plays Well With Paws (Pack Leader).
- Staff can award any badge by hand from HQ.

## Adding stops and badges (no code needed)

In Pack Leader HQ:

1. **Stops & badges → Add a stop.** Name it, describe it, and place it by searching an address, tapping the map or using your phone's location. Pick an emoji and scene.
2. **Design the badge.** Type a name or tap 🎲 *Surprise me* for a dog-pun name, pick a color, and watch the patch and passport stamp preview update.
3. **Trips → Schedule a field trip.** Tap stops in the order you'll visit them. Times are spaced automatically between departure and home time. The trip opens for booking and shows on the live tracker on the day.
4. **Special event badges** (e.g. a Halloween ride) aren't tied to a stop. Award them from *Report cards & photos*.

Retiring a stop hides it from new trips but keeps every badge and stamp pups already earned there.

## Customize

Everything business-specific lives in `js/data.js`:

- `locations`: the starting stops with coordinates, emoji and badge (sample stops are in the Phoenix metro). Stops added or edited in HQ are kept separately and aren't overwritten by this file.
- `badges`, `subjects` (report card subjects), `pricing` and add-ons.
- `business`: phone, email, Instagram handle.
- `dogs`, `trips`, `posts` and `reservations` are **sample data** so the site looks alive. Remove them before launch.

Brand colors and fonts are tokens at the top of `css/styles.css`.

## Before going live: the important parts

1. **Shared database.** Right now everything saves to the visitor's own browser (`localStorage`), so it's a fully clickable demo, but an owner won't see what staff enter on another phone. All pages read and write through the `WR` object in `js/app.js`, so swapping `load()`/`save()` for a hosted database (Supabase or Firebase are good fits) is the main step. Add real logins at the same time so owners only see their own pups and HQ is protected by staff accounts. The `WOOF` PIN is not security.
2. **Instagram on the map.** Staff can paste any Instagram post link in HQ and it embeds at that stop on the tracker. For fully automatic posts, connect the business Instagram account through the Instagram Graph API (requires a Business or Creator account and a small server function) and match posts to stops by location tag or hashtag such as `#WoofRidersPapago`.
3. **Live GPS.** HQ can share the driver's phone GPS. Once the shared database is in place, parents will see the bus move in real time. A dedicated vehicle GPS tracker with an API also works.
4. **Waiver review.** The waiver text is a starting template. Have a licensed attorney in your state review it before use, and store signed copies (the signature is captured as an image along with initials, name and date).
5. **Payments.** Reservations are requests with no payment taken. Add Stripe Checkout or Square when ready.
6. **Map tiles.** The map uses OpenStreetMap tiles, which are fine for light use. For heavier traffic, use a tile provider such as MapTiler or Stadia Maps.

## Host on GitHub Pages

1. On GitHub, open the repository → **Settings** → **Pages**.
2. Under **Build and deployment**, set **Source** to *Deploy from a branch*.
3. Choose the branch `claude/woof-riders-website-o9pijf` (or `main` once merged) and the **/ (root)** folder, then **Save**.
4. After a minute or two the site is live at `https://<your-username>.github.io/woof-riders/`.

GitHub Pages is free for public repositories. A private repository needs a paid GitHub plan for Pages. The `.nojekyll` file tells Pages to serve every file exactly as-is.

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Ideas for later

- Text-message "Pupdates" when the bus arrives at each stop
- Printable Pup Passport card that gets a sticker for each badge
- Barkday month: a free Barkday Bash on the pup's birthday trip
- "Bring a Buddy" referral credit
- Seasonal limited-edition badges (Monsoon Splasher, Pumpkin Patch Pup, Holiday Lights Cruiser)
- Pupparazzi gallery of the best photos of the week, with owner voting
- Gift cards ("Treat Cards") for dog-loving friends
