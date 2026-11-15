import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const src=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('ST08 uses typed same-origin API and protected Material workspace',()=>{
  assert.match(src('src/app/app.routes.ts'),/transfusionGuard/);
  assert.match(src('src/app/core/api/transfusion.service.ts'),/\/api\/v1\/facilities/);
  assert.doesNotMatch(src('src/app/core/api/transfusion.service.ts'),/localStorage|sessionStorage/);
  const ui=src('src/app/features/transfusion/transfusion-workspace.component.ts');
  for(const x of ['MatTableModule','MatCheckboxModule','checklist','rowVersion','baselineRecorded','alertFlag'])
    assert.ok(ui.includes(x),x);
});
