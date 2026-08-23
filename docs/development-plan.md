# TaskCircle Development Plan

## Overview

TaskCircle is developed in **16 sequential phases**, each building on the previous. Features are implemented, tested, and documented before moving to the next phase.

---

## Phase 1 — Project Setup ← **CURRENT**

Establish the project foundation.

- Repository initialization
- Frontend scaffolding (React + Vite + Tailwind CSS v3)
- Backend scaffolding (Express.js)
- Database configuration (Neon PostgreSQL + Prisma)
- Environment variable structure
- API communication setup (Axios)
- ESLint + Prettier configuration
- Project documentation

---

## Phase 2 — Authentication

Implement user authentication.

- Google OAuth 2.0 login
- Phone number + OTP login
- Account linking (Google + Phone)
- Logout
- Route protection (authenticated vs. public routes)
- Authentication tests

---

## Phase 3 — User Profile

Build user profile management.

- Profile API (CRUD)
- Profile UI page
- Edit profile functionality
- Profile picture upload
- Notification preferences

---

## Phase 4 — Groups

Implement group management.

- Create group
- Generate unique Group ID
- Join group via Group ID
- Join requests and approval
- Member management (approve, remove)
- Leave group
- Group settings

---

## Phase 5 — Permissions

Add role-based access control.

- Admin role and capabilities
- Moderator role and capabilities
- Member role and capabilities
- Permission enforcement system
- Permission management UI
- Authorization tests

---

## Phase 6 — Tasks

Build the core task system.

- Create task within a group
- Task types (assignment, announcement, etc.)
- Due dates
- Priority levels
- Links and attachments
- Task assignment to members

---

## Phase 7 — Task Status

Track task completion per member.

- Pending status
- In progress status
- Completed status
- Not interested status
- Task history
- Individual member status tracking

---

## Phase 8 — Notifications

Implement the notification system.

- New task notifications
- Due-date reminders
- Overdue notifications
- Daily reminder digest
- Notification preferences per user
- Stop notifications after "Not Interested"

---

## Phase 9 — Personal To-Do

Add private task management.

- Create personal tasks
- Edit tasks
- Delete tasks
- Complete tasks
- Personal task history

---

## Phase 10 — Recurring Tasks

Enable task recurrence.

- Daily recurrence
- Weekly recurrence
- Selected weekdays
- Custom recurrence patterns

---

## Phase 11 — Timetable

Build schedule management.

- Create schedule entries
- Edit schedules
- Delete schedules
- Daily and weekly views
- Schedule reminders

---

## Phase 12 — Activity Status

Show user availability.

- Current activity display
- Custom activity messages
- Visibility settings (who can see)

---

## Phase 13 — Search & Filtering

Add search and filtering.

- Full-text search
- Group filter
- Status filter
- Type filter
- Priority filter
- Due-date filter

---

## Phase 14 — Statistics & Analytics

Build analytics dashboard.

- Personal statistics
- Task completion rate
- Weekly and monthly productivity
- Group statistics
- Task-level statistics
- Statistics privacy controls
- Charts and visualizations
- Export statistics

---

## Phase 15 — Testing & Security

Comprehensive testing and security hardening.

- Unit tests
- API integration tests
- Authentication and authorization tests
- Group access tests
- Task privacy tests
- Notification tests
- Input validation
- Rate limiting
- Full security review

---

## Phase 16 — Deployment

Deploy to production.

- Production database setup (Neon)
- Backend deployment (Render)
- Frontend deployment (Vercel)
- Environment variables configuration
- OAuth production credentials
- Notification production setup
- Custom domain
- Production testing and smoke tests
