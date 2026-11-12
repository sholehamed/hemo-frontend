# Hemo Frontend

Independent Angular 22 + ASP.NET Core BFF frontend, Persian/RTL.

## Run

Requires Node 24.15.0 or Angular-compatible version. Start backend on localhost:5080, then:

```bash
npm install
npm run test:smoke
npm run check
npm start
```

Browse http://localhost:4200. Angular proxies /api and /health to localhost:5080.

## Authentication

- Routes /login and /system/status are public; dashboard and area routes require backend session.
- GET /api/v1/auth/csrf provisions anti-CSRF cookie; login/logout use it on relative API POSTs.
- The HttpOnly cookie remains in the browser; frontend never stores an access token.
- Role-based area navigation reflects backend scope assignments but is **not authorization**.
- Stage 2A assumes SQL Server baseline and explicit System Administrator bootstrap; no demo credentials.
- No clinical features or real patient data are processed.

See docs/ADR-0001-frontend.md and docs/ADR-0002-frontend-auth.md.
