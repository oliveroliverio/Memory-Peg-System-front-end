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
