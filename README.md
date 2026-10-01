# 👑 The Grand Imperial Palace & Luxury Suites
### Full-Stack Luxury Heritage Hotel Reservation & Front-Desk Management System

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4.21.2-lightgrey?logo=express&logoColor=black)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Cloud_SQL-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.39-C5F74F?logo=drizzle&logoColor=black)](https://orm.drizzle.team/)
[![Vite](https://img.shields.io/badge/Vite-6.2.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?logo=vercel&logoColor=white)](https://vercel.com/)

---

## 📖 Table of Contents
1. [Project Overview](#-project-overview)
2. [Core Features](#-core-features)
   - [Guest Booking & Reservation Engine](#1-guest-booking--reservation-engine)
   - [Curated 3-Step Checkout Experience](#2-curated-3-step-checkout-experience)
   - [Front-Desk Reception Portal](#3-front-desk-reception-portal)
   - [Palace Admin Management Console](#4-palace-admin-management-console)
   - [Security & Authentication Hardening](#5-security--authentication-hardening)
   - [Automated Email & OTP Services](#6-automated-email--otp-services)
   - [VIP Club & Patron Rewards](#7-vip-club--patron-rewards)
   - [100% Responsive Design](#8-100-responsive-design)
3. [Technology Stack](#-technology-stack)
4. [Project Directory Structure](#-project-directory-structure)
5. [Getting Started & Local Setup](#-getting-started--local-setup)
6. [Environment Variables Reference](#-environment-variables-reference)
7. [API Endpoints Reference](#-api-endpoints-reference)
8. [Demo Credentials](#-demo-credentials)
9. [License & Attribution](#-license--attribution)

---

## 🏰 Project Overview

**The Grand Imperial Palace & Luxury Suites** is a full-stack, enterprise-grade hotel reservation and hospitality operations platform built for an iconic Indian heritage palace located in Colaba, Mumbai.

The application integrates guest-facing luxury booking flows with hotel operations (front-desk reception, walk-in management, identity verification, room housekeeping, folio billing, tax invoicing, and administrative analytics).

```
┌────────────────────────────────────────────────────────────────────────┐
│                        THE GRAND IMPERIAL PALACE                       │
├──────────────────────────────────┬─────────────────────────────────────┤
│        Guest-Facing Engine       │      Hotel Operations & Admin       │
├──────────────────────────────────┼─────────────────────────────────────┤
│ • 34 Handcrafted Palace Suites   │ • Front-Desk Reception Portal       │
│ • Live Availability & Filtering  │ • Walk-in Registrations & Check-in  │
│ • Multi-Step INR (₹) Checkout    │ • Govt ID Verification & Sanitizer  │
│ • Luxury Add-ons & Promo Codes   │ • Room Folio Charges & Tax Invoices │
│ • OTP Identity & Reset Services  │ • Admin Suite Inventory Management  │
│ • VIP Crown Loyalty Rewards      │ • Recharts Financial Analytics      │
└──────────────────────────────────┴─────────────────────────────────────┘
```

---

## ✨ Core Features

### 1. Guest Booking & Reservation Engine
- **34 Handcrafted Luxury Suites**: Across 4 categories (Standard, Deluxe, Executive, Royal Suites) with high-resolution imagery, floor specs, bed configurations, and square footage details.
- **Real-Time Date Filtering**: Dynamic check-in/check-out calendar picker with minimum date enforcement, guest count selectors, and category filters.
- **INR (₹) Tariff Computation**: Automatic calculation of night totals, promotional discounts, housekeeping fees, and 12% GST breakdown.

### 2. Curated 3-Step Checkout Experience
1. **Primary Guest Information**: Full name, email, 10-digit Indian phone formatting (`+91`), residence, and special stay preferences.
2. **Palace Add-Ons**: Private airport chauffeur transfers (Mercedes/BMW), royal Mithai & wine hampers, and Ayurvedic spa wellness passes.
3. **Payment & Confirmation**: Simulated payment gateway supporting Credit/Debit Cards, UPI IDs (GPay, PhonePe, Paytm), and Net Banking. Instant booking reference generation (e.g., `GIP-2026-XXXX`).

### 3. Front-Desk Reception Portal
- **Live Room Status Board**: Real-time room occupancy states (`Available`, `Occupied`, `Cleaning`, `Maintenance`).
- **Walk-in Registrations**: Direct guest check-in from the front desk with automated room assignment.
- **Government ID Verification**: Built-in verification and masking for Aadhaar, Passport, PAN Card, Voter ID, and Driving License.
- **Guest Folio & Extra Charges**: Itemized add-ons (in-room dining, spa therapies, laundry, minibar) with live balance calculation.
- **Printable Tax Folio / Invoices**: GST-compliant Bill of Supply with CGST/SGST tax breakdown, SAC codes, and printable PDF layout (`window.print()`).

### 4. Palace Admin Management Console
- **Suite Inventory CRUD**: Add, edit, discount, or decommission rooms with floor constraints and amenity badges.
- **Reservation Controls**: Real-time reservation status updates (`Confirmed` → `Checked In` → `Checked Out` → `Cancelled`).
- **Revenue & Analytics**: Visual charts powered by Recharts (occupancy rates, revenue trends, category breakdown).
- **Hotel Settings**: Live customization of hotel contact details, phone, email, and global announcement banners.

### 5. Security & Authentication Hardening
- **HMAC-SHA256 Session Tokens**: Cryptographically signed session tokens (`gip_sess_${payload}.${signature}`) verified with constant-time comparison (`crypto.timingSafeEqual`).
- **Rate Limiting**: Sliding-window rate limiters protecting `/api/auth/login`, `/api/auth/forgot-password/send-otp`, `/api/auth/forgot-password/verify-otp`, and `/api/otp/send`.
- **Privilege Escalation Prevention**: User role modification on `/api/user/profile` strictly restricted to verified administrators.
- **IDOR Protection**: Enforced ownership checks on booking cancellations.
- **Secure OTP Engine**: Cryptographically secure 6-digit OTP generation via `crypto.randomInt(100000, 1000000)` with 5-minute validity and single-use invalidation.
- **HTTP Security Headers**: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, and `Referrer-Policy`.

### 6. Automated Email & OTP Services
- **Welcome Emails**: Beautiful royal-themed HTML welcome emails dispatched upon new account registration.
- **Password Reset via Email OTP**: 6-digit OTP delivered directly to the user's registered inbox with verification modal and password reset.
- **Nodemailer Integration**: Configured for Gmail SMTP (App Passwords) and custom SMTP servers with fallback to development logging.

### 7. VIP Club & Patron Rewards
- Crown Loyalty Points tracking on user profiles (earn 10% points per reservation).
- Personalized stay preferences (high floor, quiet suite, extra pillows).

### 8. 100% Responsive Design
- Optimized for mobile, tablet, laptop, and ultra-wide desktop viewports.
- Touch-friendly controls, responsive modal overlays with keyboard scroll padding, horizontal table scrolling containers, and collapsible mobile navigation.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | [React 19](https://react.dev/) + [TypeScript 5.8](https://www.typescriptlang.org/) |
| **Styling & UI** | [Tailwind CSS 4.0](https://tailwindcss.com/) + [Lucide React](https://lucide.dev/) |
| **Data Visualization** | [Recharts 2.15](https://recharts.org/) |
| **Build Tool & Bundler** | [Vite 6.2](https://vitejs.dev/) |
| **Backend Server** | [Express 4.21](https://expressjs.com/) (Node.js) |
| **Database & ORM** | [PostgreSQL](https://www.postgresql.org/) / Google Cloud SQL + [Drizzle ORM](https://orm.drizzle.team/) |
| **Authentication** | Custom HMAC-SHA256 Signed Sessions + Firebase Auth / Supabase Auth Sync |
| **Email Delivery** | [Nodemailer 6.10](https://nodemailer.com/) |

---

## 📁 Project Directory Structure

```text
hotel-booking/
├── .env.example               # Template environment variables (safe for Git)
├── .gitignore                  # Git ignore rules (.env, node_modules, dist)
├── package.json               # Dependencies and scripts
├── server.ts                  # Express backend server with API endpoints & rate limiters
├── tsconfig.json              # TypeScript compiler configuration
├── vite.config.ts             # Vite bundler configuration
├── src/
│   ├── App.tsx                # Main application orchestrator & view router
│   ├── main.tsx               # Client entry point
│   ├── index.css              # Global styles & responsive utilities
│   ├── types.ts               # Shared TypeScript data models
│   ├── components/            # Reusable UI components
│   │   ├── AnnouncementBanner.tsx
│   │   ├── AuthModal.tsx      # Email/Password, Google Auth & Forgot Password OTP Modal
│   │   ├── BookingBar.tsx     # Hero check-in/out & room search bar
│   │   ├── InvoiceModal.tsx   # Printable GST Bill of Supply
│   │   ├── Navbar.tsx         # Responsive header & mobile drawer
│   │   ├── NetworkStatusIndicator.tsx
│   │   ├── OtpVerificationModal.tsx
│   │   └── RoomCard.tsx       # Suite showcase card
│   ├── context/               # React Context Providers
│   │   ├── AuthContext.tsx    # Auth state, session management, and role gating
│   │   └── NetworkStatusContext.tsx
│   ├── data/                  # Static assets & seed definitions
│   │   └── initialRooms.ts    # 34 handcrafted palace suites
│   ├── db/                    # Database layer
│   │   ├── index.ts           # PostgreSQL connection pool
│   │   ├── schema.ts          # Drizzle ORM schemas (rooms, bookings, users, settings)
│   │   └── queries.ts         # High-performance database queries & seeding
│   ├── lib/                   # External integrations
│   │   └── supabase.ts        # Optional Supabase client & profile syncing
│   ├── middleware/            # Backend middlewares
│   │   └── auth.ts            # HMAC-SHA256 token verification & RBAC
│   ├── services/              # API & client services
│   │   ├── api.ts             # Typed REST API client
│   │   ├── clientStore.ts     # Offline-resilient local cache
│   │   └── emailService.ts    # Nodemailer email sender (Welcome & OTP emails)
│   ├── utils/                 # Utilities
│   │   ├── idValidator.ts     # Government ID format validators (Aadhaar, Passport, PAN)
│   │   └── otpService.ts      # Cryptographic OTP generation & verification
│   └── views/                 # Full-page views
│       ├── AdminPortalView.tsx       # Palace Console (Analytics, Rooms, Bookings, Settings)
│       ├── BookingConfirmationView.tsx # Booking success voucher
│       ├── CheckoutView.tsx          # 3-step checkout & payment
│       ├── ExploreRoomsView.tsx      # Full catalog & search filters
│       ├── HomeView.tsx              # Luxury landing page & amenities showcase
│       ├── MyBookingsView.tsx        # Guest reservation history
│       ├── ProfileView.tsx           # Patron profile & Crown VIP points
│       ├── ReceptionView.tsx         # Front-desk operations board & folio
│       ├── RoomDetailView.tsx        # Suite specs, reviews, and calculator
│       └── ServicesView.tsx          # Palace dining, spa, and experiences
```

---

## 🚀 Getting Started & Local Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18.0 or higher)
- [npm](https://www.npmjs.com/) (version 9.0 or higher)

### 1. Clone the Repository
```bash
git clone https://github.com/Karan-0712/hotel-booking.git
cd hotel-booking
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create your local `.env` file from the provided example template:
```bash
cp .env.example .env
```

Open `.env` and fill in your configuration:
```env
APP_URL="http://localhost:3000"
SESSION_SECRET="your_long_random_session_secret_key_here"

# (Optional) Gmail App Password for live OTP & Welcome emails
GMAIL_USER="your-email@gmail.com"
GMAIL_APP_PASSWORD="xxxx xxxx xxxx xxxx"

# (Optional) PostgreSQL Database credentials (falls back to local memory if not provided)
SQL_HOST="localhost"
SQL_USER="postgres"
SQL_PASSWORD="your_postgres_password"
SQL_DB_NAME="hotel_db"
```

> **Note**: If PostgreSQL is not connected, the application automatically operates in resilient fallback mode with in-memory persistence and client storage.

### 4. Start the Development Server
```bash
npm run dev
```

Visit **`http://localhost:3000`** in your browser to experience The Grand Imperial Palace.

---

## 🔑 Demo Credentials

For testing and grading purposes, the following accounts can be used:

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Palace Administrator** | `admin@grandimperialpalace.in` | `ImperialAdmin` | Full Palace Console, Revenue Analytics, Room CRUD, Bookings |
| **Front Desk Staff** | `reception@grandimperialpalace.in` | `reception123` | Grand Reception, Walk-ins, Check-in/out, Folio Billing, ID Verification |
| **Royal Patron** | `guest@grandimperialpalace.in` | `guest123` | Suite Reservations, Checkout, VIP Points, Profile |

---

## 📡 API Endpoints Reference

### Public & Guest Endpoints
- `GET /api/health`: System health status check.
- `GET /api/rooms`: List all rooms with date availability and category filtering.
- `GET /api/rooms/:id`: Get individual suite details and reviews.
- `POST /api/bookings`: Create a new guest reservation.
- `GET /api/bookings/my`: List active user reservations (requires auth).
- `POST /api/bookings/:id/cancel`: Cancel a reservation (IDOR protected).
- `POST /api/reviews`: Submit verified patron review.
- `GET /api/settings`: Get hotel contact information and banner message.

### Authentication & OTP Endpoints (Rate Limited)
- `POST /api/auth/login`: Authenticate with email and password.
- `POST /api/auth/register`: Create a new guest account (sends welcome email).
- `POST /api/auth/forgot-password/send-otp`: Request 6-digit email OTP for password reset.
- `POST /api/auth/forgot-password/verify-otp`: Verify OTP and reset account password.
- `POST /api/otp/send`: Dispatch mobile verification OTP.

### Front-Desk & Reception Endpoints (`requireStaffOrAdmin`)
- `GET /api/reception/bookings`: List real-time bookings for front-desk operations.
- `POST /api/reception/walkin`: Register a walk-in guest and create check-in.
- `POST /api/reception/checkin`: Execute guest check-in with ID verification.
- `POST /api/reception/checkout`: Execute guest check-out and generate final invoice.
- `POST /api/reception/folio/add`: Add room service/spa charge to guest folio.
- `PATCH /api/reception/rooms/:id/housekeeping`: Update room cleaning/maintenance status.

### Admin Console Endpoints (`requireAdmin`)
- `GET /api/admin/stats`: Get hotel revenue, occupancy, and booking metrics.
- `POST /api/admin/rooms`: Create a new room in the catalog.
- `PUT /api/admin/rooms/:id`: Update room specs, pricing, or discounts.
- `DELETE /api/admin/rooms/:id`: Delete a room from the catalog.
- `PUT /api/admin/settings`: Update hotel settings and announcement banner.

---

## 🔒 Security Best Practices Implemented

- **No Secrets in Source Control**: `.env` and all environment credential files are strictly ignored via `.gitignore`.
- **Sliding-Window Rate Limiting**: Protects sensitive authentication and OTP routes against brute-force attacks.
- **HMAC Session Integrity**: Cryptographic HMAC-SHA256 signature verification on all internal session tokens.
- **Input Sanitization & Validation**: Validation of date ranges, phone numbers, email formats, and government ID structures.
- **Safe Database Queries**: Parameterized queries through Drizzle ORM preventing SQL injection.

---

## 📄 License & Academic Attribution

Developed as an academic project for **Web Application Development (WAD)**.

© 2026 **The Grand Imperial Palace & Luxury Suites**. All rights reserved.
