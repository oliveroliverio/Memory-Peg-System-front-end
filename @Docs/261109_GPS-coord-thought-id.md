# Implementation Plan: GPS Coordinates in Thought ID Clipboard Anchor

**Date**: 2026-11-09
**Target repo**: `Memory-Peg-System-front-end` on roc5 (`~/DV/Memory-Peg-System-front-end/`)
**Target files**: `public/index.html`, `public/style.css`, `public/app.js` only
**Live URL**: `http://100.91.119.53:8080` (verified live Nov 9, 2026)
**Docs destination**: copy this file into `@Docs/` as `261109_GPS_Coordinates_Clipboard.md`

---

## 1. Overview & Objective

Extend the existing Thought ID clipboard feature (see `@Docs/260810_Thought_ID_Clipboard_Anchor.md`) so the copied anchor can also carry the user's real GPS coordinates — latitude and longitude from whatever device is viewing the page (phone GPS, laptop Wi-Fi fix, etc.).

Current anchor today:

```text
YYMMDD-HHMMSS_<location>
Example: 260810-085431_home_office
```

New anchor, when GPS is on and available:

```text
YYMMDD-HHMMSS_<location>_N32.67452_W117.10655
```

That coordinate suffix follows the user's own chat-tag convention (`N<lat>_W<lon>`). The coordinates are for building-level identification only — which building / spot he was in — not for navigation or tracking.

When GPS is off, denied, unavailable, or blocked, the feature must degrade to today's anchor with no coordinates, and the existing copy must still work exactly as it does now. GPS must never break the Thought ID copy.

## 2. Decision: which "API" to use

### Primary — browser Geolocation API (use this)

- `navigator.geolocation.getCurrentPosition()` — built into every modern browser.
- **Cost: free. No API key, no signup, no server call, no new dependency.**
- **Accuracy: building-level.** The browser picks the best source the device has: GPS on a phone (typically ~5–20 m), Wi-Fi / cell fix on a laptop (typically ~20–65 m). The returned `coords.accuracy` value (in metres) tells you which you got.
- No code branching per device is needed. The browser does the device-specific work; the app just asks once and reads `coords.latitude` / `coords.longitude`.

### Do NOT use an IP-geolocation API as the primary source

IP APIs (ipapi.co, ip-api.com, IPinfo, etc.) locate the *IP address*, not the device. That is city-level at best — accuracy at city level "drops sharply, often to 50–75%" — and it is worse here than usual: on Tailscale / VPN the visible IP is not the device's real location at all. An IP lookup would happily return the wrong city and look confident doing it. Never present an IP-derived position as a GPS position.

### Fallback only — ipapi.co (optional, coarse, labelled)

If, and only if, device GPS is unavailable *and* the user still wants a rough position, offer a clearly labelled coarse fallback:

- `GET https://ipapi.co/json/` — free, no key, 1,000 calls/day, sends CORS headers so it works from the browser, returns `latitude` / `longitude` / `city`.
- Free tier of the main alternative, ip-api.com, is 45 requests/minute with no key, non-commercial use only — but its free endpoint is HTTP-only and does not send CORS headers for browser use, so ipapi.co is the better browser fallback.
- Fallback coordinates must be marked coarse in the UI and in the toast (e.g. "coarse, city-level"). Never append fallback coordinates silently as if they were GPS. If the user does not explicitly opt into the fallback, skip it — copy the anchor without coordinates instead.

No other external API, key, or paid tier is needed for this feature.

## 3. The secure-context problem (read this before writing code)

This is the load-bearing constraint, and the most likely reason the feature "works on my machine and not on my phone":

- `navigator.geolocation` only exists in a **secure context** (HTTPS, or `localhost`). Served over plain HTTP, "you won't get a permission prompt at all; the success callback never fires" and the error can look like a permission denial even though the user was never asked.
- The live app is served over plain HTTP at `http://100.91.119.53:8080` — a Tailscale IP, not `localhost`. Treat GPS availability on that origin as **unverified until tested on the phone**, not as a given.
- `navigator.clipboard` has the same secure-context requirement, which is why the existing code already has an `execCommand('copy')` fallback. Reuse that pattern; do not remove it.

**Step 0 (do first, before building the UI):** on the phone, over Tailscale, at `http://100.91.119.53:8080`, log `window.isSecureContext`, `!!navigator.geolocation`, and the result of one `getCurrentPosition` call. Report the result in `LOG.md`.

- If geolocation works there, proceed as specified below.
- If it is blocked as an insecure origin, do NOT fake it: implement the feature exactly as specified (detection + graceful "GPS unavailable on this connection" state + ipapi.co coarse fallback only on explicit opt-in), keep the existing Thought ID copy working, and stop. Serving the app over HTTPS (e.g. a Tailscale certificate / MagicDNS name) is a **separate follow-up decision for the user**, not part of this PRD. Do not add TLS, a reverse proxy, or a new domain in this change.

## 4. Current state (verified Nov 9, 2026 — do not re-derive, verify before editing)

- Button `#copy-thought-id-btn` ("📌 Copy Thought ID") in `public/index.html`; modal `#thought-id-modal` with input `#thought-location-input`, preview `#thought-id-preview`, submit `#thought-modal-submit`; toast container and `showToast()` in `public/app.js`.
- `formatThoughtId(locationStr, now)` in `public/app.js` builds `YYMMDD-HHMMSS_<location>`, sanitising spaces to `_` and defaulting an empty location to `location`.
- `copyTextToClipboard(text)` in `public/app.js` tries `navigator.clipboard.writeText` when `navigator.clipboard && window.isSecureContext`, otherwise falls back to a temporary off-screen `<textarea>` + `document.execCommand('copy')`. Reuse it unchanged.
- Last typed location is persisted in `localStorage` under `last_thought_location` and pre-filled on next open. Do not change that key or behaviour.
- Backend is untouched by this feature. No change to `server.js`, `compose.yml`, `Dockerfile`, `package.json`, or any `lib/` file. No new npm dependency. No new environment variable. No new API endpoint. No data is sent to the server — coordinates live only in the browser and in the clipboard string the user copies.

## 5. Specification

### 5.1 Format

- Coordinates are appended **after** the location label, never before it, so existing anchors stay prefix-compatible:
  `YYMMDD-HHMMSS_<location>_N<lat>_W<lon>`
- Latitude: `N` for >= 0, `S` for < 0. Longitude: `E` for >= 0, `W` for < 0. Use the absolute value after the letter.
- Precision: **5 decimal places** (e.g. `32.67452`, `117.10655`). That is ~1.1 m of resolution — more than enough for building level — and avoids false precision from 6+ decimals. Round, do not truncate.
- Example: `261109-151444_home_N32.67452_W117.10655`
- The accuracy value (`coords.accuracy`, metres) is **not** part of the copied string. Show it in the UI/toast only (e.g. "±18 m").
- If the user has GPS off, the anchor is exactly today's format with no trailing underscore and no coordinate suffix.

### 5.2 UX — modal changes (`public/index.html`, `public/style.css`)

- Add one checkbox in the Thought ID modal, below the location input, default **checked** (GPS is the point of this feature, but the user can uncheck it in one tap):
  - Label: `📍 Include GPS coordinates`
  - Subtext, small and muted: `Uses your device location. Nothing is sent to the server.`
- Add a status line under the checkbox, initially empty, with three states:
  - Locating: `Locating…` (spinner or pulsing dot, theme-matched)
  - Ready: `📍 N32.67452, W117.10655 (±18 m)` — coordinates + accuracy
  - Unavailable: `GPS unavailable on this connection — copying without coordinates.` (or `Location permission denied — copying without coordinates.`)
- The live preview `#thought-id-preview` must update to show the full anchor *with* coordinates as soon as a fix arrives, and back to the no-coordinate form if GPS is unchecked / unavailable. The preview is the contract: what the preview shows is exactly what gets copied.
- Keep the existing modal behaviour: Enter submits, Escape closes, location pre-fills from `localStorage`. Do not change the button text, modal layout, or toast styling beyond adding the new checkbox/status line in the same glassmorphism style.

### 5.3 JS logic (`public/app.js`)

Add, next to `formatThoughtId` / `copyTextToClipboard`:

1. `getDevicePosition()` — a small Promise wrapper around `navigator.geolocation.getCurrentPosition`, with options `{ enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }`.
   - `enableHighAccuracy: true` asks for GPS on phones; accept that it can take a few seconds.
   - `maximumAge: 60000` reuses a fix from the last 60 seconds so repeat copies are instant.
   - Resolve with `{ latitude, longitude, accuracy }`; reject with the `PositionError` (`code` 1 = denied, 2 = unavailable, 3 = timeout).
2. `formatCoordinates(lat, lon)` — returns `N32.67452_W117.10655` per §5.1 (5 decimals, hemisphere letters, absolute values).
3. `formatThoughtId(locationStr, now, coords)` — extend the existing function with an optional third argument. When `coords` is present, append `_` + `formatCoordinates(...)`. When absent, return exactly today's string. Do not change the existing two-argument behaviour.
4. Request timing — **only on user action, never on page load**:
   - When the modal opens *and* the GPS checkbox is checked, start one `getDevicePosition()` call. Do not request location on page load, and do not request it if the checkbox is unchecked.
   - If the user submits before the fix arrives, wait for the in-flight fix up to the 10 s timeout, then copy with coordinates if it landed, without if it did not. Never block the copy indefinitely on GPS.
   - If the checkbox is unchecked after a fix arrived, discard the fix for that copy (do not append stale coordinates).
   - Cache the last successful fix in a module-level variable (not `localStorage`) for the session, so a second copy within 60 s does not re-prompt. Do **not** persist coordinates to `localStorage` — the location *label* is persisted, coordinates are not.
5. Copy path — unchanged: build the string, call the existing `copyTextToClipboard()`, show the existing toast. On success the toast shows the copied anchor (with coordinates when present) plus accuracy when known, e.g. `Copied Thought ID to clipboard: 261109-151444_home_N32.67452_W117.10655 (±18 m)`.
6. Error handling — map each failure to the status line and toast, and always fall through to copying without coordinates:
   - `code 1` (denied): `Location permission denied — copying without coordinates.` Do not re-prompt in a loop; the user can re-enable it in browser settings.
   - `code 2` (unavailable) or `code 3` (timeout): `Could not get a GPS fix — copying without coordinates.`
   - `!window.isSecureContext` or `!navigator.geolocation`: `GPS unavailable on this connection — copying without coordinates.` (See §3.)
   - Coarse fallback (only if the user explicitly opts in — see §5.4): fetch `https://ipapi.co/json/`, take `latitude`/`longitude`, show `Coarse location (± city level)`, and append coordinates only with that label shown. If the fetch fails, copy without coordinates.
7. No console spam: one concise log line per copy (`[Thought ID] copied …`), matching the existing log style. No logging of coordinates beyond the copied string itself.

### 5.4 Explicit non-goals (do not build these)

- No `watchPosition` / live tracking. One fix per copy, on demand only.
- No map, no reverse-geocoding (no place name lookup), no address lookup.
- No server storage of coordinates, no new database column, no new API route, no analytics.
- No automatic GPS request on page load.
- No HTTPS / TLS / reverse-proxy work in this change (see §3).
- No change to the gallery, quadrant, time-travel, or any other view.
- No change to the `last_thought_location` persistence.

## 6. Implementation steps

1. **Step 0 — verify on the phone** (§3): log `isSecureContext`, `navigator.geolocation` presence, and one live fix at `http://100.91.119.53:8080`. Record the result in `LOG.md` before building the UI.
2. `public/index.html` — add the GPS checkbox + status line inside `#thought-id-modal`, below the location input. No other HTML changes.
3. `public/style.css` — style the checkbox row and status line in the existing glassmorphism / dark-theme style. No global style changes.
4. `public/app.js` — add `getDevicePosition()`, `formatCoordinates()`, extend `formatThoughtId()` with the optional coords argument, wire modal-open → request fix, submit → wait-or-copy, checkbox toggle → update preview. Reuse `copyTextToClipboard()` and `showToast()` unchanged.
5. Rebuild / redeploy exactly as the repo already does (`git pull` + `docker compose up -d --build` on roc5; see `@Docs/Raspberry-Pi-Deployment.md`). Confirm the container is `Up` and `http://100.91.119.53:8080` returns 200.
6. Update `LOG.md` with what changed, the Step 0 result, and the test results from §7.

## 7. Verification & testing plan

Run these on the phone (primary device) over Tailscale, and once on a laptop:

1. **Happy path (phone):** open modal, GPS checkbox checked, fix arrives, preview shows `…_N…_W…` with accuracy, submit → clipboard contains exactly the preview string, toast shows the anchor + accuracy. Paste into Notes and confirm the coordinates match the phone's real position at building level.
2. **GPS off / denied:** deny permission (or turn location off) → status line explains, copy still succeeds without coordinates, anchor is exactly today's format.
3. **Checkbox off:** uncheck → preview loses the coordinate suffix, copy has no coordinates, no permission prompt appears.
4. **Insecure context:** if Step 0 showed geolocation blocked on `http://100.91.119.53:8080`, confirm the app shows the "unavailable on this connection" state and the Thought ID copy still works. Do not claim GPS works if it does not.
5. **Timeout:** with GPS on but no fix (e.g. indoors, airplane-mode-adjacent), submit within the timeout → copy completes without coordinates instead of hanging.
6. **Repeat copy:** copy twice within a minute → second copy is instant (cached fix), same coordinates, no second permission prompt.
7. **Regression:** with GPS unavailable, the existing flow is byte-identical to before: same format, same modal, same toast, same `localStorage` pre-fill. The gallery and quadrant views are untouched.
8. **Privacy check:** confirm in the Network tab / server logs that no request carrying coordinates leaves the browser except the optional, user-opted-in `ipapi.co` fallback fetch. Coordinates are never POSTed to the roc5 server.

## 8. Acceptance criteria

- [ ] Thought ID copy works with GPS on (phone): anchor includes `_N<lat>_W<lon>` at 5 decimals, preview matches clipboard exactly.
- [ ] Thought ID copy works with GPS off / denied / timed out / unchecked: anchor is today's format, no coordinates, no hang, no error toast that blocks the copy.
- [ ] No location request happens on page load; only after the modal opens with the checkbox checked.
- [ ] No coordinates are sent to the server or stored in `localStorage`.
- [ ] No change to `server.js`, `compose.yml`, `Dockerfile`, `package.json`, or any `lib/` file; no new dependency.
- [ ] Container rebuilds and serves 200 at `http://100.91.119.53:8080`; gallery and quadrant views unchanged.
- [ ] `LOG.md` records the Step 0 secure-context result and the phone test results.
