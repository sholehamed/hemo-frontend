# Hemo Frontend

Independent Angular 22 app (Persian / RTL). **No Foundation dependencies.** This is Stage 1 infrastructure, not a functioning clinical system.

## Requirements

Node.js 24.15.0 (or Angular 22-compatible Node.js >=22.22.3), npm.

## Run

```bash
npm install
npm run test:smoke
npm run check
npm start
```

Then open `http://localhost:4200`. The dev-server proxies `/api` and `/health` to the Hemo backend at `http://localhost:5080`. The `/system/status` screen shows real backend connectivity without exposing sensitive configuration.

## What's included

- Angular standalone / zoneless / lazy routes
- Persian RTL responsive shell with seven Hemo area placeholders
- Relative HttpClient service for the API system-status endpoint
- Static smoke tests and GitHub Actions build checks

## Not yet included

- Real login, BFF, roles or authorizations
- Patient data, blood requests, crossmatch, transfusion or HIS integration
- Transferred Hemo-raw pages, workflow validations or clinical rules

See `docs/ADR-0001-frontend.md`; backend is in `sholehamed/hemo-backend`. Never commit credentials or patient data.
