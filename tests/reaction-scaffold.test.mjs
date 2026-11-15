import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const text = path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('ST09 uses material protected workflow, typed BFF and distinct RCA signoff',()=>{
  assert.match(text('src/app/core/api/reaction.service.ts'),/hemovigilance/);
  assert.doesNotMatch(text('src/app/core/api/reaction.service.ts'),/localStorage|sessionStorage/);
  assert.match(text('src/app/app.routes.ts'),/reactionGuard/);
  const c=text('src/app/features/reactions/reactions-workspace.component.ts');
  for(const x of ['MatTableModule','MatCheckboxModule','rca','rowVersion',
    'transfusionStopped','nationalReportRequired'])
    assert.ok(c.includes(x),x);
});
