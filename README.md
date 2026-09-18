# CityCare Hospital — Full-Stack Hospital Management Website

A comprehensive, deployable full-stack hospital management web application for **CityCare Hospital**.
Architected as an interconnected set of Configuration Items (CIs) tracked and governed by the **MedRelease** Software Configuration Management platform.

---

## 🌟 Key Features

- **Public Patient Experience**:
  - Hero landing page, Department Services directory, Physician directory with specialty search.
  - Interactive appointment booking with real-time 30-minute slot availability and conflict prevention.
  - Emergency Department online intake registration with priority triage status tracking.
  - Patient Portal to view consultations, access diagnostic lab results, and request prescription refills.
- **Physician Workspace (Doctor Dashboard - CI-05)**:
  - Consolidated daily consultation schedule with one-click status updates (`COMPLETED`, `NO_SHOW`).
  - Live emergency queue sorted by clinical acuity (`CRITICAL` &gt; `HIGH` &gt; `MEDIUM` &gt; `LOW`).
  - Diagnostic laboratory test ordering, specimen collection, and abnormal result entry.
  - Multi-item digital prescription issuance with automatic pharmacy stock deduction.
- **Hospital Administration & SCM Analytics**:
  - Cross-module reporting engine (CI-04) aggregating metrics across all clinical departments.
  - Dynamic CSV exports for Appointments, Emergency Triage, Laboratory Orders, and Pharmacy Inventory.
  - Full pharmaceutical formulary management with low-stock alerts and manual stock adjustments.
  - Prescription refill review and approval workflow.
  - System activity audit logging (`/activity`) tracking security and clinical events.
- **Security & RBAC**:
  - JWT authentication with bcrypt password hashing.
  - Strict role-based access control (`ADMIN`, `DOCTOR`, `PATIENT`).
  - Zero cross-patient information leakage (403 Forbidden enforcement).
  - Rate limiting on authentication and password reset endpoints.

---

## 🏗️ Technology Stack

| Layer | Technology |
|---|---|
| **Backend API** | FastAPI (Python 3.13) |
| **Database** | SQLite (local dev), PostgreSQL (production) |
| **ORM & Migrations** | SQLAlchemy 2.0, Alembic |
| **Authentication** | JWT (`python-jose`), bcrypt (`passlib==1.7.4`, `bcrypt==4.0.1`) |
| **Frontend SPA** | React 18, Vite 5, React Router 6 |
| **Styling** | Tailwind CSS 3, Lucide React icons |
| **Testing** | pytest, pytest-asyncio, httpx |
| **Deployment** | Docker, Render Blueprint (`render.yaml`) |

---

## 🚀 Quick Start (Local Setup)

### 1. Prerequisites
- Python 3.11+ (Python 3.13 tested)
- Node.js 18+ (Node.js 20 tested)

### 2. Backend Setup
```bash
cd backend

# Create virtual environment (if not present)
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations (automatically seeds on startup)
alembic upgrade head

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```
Backend API will be accessible at: `http://localhost:8000`
Interactive API Docs (Swagger): `http://localhost:8000/docs`

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
Frontend Web App will be accessible at: `http://localhost:5173`

---

## 🔑 Demo Accounts

All seed accounts use the default password: **`Password123!`**

| Role | Email | Name / Description |
|---|---|---|
| **ADMIN** | `admin@citycare.com` | Hospital Administrator (Full Access) |
| **DOCTOR** | `doctor@citycare.com` | Dr. Sarah Jenkins (Cardiology) |
| **DOCTOR** | `doctor.marcus@citycare.com` | Dr. Marcus Chen (Neurology) |
| **DOCTOR** | `doctor.priya@citycare.com` | Dr. Priya Patel (Pediatrics) |
| **DOCTOR** | `doctor.james@citycare.com` | Dr. James Wilson (Orthopedics) |
| **PATIENT** | `patient@citycare.com` | John Doe (User ID: 6) |
| **PATIENT** | `jane.smith@citycare.com` | Jane Smith (User ID: 7) |

---

## 🧪 Running Automated Tests

Run the complete backend test suite (29 tests across all clinical and auth modules):
```bash
cd backend
pytest -v
```

---

## 📦 Deployment

### Render Blueprint
Deploy directly to Render using the included `render.yaml` blueprint:
1. Connect your repository to [Render.com](https://render.com).
2. Select **New &gt; Blueprint** and point to `render.yaml`.
3. Render will provision:
   - Managed PostgreSQL database (`citycare-db`)
   - FastAPI backend web service (`citycare-backend`)
   - Static frontend React site (`citycare-frontend`)

### Docker
```bash
cd backend
docker build -t citycare-backend:latest .
docker run -p 8000:8000 -e DATABASE_URL=sqlite:///./citycare.db citycare-backend:latest
```

---

## 📚 Documentation
- See [`docs/MODULES.md`](docs/MODULES.md) for detailed Configuration Items (CIs) specification and MedRelease SCM integration notes.
- See [`CHANGELOG.md`](CHANGELOG.md) for detailed release history.
