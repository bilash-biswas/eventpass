# EventPass Production Deployment Guide 🚀

This document outlines the production architecture, containerization, database management, and deployment strategies for the **EventPass** backend REST API.

---

## 🏗 Production Architecture

```mermaid
graph TD
    Client["Clients (Web / Flutter Mobile)"] -->|HTTPS (TLS 1.3)| CDN["Cloudflare / AWS CloudFront"]
    CDN -->|Reverse Proxy| Ingress["Ingress / ALB (SSL Termination)"]

    subgraph "Container Cluster (AWS ECS / Cloud Run / K8s)"
        Node1["EventPass API Instance 1<br/>(Docker: non-root node user)"]
        Node2["EventPass API Instance 2<br/>(Docker: non-root node user)"]
        NodeN["EventPass API Instance N<br/>(Docker: non-root node user)"]
    end

    Ingress --> Node1
    Ingress --> Node2
    Ingress --> NodeN

    subgraph "Data Tier"
        PgBouncer["Connection Pooler (PgBouncer / RDS Proxy)"]
        PostgresPrimary[("PostgreSQL 16 Primary DB<br/>(Row-level locks FOR UPDATE)")]
        RedisCluster[("Redis Cluster<br/>(Distributed Throttler & Cache)")]
    end

    Node1 -->|Connection Pool| PgBouncer
    Node2 -->|Connection Pool| PgBouncer
    NodeN -->|Connection Pool| PgBouncer

    Node1 -.->|Rate Limiting| RedisCluster
    Node2 -.->|Rate Limiting| RedisCluster
    NodeN -.->|Rate Limiting| RedisCluster

    PgBouncer --> PostgresPrimary
```

---

## 📋 Production Environment Variables Checklist

Every environment variable is strictly validated at application startup using `class-validator` (`src/config/env.validation.ts`). Missing or invalid configuration causes the process to fail immediately before accepting traffic.

| Variable | Description | Production Recommendation |
|---|---|---|
| `NODE_ENV` | Environment mode | Must be set to `production` |
| `PORT` | HTTP port | Standard `3000` or assigned by platform (`PORT` env) |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/dbname?sslmode=require&connection_limit=20` |
| `JWT_ACCESS_SECRET` | Secret key for access token signing | Cryptographically random string (min 32 chars, preferably 64+ hex chars) |
| `JWT_ACCESS_EXPIRATION` | Access token lifespan | `15m` (short-lived) |
| `JWT_REFRESH_SECRET` | Secret key for refresh token signing | Unique cryptographically random string (min 32 chars, distinct from access secret) |
| `JWT_REFRESH_EXPIRATION_DAYS` | Refresh token retention | `7` days |
| `CORS_ORIGIN` | Allowed web origins (comma-separated) | `https://eventpass.io,https://app.eventpass.io` (Never use `*` in production) |
| `THROTTLE_TTL` | Rate limit window in milliseconds | `60000` (1 minute) |
| `THROTTLE_LIMIT` | Global requests allowed per window | `100` |
| `THROTTLE_AUTH_LIMIT` | Strict requests allowed for auth endpoints | `10` or `5` |

### Generating Secure Secrets
Generate cryptographically strong 256-bit secrets via Node.js or OpenSSL:
```bash
# Generate 64-character hex secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# OR via openssl
openssl rand -hex 32
```

---

## 🗄 Database Migration Strategy

### The Rule: Never run `prisma migrate dev` in Production
`prisma migrate dev` is designed exclusively for local development (it prompts for resets and generates new migration files). In staging and production environments, always apply committed migrations using:

```bash
npx prisma migrate deploy
```

### Zero-Downtime Migration Workflow
1. **Pre-Deployment / Release Phase**:
   - In platforms like Heroku, Render, Railway, or AWS CodePipeline, run `npx prisma migrate deploy` in the dedicated **Release Phase** or **Pre-deploy Command** step before new containers are routed live traffic.
   - For Kubernetes, run migrations in a Kubernetes `Job` or `initContainers` block before the new `Deployment` rollout begins.
2. **Backward Compatibility**:
   - Ensure database schema changes are non-breaking (e.g. add nullable columns first, deploy code that writes to both, then mark non-null in subsequent migrations).

---

## 🐳 Docker Deployment

Both the NestJS backend and Next.js frontend are containerized using production-grade multi-stage Dockerfiles:

### Backend Docker Image (`backend/Dockerfile`)
- Base image: `node:20-alpine`.
- Non-root user: Runs as unprivileged `node` user (UID 1000).
- Signal handling: Employs `dumb-init` as PID 1 for graceful termination.
- Healthcheck: Native `HEALTHCHECK` probe against `/v1/health`.
- Image footprint: ~150 MB after dev dependency pruning.

### Frontend Docker Image (`frontend/Dockerfile`)
- Base image: `node:20-alpine`.
- Standalone mode: Leverages Next.js 15 `output: 'standalone'` bundling with minimal footprint.
- Non-root user: Runs as unprivileged `nextjs` user (UID 1001).
- Signal handling: Employs `dumb-init` as PID 1.
- Healthcheck: Native `HEALTHCHECK` probe against `/`.

### Running Full Stack with Docker Compose
```bash
# Build and launch PostgreSQL, NestJS API, and Next.js Frontend
docker compose up --build -d

# Check running container health status
docker compose ps

# View unified application logs
docker compose logs -f
```

### Building & Running Manually
```bash
# 1. Build & run Backend
docker build -t eventpass-backend:latest ./backend
docker run -d \
  --name eventpass-api \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL="postgresql://user:pass@host:5432/eventpass_db?sslmode=require" \
  -e JWT_ACCESS_SECRET="your_secure_64_character_access_secret..." \
  -e JWT_REFRESH_SECRET="your_secure_64_character_refresh_secret..." \
  -e CORS_ORIGIN="http://localhost:3001" \
  eventpass-backend:latest

# 2. Build & run Frontend
docker build -t eventpass-web:latest ./frontend
docker run -d \
  --name eventpass-web \
  -p 3001:3000 \
  -e NODE_ENV=production \
  -e NEXT_PUBLIC_API_URL="http://localhost:3000" \
  -e INTERNAL_API_URL="http://host.docker.internal:3000" \
  eventpass-web:latest
```

---

## ☁️ Cloud Platform Guides

### 1. AWS ECS (Fargate)
1. Push Docker image to **AWS ECR** (Elastic Container Registry).
2. Configure **AWS Secrets Manager** or **Systems Manager Parameter Store** for database credentials and JWT secrets.
3. In the ECS Task Definition:
   - Reference secrets directly via `secrets` configuration.
   - Set container health check to `CMD-SHELL curl -f http://localhost:3000/v1/health || exit 1`.
   - Set CPU / Memory: 0.5 vCPU, 1 GB RAM (scales horizontally).
4. Configure an **Application Load Balancer (ALB)** with an HTTPS listener (port 443 with ACM certificate) forwarding to target group port 3000.
5. Set ALB Health Check path to `/v1/health`.

### 2. Google Cloud Run
1. Build and push image to **Google Artifact Registry**:
   ```bash
   gcloud builds submit --tag gcr.io/PROJECT_ID/eventpass-backend ./backend
   ```
2. Deploy to Cloud Run:
   ```bash
   gcloud run deploy eventpass-api \
     --image gcr.io/PROJECT_ID/eventpass-backend \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars NODE_ENV=production \
     --set-secrets DATABASE_URL=EVENTPASS_DB_URL:latest,JWT_ACCESS_SECRET=JWT_ACCESS_SECRET:latest,JWT_REFRESH_SECRET=JWT_REFRESH_SECRET:latest
   ```

### 3. Render or Railway
- Connect the Git repository.
- Root Directory: `backend`
- Environment: `Docker` (Render and Railway detect `backend/Dockerfile` automatically).
- Pre-deploy Command: `npx prisma migrate deploy`
- Set Environment Variables via dashboard.
- Health Check Path: `/v1/health`.

---

## ⚖️ Horizontal Scaling & Multi-Node Behavior

### Concurrency & Locking Across Multiple Instances
- **Row-Level Locking**: The RSVP capacity check uses PostgreSQL native `SELECT ... FOR UPDATE` via raw SQL inside a transaction. Because the lock is managed directly by the central PostgreSQL engine, **this locking is 100% safe across any number of parallel NestJS instances or pods**. Multiple app servers cannot oversell an event.
- **Atomic Check-In**: The `prisma.ticket.updateMany({ where: { id, status: 'VALID' } })` check-in query is similarly atomic at the PostgreSQL transaction level. Concurrent scans hitting different load-balanced servers are safely resolved with one success and one `409 Conflict`.

### Distributed Rate Limiting (Redis)
By default, `@nestjs/throttler` tracks requests in local container memory. When scaling to 2+ load-balanced instances:
- Install `@nest-lab/throttler-storage-redis` or `ioredis`.
- Configure `ThrottlerStorageRedisService` in `app.module.ts` pointing to an AWS ElastiCache / Redis instance so that request counts are shared across all nodes.

---

## 🩺 Health & Monitoring

### Health Endpoint
`GET /v1/health` performs an active database query (`SELECT 1`) through `PrismaService`:
- **Healthy (`200 OK`)**:
  ```json
  {
    "status": "ok",
    "timestamp": "2026-10-29T01:30:00.000Z",
    "database": {
      "status": "up"
    }
  }
  ```
- **Unhealthy (`503 Service Unavailable`)**:
  ```json
  {
    "statusCode": 503,
    "error": "Service Unavailable",
    "message": "Database connection failed",
    "path": "/v1/health",
    "timestamp": "2026-10-29T01:30:00.000Z"
  }
  ```

### Observability & Logging
- Every request is tagged with an `x-request-id` header (echoed back to client and captured in structured logs).
- Request Logger prints: `[HTTP] <method> <url> <statusCode> <duration>ms - <ip> - requestId: <uuid>`.
- Sensitive data (passwords, tokens, authorization headers) is scrubbed from logs.
