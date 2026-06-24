# Troubleshooting Raspberry Pi Deployment

This document outlines the troubleshooting steps taken to resolve a series of issues encountered when attempting to run both the frontend and backend 24/7 on a Raspberry Pi using PM2.

## The Issues

1. **Frontend Crashing (Missing Dependency):** The frontend PM2 instance was crashing on startup because it was trying to load the `dotenv` package (added recently to support environment variables), but `npm install` had not been run after the code was pulled.
2. **"Failed to load data" (IPv6 Localhost Bug):** The frontend was unable to fetch data from the backend because the `.env` file pointed to `http://localhost:3000`. In Node 18+, `localhost` defaults to IPv6 (`::1`), but the backend was explicitly listening on IPv4 (`0.0.0.0`), causing connection refusals.
3. **Serving Stale Data (Port Hogging):** Once the frontend finally connected, it returned old backend data (returning `weekCharacter` instead of the newly refactored `weekCreature`). This occurred because an old `systemd` service of the backend was still running in the background and holding port 3000 hostage. When PM2 tried to start the *new* backend on port 3000, it failed silently and went into a 100% CPU crash loop, leaving the frontend talking to the old `systemd` service.

---

## Step-by-Step Resolution

### 1. Fix the Node.js IPv6 Localhost Bug
To ensure the frontend communicates with the backend over IPv4 (which is what `0.0.0.0` listens on), change the `BACKEND_URL` in the frontend's `.env` file from `localhost` to the explicit IPv4 address:

```bash
# In ~/Memory-Peg-System-front-end/.env
BACKEND_URL=http://127.0.0.1:3000
```

### 2. Identify and Kill the Rogue Background Service
To find out what was holding port 3000 hostage (the old `systemd` service), we used the `ss` command:

```bash
sudo ss -lptn 'sport = :3000'
```

**Example Output:**
```
State     Recv-Q    Send-Q       Local Address:Port        Peer Address:Port    Process
LISTEN    0         511                0.0.0.0:3000             0.0.0.0:*        users:(("node",pid=29714,fd=18))
```

*Note: Be careful not to confuse the `Send-Q` (e.g., 511) with the actual Process ID. The true Process ID is listed at the very end as `pid=29714`.*

Once the correct PID was identified, we forcefully killed the rogue process to free up port 3000:
```bash
sudo kill -9 29714
```

### 3. Update the Code and Restart PM2
With the port finally free, we ensured the backend had the latest mythical creature code by pulling from GitHub, and then allowed PM2 to properly take over.

```bash
# Update the backend code
cd ~/Memory-Peg-System
git pull
npm install

# Restart the backend PM2 instance
pm2 restart memory-peg-backend

# Update the frontend code
cd ~/Memory-Peg-System-front-end
git pull
npm install

# Restart the frontend PM2 instance
pm2 restart memory-peg-frontend
```

After these steps, the frontend successfully connected to the correct, newly-updated PM2 backend on `127.0.0.1:3000`, and the iPhone immediately displayed the correct mythical creature data!
