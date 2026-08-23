# TaskCircle Database Documentation

## Overview

TaskCircle uses **PostgreSQL** hosted on **Neon** (serverless Postgres) as its primary database, accessed through **Prisma ORM**.

## Connection

| Property    | Value                     |
|------------|---------------------------|
| Provider   | Neon PostgreSQL            |
| ORM        | Prisma                     |
| Protocol   | PostgreSQL wire protocol   |
| SSL        | Required (`sslmode=require`) |

### Connection String Format

```
postgresql://<user>:<password>@<host>:5432/<database>?sslmode=require
```

The connection string is stored in `backend/.env` as `DATABASE_URL` and is **never committed to Git**.

## Prisma Setup

- Schema location: `backend/prisma/schema.prisma`
- Generated client: `node_modules/.prisma/client/`
- Client singleton: `backend/src/config/db.js`

### Useful Commands

```bash
# Generate Prisma client after schema changes
npx prisma generate

# Create and apply a migration
npx prisma migrate dev --name <migration-name>

# Open Prisma Studio (visual DB browser)
npx prisma studio

# Reset database (DESTRUCTIVE)
npx prisma migrate reset

# Pull schema from existing database
npx prisma db pull
```

## Schema — Phase 1 (Placeholder)

The current schema contains a minimal `User` model to verify that Prisma is configured correctly. The production schema will be designed during the appropriate development phase.

```prisma
model User {
  id        String   @id @default(cuid())
  email     String?  @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## Planned Schema (Future Phases)

The full schema will include models for:

- **User** — Authentication, profile, preferences
- **Group** — Team/group management
- **GroupMember** — User-group relationships with roles
- **Task** — Group tasks with assignments
- **TaskStatus** — Per-member task status tracking
- **PersonalTask** — Private to-do items
- **RecurringTask** — Task recurrence patterns
- **Timetable** — Schedule entries
- **Notification** — Notification records
- **ActivityStatus** — User activity/availability

These will be implemented phase-by-phase as the application grows.

## Neon-Specific Notes

- Neon uses **serverless** PostgreSQL — connections auto-suspend after inactivity.
- Cold starts may add ~500ms latency on first query after idle.
- Connection pooling is available via Neon's pooler endpoint.
- Neon supports branching for development/staging databases.
