# Use node alpine image for a small footprint, ideal for Raspberry Pi (ARM architecture)
FROM node:20-alpine

# Set node environment to production
ENV NODE_ENV=production

# Set up working directory
WORKDIR /app

# Copy package files and install production dependencies only for reproducibility
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Copy the rest of the application files
COPY . .

# Run as non-root user for better security
USER node

# Expose the port the app runs on
EXPOSE 8080

# Command to run the application
CMD ["node", "server.js"]
