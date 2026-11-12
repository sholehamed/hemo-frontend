# ADR-0001: Independent Angular 22 web shell

The web application uses Angular 22 standalone components, lazy loaded feature routes, zoneless change detection, strict TypeScript, and Persian RTL UI.

Stage 1 is a navigation and connectivity shell, NOT a medical workflow app. The seven named areas represent business capabilities. There is deliberately no client-side fake role selector or login. BFF/cookie authentication and server-enforced permission checks belong to Stage 2. All API requests use same-origin relative paths. The development proxy forwards /api and /health to http://localhost:5080.

Angular 22 requires Node >=22.22.3 (or >=24.15.0); TypeScript 6.0.x. CI uses Node 24.15.0. The initial source does not port prototype clinical forms to avoid deceptive sample actions. Hemo-raw remains the visual/functional reference.

Tests: `npm run test:smoke` covers scaffold invariants; `npm run check` performs an Angular production compilation. Browser E2E tests will be added with real feature workflows.
