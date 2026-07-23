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

COPY backend-ts/package*.json ./
COPY backend-ts/prisma.config.ts ./
COPY backend-ts/prisma/ ./prisma/

RUN npm ci
RUN npx prisma generate

COPY backend-ts/ .
RUN npm run build

# Stage 3: Production runtime
FROM node:24-alpine AS runtime

WORKDIR /app

COPY --from=backend-build /app/backend/dist ./dist
COPY --from=backend-build /app/backend/src/generated ./src/generated
COPY --from=backend-build /app/backend/node_modules ./node_modules
COPY --from=backend-build /app/backend/package.json ./

# Copy frontend build output so NestJS can serve it as static assets
COPY --from=frontend-build /app/frontend/dist ./public

EXPOSE 8080

ENV PORT=8080
ENV NODE_ENV=production

CMD ["node", "dist/main.js"]
