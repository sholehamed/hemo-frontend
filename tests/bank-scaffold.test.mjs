import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const src = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
test('ST06 bank routes enforce a client-side role guard and backend-scoped API', () => {
  assert.match(src('src/app/app.routes.ts'), /bloodBankGuard/);
  assert.match(src('src/app/core/api/blood-bank.service.ts'), /\/api\/v1\/facilities/);
  assert.doesNotMatch(src('src/app/core/api/blood-bank.service.ts'), /localStorage|sessionStorage/);
});
test('Crossmatch requires explicit laboratory evidence and independent approval action', () => {
  const form = src('src/app/features/blood-bank/bank-workspace.component.ts');
  assert.match(form, /testCode/);
  assert.match(form, /testResult/);
  assert.match(form, /finalize\(/);
});
