# Raspberry Pi 24/7 Production Deployment Guide (Without Docker)

Since the Docker repository doesn't yet support the bleeding-edge version of Raspbian (Trixie), we will use **PM2**, the industry standard process manager for Node.js. PM2 will keep your application running 24/7 and automatically restart it if the Raspberry Pi reboots.

## Prerequisites
Ensure your Raspberry Pi has Node.js and Git installed. 

If you don't have Node.js installed, install it via:
```bash
sudo apt update
sudo apt install -y nodejs npm git
```

---

## Step-by-Step Deployment Instructions

### 1. Clone the Repository
Pull down the latest version of the frontend repository onto your Raspberry Pi:
```bash
git clone https://github.com/oliveroliverio/Memory-Peg-System-front-end.git
cd Memory-Peg-System-front-end
```

### 2. Install Project Dependencies
Install the required packages for the Node.js server:
```bash
npm install
```

### 3. Configure Environment (Optional)
The application assumes your backend API is running on the same Raspberry Pi on port `3000`. 
If your backend is running on a different port or machine, you can configure it:
```bash
cp .env.example .env
# Edit the .env file to include your backend URL:
# BACKEND_URL=http://<YOUR_BACKEND_IP>:3000
```

### 4. Install PM2 Globally
Install the PM2 process manager globally so we can use its CLI:
```bash
sudo npm install -g pm2
```

### 5. Start the Application with PM2
Start the frontend server and name the process `memory-peg-frontend` so it's easy to identify:
```bash
pm2 start server.js --name "memory-peg-frontend"
```

### 6. Set Up Auto-Restart on Reboot
To ensure your app automatically starts when the Raspberry Pi reboots or loses power, run:
```bash
pm2 startup
```
**Important:** The `pm2 startup` command will output a specific `sudo env PATH...` command at the very bottom of the terminal. **You must copy and paste that exact command into your terminal and run it.**

Finally, save the current PM2 list so it remembers to start your app:
```bash
pm2 save
```

---

## Useful PM2 Commands

- **Check app status:** 
  ```bash
  pm2 status
  ```
- **View live logs:** 
  ```bash
  pm2 logs memory-peg-frontend
  ```
- **Restart the app:** 
  ```bash
  pm2 restart memory-peg-frontend
  ```
- **Stop the app:** 
  ```bash
  pm2 stop memory-peg-frontend
  ```

## Access the App
You can now access your dashboard from any device on your local network by going to:
`http://<RASPBERRY_PI_IP_ADDRESS>:8080`

### Updating the App in the Future
When you push new changes to GitHub and want to update the Raspberry Pi, simply run:
```bash
cd ~/Memory-Peg-System-front-end
git pull
npm install
pm2 restart memory-peg-frontend
```
