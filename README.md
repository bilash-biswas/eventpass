# EventPass 🎟

EventPass is a production-ready event RSVP and ticketing platform. This repository contains the backend REST API, and will host the Next.js web application and Flutter mobile application.

- **Backend API**: [`backend/`](backend/) — NestJS 11, TypeScript (strict mode), PostgreSQL 16/17, Prisma ORM, Argon2, JWT with rotation & reuse detection, row-level locking, atomic check-in.
- **Interactive Documentation**: Available at `http://localhost:3000/docs` (OpenAPI Swagger UI) and `/docs-json`.
- **Client Codegen**: Offline export available via `npm run export:openapi` in `backend/` generating `openapi.json` for Dart (`swagger_parser`) and TypeScript (`openapi-typescript`).

---

## 🏃 Quick Start (Local Docker & Backend)

### 1. Launch PostgreSQL
```bash
docker compose up -d
```

### 2. Configure & Seed Backend
```bash
cd backend
cp .env.example .env
npm install
npm run prisma:migrate
npm run prisma:seed
```

### 3. Run Development Server
```bash
npm run start:dev
```
- API Root: `http://localhost:3000/v1`
- Swagger UI: `http://localhost:3000/docs`
- Health check: `http://localhost:3000/v1/health`

### 4. Run Test Suite
```bash
# Unit tests
npm run test

# End-to-end integration tests (concurrency & double-scan)
npm run test:e2e
```

### 5. Production Deployment & Docker
- Multi-stage Docker build: `docker build -t eventpass-backend ./backend`
- Full stack with Docker Compose: `docker compose up --build`
- See [Production Deployment Guide](DEPLOYMENT.md) for AWS ECS, Google Cloud Run, Render, and horizontal scaling notes.

For full architecture details, concurrency guarantees, and endpoint documentation, refer to the [Backend Documentation](backend/README.md).
