# TaskCircle Security Documentation

## Current Security Measures (Phase 1)

### Server Security

| Measure | Implementation | Status |
|---------|---------------|--------|
| Security headers | `helmet` middleware | ✅ Active |
| CORS | `cors` middleware with origin whitelist | ✅ Active |
| JSON parsing limits | Express built-in | ✅ Active |
| Error sanitization | Custom error handler (hides stack traces in production) | ✅ Active |
| Environment variables | `dotenv` — secrets excluded from Git via `.gitignore` | ✅ Active |
| Request logging | `morgan` middleware | ✅ Active |

### Git Security

- `.env` files are excluded from version control via `.gitignore`.
- `.env.example` files contain only placeholder values.
- No secrets, tokens, or credentials are committed to the repository.

---

## Planned Security Measures (Future Phases)

### Phase 2 — Authentication

- Google OAuth 2.0 (server-side flow)
- Phone OTP verification
- JWT token-based authentication
- Token refresh mechanism
- Secure cookie storage (httpOnly, secure, sameSite)
- Session management

### Phase 5 — Authorization

- Role-based access control (Admin, Moderator, Member)
- Group-level permissions
- Route-level authorization middleware
- Resource ownership validation

### Phase 15 — Security Hardening

- Input validation and sanitization
- Rate limiting (login attempts, API calls)
- SQL injection prevention (handled by Prisma)
- XSS prevention (handled by React + Helmet)
- CSRF protection
- Request size limits
- Dependency vulnerability auditing (`npm audit`)
- Security review

---

## Environment Variables

All sensitive configuration is stored in `.env` files and loaded via `dotenv`.

| Variable | Location | Contains Secret? |
|----------|----------|-----------------|
| `DATABASE_URL` | `backend/.env` | Yes |
| `PORT` | `backend/.env` | No |
| `NODE_ENV` | `backend/.env` | No |
| `FRONTEND_URL` | `backend/.env` | No |
| `VITE_API_URL` | `frontend/.env` | No |

Future variables (Phase 2+):

| Variable | Purpose |
|----------|---------|
| `GOOGLE_CLIENT_ID` | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `JWT_SECRET` | Token signing |
| `OTP_SERVICE_API_KEY` | OTP provider |
| `FIREBASE_CONFIG` | Push notifications |

---

## Reporting Security Issues

If you discover a security vulnerability, please report it responsibly. Do not open a public issue.
