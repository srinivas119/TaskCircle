# Changelog

All notable changes to TaskCircle are documented here.  
Newest changes appear at the top.

---

## 2026-08-23

### Added
- **Project Setup (Phase 1)**:
  - Initialized Git repository.
  - Setup React + Vite frontend with Tailwind CSS v3, React Router, Axios, and ESLint/Prettier configuration.
  - Setup Node.js + Express backend with CORS, Helmet, Morgan, and custom global error handling middleware.
  - Configured PostgreSQL connection using Prisma ORM with placeholder schema.
  - Generated Prisma client singleton (`backend/src/config/db.js`).
  - Added backend health endpoint (`/api/health`) and database health checker (`/api/health/db`) with graceful placeholder error handling.
  - Setup environment configurations (`.env.example` and local `.env` files).
  - Created architecture, database, API, security, and development-plan docs under `/docs`.
  - Added comprehensive `README.md`.
- Created project progress, checklist, changelog, and handoff documentation files.

### Changed
- Resolved PostCSS build warning in `frontend/src/index.css` by restructuring CSS directives and `@import`.

### Fixed
- None (Phase 1 initialized from scratch).

### Tests
- Frontend built successfully (production bundle compilation has 0 errors/warnings).
- Frontend and backend linting checks passed without any errors/warnings.
- Backend server successfully started and responded to `GET /api/health` with `status: "ok"`.
- Backend database health endpoint `GET /api/health/db` verified to handle missing/placeholder database connection string gracefully.

### Next
- Start Phase 2: Google Authentication & Phone OTP.
