import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function source(path) {
  return readFileSync(new URL('../' + path, import.meta.url), 'utf8');
}

test('Angular uses the same XSRF cookie/header contract as backend', () => {
  const config = source('src/app/app.config.ts');
  assert.match(config, /cookieName:\s*'XSRF-TOKEN'/);
  assert.match(config, /headerName:\s*'X-XSRF-TOKEN'/);
});

test('login and logout use same-origin relative paths, with CSRF bootstrap', () => {
  const auth = source('src/app/core/auth/auth.service.ts');
  assert.match(auth, /'\/api\/v1\/auth\/csrf'/);
  assert.match(auth, /'\/api\/v1\/auth\/login'/);
  assert.match(auth, /'\/api\/v1\/auth\/logout'/);
  assert.doesNotMatch(auth, /localStorage|sessionStorage/);
});

test('clinical navigation is guarded and privileges come from session', () => {
  const routes = source('src/app/app.routes.ts');
  const auth = source('src/app/core/auth/auth.service.ts');
  assert.match(routes, /canActivate:\s*\[authGuard, areaGuard\]/);
  assert.match(auth, /grants/);
  assert.doesNotMatch(auth, /selectedRole/);
});
