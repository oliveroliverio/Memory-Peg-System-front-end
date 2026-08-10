# Restarting Node Servers and Using Environment Variables

When you make changes to backend code (like `server.js`), configuration files (like `.env`), or `compose.yml`, you **must** rebuild or restart the container for changes to take effect. If you only modify client-side files during local development without Docker, a simple browser refresh is needed. In Docker production deployments, rebuilding the image is required.

## Environment Variable Setup

### 1. Formatting the Backend URL Correctly
Any URL passed to `fetch` must include a valid protocol (`http://` or `https://`):
```bash
BACKEND_URL='http://127.0.0.1:3000'
```

### 2. Loading `.env` in Node.js
The project uses `dotenv` to load `.env` variables automatically:
```javascript
require('dotenv').config();
```

---

## How to Restart / Redeploy the Server

### Local Development (without Docker)
Stop the local Node process with `Ctrl + C` in your terminal, then start it:
```bash
npm run start
```

### Production Deployment on Raspberry Pi (with Docker)
When running on the Pi under Docker Compose:

```bash
# Redeploy after pulling or editing code:
git pull
docker compose up -d --build

# Quick restart without rebuilding code:
docker compose restart memory-peg-frontend
```
