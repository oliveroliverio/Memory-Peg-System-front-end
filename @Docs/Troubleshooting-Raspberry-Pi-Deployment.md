# Troubleshooting Raspberry Pi Deployment

This document outlines troubleshooting steps and solutions for running the frontend and backend 24/7 on a Raspberry Pi using Docker Compose.

---

## Common Issues & Solutions

### 1. "Failed to load data" (IPv6 / Host Networking Resolution)
- **Symptom:** The frontend proxy fails to fetch data from backend server at `http://localhost:3000`.
- **Cause:** Node.js 18+ resolves `localhost` to IPv6 (`::1`), whereas backend servers may listen exclusively on IPv4 (`0.0.0.0` or `127.0.0.1`).
- **Solution:** 
  In `compose.yml`, ensure `network_mode: "host"` is enabled so the container shares the Pi host's network interface directly, and set `BACKEND_URL=http://localhost:3000` or `http://127.0.0.1:3000`.

### 2. Code Changes Not Updating (Stale Docker Container)
- **Symptom:** You ran `git pull`, but the website still displays the old version.
- **Cause:** Running `docker compose up -d` without `--build` reuses the old compiled container image.
- **Solution:** Always include `--build` when redeploying after pulling code:
  ```bash
  git pull && docker compose up -d --build
  ```

### 3. Identifying Rogue Port Conflicts
- **Symptom:** Docker fails to start container because port `8080` or `3000` is already in use.
- **Solution:** Use `ss` or `lsof` to find what process is binding the port:
  ```bash
  sudo ss -lptn 'sport = :8080'
  ```
  Identify the PID (e.g. `pid=1234`) and stop/kill the rogue process:
  ```bash
  sudo kill -9 1234
  ```

---

## Complete Verification & Redeploy Workflow

```bash
# Update repository
cd ~/Memory-Peg-System-front-end
git pull

# Rebuild image & restart container
docker compose up -d --build

# Verify container health & logs
docker compose ps
docker compose logs -f memory-peg-frontend
```
