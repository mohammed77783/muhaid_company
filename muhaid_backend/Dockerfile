
# ---- deps: all dependencies (cached until package*.json changes) ----
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- build: nest build -> dist/ ----
FROM deps AS build
COPY . .
RUN npm run build

# ---- tools: migrate and seed jobs (needs drizzle-kit and tsx), never serves traffic ----
FROM deps AS tools
COPY . .
# drizzle.config.ts and the seed script call process.loadEnvFile, which throws if the
# file is missing. An empty file satisfies it; real values come from container env vars.
RUN touch .env.production
ENV NODE_ENV=production

# ---- runtime: the API (last stage = default build target) ----
FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
# Runtime dependencies only (no TypeScript, vitest, drizzle-kit). Installed before
# copying dist so this layer stays cached when only source code changes.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist

RUN touch .env.production && mkdir -p uploads && chown -R node:node /app/uploads
USER node
EXPOSE 3000


HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/main"]
