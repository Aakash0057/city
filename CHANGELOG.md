# Changelog

All notable changes to the CityCare Hospital Full-Stack Website are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [1.0.0] - 2026-09-18

### Added
- **Core Architecture**:
  - FastAPI modern backend with SQLAlchemy 2.0 and Alembic database migrations.
  - SQLite database locally, dynamic PostgreSQL support for Render deployment.
  - Pydantic v2 validation schemas and strict domain models.
  - Automatic seed script populating departments, doctors, medications, lab tests, and demo users.
- **Authentication & Security**:
  - JWT authentication using `python-jose` and bcrypt password hashing.
  - Role-Based Access Control (`ADMIN`, `DOCTOR`, `PATIENT`).
  - Strict cross-patient isolation (403 Forbidden on unauthorized data access).
  - Rate limiting on sensitive endpoints (`/auth/login`, `/auth/forgot-password`).
  - Single-use 15-minute password reset tokens with SHA-256 hash storage.
  - System activity audit logging (`/activity`).
- **Clinical & Operational Modules (MedRelease CIs)**:
  - **Appointments**: Double-booking prevention (409 Conflict), 30-min slot calculation, cancel/reschedule.
  - **Emergency Triage (CI-01)**: Public intake tickets, priority queue (CRITICAL > HIGH > MEDIUM > LOW), triage updates.
  - **Laboratory Diagnostics (CI-02)**: Test catalog, doctor ordering, specimen collection timestamps, abnormal result flagging.
  - **Pharmacy Formulary (CI-03)**: Inventory tracking, low-stock threshold alerts, multi-item prescriptions with stock deduction, refill request/approval workflow.
  - **Reporting Engine (CI-04)**: Aggregated hospital metrics, role-scoped insights, dynamic CSV export downloads.
  - **Doctor Dashboard (CI-05)**: Consolidated clinical workspace with today's appointments, live queue, and lab orders.
- **Frontend Web Application**:
  - Built with React 18, Vite, Tailwind CSS, and Lucide icons.
  - Single-page application routing with protected route guards.
  - Centralized API service layer (`services/api.js`) with JWT attachment and error normalization.
  - Global authentication and toast notification context providers.
  - Public pages: Home, Clinical Services, Physician Directory, About, Contact, Emergency Intake.
  - Authenticated portals: Patient Portal, Doctor Dashboard, Hospital Admin Executive Center.
- **DevOps & Testing**:
  - 29 comprehensive pytest test suites covering auth, RBAC, isolation, appointments, emergency, lab, pharmacy, and reporting.
  - Render Blueprint deployment configuration (`render.yaml`) with managed PostgreSQL.
  - Multi-stage production `Dockerfile` for backend API.
  - Full SCM documentation in `docs/MODULES.md`.
