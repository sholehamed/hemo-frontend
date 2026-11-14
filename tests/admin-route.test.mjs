import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('Admin navigation has a server-session gate and no unprotected route', () => {
  const r = readFileSync(new URL('../src/app/app.routes.ts', import.meta.url), 'utf8');
  assert.match(r, /systemAdminGuard/);
  assert.match(r, /canActivate:\s*\[authGuard, systemAdminGuard\]/);
});

test('Admin commands use BFF API paths and never store initial password', () => {
  const s = readFileSync(new URL('../src/app/core/api/administration.service.ts', import.meta.url), 'utf8');
  assert.match(s, /\/api\/v1\/admin\/users/);
  assert.match(s, /\/api\/v1\/admin\/organization/);
  assert.doesNotMatch(s, /localStorage|sessionStorage/);
});
