# Troubleshooting: Docker Container Serving Old Code After Git Pull

**Symptom:** You pushed new code to GitHub, ran `git pull` on the Pi, but the web app is still returning the old code or previous UI features.

---

## Why This Happens in Docker

Docker containers run compiled image layers. Running `git pull` updates the files on the host file system, but **does not automatically update the Docker container image**. 

If you run `docker compose restart` or `docker compose up -d` without the `--build` flag, Docker reuses the existing container image containing the old version of the source code.

---

## The Fix: Rebuild & Redeploy Container

To force Docker to pick up fresh source code changes:

```bash
cd ~/Memory-Peg-System-front-end
git pull
docker compose up -d --build
```

### What `--build` Does:
1. Detects changed files on disk (`server.js`, `public/*`, `package.json`, etc.).
2. Re-runs `Dockerfile` instructions to construct a fresh container image layer.
3. Gracefully stops the old running container.
4. Spawns the new container using the newly built image.

---

## Diagnostic & Verification Steps

### Step 1 — Check Docker Container Status
```bash
docker compose ps
```
Ensure `memory-peg-frontend` status is `Up`.

### Step 2 — Tail Container Logs
```bash
docker compose logs -f memory-peg-frontend
```
Look for startup logs confirming `server.js` initialized cleanly.

### Step 3 — Force Browser Cache Refresh
Client-side assets (HTML, CSS, JS) may be cached by mobile Safari or desktop browsers.  
- **Desktop**: Press `Cmd + Shift + R` (Mac) or `Ctrl + F5` (Windows/Linux).
- **Mobile Safari**: Close the tab and reopen it or clear website data.

---

## Quick Command Summary

| Goal | Command |
|---|---|
| Rebuild container after code changes | `git pull && docker compose up -d --build` |
| View real-time container logs | `docker compose logs -f` |
| Restart existing container | `docker compose restart` |
| Tear down containers | `docker compose down` |
