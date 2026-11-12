import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('framework version and scripts are pinned', () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url)));
  assert.equal(pkg.dependencies['@angular/core'], '22.2.6');
  assert.equal(pkg.devDependencies['@angular/cli'], '22.2.6');
  assert.ok(pkg.scripts.build);
});

test('relative API and development proxy are configured', () => {
  const proxy = JSON.parse(readFileSync(new URL('../proxy.conf.json', import.meta.url)));
  const service = readFileSync(new URL('../src/app/core/api/system-status.service.ts', import.meta.url), 'utf8');
  assert.equal(proxy['/api'].target, 'http://localhost:5080');
  assert.match(service, /'\/api\/v1\/system\/status'/);
});

test('all seven business areas have stable navigation keys', () => {
  const source = readFileSync(new URL('../src/app/core/navigation/areas.ts', import.meta.url), 'utf8');
  for (const key of ['admission','nursing','doctor','blood-bank','supervisor','equipment','hemovigilance']) {
    assert.match(source, new RegExp("id: '"+key+"'"));
  }
});

test('bootstrap does not implement a fake sign-in', () => {
  const routes = readFileSync(new URL('../src/app/app.routes.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(routes, /login|auth\/callback|fake-session/);
});
