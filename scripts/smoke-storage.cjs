const fs = require('node:fs');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { createClient } = require('@supabase/supabase-js');
const base = process.env.FILM_TEST_URL || 'http://127.0.0.1:43187';
const account = JSON.parse(fs.readFileSync('.local/smoke-account.json', 'utf8'));
const { cookie } = JSON.parse(fs.readFileSync('.local/smoke-cookies.json', 'utf8'));
async function call(endpoint, method = 'GET', body) {
  const response = await fetch(base + endpoint, { method, headers: { cookie, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined, redirect: 'manual' });
  return { response, data: await response.json().catch(() => ({})) };
}
async function main() {
  const project = { id: 'smoke-' + Date.now(), title: 'Deployment smoke test', canvas: { nodes: [{ id: 'note-one', type: 'note', data: { text: 'Version one' } }], edges: [] } };
  let out = await call('/api/film/cloud', 'POST', { project }); assert.equal(out.response.status, 200, 'project save');
  out = await call('/api/film/cloud?action=load&id=' + project.id); assert.equal(out.data.project.title, project.title);
  project.canvas.nodes[0].data.text = 'Version two';
  out = await call('/api/film/cloud', 'POST', { project }); assert.equal(out.response.status, 200, 'project update');
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false } });
  const { error: signInError } = await client.auth.signInWithPassword(account); if (signInError) throw signInError;
  const { data: versions, error: versionError } = await client.from('film_project_versions').select('project').eq('project_id', project.id); if (versionError) throw versionError;
  assert.equal(versions[0].project.canvas.nodes[0].data.text, 'Version one');
  const forged = await client.from('film_jobs').insert({ owner_id: account.id, kind: 'video', provider_task_id: 'forged-task' });
  assert.ok(forged.error, 'browser must not mint provider task ownership');
  const image = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zl1EAAAAASUVORK5CYII=', 'base64');
  const key = crypto.createHash('sha256').update(image).digest('hex').slice(0, 32) + '.png';
  const upload = await client.storage.from('film-media').upload(account.id + '/' + key, image, { contentType: 'image/png', upsert: true }); if (upload.error) throw upload.error;
  out = await call('/api/film/media?key=' + key); assert.equal(out.response.status, 307);
  const delivered = await fetch(out.response.headers.get('location')); assert.deepEqual(Buffer.from(await delivered.arrayBuffer()), image);
  const foreignUpload = await client.storage.from('film-media').upload('00000000-0000-0000-0000-000000000000/' + key, image, { contentType: 'image/png' });
  assert.ok(foreignUpload.error, 'cross-owner upload must fail');
  await call('/api/film/cloud?id=' + project.id, 'DELETE');
  const remove = await client.storage.from('film-media').remove([account.id + '/' + key]); if (remove.error) throw remove.error;
  console.log('Storage smoke checks passed: project save/load/version/delete, signed media delivery, and denied forged jobs/cross-owner uploads.');
}
main().catch((error) => { console.error('Storage smoke failed:', error.message); process.exitCode = 1; });
