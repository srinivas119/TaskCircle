# TaskCircle API Documentation

## Base URL

| Environment | URL                                  |
|------------|--------------------------------------|
| Development | `http://localhost:5000/api`          |
| Production  | `https://taskcircle-api.onrender.com/api` |

## Request / Response Conventions

### Headers

```
Content-Type: application/json
Authorization: Bearer <token>   (when authenticated — Phase 2+)
```

### Success Response

```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message description"
}
```

---

## Endpoints

### Health Check

#### `GET /api/health`

Returns the API server health status.

**Authentication:** None

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2026-08-23T00:00:00.000Z",
  "environment": "development",
  "uptime": 123.456
}
```

---

#### `GET /api/health/db`

Returns the database connection status.

**Authentication:** None

**Success Response (200):**

```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-08-23T00:00:00.000Z"
}
```

**Error Response (503):**

```json
{
  "status": "error",
  "database": "disconnected",
  "error": "Can't reach database server",
  "timestamp": "2026-08-23T00:00:00.000Z"
}
```

---

#### `GET /` (Root)

Returns API information.

**Response:**

```json
{
  "message": "TaskCircle API",
  "version": "1.0.0",
  "docs": "/api/health"
}
```

---

## Planned Endpoints (Future Phases)

| Phase | Method | Endpoint                     | Description              |
|-------|--------|------------------------------|--------------------------|
| 2     | POST   | `/api/auth/google`           | Google OAuth login       |
| 2     | POST   | `/api/auth/otp/send`         | Send OTP to phone        |
| 2     | POST   | `/api/auth/otp/verify`       | Verify OTP               |
| 2     | POST   | `/api/auth/logout`           | Logout                   |
| 3     | GET    | `/api/users/me`              | Get current user profile |
| 3     | PUT    | `/api/users/me`              | Update profile           |
| 4     | POST   | `/api/groups`                | Create group             |
| 4     | GET    | `/api/groups`                | List user's groups       |
| 4     | POST   | `/api/groups/:id/join`       | Join a group             |
| 6     | POST   | `/api/groups/:id/tasks`      | Create task              |
| 6     | GET    | `/api/groups/:id/tasks`      | List tasks               |
| 9     | GET    | `/api/todos`                 | List personal to-dos     |
| 9     | POST   | `/api/todos`                 | Create personal to-do    |

These will be documented in detail as they are implemented.
