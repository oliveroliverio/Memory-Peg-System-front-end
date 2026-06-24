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
