# Backend Dockerfile
FROM node:18-alpine AS backend-builder

WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --only=production

COPY backend/ ./
RUN npm run build

# Frontend Dockerfile
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# Production image
FROM node:18-alpine

RUN addgroup -g 1001 -S nodejs
RUN adduser -S argus -u 1001

WORKDIR /app

# Copy backend
COPY --from=backend-builder --chown=argus:nodejs /app/backend/dist ./backend/dist
COPY --from=backend-builder --chown=argus:nodejs /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder --chown=argus:nodejs /app/backend/package.json ./backend/

# Copy frontend build
COPY --from=frontend-builder --chown=argus:nodejs /app/frontend/build ./frontend/build

# Create logs directory
RUN mkdir -p /app/logs && chown argus:nodejs /app/logs

USER argus

EXPOSE 3001

WORKDIR /app/backend

CMD ["node", "dist/server.js"]