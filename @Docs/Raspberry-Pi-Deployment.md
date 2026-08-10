# Raspberry Pi Deployment Guide — Docker

Deploys the Memory Peg System Frontend on a Raspberry Pi using **Docker** and **Docker Compose**. Docker provides containerized isolation, persistent host DataLake volume mounting, automatic container restarts on boot, and reproducible builds.

---

## Prerequisites

1. **Docker & Docker Compose** installed on your Raspberry Pi:
   ```bash
   # Verify Docker installation
   docker --version
   docker compose version
   ```
2. User added to the `docker` group (so commands run without `sudo`):
   ```bash
   sudo usermod -aG docker $USER
   # Log out and back in for group changes to take effect
   ```

---

## Initial Setup & First Deployment

### 1. Clone the Repository
```bash
git clone https://github.com/oliveroliverio/Memory-Peg-System-front-end.git
cd Memory-Peg-System-front-end
```

### 2. Verify / Customize Environment Variables
The repository includes a `compose.yml` file configured for the frontend server. By default:
- **PORT**: `8080` (exposed to host `8080`)
- **BACKEND_URL**: `http://localhost:3000` (uses host networking mode so it talks directly to the backend API)
- **DATALAKE_PATH**: Read-only volume mount pointing to `/home/olivero54/DATALAKE`

If needed, create or edit `.env` to override configuration defaults:
```bash
cp .env.example .env
```

### 3. Build & Launch Containers
Run `docker compose` in detached mode:
```bash
docker compose up -d --build
```
- `--build`: Compiles the Node 20 Alpine Docker image using the `Dockerfile`.
- `-d`: Runs the container in the background (detached).
- `restart: unless-stopped` (in `compose.yml`): Ensures the app automatically restarts if the Pi reboots or if the container crashes.

### 4. Verify Container Status
Check that the container is up and healthy:
```bash
docker compose ps
```

Access the frontend dashboard from any device on your local network:
`http://<RASPBERRY_PI_IP>:8080`

---

## How to Redeploy After Source Code Changes

When you make changes to frontend static assets, server logic (`server.js`), or pull updates from GitHub, you **must rebuild and restart** the container so Docker picks up the new code.

> ⚠️ **Important:** Running `git pull` alone only updates files on the host disk. Docker runs inside a compiled image layer. You must include `--build` when redeploying!

### Complete Redeployment Workflow:

```bash
# 1. Navigate to the project directory
cd ~/Memory-Peg-System-front-end

# 2. Pull the latest code from GitHub
git pull

# 3. Rebuild the image and recreate the running container
docker compose up -d --build
```

Docker Compose will automatically:
1. Detect changes in the repository.
2. Rebuild the container image layer.
3. Stop the existing container cleanly.
4. Replace it with a new container running the updated code.
5. Re-attach volume mounts and host network mode without downtime.

---

## Useful Docker Commands

| Command | Description |
|---|---|
| `docker compose ps` | View status of running containers |
| `docker compose logs -f memory-peg-frontend` | Stream live container logs in real time |
| `docker compose restart memory-peg-frontend` | Quick container restart (does not rebuild code) |
| `docker compose up -d --build` | Rebuild image & redeploy container after code changes |
| `docker compose down` | Stop and remove running containers |
| `docker system prune -f` | Clean up unused build cache and dangling images |

---

## Troubleshooting

- **Container failed to start?**
  Inspect live logs:
  ```bash
  docker compose logs -f
  ```
- **Changes not showing up in browser?**
  Ensure you ran `docker compose up -d --build` (with `--build`) and hard-refresh your browser (`Cmd+Shift+R` or `Ctrl+F5`).
