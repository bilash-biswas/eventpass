# EventPass API 🎫

A production-grade REST API backend for an event RSVP and ticketing platform built with **NestJS 11**, **TypeScript in strict mode**, and **PostgreSQL 16/17** with **Prisma ORM**. Designed as the unified backend consumed by both a **Next.js (App Router)** web app and a **Flutter** mobile app.

---

## 🏛 Architecture Overview

```mermaid
graph TD
    ClientWeb["Next.js Web App (SSR / Cookies)"] -->|HTTPS / JSON| API["EventPass REST API (NestJS)"]
    ClientMobile["Flutter Mobile App (Dio / Secure Storage)"] -->|HTTPS / JSON| API

    subgraph "API Core (NestJS)"
        GuardThrottler["ThrottlerGuard (Rate Limiting)"]
        GuardAuth["JwtAuthGuard (Access Tokens)"]
        GuardRoles["RolesGuard (RBAC: USER, ORGANIZER, ADMIN)"]
        Validation["Global ValidationPipe (whitelist, forbidNonWhitelisted)"]
        Filter["AllExceptionsFilter (Standard Shape + Prisma Error Mapping)"]
        Middleware["RequestLoggerMiddleware (x-request-id)"]
    end

    API --> GuardThrottler
    GuardThrottler --> GuardAuth
    GuardAuth --> GuardRoles
    GuardRoles --> Validation
    Validation --> ServiceLayer["Services (Auth, Events, Tickets, Users, Health)"]

    subgraph "Database & Storage"
        ServiceLayer -->|Prisma ORM| Postgres[("PostgreSQL 16/17 Database")]
    end
```

---

## 🛠 Tech Stack

| Technology | Purpose | Key Details |
|---|---|---|
| **NestJS 11** | Framework | Modular architecture, dependency injection, TypeScript strict mode |
| **PostgreSQL 16/17** | Relational Database | ACID guarantees, row-level locking (`FOR UPDATE`) |
| **Prisma ORM 6** | Object-Relational Mapping | Type-safe queries, declarative migrations, connection pooling |
| **Argon2** | Password Hashing | Memory-hard cryptographic hashing algorithm (argon2id) |
| **Passport & JWT** | Authentication | Short-lived access tokens (15m) + rotating SHA-256 refresh tokens (7d) |
| **@nestjs/throttler** | Rate Limiting | Global 100 req/min, strict 5 req/min on sensitive auth routes |
| **@nestjs/swagger** | API Documentation | OpenAPI 3.0 interactive Swagger UI at `/docs` & JSON export |
| **Helmet & CORS** | HTTP Security | Standard security headers, environment-driven origin allowlist |
| **class-validator** | Input Validation | DTO validation with strict type-casting & forbidden unknown keys |
| **Jest & Supertest** | Testing | Unit tests with mocks + end-to-end integration tests on real PostgreSQL |

---

## 🗃 Domain Model

```mermaid
erDiagram
    User ||--o{ RefreshToken : owns
    User ||--o{ Event : organizes
    User ||--o{ Ticket : attends
    Event ||--o{ Ticket : contains

    User {
        string id PK "UUID"
        string email UK "Unique email address"
        string passwordHash "Argon2 hash"
        string name "User display name"
        enum role "USER | ORGANIZER | ADMIN"
        datetime createdAt "Timestamp"
        datetime updatedAt "Timestamp"
    }

    RefreshToken {
        string id PK "UUID"
        string tokenHash UK "SHA-256 hash"
        string userId FK "References User"
        datetime expiresAt "Expiration date (7 days)"
        datetime revokedAt "Revocation timestamp or null"
        datetime createdAt "Timestamp"
    }

    Event {
        string id PK "UUID"
        string slug UK "Generated from title with collision handling"
        string title "Event title"
        string description "Markdown or plain text description"
        string location "Venue or online stream URL"
        datetime startsAt "Event start time"
        datetime endsAt "Event end time"
        int capacity "Maximum attendee count"
        string coverImageUrl "Nullable URL"
        enum status "DRAFT | PUBLISHED | CANCELLED"
        string organizerId FK "References User"
        datetime createdAt "Timestamp"
        datetime updatedAt "Timestamp"
    }

    Ticket {
        string id PK "UUID"
        string code UK "Cryptographically random 160-bit code"
        enum status "VALID | CHECKED_IN | CANCELLED"
        string eventId FK "References Event"
        string userId FK "References User"
        datetime checkedInAt "Timestamp or null"
        datetime createdAt "Timestamp"
        datetime updatedAt "Timestamp"
    }
```

---

## 🔒 Security & Concurrency Correctness

### 1. Concurrency-Safe RSVP (No Overselling)
When an attendee requests an RSVP, the operation executes within a Prisma `$transaction`:
- Executes raw SQL `SELECT id, capacity, status, "endsAt" FROM events WHERE id = ${eventId} FOR UPDATE` to acquire an exclusive row-level lock on the target event.
- Validates that the event status is `PUBLISHED`, the event has not concluded (`endsAt > now`), and the user does not hold an active ticket.
- Counts active tickets (`VALID` and `CHECKED_IN`). If `confirmedCount >= capacity`, transaction aborts with `409 Conflict`.
- Successfully verified by concurrent integration tests firing 10 simultaneous requests against 1 remaining spot (exactly 1 gets `201 Created`, 9 get `409 Conflict`).

### 2. Atomic QR Check-In (Zero Double Scans)
Event organizers scan tickets at the venue using a mobile device:
- The check-in query uses `prisma.ticket.updateMany({ where: { id: ticket.id, status: 'VALID' }, data: { status: 'CHECKED_IN', checkedInAt: now } })`.
- If the affected count is `0`, a simultaneous scan already processed the ticket and a `409 Conflict` is returned.
- Returns explicit, distinct error responses:
  - `404 Not Found` → `"Invalid ticket code"`
  - `403 Forbidden` → `"You are not authorized to check in tickets for this event"`
  - `400 Bad Request` → `"This ticket has been cancelled"`
  - `409 Conflict` → `"This ticket has already been checked in"`

### 3. Refresh Token Rotation & Automatic Reuse Detection
- Refresh tokens are never stored in plaintext; only their SHA-256 digest is persisted.
- On each `/v1/auth/refresh` call, the presented token is immediately revoked and a new token pair is issued.
- **Reuse Detection**: If a revoked token is presented, the system assumes token compromise and revokes **all** active refresh tokens belonging to that user.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v20 or higher
- **PostgreSQL**: v16 or v17 (or Docker Compose)
- **npm**: v10 or higher

### 1. Start Database via Docker Compose
From the repository root:
```bash
docker compose up -d
```
This starts PostgreSQL 16 on `localhost:5432` with database `eventpass_db`.

### 2. Environment Configuration
Copy `.env.example` to `.env` in `backend/`:
```bash
cp .env.example .env
```
Default `.env` configuration:
```env
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/eventpass_db?schema=public"

JWT_ACCESS_SECRET="eventpass_super_secret_jwt_access_key_min_32_characters"
JWT_ACCESS_EXPIRATION="15m"
JWT_REFRESH_SECRET="eventpass_super_secret_jwt_refresh_key_min_32_characters"
JWT_REFRESH_EXPIRATION_DAYS=7

CORS_ORIGIN="http://localhost:3000,http://localhost:3001"
THROTTLE_TTL=60000
THROTTLE_LIMIT=100
THROTTLE_AUTH_LIMIT=10
```

### 3. Run Migrations & Seed Database
```bash
cd backend
npm install
npm run prisma:migrate
npm run prisma:seed
```

#### Pre-seeded Test Accounts
All seeded accounts use password: `Password123!`

| Role | Email | Purpose |
|---|---|---|
| **ADMIN** | `admin@eventpass.io` | Global administrative privileges |
| **ORGANIZER** | `organizer@eventpass.io` | Event creator and QR check-in organizer |
| **USER** | `user1@eventpass.io` | Attendee with active ticket |
| **USER** | `user2@eventpass.io` | Attendee with checked-in ticket |

### 4. Start Development Server
```bash
npm run start:dev
```
The server starts at `http://localhost:3000`.

---

## 📖 API Documentation & Client Generation

### Interactive Swagger UI
Open `http://localhost:3000/docs` in your browser. All endpoints include request/response DTO schemas, authentication tags, and example payloads.

### Live OpenAPI JSON
The live OpenAPI specification is served at:
```
http://localhost:3000/docs-json
```

### Offline OpenAPI Export Script
Generate `openapi.json` without running the HTTP server (for automated Flutter/TypeScript codegen in CI/CD):
```bash
npm run export:openapi
```
This generates:
- `backend/openapi.json`
- `backend/swagger.json`

#### Generating Clients
- **TypeScript (Next.js)**:
  ```bash
  npx openapi-typescript backend/openapi.json -o ../frontend/types/api.ts
  ```
- **Dart (Flutter)**:
  ```bash
  dart run swagger_parser
  ```

---

## 🧪 Testing

The test suite covers unit tests and full end-to-end integration tests on a real PostgreSQL database.

```bash
# Run unit tests (services, business logic, mocks)
npm run test

# Run e2e integration tests (auth, concurrency, double-scan, health)
npm run test:e2e

# Run linter and formatting
npm run lint
npm run format
```

### Key Test Scenarios:
1. `tickets.e2e-spec.ts`:
   - **Concurrency Test**: 10 simultaneous HTTP requests for 1 remaining spot (`SELECT ... FOR UPDATE`); asserts exactly 1 receives `201 Created` and 9 receive `409 Conflict`.
   - **Double-Scan Test**: 2 simultaneous requests attempting to check in the same ticket code; asserts exactly 1 returns `200 OK` and 1 returns `409 Conflict`.
2. `auth.e2e-spec.ts`:
   - Password hashing verification (no password hashes exposed).
   - Token rotation on every refresh.
   - Token reuse detection revoking all active sessions.
   - Rate limiting returning `429 Too Many Requests` with standard error shape.
3. `events.e2e-spec.ts`:
   - Deterministic slug collision resolution (`title-1`, `title-2`).
   - Role-based authorization (`ORGANIZER` and `ADMIN` can create; only owner can edit/cancel).

---

## 📡 API Endpoints Reference

All routes are prefixed with `/v1`.

### Health
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/v1/health` | Public | Database connection and uptime health check |

### Authentication
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/v1/auth/register` | Public (Rate-limited) | Register user (`USER` or `ORGANIZER`) |
| `POST` | `/v1/auth/login` | Public (Rate-limited) | Login with email and password |
| `POST` | `/v1/auth/refresh` | Public (Rate-limited) | Rotate refresh token for new token pair |
| `POST` | `/v1/auth/logout` | Bearer Token | Revoke refresh token session |

### Users
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/v1/users/me` | Bearer Token | Current user profile |

### Events
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/v1/events` | Public | List published events with search, filter, pagination |
| `GET` | `/v1/events/:slug` | Public | Event details by slug |
| `POST` | `/v1/events` | ORGANIZER, ADMIN | Create event |
| `PATCH` | `/v1/events/:id` | Owner Only | Update event details / publish status |
| `DELETE` | `/v1/events/:id` | Owner, ADMIN | Soft-cancel event (`CANCELLED` status) |
| `GET` | `/v1/events/:id/attendees` | Owner Only | List confirmed attendees |

### Tickets & Check-In
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/v1/events/:id/rsvp` | Bearer Token | Concurrency-locked RSVP and ticket issuance |
| `DELETE` | `/v1/events/:id/rsvp` | Bearer Token | Cancel RSVP and release capacity |
| `GET` | `/v1/tickets/me` | Bearer Token | List all tickets owned by current user |
| `POST` | `/v1/tickets/check-in` | Event Owner, ADMIN | Atomic attendee check-in via QR code |

---

## 🛡 Consistent Error Response Shape

All errors thrown by the application or Prisma ORM are captured by `AllExceptionsFilter` and returned in a unified format:

```json
{
  "statusCode": 409,
  "error": "Conflict",
  "message": "Event is at full capacity",
  "path": "/v1/events/c8520fe0-669e-450a-a6ab-63cf65606c05/rsvp",
  "timestamp": "2026-10-29T01:30:10.991Z"
}
```

---

## 🚀 Deployment

For production deployments, container orchestration (AWS ECS, Google Cloud Run, Render), zero-downtime database migrations, and horizontal scaling strategies, see the [Production Deployment Guide](../DEPLOYMENT.md).

---

## 📄 License
UNLICENSED — EventPass Portfolio Project.
