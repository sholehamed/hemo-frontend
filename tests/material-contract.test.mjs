import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('Angular Material dependencies match Angular framework version', () => {
  const packageJson = JSON.parse(source('package.json'));
  for (const name of ['@angular/material', '@angular/cdk', '@angular/animations'])
    assert.equal(packageJson.dependencies[name], packageJson.dependencies['@angular/core']);
});

test('Material components used in shell, authentication, admin and ST04', () => {
  for (const [file, expected] of [
    ['src/app/app.component.ts', 'MatSidenavModule'],
    ['src/app/features/login/login.component.ts', 'MatFormFieldModule'],
    ['src/app/features/admin/admin.component.ts', 'MatTabsModule'],
    ['src/app/features/admission/admission-create.component.ts', 'MatCheckboxModule'],
    ['src/app/features/admission/admission-list.component.ts', 'MatTableModule'],
    ['src/app/features/admission/admission-identity.component.ts', 'MatCardModule']
  ]) assert.ok(source(file).includes(expected), file);
});

test('responsive styles and reduced motion controls exist', () => {
  assert.match(source('src/app/app.component.css'), /max-width:900px/);
  assert.match(source('src/styles.css'), /prefers-reduced-motion/);
});
