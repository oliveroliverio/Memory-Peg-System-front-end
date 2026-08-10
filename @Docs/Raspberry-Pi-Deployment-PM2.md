# Raspberry Pi Deployment Guide — (Deprecated PM2 Guide)

> [!NOTE]
> **This PM2 guide has been superseded.**  
> The Memory Peg System frontend is now deployed using **Docker** and **Docker Compose**.
> 
> Please refer to the official Docker guide:
> 📄 [Raspberry-Pi-Deployment.md](file:///home/olivero54/DV/Memory-Peg-System-front-end/@Docs/Raspberry-Pi-Deployment.md)

---

## Migration Summary (PM2 → Docker)

The project has transitioned from PM2 process management to Docker Compose for containerized isolation, consistent host network mapping, and simplified `--build` redeployments.

### Quick Command Reference Comparison:

| Action | Old PM2 Command | New Docker Command |
|---|---|---|
| **Deploy / Start** | `pm2 start server.js --name memory-peg-frontend` | `docker compose up -d --build` |
| **Redeploy Code Change** | `git pull && pm2 reload memory-peg-frontend` | `git pull && docker compose up -d --build` |
| **View Logs** | `pm2 logs memory-peg-frontend` | `docker compose logs -f` |
| **Check Status** | `pm2 status` | `docker compose ps` |
| **Stop Server** | `pm2 stop memory-peg-frontend` | `docker compose down` |
