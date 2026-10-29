# EventPass Mobile Application

A high-performance Flutter mobile application for **EventPass** — a high-concurrency event ticketing, RSVP, and gate check-in platform.

Built with **Flutter 3.32.0**, **Dart 3.8.0**, **Riverpod**, **GoRouter**, **Dio**, **Freezed**, **qr_flutter**, and **mobile_scanner**.

---

## Key Features

- **Public Event Catalog & Discovery**:
  - Live event catalog with cover images, calendar date badges, venue metadata, and capacity counters.
  - Real-time search with debouncing and pull-to-refresh (`RefreshIndicator`).
- **Dynamic Event Details & RSVP**:
  - Hero banner presentation with formatted dates, location cards, host info, and descriptions.
  - Sticky bottom RSVP action bar with optimistic feedback and backend row-level locking guarantees.
- **Attendee Ticket Wallet & Digital Pass**:
  - Perforated ticket stub aesthetic with semicircular side cutouts and dashed separator styling.
  - High-density QR code rendered via `qr_flutter` encoding the 160-bit cryptographically random code.
  - One-tap "Copy Code" with instant clipboard confirmation.
  - Categorized tabs: **Active Passes** vs **Past & Concluded**.
  - One-tap RSVP cancellation with safety confirmation dialog to release spots back into event capacity.
- **Automatic Screen Brightness Boost**:
  - Elevates screen brightness to 100% when presenting the digital admission pass for optical scanner readability.
  - Automatically restores previous system brightness on modal dismissal.
- **Organizer QR Scanner & Atomic Gate Check-In**:
  - Camera scanner preview with illuminated corner reticle brackets (`mobile_scanner`).
  - Strict concurrency lock preventing multiple check-ins from identical camera frames.
  - Hardware flashlight toggle and front/back camera switching.
  - Manual alphanumeric code entry fallback for damaged screens or printed tickets.
  - **Haptic & Visual Feedback**:
    - **Success (200)**: `HapticFeedback.mediumImpact()`, green admission sheet with attendee and event details.
    - **Double Scan (409)**: `HapticFeedback.heavyImpact()`, amber warning alert with previous check-in timestamp.
    - **Invalid Code (404)**: `HapticFeedback.heavyImpact()`, red alert for non-existent tickets.
    - **Unauthorized (403)**: `HapticFeedback.heavyImpact()`, red alert for non-matching organizer permissions.
- **Secure Networking & Token Rotation**:
  - Dio `QueuedInterceptor` attaching JWT `Bearer` tokens.
  - Transparent 401 token refresh queue via separate Dio instance preventing retry loops and token reuse detection.
  - Encrypted credential storage using `FlutterSecureStorage` (`encryptedSharedPreferences` on Android, Keychain on iOS).

---

## Architecture Overview

The application follows a **feature-first** modular architecture:

```
mobile/lib/
├── app.dart                                # Root MaterialApp with theme & router
├── main.dart                               # Entry point initializing storage
├── core/
│   ├── api/
│   │   ├── api_client.dart                 # Dio instance with AuthInterceptor
│   │   ├── api_endpoints.dart              # Dynamic host resolution (10.0.2.2 / localhost / LAN)
│   │   └── auth_interceptor.dart           # Queued token injection & 401 refresh queue
│   ├── constants/                          # Global timeouts and storage keys
│   ├── router/                             # GoRouter with authentication guards
│   ├── storage/                            # FlutterSecureStorage wrapper
│   ├── theme/                              # Material 3 ColorScheme & typography
│   ├── utils/
│   │   ├── date_formatter.dart             # Calendar badge & date range formatting
│   │   └── screen_brightness_helper.dart   # Screen brightness boost & restore utility
│   └── widgets/
│       └── network_error_banner.dart       # Reusable offline / connection error banner
└── features/
    ├── auth/                               # Login, registration, token refresh, and user models
    ├── events/                             # Catalog, event details, RSVP, and event models
    ├── scanner/                            # Gate scanner, camera reticle, and atomic check-in
    └── tickets/                            # Ticket wallet, pass modal, and perforated ticket card
```

---

## Getting Started

### Prerequisites

- [Flutter SDK](https://flutter.dev/docs/get-started/install) (`>= 3.32.0`)
- [Dart SDK](https://dart.dev/get-dart) (`>= 3.8.0`)
- Android Studio / Android SDK (for Android emulator or device) or Xcode (for iOS)
- Running [EventPass NestJS Backend](../backend/)

### 1. Install Dependencies

```powershell
cd mobile
flutter pub get
```

### 2. Configure Backend Host Resolution

The mobile application automatically resolves the backend base URL depending on execution platform:

| Platform | Resolved Base URL |
| :--- | :--- |
| **Android Emulator** | `http://10.0.2.2:3000` (maps to host localhost) |
| **iOS Simulator / Web / Desktop** | `http://localhost:3000` |
| **Physical Android / iOS Device** | Pass `--dart-define=API_BASE_URL=http://<YOUR_LAN_IP>:3000` |

### 3. Run the Application

```powershell
# Android Emulator (uses 10.0.2.2 automatically)
flutter run

# Physical Device over LAN
flutter run --dart-define=API_BASE_URL=http://192.168.1.100:3000

# Flutter Web
flutter run -d chrome
```

---

## Pre-seeded Demo Accounts

Use the one-tap quick-fill buttons on the login screen or enter manually:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Organizer** | `organizer@eventpass.io` | `Password123!` | Event creation, Attendee Roster, Gate QR Scanner (`/scanner`) |
| **Attendee 1** | `user1@eventpass.io` | `Password123!` | Public catalog, RSVP, Ticket Wallet (`/my-tickets`) |
| **Attendee 2** | `user2@eventpass.io` | `Password123!` | Public catalog, RSVP, Ticket Wallet (`/my-tickets`) |

---

## Running Automated Tests

```powershell
cd mobile

# Static code analysis
flutter analyze

# Unit, repository, and widget tests
flutter test
```

### Test Coverage Highlights

- `test/core/api/auth_interceptor_test.dart`: Validates token attachment and null-token bypass.
- `test/features/auth/login_screen_test.dart`: Validates form rendering, input validation rules, demo quick-fill buttons, and authentication submission.
- `test/features/tickets/ticket_card_test.dart`: Validates QR code rendering, ticket code display, status badges, and cancel RSVP confirmation dialog.
- `test/features/scanner/scanner_repository_test.dart`: Validates 200 OK, 409 Conflict double-scan, 404 Not Found, and 403 Forbidden check-in outcomes.
- `test/features/scanner/scan_result_sheet_test.dart`: Validates approved check-in presentation and double-scan warning alert banners.
- `test/widget_test.dart`: Verifies `EventPassApp` mounting and initial catalog view.

---

## Code Generation

If you modify Freezed models (`*.freezed.dart`, `*.g.dart`), regenerate code with:

```powershell
dart run build_runner build --delete-conflicting-outputs
```
