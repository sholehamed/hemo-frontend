import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function get(path) { return readFileSync(new URL('../' + path, import.meta.url), 'utf8'); }

test('all four admission screens have authenticated route guards', () => {
  const routes = get('src/app/app.routes.ts');
  for (const path of ["path: 'admission'","path: 'admission/new'","path: 'admission/list'","path: 'admission/identity/:facilityId/:departmentId/:encounterId'"])
    assert.ok(routes.includes(path), path);
  assert.match(routes, /admissionGuard/);
});

test('admission writes use the shared same-origin backend without mock storage', () => {
  const service = get('src/app/core/api/admissions.service.ts');
  assert.match(service, /\/api\/v1\/facilities/);
  for (const endpoint of ['wristbands','identity-verifications','patient'])
    assert.match(service, new RegExp(endpoint));
  assert.doesNotMatch(service, /localStorage|sessionStorage|mockPatient/);
});

test('Jalali input must be converted to ISO Gregorian for API persistence', () => {
  const adapter = get('src/app/shared/jalali-date.ts');
  assert.match(adapter, /jalaliToIso/);
  assert.match(adapter, /timeZone: 'UTC'/);
  const form = get('src/app/features/admission/admission-create.component.ts');
  assert.match(form, /jalaliToIso\(value.birthDateJalali\)/);
});
