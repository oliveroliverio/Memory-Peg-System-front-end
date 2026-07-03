# Dev Journal — July 3, 2026

Today I implemented a dynamic, day-of-the-week theme switcher for the Memory Peg System frontend. The goal was to dynamically adjust the visual styling (colors, gradients, typography, and glows) of the application depending on the current day's theme as retrieved from the `/api/getCharacters` endpoint (e.g., Easter on Sunday, Halloween on Friday, Christmas on Saturday).

### Architecture & Design Decisions
To keep the codebase clean, maintainable, and to avoid bloating `server.js`, I chose a purely client-side approach utilizing CSS custom properties (variables) and a dedicated stylesheet:
1. **Dynamic Font Loading**: I replaced the single Outfit Google Font import in `index.html` with a unified link requesting all the custom display fonts at once: `Outfit` (default body copy), `Fredoka` (Easter), `Russo One` (Independence Day), `Cinzel Decorative` (Mardi Gras), `Lora` (Thanksgiving), `Cinzel` (Lunar New Year), `Creepster` (Halloween), and `Mountains of Christmas` (Christmas).
2. **Variable-Based Core Styles**: In `style.css`, I replaced hardcoded visual properties (like text gradients, SVG clock glows, badge drop-shadows, and background gradients) with CSS variables. I also introduced smooth transition effects (`transition: 0.6s ease`) on elements so that styling changes animate fluidly on page load or quadrant shifts.
3. **Themed Variable Overrides**: I created `themes.css` to group theme variable overrides. When a class like `.theme-halloween` is applied to the `<body>`, it overrides the variables (such as `--bg-dark`, `--primary-color`, `--title-font`, and `--clock-glow`) defined in the root. This is extremely modular and avoids cluttering the main stylesheet.
4. **JS DOM Class Toggler**: In `app.js`, inside the `populateUI` function, the client-side logic strips any existing `theme-*` classes from `document.body` and adds the correct slugified theme class name (e.g., `theme-halloween` for Friday).

### The Debugging & Rebuild Headaches
After verifying that the Javascript and CSS were syntactically correct and starting the local server using `npm run dev`, I noticed the changes were not visible in the web browser. The app was serving the old `index.html` and stylesheet without the new themes.

Upon checking ports, I discovered that port 8080 was already occupied by a Node process (PID 22436) that had been started yesterday. Further inspection of its parent PID revealed it was being run inside a Docker container (`memory-peg-frontend`) managed by Docker Compose. Since the container built yesterday copied the static files rather than mounting them as a directory volume, it was serving stale code and preventing our local server task from binding to port 8080.

To resolve the conflict, I stopped our local task and ran:
```bash
docker compose up --build -d
```
This rebuilt the Docker image from our modified directory context, restarted the container, and immediately served the updated theme system. Once reloaded, the application successfully detected that today is Friday, applied the `theme-halloween` class, and dynamically adjusted the UI to the creepy orange and green theme with the `Creepster` display font.
