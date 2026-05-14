# Docker Best Practices

---

## Multi-Stage Build

Use multiple stages to keep the final image small:

```dockerfile
# Stage 1: Install all dependencies (including devDeps for build)
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --include=dev

# Stage 2: Build the application
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: Production runtime (minimal image)
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nodeapp

# Copy only production artifacts
COPY --from=deps --chown=nodeapp:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodeapp:nodejs /app/dist ./dist
COPY --from=builder --chown=nodeapp:nodejs /app/package.json ./

USER nodeapp

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "dist/index.js"]
```

---

## Dependency Caching

Always copy `package*.json` before `COPY . .` so Docker can cache the `npm ci` layer:

```dockerfile
# Cached if package.json unchanged
COPY package*.json ./
RUN npm ci

# Only invalidates the cache above if source changes
COPY . .
```

---

## .dockerignore

```
node_modules
.next
dist
build
*.log
.env
.env.local
.git
.gitignore
coverage
tests
docs
*.md
```

---

## Environment Variables

```dockerfile
# Set defaults in Dockerfile — override at runtime
ENV NODE_ENV=production \
    PORT=3000 \
    LOG_LEVEL=info

# Never bake secrets into the image
# Pass at runtime: docker run -e JWT_SECRET=... or via docker-compose
```

---

## Health Checks

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1
```

Use `wget` (available in Alpine) instead of `curl` to avoid installing extra packages.

---

## Image Size Tips

- Use `node:20-alpine` (not `node:20`): ~50MB vs ~350MB.
- Remove build tools in the same `RUN` layer:
  ```dockerfile
  RUN apk add --no-cache python3 make g++ \
    && npm ci \
    && apk del python3 make g++
  ```
- Use `npm ci --omit=dev` in the production stage.
- Only copy files you need in the final stage.

---

## Security

- Run as a non-root user (see multi-stage example above).
- Use `--no-new-privileges` in docker-compose.
- Scan images with `docker scout` or `trivy` in CI.
- Pin base image versions: `node:20.11-alpine3.19` not `node:latest`.
