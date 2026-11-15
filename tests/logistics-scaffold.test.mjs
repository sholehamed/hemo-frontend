import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const s=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('ST07 logistics uses scoped backend endpoints and Material UI',()=>{
  assert.match(s('src/app/core/api/logistics.service.ts'), /\/api\/v1\/facilities/);
  assert.doesNotMatch(s('src/app/core/api/logistics.service.ts'),/localStorage|sessionStorage/);
  assert.match(s('src/app/features/logistics/logistics-workspace.component.ts'),/MatTableModule/);
  assert.match(s('src/app/app.routes.ts'),/logisticsWorkspaceGuard/);
});
