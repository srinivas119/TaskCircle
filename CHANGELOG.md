# Changelog

All notable changes to TaskCircle are documented here.  
Newest changes appear at the top.

---

## 2026-08-23

### Added
- **Secure Authentication (Phase 2)**:
  - Created authentication database schema including `User`, `AuthAccount`, `Session`, and `OTPVerification` models.
  - Implemented signed cookie-based session management middleware with HTTP-only security properties.
  - Added Google OAuth ID token verification endpoint with a local developer bypass/mocking mode.
  - Implemented Phone number OTP authentication featuring cryptographically secure OTP generation, bcrypt hashing, a 60s request cooldown block, and a 5-attempt verification lockout mechanism.
  - Created secure endpoints to link Google and Phone profiles without silent merges or overwrites.
  - Added frontend `AuthContext` to manage auth lifecycle states, login views, and profile layouts.
  - Added custom integration test runner (`backend/tests/run-tests.js`) testing all 13 core authentication and security logic flows.
  - Configured Axios singleton with `withCredentials: true` globally.

### Fixed
- Fixed a `ReferenceError` in `backend/tests/run-tests.js` by correctly importing `hashValue` from `backend/src/utils/crypto.js` to ensure the test suite executes successfully.

### Tests
- Integration tests: 13/13 tests passed successfully.
- Frontend: production build compiled with 0 errors/warnings.
- Linting: 0 lint errors/warnings across frontend and backend.

### Next
- Start Phase 3: User Profile API and UI.
