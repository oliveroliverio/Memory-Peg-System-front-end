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

