# Restarting Node Servers and Using Environment Variables

When you make changes to backend code (like `server.js`) or configuration files (like `.env`), you **must** restart the server for the changes to take effect. If you only modify frontend static files (like HTML, CSS, or client-side JavaScript in the `public` folder), a simple browser refresh is all that is needed.

## Issue Encountered
The user modified the `.env` file to set `BACKEND_URL='100.88.124.124:3000'` but didn't know if a restart was necessary. Furthermore, the URL was missing the `http://` protocol, which causes the `fetch` API in Node.js to throw a "Failed to parse URL" error, and `dotenv` was not installed, meaning Node.js wouldn't natively load the `.env` file without a specific CLI flag.

## Solution

### 1. Formatting the URL correctly
Any URL passed to `fetch` must include a valid protocol. The `.env` file was corrected to:
```bash
BACKEND_URL='http://100.88.124.124:3000'
```

### 2. Loading the `.env` file
We installed the `dotenv` package so the server automatically loads variables from the `.env` file without needing custom command-line flags.
```bash
npm install dotenv
```
And added this line to the top of `server.js`:
```javascript
require('dotenv').config();
```

### 3. How to Restart the Server
Since changes were made to `.env` and `server.js`, a restart is required.

**If running locally on your Mac:**
Stop the server by pressing `Ctrl + C` in the terminal, then start it again:
```bash
npm run start
```

**If running on your Raspberry Pi with PM2:**
Run the following command on the Raspberry Pi:
```bash
pm2 restart memory-peg-frontend
```
