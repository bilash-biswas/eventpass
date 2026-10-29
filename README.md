# EventPass 🎟

EventPass is a production-grade, high-concurrency event ticketing, RSVP, and gate check-in platform spanning three production applications:

1. **Backend REST API** ([`backend/`](backend/)):
   - **Framework**: NestJS 11 with strict TypeScript, Prisma ORM, and PostgreSQL.
   - **Security**: Argon2 password hashing, JWT access + refresh token rotation with reuse detection, and role guards (`ATTENDEE`, `ORGANIZER`, `ADMIN`).
   - **Concurrency**: PostgreSQL row-level locking (`SELECT ... FOR UPDATE`) preventing overbooking under high concurrent load.
   - **Gate Check-In**: Atomic check-in endpoint with distinct `409 Conflict` double-scan detection.
   - **Documentation**: Swagger OpenAPI interactive UI at `http://localhost:3000/docs`.

2. **Web Application** ([`frontend/`](frontend/)):
   - **Framework**: Next.js 15 App Router, React 19, TypeScript, and Tailwind CSS.
   - **Security**: `httpOnly` secure cookie authentication proxy with zero client-side JWT token leakage.
   - **Public Catalog**: Filterable and searchable event listings, dynamic OpenGraph SEO metadata for event detail pages.
   - **Attendee Wallet**: Digital ticket passes with live SVG QR codes (`qrcode.react`), status badges, and cancellation.
   - **Organizer Dashboard**: Event management hub, real-time live form preview, attendee roster with RFC 4180 CSV export.

3. **Mobile Application** ([`mobile/`](mobile/)):
   - **Framework**: Flutter 3.32.0, Dart 3.8.0, Riverpod, GoRouter, and Freezed immutable models.
   - **Networking**: Dio with `QueuedInterceptor` providing automatic 401 token refresh queue and `FlutterSecureStorage` encryption.
   - **Ticket Wallet**: Perforated ticket stub aesthetic, 160-bit QR code generation, and automatic 100% screen brightness boost via `screen_brightness`.
   - **Gate Scanner**: Camera QR scanner with corner reticle brackets (`mobile_scanner`), torch toggle, manual code entry, and distinct haptic feedback.

---

## 🏃 Quick Start Guide

### 1. Launch Backend Database & API

```bash
# 1. Start PostgreSQL
docker compose up -d

# 2. Setup & Seed Database
cd backend
npm install
npm run prisma:migrate
npm run prisma:seed

# 3. Start NestJS Backend
npm run start:dev
```
- API Root: `http://localhost:3000/v1`
- Swagger UI: `http://localhost:3000/docs`
- Health check: `http://localhost:3000/v1/health`

### 2. Launch Web Application

```bash
cd frontend
npm install
npm run dev
```
- Web Application: `http://localhost:3001`

### 3. Launch Mobile Application

```bash
cd mobile
flutter pub get

# Android Emulator (automatically resolves host as 10.0.2.2:3000)
flutter run

# Web
flutter run -d chrome

# Physical Device over Wi-Fi/LAN
flutter run --dart-define=API_BASE_URL=http://<YOUR_LAN_IP>:3000
```

---

## 💡 Pre-seeded Demo Accounts

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Organizer** | `organizer@eventpass.io` | `Password123!` | Create events, view attendee rosters, export CSV, gate scanner |
| **Attendee 1** | `user1@eventpass.io` | `Password123!` | Browse events, RSVP, view ticket wallet, present QR pass |
| **Attendee 2** | `user2@eventpass.io` | `Password123!` | Browse events, RSVP, view ticket wallet, present QR pass |
| **Admin** | `admin@eventpass.io` | `Password123!` | System-wide administrative permissions |

---

## 🧪 Testing Suites

```bash
# Backend unit & e2e concurrency tests
cd backend && npm test && npm run test:e2e

# Web build & lint verification
cd ../frontend && npm run build

# Mobile static analysis & widget tests
cd ../mobile && flutter analyze && flutter test
```

---

## 📖 Sub-project Documentation

- [Backend REST API README](backend/README.md)
- [Next.js Web Application README](frontend/README.md)
- [Flutter Mobile Application README](mobile/README.md)
- [Production Deployment Guide](DEPLOYMENT.md)
