# TaskCircle Architecture

## Overview

TaskCircle is a collaborative task management application built with a modern JavaScript stack. The application follows a **client-server architecture** with a clear separation between frontend and backend.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (Browser)                     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              React + Vite + Tailwind CSS              │  │
│  │         React Router · Axios · Socket.IO Client       │  │
│  └──────────────────────┬────────────────────────────────┘  │
└─────────────────────────┼───────────────────────────────────┘
                          │ HTTP / WebSocket
┌─────────────────────────┼───────────────────────────────────┐
│                     Server (Node.js)                        │
│  ┌──────────────────────┴────────────────────────────────┐  │
│  │          Express.js · REST API · Socket.IO            │  │
│  │     Helmet · CORS · Morgan · Error Handling           │  │
│  └──────────────────────┬────────────────────────────────┘  │
│  ┌──────────────────────┴────────────────────────────────┐  │
│  │                    Prisma ORM                         │  │
│  └──────────────────────┬────────────────────────────────┘  │
└─────────────────────────┼───────────────────────────────────┘
                          │ PostgreSQL Protocol
┌─────────────────────────┼───────────────────────────────────┐
│  ┌──────────────────────┴────────────────────────────────┐  │
│  │               Neon PostgreSQL (Cloud)                 │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Project Structure

```
TaskCircle/
├── frontend/                # React + Vite application
│   ├── public/              # Static assets
│   ├── src/
│   │   ├── api/             # Axios instance & API utilities
│   │   ├── components/      # Reusable UI components (future)
│   │   ├── layouts/         # Page layout wrappers
│   │   ├── pages/           # Route-level page components
│   │   ├── hooks/           # Custom React hooks (future)
│   │   ├── context/         # React context providers (future)
│   │   ├── utils/           # Utility functions (future)
│   │   ├── App.jsx          # Root component with routing
│   │   ├── main.jsx         # Entry point
│   │   └── index.css        # Global styles + Tailwind
│   ├── tailwind.config.js   # Tailwind CSS configuration
│   ├── postcss.config.js    # PostCSS configuration
│   ├── vite.config.js       # Vite configuration
│   ├── .eslintrc.cjs        # ESLint configuration
│   └── package.json
│
├── backend/                 # Node.js + Express API
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   ├── src/
│   │   ├── config/          # Configuration (DB, etc.)
│   │   ├── middleware/       # Express middleware
│   │   ├── routes/          # API route handlers
│   │   ├── controllers/     # Business logic (future)
│   │   ├── services/        # Service layer (future)
│   │   ├── utils/           # Utility functions (future)
│   │   └── index.js         # Express server entry point
│   ├── .eslintrc.cjs        # ESLint configuration
│   └── package.json
│
├── docs/                    # Project documentation
│   ├── architecture.md      # This file
│   ├── database.md          # Database documentation
│   ├── api.md               # API documentation
│   ├── security.md          # Security documentation
│   └── development-plan.md  # Development roadmap
│
├── PROJECT_STATUS.md        # Current project status
├── DEVELOPMENT_CHECKLIST.md # Feature checklist
├── AI_HANDOFF.md            # AI session continuity
├── CHANGELOG.md             # Change log
├── README.md                # Project overview
├── .gitignore               # Git ignore rules
└── .prettierrc              # Prettier configuration
```

## Technology Stack

| Layer        | Technology          | Purpose                        |
|-------------|---------------------|--------------------------------|
| Frontend    | React               | UI framework                   |
| Build       | Vite                | Build tool & dev server        |
| Styling     | Tailwind CSS v3     | Utility-first CSS              |
| Routing     | React Router        | Client-side routing            |
| HTTP Client | Axios               | API communication              |
| Backend     | Express.js          | Web framework                  |
| Runtime     | Node.js             | Server runtime                 |
| ORM         | Prisma              | Database access                |
| Database    | PostgreSQL (Neon)   | Persistent storage             |
| Realtime    | Socket.IO           | WebSocket communication        |
| Push        | FCM / Web Push      | Notifications                  |
| Auth        | Google OAuth + OTP  | Authentication                 |
| Linting     | ESLint              | Code quality                   |
| Formatting  | Prettier            | Code formatting                |

## Deployment Architecture

| Component  | Platform | URL Pattern                |
|-----------|----------|----------------------------|
| Frontend  | Vercel   | https://taskcircle.vercel.app |
| Backend   | Render   | https://taskcircle-api.onrender.com |
| Database  | Neon     | PostgreSQL connection string |

## Design Principles

1. **Separation of concerns** — Frontend and backend are independent projects with their own dependencies.
2. **RESTful API** — Backend exposes a clean REST API consumed by the frontend via Axios.
3. **Stateless server** — No server-side sessions; authentication via tokens.
4. **Database-first** — Prisma schema is the source of truth for data models.
5. **Graceful degradation** — The app handles missing services (e.g., database) without crashing.
