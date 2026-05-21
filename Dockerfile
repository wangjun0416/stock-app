# Multi-stage build for Node.js application

# Stage 1: Build frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY . .
RUN npm run build

# Stage 2: Production server
FROM node:20-alpine AS production

WORKDIR /app

# Install serve for static files
RUN npm install -g serve

# Copy package files for backend
COPY package*.json ./
RUN npm ci --only=production

# Copy built frontend from builder stage
COPY --from=builder /app/build ./build

# Copy backend files
COPY server.js ./

# Expose ports
EXPOSE 3000 3001

# Create startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'echo "🚀 Starting Stock Monitor..."' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Start backend server' >> /app/start.sh && \
    echo 'node server.js &' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Wait a moment for backend to start' >> /app/start.sh && \
    echo 'sleep 3' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Start frontend server' >> /app/start.sh && \
    echo 'serve -s build -l 3000' >> /app/start.sh && \
    chmod +x /app/start.sh

# Start both services
CMD ["/app/start.sh"]
