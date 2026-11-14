import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';

test('centralized HTTP errors do not reveal arbitrary exception details', () => {
  const source = readFileSync(new URL('../src/app/core/api/api-error.ts', import.meta.url), 'utf8');
  for (const status of ['401','403','409','422']) assert.match(source, new RegExp(status));
  assert.match(source, /Do not display server exception/);
});

test('HTTP interceptor is registered in the Angular application', () => {
  const config = readFileSync(new URL('../src/app/app.config.ts', import.meta.url), 'utf8');
  assert.match(config, /withInterceptors\(\[apiErrorInterceptor\]\)/);
});
