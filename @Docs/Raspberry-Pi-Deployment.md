# Raspberry Pi Deployment Guide — Docker (Primary)

This guide covers deploying the Memory Peg System Frontend on a Raspberry Pi using **Docker Compose**, which keeps the container running 24/7 and auto-restarts it on reboot or crash.

---

## Prerequisites

Ensure your Raspberry Pi has `git` and `docker` installed.

```bash
# Install Docker (one-liner)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
# Log out and back in for group changes to apply
```

---

## One-Time Setup

```bash
# Clone the repo
git clone https://github.com/oliveroliverio/Memory-Peg-System-front-end.git
cd Memory-Peg-System-front-end

# Configure environment
cp .env.example .env
nano .env   # set BACKEND_URL if backend is not on localhost:3000

# Build image and start container in background
docker compose up --build -d
```

Access the app at: `http://<RASPBERRY_PI_IP>:8080`

---

## Ongoing Update Workflow

Every time you push new code to GitHub and want to deploy to the Pi:

```bash
cd ~/Memory-Peg-System-front-end
git pull
docker compose up --build -d
```

- `--build` forces Docker to rebuild the image with the new source files
- `-d` runs it detached (in the background)
- The old container is stopped and replaced seamlessly
- `restart: unless-stopped` in `compose.yml` ensures it survives Pi reboots automatically

> **Always use `--build` on code deploys.** Docker caches the `npm install` layer, so rebuilds are fast even though you always pass the flag.

---

## Useful Docker Commands

| Command | What it does |
|---|---|
| `docker compose ps` | See container status |
| `docker compose logs -f` | Tail live logs |
| `docker compose up --build -d` | Deploy latest code (build + restart) |
| `docker compose restart` | Restart without rebuilding |
| `docker compose down` | Stop and remove container |
| `docker compose down --rmi local` | Stop, remove container and built image |

---

## Why Docker over pm2

| | Docker | pm2 |
|---|---|---|
| Auto-restart on crash | ✅ | ✅ |
| Auto-start on reboot | ✅ (`restart: unless-stopped`) | Requires `pm2 startup` setup |
| Isolated environment | ✅ | ❌ (uses host Node) |
| Reproducible deploys | ✅ (pinned image + lockfile) | ❌ |
| Multi-service ready | ✅ | Gets messy |
| Pi overhead | Moderate | Minimal |

Docker is the right choice here — consistent environments, zero "works on my machine" issues, and trivially extensible if a backend service is added to the same Pi later.
