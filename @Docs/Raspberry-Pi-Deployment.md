# Raspberry Pi 24/7 Production Deployment Guide

This guide provides step-by-step instructions on how to deploy the Memory Peg System Frontend on a Raspberry Pi using Docker and Docker Compose so it runs 24/7 continuously, even after reboots.

## Prerequisites
Ensure your Raspberry Pi has `git`, `docker`, and `docker-compose` installed.

If you don't have Docker installed, you can install it quickly on your Raspberry Pi:
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```
*(You may need to log out and log back in for the user group changes to apply.)*

---

## Step-by-Step Deployment Instructions

### 1. Clone the Repository
Start by pulling down the latest version of the frontend repository onto your Raspberry Pi:
```bash
git clone https://github.com/oliveroliverio/Memory-Peg-System-front-end.git
cd Memory-Peg-System-front-end
```

### 2. Configure Environment (Optional)
The application assumes your backend API (the original Memory-Peg-System) is running on the same Raspberry Pi on port `3000`. 
If your backend is running on a different port or a different machine, you can create an `.env` file to configure it:
```bash
cp .env.example .env
# Edit .env and add: BACKEND_URL=http://<YOUR_BACKEND_IP>:3000
```

### 3. Build and Start the Container 24/7
We will use Docker Compose to build the minimal production image and start it in the background (`-d` flag for detached mode).

```bash
docker compose up --build -d
```

**Why this setup?**
- **Docker Compose**: Ensures that the container will automatically restart if it crashes or if the Raspberry Pi reboots (thanks to `restart: unless-stopped`).
- **Host Network Mode**: We are using `network_mode: "host"`, meaning the container shares the Pi's networking. This natively allows the frontend container to talk to the backend on `localhost:3000` without any tricky Docker network configurations.
- **Minimal Image**: We use `node:20-alpine` and `--only=production` to keep the memory footprint very small on the Raspberry Pi.

### 4. Verify it's Running
Check the status of the container:
```bash
docker compose ps
```
Or check the live logs:
```bash
docker compose logs -f
```

### 5. Access the App
You can now access your beautiful dashboard from any device on your local network by going to:
`http://<RASPBERRY_PI_IP_ADDRESS>:8080`

### Updating the App in the Future
When you push new changes to GitHub and want to update the Raspberry Pi, run these commands inside the `Memory-Peg-System-front-end` directory:
```bash
git pull
docker compose up --build -d
```
Docker will automatically stop the old version, build the new one, and bring it back up seamlessly!
