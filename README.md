# TaskCircle

Collaborative task management for teams. Share tasks, track progress, and stay organized — together.

## Tech Stack

| Layer       | Technology                |
|------------|---------------------------|
| Frontend   | React + Vite + Tailwind CSS v3 |
| Backend    | Node.js + Express.js       |
| Database   | PostgreSQL (Neon)          |
| ORM        | Prisma                     |
| Realtime   | Socket.IO                  |
| Auth       | Google OAuth + Phone OTP   |
| Push       | Firebase Cloud Messaging   |
| Deployment | Vercel (FE) · Render (BE) · Neon (DB) |

## Project Structure

```
TaskCircle/
├── frontend/          # React + Vite application
├── backend/           # Node.js + Express API
├── docs/              # Project documentation
├── PROJECT_STATUS.md  # Current progress
├── CHANGELOG.md       # Change history
├── AI_HANDOFF.md      # AI session continuity
└── DEVELOPMENT_CHECKLIST.md  # Feature checklist
```

## Prerequisites

- **Node.js** v18+ and **npm**
- **Git**
- A **Neon PostgreSQL** database (or any PostgreSQL instance)

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd TaskCircle
```

### 2. Set up the Backend

```bash
cd backend
npm install
```

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Edit `backend/.env` and replace the `DATABASE_URL` with your Neon PostgreSQL connection string:

```
DATABASE_URL=postgresql://your-user:your-password@your-host:5432/your-database?sslmode=require
```

Generate the Prisma client and run migrations:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

Start the backend dev server:

```bash
npm run dev
```

The API will be running at `http://localhost:5000`.

### 3. Set up the Frontend

```bash
cd frontend
npm install
```

Create a `.env` file (if not already present):

```bash
cp .env.example .env
```

Start the frontend dev server:

```bash
npm run dev
```

The app will be running at `http://localhost:5173`.

### 4. Verify Setup

- Open `http://localhost:5173` — You should see the TaskCircle landing page.
- The page shows live status indicators for the backend API and database connection.
- Visit `http://localhost:5000/api/health` to check the API directly.

## Available Scripts

### Frontend (`cd frontend`)

| Script | Command | Description |
|--------|---------|-------------|
| Dev server | `npm run dev` | Start Vite dev server |
| Build | `npm run build` | Production build |
| Preview | `npm run preview` | Preview production build |
| Lint | `npx eslint src/` | Run ESLint |
| Format | `npx prettier --write src/` | Format code |

### Backend (`cd backend`)

| Script | Command | Description |
|--------|---------|-------------|
| Dev server | `npm run dev` | Start with nodemon (auto-restart) |
| Start | `npm start` | Start production server |
| Lint | `npm run lint` | Run ESLint |
| Format | `npm run format` | Format code |
| Prisma Generate | `npm run prisma:generate` | Regenerate Prisma client |
| Prisma Migrate | `npm run prisma:migrate` | Run migrations |
| Prisma Studio | `npm run prisma:studio` | Open visual DB browser |

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/architecture.md) | System architecture and design |
| [Database](docs/database.md) | Database setup and schema |
| [API](docs/api.md) | API endpoint documentation |
| [Security](docs/security.md) | Security measures and practices |
| [Development Plan](docs/development-plan.md) | 16-phase roadmap |

## Development Progress

See [PROJECT_STATUS.md](PROJECT_STATUS.md) for the current state and [DEVELOPMENT_CHECKLIST.md](DEVELOPMENT_CHECKLIST.md) for the full feature checklist.

## License

Private — All rights reserved.
