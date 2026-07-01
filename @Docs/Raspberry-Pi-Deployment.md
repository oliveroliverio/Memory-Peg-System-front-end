# Raspberry Pi Deployment Guide — pm2 (Primary)

This guide covers deploying the Memory Peg System Frontend on a Raspberry Pi using **pm2**, which keeps the Node.js process alive 24/7 and auto-restarts it on reboot or crash.

> Docker instructions are preserved at the bottom as an alternative if you ever need multi-service orchestration.

---

## Prerequisites

- Node.js ≥ 18 installed on the Pi (`node -v` to check)
- The repo cloned on the Pi

```bash
git clone https://github.com/oliveroliverio/Memory-Peg-System-front-end.git
cd Memory-Peg-System-front-end
npm install
```

---

## One-Time pm2 Setup

```bash
# Install pm2 globally
npm install -g pm2

# Configure environment (backend URL, port, etc.)
cp .env.example .env
nano .env   # set BACKEND_URL and PORT as needed

# Start the app under pm2
pm2 start server.js --name memory-peg-frontend

# Persist the process list across reboots
pm2 save

# Generate the systemd/init startup hook (run the printed command it gives you)
pm2 startup
# ↑ Copy-paste the exact `sudo env PATH=...` command it prints and run it
```

Verify it's running:

```bash
pm2 status
pm2 logs memory-peg-frontend
```

Access the app at: `http://<RASPBERRY_PI_IP>:8080`

---

## Ongoing Update Workflow

Every time you push new code to GitHub and want to deploy to the Pi:

```bash
cd ~/Memory-Peg-System-front-end
git pull
pm2 restart memory-peg-frontend
```

3 commands. Done.

---

## Useful pm2 Commands

| Command | What it does |
|---|---|
| `pm2 status` | See all running processes |
| `pm2 logs memory-peg-frontend` | Tail live logs |
| `pm2 restart memory-peg-frontend` | Restart after code changes |
| `pm2 stop memory-peg-frontend` | Stop the process |
| `pm2 delete memory-peg-frontend` | Remove from pm2 list |
| `pm2 save` | Persist current process list to survive reboots |
| `pm2 startup` | Re-generate startup hook (run once after any OS reinstall) |

---

## Docker Alternative (appendix)

If you ever migrate to multi-service setup (backend + frontend together), Docker Compose is the better choice.

### Build and start

```bash
docker compose up --build -d
```

### Update after git pull

```bash
git pull
docker compose up --build -d
```

### Other commands

```bash
docker compose ps          # status
docker compose logs -f     # live logs
docker compose down        # stop and remove containers
```

> **Note**: Always use `--build` when deploying code changes. Docker caches the `npm install` layer, so rebuilds are fast.
