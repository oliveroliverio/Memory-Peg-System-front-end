# Raspberry Pi Deployment Guide — pm2

Deploys the Memory Peg System Frontend on a Raspberry Pi Zero using **pm2**, which is lightweight (~5MB overhead), auto-restarts on crash, and survives reboots.

---

## Prerequisites

Node.js ≥ 18 must be installed on the Pi. Check with `node -v`.

```bash
# Clone the repo
git clone https://github.com/oliveroliverio/Memory-Peg-System-front-end.git
cd Memory-Peg-System-front-end
npm install
```

---

## One-Time Setup

```bash
# Install pm2 globally
npm install -g pm2

# Configure environment
cp .env.example .env
nano .env   # set BACKEND_URL if backend is not on localhost:3000

# Start the app under pm2
pm2 start server.js --name memory-peg-frontend

# Persist the process list so it survives reboots
pm2 save

# Generate the startup hook (copy-paste the sudo command it prints)
pm2 startup
```

Verify it's running:

```bash
pm2 status
pm2 logs memory-peg-frontend
```

Access the app at: `http://<RASPBERRY_PI_IP>:8080`

---

## Ongoing Update Workflow

Every time you push new code to GitHub:

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
| `pm2 save` | Persist process list (run after any change) |
| `pm2 startup` | Re-generate startup hook after OS reinstall |

---

## Why pm2 over Docker on Pi Zero

The Pi Zero (ARMv6) has no official Docker support, and the Pi Zero 2 W (512MB RAM) is too constrained for Docker's ~80MB daemon overhead. pm2 adds ~5MB and provides the same crash-recovery and reboot-survival guarantees for a single Node.js process.
