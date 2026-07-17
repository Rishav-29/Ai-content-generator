# Use Node.js 20 Alpine as base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY backend/package*.json ./backend/

# Install backend dependencies
RUN cd backend && npm install --production

# Copy backend source code
COPY backend/ ./backend/

# Copy frontend source code (served statically by backend)
COPY frontend/ ./frontend/

# Expose port
EXPOSE 3000

# Set environment variables (these should be overridden at runtime)
ENV PORT=3000
ENV NODE_ENV=production

# Start the application
CMD ["node", "backend/server.js"]
