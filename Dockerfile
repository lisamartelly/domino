# Stage 1: Build the frontend
FROM node:24-alpine AS frontend-build

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ .
RUN npm run build

# Stage 2: Build the backend
FROM node:24-alpine AS backend-build

WORKDIR /app/backend

COPY backend-ts/ .
RUN npm ci
RUN npx prisma generate
RUN npm run build

# Stage 3: Production runtime
FROM node:24-alpine AS runtime

WORKDIR /app

# Copy compiled backend
COPY --from=backend-build /app/backend/dist ./dist

# Overlay Prisma-generated source files so .ts references resolve at runtime
COPY --from=backend-build /app/backend/src/generated/ ./dist/src/generated/

COPY --from=backend-build /app/backend/node_modules ./node_modules
COPY --from=backend-build /app/backend/package.json ./

# Copy Prisma schema, config, and migrations for prisma migrate deploy
COPY --from=backend-build /app/backend/prisma ./prisma
COPY --from=backend-build /app/backend/prisma.config.ts ./prisma.config.ts

# Copy frontend build output so NestJS can serve it as static assets
COPY --from=frontend-build /app/frontend/dist ./public

# Copy entrypoint script
COPY backend-ts/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 8080

ENV PORT=8080
ENV NODE_ENV=production

CMD ["./docker-entrypoint.sh"]
