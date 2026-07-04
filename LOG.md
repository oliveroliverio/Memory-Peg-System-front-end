# Changelog

## FEAT: Initial Frontend Setup (2026-06-24)
- **Why**: The user requested a mobile-friendly frontend to visualize data from the `/getCharacters` endpoint of the backend.
- **What Changed**:
  - `server.js`: Created an Express server that proxies requests to the backend API running on port 3000 to avoid CORS restrictions, and serves static files.
  - `public/index.html`: Created the markup structure with a hero banner and a dashboard utilizing Glassmorphism design and responsive layout.
  - `public/style.css`: Added vibrant styling, dark mode aesthetics, and dynamic hover animations.
  - `public/app.js`: Created client-side logic to fetch character/day data from our local proxy API and dynamically populate the DOM.
  - `public/banner.png`: Generated an AI banner showing a mystical memory palace for the hero section.
  - `package.json`: Initialized npm and installed `express`, `cors` and `nodemon`.
  - `.gitignore`, `.env.example`, `README.md`: Initialized standard project files.

## BUGFIX: Fix Express router syntax (2026-06-24)
- **Why**: Express 5 enforces strict parsing on `app.get('*')`, resulting in a `PathError`.
- **What Changed**:
  - `server.js`: Changed `app.get('*', ...)` to a middleware `app.use((req, res) => ...)` to catch all remaining routes gracefully and serve the Single Page Application.

## FEAT: Add Docker setup for Raspberry Pi deployment (2026-06-24)
- **Why**: The user wanted production-ready instructions and a deployment strategy to keep the app running 24/7 on a Raspberry Pi.
- **What Changed**:
  - `Dockerfile`: Created a minimal Docker image based on `node:20-alpine`.
  - `compose.yml`: Set up a simple Docker Compose file using host networking so that it seamlessly communicates with the backend on `localhost:3000`.
  - `.dockerignore`: Included node_modules, git directories, and the zip archive to keep image size small.
  - `server.js`: Refactored to use the `BACKEND_URL` environment variable for flexibility (defaulting to localhost:3000).
  - `@Docs/Raspberry-Pi-Deployment.md`: Drafted complete, step-by-step documentation on deploying the app.

## FEAT: Update banner text to show Week Character dynamically (2026-06-24)
- **Why**: The user requested that the hero banner display the current Week Character name and its week number instead of generic placeholder text.
- **What Changed**:
  - `public/index.html`: Added `id="banner-title"` and `id="banner-subtitle"` to the banner text elements.
  - `public/app.js`: Hooked up the new DOM elements to populate with the fetched API data (`data.weekCreature.creature` and `data.weekCreature.weekFormatted`).

## DOCS: Add non-Docker Raspberry Pi deployment guide (2026-06-24)
- **Why**: The user's Raspberry Pi OS (Trixie) didn't have a supported Docker release yet, so they needed an alternative method to run the app 24/7 without Docker.
- **What Changed**:
  - `@Docs/Raspberry-Pi-Deployment-PM2.md`: Created a new guide using `pm2`, the industry-standard Node.js process manager, for ensuring the server runs 24/7 and auto-restarts on reboot.

## DOCS: Add troubleshooting guide for Raspberry Pi deployment (2026-06-24)
- **Why**: The user encountered several tricky issues setting up both frontend and backend on the Pi (stale systemd service blocking port 3000, PM2 crash loops, Node.js IPv6 localhost bug).
- **What Changed**:
  - `@Docs/Troubleshooting-Raspberry-Pi-Deployment.md`: Documented the entire troubleshooting process, including how to use `ss` to find rogue processes, killing them by PID, and fixing the IPv6 `localhost` bug by switching to `127.0.0.1`.

## FEAT: Add time character to hero banner (2026-06-24)
- **Why**: The user wanted the time character to be displayed on the hero banner as a subtitle to the week creature, while keeping the week number displayed as normal.
- **What Changed**:
  - `public/index.html`: Added a new `<h3>` element with id `banner-time-character`.
  - `public/style.css`: Added a new `.banner-sub-title` class to style the time character subtitle.
  - `public/app.js`: Updated the frontend logic to grab the time character element and populate its text content with `data.timeCharacter.character`.

## FEAT: Dynamic quadrant-boundary refresh for time_character, week_creature, day_theme (2026-07-01)
- **Why**: The user requested the frontend to automatically update to the correct time character, week creature, and day theme as each 15-minute quadrant boundary passes (:00, :15, :30, :45), without constant polling.
- **Strategy**: Chained `setTimeout` — calculate exact ms to the next quadrant, fire once, re-fetch `/api/getCharacters`, repopulate the DOM, then chain the next timer. Max 4 wakeups per hour, zero ms polling.
- **What Changed**:
  - `public/app.js`:
    - Extracted `populateUI(data)` helper to avoid duplicate DOM-write logic.
    - Added `msUntilNextQuadrant()`: computes precise ms until the next :00/:15/:30/:45 boundary (+500ms buffer so backend clock has ticked over).
    - Added `refreshAtQuadrant()`: fetches API, calls `populateUI`, then chains next refresh.
    - Added `scheduleNextRefresh()`: arms a single one-shot `setTimeout`.
    - Initial load path unchanged — fetch on `DOMContentLoaded`, then arm first timer.

## FEAT: Show prev/next time characters in banner for learning context (2026-07-01)
- **Why**: To build a stronger memory association with the surrounding quadrants. Faded adjacent rows flank the current active character.
- **What Changed**:
  - `public/index.html`: Added adjacent character context structure.
  - `public/style.css`: Added styles for the surrounding character rows (.banner-adjacent, .adj-label).
  - `public/app.js`: Fetched and updated prev/next time characters.

## FEAT: Move SVG Analog Clock to Hero Banner (2026-07-01)
- **Why**: The user wanted the SVG active-quadrant clock to sit directly in the hero banner next to the active character, instead of inside the dashboard time card.
- **What Changed**:
  - `public/index.html`: Moved `<svg id="quadrant-clock">` from `.time-card` to `.banner-character-context` inside a new `.banner-current-row` layout container next to `#banner-time-character`.
  - `public/style.css`: Styled `.banner-current-row` to display elements inline. Resized the clock size from 68px/76px down to a cleaner 36px/44px to look balanced in the banner context.

## FEAT: Dynamic day-of-week theme switcher (2026-07-03)
- **Why**: The user wanted the UI color, font, and style palette to adapt dynamically to the current day's theme as fetched from the backend (e.g. Christmas red/green, Halloween orange/green/black).
- **What Changed**:
  - `public/index.html`: Linked `themes.css` and combined Google Fonts loading for Outfit, Fredoka, Russo One, Cinzel Decorative, Lora, Cinzel, Creepster, and Mountains of Christmas.
  - `public/style.css`: Converted background glows, heading gradients, clock animations, and badge drop-shadows to CSS custom properties (`var()`). Added smooth 0.6s easing transitions.
  - `public/themes.css`: Created a dedicated stylesheet defining unique dark-mode adapted color, glow, and typography variables for all 7 day themes.
  - `public/app.js`: Updated `populateUI` to dynamically toggle theme classnames (e.g. `theme-halloween`) on the `<body>` element.
  - `@Docs/Journal-2026-07-03.md`: Created dev journal describing design choices, implementation details, and container rebuild workflows.

## FEAT: Time-character media gallery from the DataLake (2026-07-04)
- **Why**: Per `MemoryPeg_TimeCharacter_Gallery_PRD.md`, each time character should automatically display all media captured during its 15-minute quadrant, sourced from the canonical DataLake at `/home/olivero54/DATALAKE`.
- **Strategy**: Build an in-memory metadata index once at boot and keep it current with a chokidar filesystem watcher instead of rescanning on every request. A storage-provider abstraction isolates the local DataLake so future providers (Synology, S3, Drive, …) can slot in behind the same index/API. Timestamps parse from the `YYMMDD-HHMMSS_<n>.ext` filename, falling back to fs birthtime then mtime. Interval matching includes assets where `intervalStart <= timestamp < intervalEnd`.
- **What Changed**:
  - `lib/timestamp.js`: Filename timestamp parser (local time) with birthtime/mtime fallback chain and rollover validation.
  - `lib/mediaTypes.js`: Extension→type registry covering PRD phases 1–3 (image / video / text).
  - `lib/provider.js`: `StorageProvider` interface + `LocalDataLakeProvider` (recursive scan + chokidar watcher with `awaitWriteFinish`).
  - `lib/galleryIndex.js`: `GalleryIndex` — builds records `{absolutePath, relativePath, timestamp, mediaType, extension, filesize, timestampSource}`, maintains them live from watcher events, and answers `queryQuadrant()` / `queryInterval()` chronologically.
  - `server.js`: Starts the index at boot; adds `GET /api/gallery/:date/:quadrant` (date=YYMMDD, quadrant=HHMM snapped to :00/:15/:30/:45), a `/media` static route serving raw DataLake files, and `/api/gallery-stats` diagnostics.
  - `public/index.html`: Added the Memory Gallery section and a fullscreen lightbox/swipe-viewer overlay; bumped asset cache-bust to `v8`.
  - `public/style.css`: Responsive thumbnail grid (lazy-loaded), hover captions, mobile "+N more" single-image collapse, and lightbox styling (arrows on desktop, swipe on mobile).
  - `public/app.js`: `loadGallery()` derives the current quadrant from local time and fetches `/api/gallery/...`; `renderGallery()` builds the grid; lightbox supports keyboard nav (←/→/Esc) on desktop and touch-swipe on mobile. Re-runs on every `populateUI` so it tracks quadrant boundaries.
  - `compose.yml`: Mounted `/home/olivero54/DATALAKE` read-only into the container so the index/watcher see media at the default path.
  - `package.json`: Added `chokidar` dependency.
- **Verified**: Container rebuilt; index loaded 743 assets; `/api/gallery/260703/1100` returned 13 chronologically-sorted assets for the 11:00–11:15 window; `/media/*` served PNGs `200 image/png`; bad params → `400`; live watcher add/remove updated the index within ~1s.

## FEAT: Time Travel — swipeable quadrant navigation on the banner (2026-07-04)
- **Why**: Per `MemoryPeg_TimeTravel_PRD.md`, users should be able to swipe the banner backward through past 15-minute quadrants (never into the future) with Apple-like inertial snap, seeing Time Character, Day Theme, Week Creature, Calendar Date, and the Memory Gallery all recompute for the selected quadrant, with a "Return to Present" exit.
- **Strategy**: Discovered the sibling backend repo (`Memory-Peg-System/server.js`) already exposes `POST /getCharactersByDate` for arbitrary date/time — so a single new frontend endpoint could combine that with the DataLake gallery index for any quadrant. Quadrant boundaries are addressed as absolute UTC epoch ms rather than local date/time strings: every real-world UTC offset is a multiple of 15 minutes, so flooring `Date.now()` to a 900000ms grid client-side lines up exactly with Pi-local :00/:15/:30/:45 boundaries regardless of the viewer's own timezone — no client-side TZ math needed. The actual swipe/inertia mechanics use native CSS scroll-snap (an invisible 3-pane track layered over the banner) rather than a JS physics/momentum library, so touch and trackpad get real OS-level momentum and rubber-band bounce for free; the pane carries no content itself; it's a stateless gesture surface that recenters after every settle while a single set of banner/dashboard/gallery DOM nodes gets its content swapped.
- **What Changed**:
  - `server.js`: Added `GET /api/quadrant/:epochMs` — floors the requested epoch to its quadrant, clamps it to never exceed the live quadrant, proxies `getCharactersByDate` on the backend for week creature/day theme/time character context, and merges in `galleryIndex.queryQuadrant()` results, returning everything a selected quadrant needs in one round trip (`isLive` flag included).
  - `public/index.html`: Added `.tt-track` (3-pane scroll-snap gesture surface), `#tt-prev-btn`/`#tt-next-btn` arrow buttons (desktop/accessibility fallback), `#tt-return-btn` ("Return to Present"), `#banner-date`, and a fading `.tt-hint` swipe affordance. Updated the empty-gallery copy to the PRD's exact wording ("No memories captured during this time.").
  - `public/style.css`: New Time Travel section — invisible scroll-snap track (`touch-action: pan-y`, `overscroll-behavior-x: contain`, hidden scrollbar), collapsible "next" pane (width:0 at the live edge so the browser's native overscroll bounce fires instead of custom spring physics), arrow/return-button styling matching the existing glass/neon system, and a brief opacity dip (`.tt-updating`) on metadata swap for a non-jarring transition.
  - `public/app.js`: Replaced the old `/api/getCharacters`-polling model with a quadrant state machine: `showQuadrant(epochMs)` fetches (or serves from an LRU-capped `Map` cache) and renders a full quadrant payload; `navigate(delta)` steps ±1 quadrant and refuses to cross into the future; `returnToPresent()` force-refreshes the live quadrant and re-arms the existing chained quadrant-boundary timer (paused the moment the user steps away from live). Prefetches both neighbors after every render. The analog clock now renders from the *selected* quadrant's hour/minute (`updateClockFor`) instead of always reading the real wall clock, so it stays correct while time-traveling. `formatBannerDate()` renders the server-authoritative `YYMMDD` forced through `timeZone:'UTC'` so the displayed calendar date can't drift based on the viewer's own timezone.
  - `@Docs` unaffected; no bundler/Framer Motion/Motion One dependency was introduced — native CSS scroll-snap covered the "Apple-like inertial scrolling + elastic bounce" requirement without one.
- **Verified**: Rebuilt and redeployed the container; curl-verified `/api/quadrant/:epochMs` for live/past/future-clamped/week-boundary-crossing cases (e.g. 8 days back correctly dropped week 27→26, Selkie→Loch Ness Monster). Drove the real app with a headless Chromium (playwright-core against system `/usr/bin/chromium`, no dev server needed — hit the already-running container): clicking the prev arrow 3× stepped the character/clock/time card back correctly and revealed the Return-to-Present button; the next arrow advanced one step; Return to Present snapped exactly back to the original live character and re-disabled the next arrow. A deeper 90-step walk landed precisely on Fri Jul 3, 11:00 am (BuDdy) with the day theme correctly flipped to Halloween, rendered all 13 real image thumbnails in the gallery, and opened the lightbox on click. Zero browser console errors across all runs.

