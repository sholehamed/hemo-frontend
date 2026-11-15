import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
const get = p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('ST05 worklist uses same-origin backend and CQRS API, no local mock',()=>{
  const api=get('src/app/core/api/blood-requests.service.ts');
  assert.match(api,/\/api\/v1\/facilities/);
  assert.match(api,/review/);
  assert.doesNotMatch(api,/localStorage|mockRequests/);
  const routes=get('src/app/app.routes.ts');
  assert.match(routes,/clinicalGuard/);
  assert.match(routes,/clinical\/requests/);
});
test('Material clinical component includes responsive scoped form and table',()=>{
  const source=get('src/app/features/clinical/blood-requests.component.ts');
  for(const x of ['MatFormFieldModule','MatTableModule','MatPaginatorModule','@media(max-width:650px)'])
    assert.ok(source.includes(x),x);
});
