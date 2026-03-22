# SocietyPro — Society Management System

A full-stack, multi-society management platform built with **FastAPI** (Python) + **React** (Vite).

---

## Features

| Module | Capabilities |
|---|---|
| **Multi-Society** | SuperAdmin manages N societies; Admins/Residents are scoped to their own |
| **Dashboard** | Income vs Expense charts, expense pie, complaint & bill summaries |
| **Billing** | Flat-wise monthly bills, bulk generation, payment recording, defaulters list |
| **Ledger** | Double-entry income/expense transactions with category filters |
| **Complaints** | SLA tracking, priority, assignment, status workflow |
| **Visitors** | OTP/QR check-in/out, daily log |
| **Announcements** | Pinned notices, categories (general / event / notice / emergency) |
| **Assets** | Asset register with service history logs |
| **Vendors** | Vendor registry with ratings |
| **Budget** | Planned vs Actual comparison with bar chart |
| **Polls** | One-vote-per-user community polls |
| **Reports** | Excel + PDF for collection, defaulters, expenses, assets, visitors |
| **Audit Log** | Immutable action log with before/after values |
| **Settings** | 8-tab settings: General, Billing, Notifications, SMS, Email, WhatsApp, Database, Security |

---

## Tech Stack

```
Backend          FastAPI 0.109 · SQLAlchemy 2.0 · Alembic · Python 3.11
Database         SQLite (default) or Microsoft SQL Server (configurable)
Auth             JWT (HS256) + OTP via Twilio/MSG91
Notifications    SMS (Twilio/MSG91) · Email (SMTP/SendGrid) · WhatsApp (Twilio/WATI/Gupshup)
Reports          openpyxl (Excel) · reportlab (PDF)
Frontend         React 18 · Vite 5 · Recharts · Tailwind CSS
Deployment       Docker Compose (Nginx + FastAPI + SQLite volume)
```

---

## Quick Start

### 1. Backend

```bash
cd backend
cp .env.example .env          # edit SECRET_KEY and any credentials
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The API is now at `http://localhost:8000`.  
Swagger UI: `http://localhost:8000/docs`

**Default SuperAdmin:**  
Email: `admin@societypro.com`  Password: `Admin@123`

---

### 2. Frontend (Vite Dev Server)

```bash
cd frontend
npm install
npm run dev        # → http://localhost:3000
```

Or use the standalone HTML file (no build step):

```bash
# Just open frontend/index.html in a browser — no server needed for the demo
```

---

### 3. Docker Compose (Full Stack)

```bash
cp backend/.env.example .env     # fill in credentials
docker compose up --build -d
```

| Service  | Port |
|---|---|
| Frontend (Nginx) | 80 |
| Backend (FastAPI) | 8000 |

---

## Switching to MSSQL

1. Edit `.env` — set `DB_TYPE=mssql` and fill MSSQL credentials
2. Run the migration helper:

```bash
cd backend
python migrate.py --from sqlite --to mssql
```

3. Restart the application

The migration copies all tables and data, then Alembic keeps the schema in sync going forward.

---

## Alembic Migrations

```bash
cd backend
alembic init alembic
# Edit alembic/env.py to import models.Base and point to settings.DATABASE_URL
alembic revision --autogenerate -m "initial schema"
alembic upgrade head
```

---

## Project Structure

```
society-app/
├── backend/
│   ├── main.py                # FastAPI app, startup seed, router registration
│   ├── models.py              # SQLAlchemy ORM models
│   ├── schemas.py             # Pydantic request/response schemas
│   ├── auth.py                # JWT, bcrypt, OTP, role guards
│   ├── config.py              # Pydantic Settings (reads .env)
│   ├── database.py            # Engine factory, get_db, recreate_engine()
│   ├── migrate.py             # SQLite → MSSQL data migration script
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── .env.example
│   └── routers/
│       ├── auth.py            # /api/auth/*
│       ├── societies.py       # /api/societies/*
│       ├── billing.py         # bills, payments, transactions, defaulters
│       ├── core.py            # users, complaints, visitors, announcements,
│       │                      #   assets, vendors, budget, polls, audit
│       ├── settings.py        # /api/settings/*
│       └── reports.py         # /api/societies/{id}/reports/* (xlsx/pdf)
│
├── frontend/
│   ├── index.html             # Standalone demo (React via CDN, no build needed)
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── Dockerfile
│   ├── nginx.conf
│   └── src/
│       ├── main.jsx
│       ├── App.jsx            # React Router setup, lazy pages, auth guards
│       ├── index.css
│       ├── api/
│       │   └── index.js       # Axios client + all API module functions
│       ├── contexts/
│       │   └── AuthContext.jsx
│       ├── layouts/
│       │   └── AppLayout.jsx  # Sidebar + Header shell
│       ├── components/
│       │   └── ui.jsx         # Badge, StatCard, Button, Input, Modal, Table…
│       └── pages/
│           ├── LoginPage.jsx
│           ├── DashboardPage.jsx   (Recharts area + pie charts)
│           ├── SocietiesPage.jsx
│           ├── UsersPage.jsx
│           ├── BillingPage.jsx
│           ├── TransactionsPage.jsx
│           ├── ComplaintsPage.jsx
│           ├── VisitorsPage.jsx
│           ├── AnnouncementsPage.jsx
│           ├── AssetsPage.jsx
│           ├── VendorsPage.jsx
│           ├── BudgetPage.jsx      (Recharts bar chart)
│           ├── PollsPage.jsx
│           ├── ReportsPage.jsx     (triggers xlsx/pdf download)
│           ├── AuditPage.jsx
│           └── SettingsPage.jsx    (8 tabs)
│
└── docker-compose.yml
```

---

## API Summary

```
POST   /api/auth/login
GET    /api/auth/me
POST   /api/auth/send-otp
POST   /api/auth/verify-otp

GET    /api/societies/
POST   /api/societies/
GET    /api/societies/{id}/dashboard
GET    /api/societies/{id}/towers
GET    /api/societies/{id}/flats

GET    /api/societies/{id}/bills
POST   /api/societies/{id}/bills/generate-bulk
POST   /api/societies/{id}/bills/{bill_id}/pay
GET    /api/societies/{id}/transactions
GET    /api/societies/{id}/transactions/summary
GET    /api/societies/{id}/defaulters

GET    /api/societies/{id}/complaints
GET    /api/societies/{id}/visitors
GET    /api/societies/{id}/announcements
GET    /api/societies/{id}/assets
GET    /api/societies/{id}/vendors
GET    /api/societies/{id}/budget
GET    /api/societies/{id}/polls
POST   /api/societies/{id}/polls/{poll_id}/vote
GET    /api/societies/{id}/audit

GET    /api/settings/
PUT    /api/settings/bulk
POST   /api/settings/database/test
POST   /api/settings/database/switch
POST   /api/settings/notifications/test

GET    /api/societies/{id}/reports/collection?fmt=xlsx|pdf
GET    /api/societies/{id}/reports/defaulters?fmt=xlsx|pdf
GET    /api/societies/{id}/reports/expenses?fmt=xlsx|pdf
GET    /api/societies/{id}/reports/assets?fmt=xlsx|pdf
GET    /api/societies/{id}/reports/visitors?fmt=xlsx|pdf
```

---

## Roles

| Role | Permissions |
|---|---|
| `superadmin` | Full access to all societies and platform settings |
| `admin` | Full access within their society |
| `resident` | Own billing, complaints, visitors, polls, announcements |
| `staff` | Visitor management, complaints |
| `vendor` | Read-only relevant data |

---

## Pending / Next Steps

- [ ] Celery + Redis for auto-bill generation and payment reminder jobs
- [ ] File upload endpoints (invoice PDFs, asset photos)
- [ ] Push notifications (FCM)
- [ ] Resident mobile app (React Native / Flutter)
- [ ] Alembic migration scripts (autogenerate from models)
- [ ] Rate limiting and API key support for third-party integrations
