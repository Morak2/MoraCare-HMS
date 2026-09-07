# Moracare HMS

A full-stack Hospital Management System (HMS) — a React frontend and a Node/Express + PostgreSQL backend, covering hospital registration, patient care, staff operations, and billing in one platform.

## Tech Stack

**Frontend:** React, Vite, Tailwind CSS
**Backend:** Node.js, Express, Prisma ORM
**Database:** PostgreSQL (via Supabase)
**Auth:** JWT-based authentication, role-based access control


## Structure

```
moracare-hms/
├── frontend/   React + Vite app
└── backend/    Node/Express API + Prisma + PostgreSQL
```

## User roles

- **Super Admin** — approves new hospitals, views platform-wide stats
- **Hospital Admin** — manages their hospital's staff, patients, and operations
- **Staff** (doctors, receptionists, pharmacists) — role-specific dashboards
- **Patients** — their own login, dashboard, and records

## Features

**Hospital & account management**
- Hospital registration with Super Admin approval workflow
- Staff, patient, and hospital-admin authentication (JWT), email verification, password change
- Subscription plans and pricing

**Patient care**
- Patient registration and records management
- Appointment scheduling
- Patient check-in queue and undo history, built on custom `Stack` and `Queue` (linked-list based) data structures
- Medical records, admissions, and bed management
- Lab requests and prescriptions

**Hospital operations**
- Staff management
- Pharmacy management
- Billing and payments, with payment proof upload
- Notifications
- Platform-wide statistics (Super Admin)

**Other**
- Contact/support page
- Security settings page

## Setup

### Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in your real DATABASE_URL, JWT_SECRET, etc.
npx prisma migrate dev
npm run dev
```

Runs on `http://localhost:5000` by default.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # point VITE_API_URL at your running backend
npm run dev
```

Runs on `http://localhost:5173` by default (Vite's default port).

## Notes

- Both `.env` files are gitignored on purpose — never commit real database credentials or secrets. Use the `.env.example` files as a template.
- Run the backend before the frontend, since the frontend depends on the API being reachable.
