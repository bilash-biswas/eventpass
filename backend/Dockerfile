# =============================================================================
# Stage 1: Build stage
# =============================================================================
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Install native build tools needed for packages with C++ bindings (argon2)
RUN apk add --no-cache python3 make g++

# Copy package dependency manifests
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies required for compilation)
RUN npm install

# Generate Prisma Client
RUN npx prisma generate

# Copy application source and build configurations
COPY tsconfig*.json nest-cli.json ./
COPY src ./src

# Compile NestJS TypeScript application into dist/
RUN npm run build

# Remove development dependencies to keep production image footprint minimal
RUN npm prune --omit=dev

# =============================================================================
# Stage 2: Production runtime stage (minimal, secure, non-root user)
# =============================================================================
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

# Install dumb-init for graceful signal handling (PID 1) and curl for container health check
RUN apk add --no-cache dumb-init curl

# Default environment configuration
ENV NODE_ENV=production
ENV PORT=3000

# Copy production node_modules from builder
COPY --chown=node:node --from=builder /usr/src/app/node_modules ./node_modules

# Copy compiled JavaScript output
COPY --chown=node:node --from=builder /usr/src/app/dist ./dist

# Copy Prisma schema, migrations, and package manifests (for schema runtime and prisma migrate deploy)
COPY --chown=node:node --from=builder /usr/src/app/prisma ./prisma
COPY --chown=node:node --from=builder /usr/src/app/package.json ./package.json

# Switch to the unprivileged 'node' user (UID 1000)
USER node

# Expose standard application port
EXPOSE 3000

# Docker native container health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/v1/health || exit 1

# Handle process termination signals properly
ENTRYPOINT ["dumb-init", "--"]

# Launch production server
CMD ["node", "dist/main.js"]
