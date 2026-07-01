# Troubleshooting: Stale pm2 Process Serving Old Code

**Symptom:** You pushed new code to GitHub, ran `git pull` and `pm2 restart` on the Pi,
but the API is still returning the old response. The file on disk is correct, but
the running process hasn't picked up the changes.

---

## Why This Happens

`pm2 restart` sends a SIGINT/SIGTERM signal to the process. On resource-constrained
hardware (like the Pi Zero), the signal is **acknowledged by pm2 but not always
delivered to the child process**, so the old process stays alive on the port.
pm2 then starts a *second* process which either fails to bind the port or never
gets requests because the old one is already listening.

---

## Diagnosis Steps

### Step 1 — Verify the file on disk is correct (Pi)

```bash
node -e "
const {buildCharacterResponse} = require('/home/olivero54/Memory-Peg-System/server.js');
const r = buildCharacterResponse(new Date());
console.log('Keys:', Object.keys(r));
console.log('Sample field:', r.prevTimeCharacter);
"
```

**Expected:** Shows `prevTimeCharacter` in the keys list and its value.  
**If missing:** The git pull didn't update the file — re-run `git pull`.

---

### Step 2 — Verify what the API is actually returning (Mac)

```bash
# From your Mac — hit the Pi's backend directly over Tailscale
curl http://100.88.124.124:3000/getCharacters | python3 -m json.tool | grep -A3 "prevTime\|nextTime"

# Or hit your local backend
curl http://localhost:3000/getCharacters | python3 -m json.tool | grep -A3 "prevTime\|nextTime"
```

If the file is correct (Step 1) but the API returns old data, you have a stale process.

---

### Step 3 — Check running node processes (Pi)

```bash
ps aux | grep node | grep -v grep
```

**Example output showing the problem:**
```
olivero+  9303  0.1 13.1 149876 57148 ?  Ssl  12:29  /usr/bin/node /home/olivero54/Memory-Peg-System/server.js
olivero+ 15174  1.2 13.4 187140 58672 ?  Ssl  13:01  node /home/olivero54/Memory-Peg-System-front-end/server.js
```

Look at the **start time** column (here `12:29`). If the backend process was started
*before* your git pull and pm2 restart, it's a stale process running old code.

---

### Step 4 — Check what pm2 thinks it's running (Pi)

```bash
pm2 show memory-peg-backend | grep -i "script\|path\|cwd"
```

Confirms the script path pm2 is managing. Cross-reference with `ps aux` to verify
which PID corresponds to which file.

---

### Step 5 — Check pm2 logs for errors (Pi)

```bash
pm2 logs memory-peg-backend --lines 20
```

If you see repeated `API server is listening at http://0.0.0.0:3000` lines,
the process keeps crashing and restarting. No error lines means it starts
cleanly but the stale process is still holding the port.

---

## Fix

### Option A — Force-kill the stale process (Pi)

Note the PID from Step 3 (e.g. `9303`) and kill it directly:

```bash
kill 9303
```

pm2 detects the death and automatically spawns a fresh process using the current
code on disk. Wait ~2 seconds, then verify:

```bash
curl http://localhost:3000/getCharacters | python3 -m json.tool | grep -A3 "prevTime\|nextTime"
```

---

### Option B — Kill by process name (Pi, no PID lookup needed)

```bash
kill $(ps aux | grep 'Memory-Peg-System/server' | grep -v grep | awk '{print $2}')
```

pm2 auto-respawns. Verify with curl as above.

---

### Option C — Use pm2 reload instead of pm2 restart (preferred going forward)

`pm2 reload` does an in-process graceful reload that is more reliable than
`pm2 restart` on constrained hardware:

```bash
git pull && pm2 reload memory-peg-backend
```

This should be the standard deploy command going forward.

---

## Full Verified Deploy Workflow (Pi)

```bash
# Backend
cd ~/Memory-Peg-System
git pull
pm2 reload memory-peg-backend

# Verify backend is returning new fields
curl http://localhost:3000/getCharacters | python3 -m json.tool | grep -A3 "prevTime\|nextTime"

# Frontend
cd ~/Memory-Peg-System-front-end
git pull
pm2 reload memory-peg-frontend
```

If `pm2 reload` doesn't work, fall back to Option B above and pm2 will auto-respawn.

---

## Verify End-to-End From Mac

```bash
# Hit Pi backend directly over Tailscale
curl http://100.88.124.124:3000/getCharacters | python3 -m json.tool | grep -A3 "prevTime\|nextTime"

# Hit Pi frontend proxy (what the browser actually uses)
curl http://100.88.124.124:8080/api/getCharacters | python3 -m json.tool | grep -A3 "prevTime\|nextTime"
```

Both should return `prevTimeCharacter` and `nextTimeCharacter`.  
Then hard-refresh your browser (`Cmd+Shift+R`) or close/reopen the Safari tab on iPhone.

---

## Key Takeaways

| Command | Behaviour on Pi Zero |
|---|---|
| `pm2 restart` | Unreliable — old process may survive |
| `pm2 reload` | Graceful in-place reload — preferred |
| `kill <PID>` | Nuclear option — guaranteed; pm2 auto-respawns |
| `git pull` alone | Updates disk only; running process unchanged |

> **Remember:** A Node.js process loads code *once at startup*. `git pull` only
> changes the file on disk. The running process must be restarted/reloaded to
> pick up any changes.
