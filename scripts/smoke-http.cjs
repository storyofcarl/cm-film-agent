const fs = require('node:fs');
const assert = require('node:assert/strict');
const base = process.env.FILM_TEST_URL || 'http://127.0.0.1:43187';
const fetch = require('./test-fetch.cjs')(base);
const { cookie } = JSON.parse(fs.readFileSync('.local/smoke-cookies.json', 'utf8'));

async function main() {
  const endpoints = fs.readdirSync('pages/api/film').filter((f) => f.endsWith('.js')).map((f) => '/api/film/' + f.slice(0, -3));
  endpoints.push('/api/seed', '/api/seedream', '/api/seedance', '/api/seedance-status', '/api/asset-upload', '/api/production-design', '/api/auth/session');
  for (const endpoint of endpoints) {
    const response = await fetch(base + endpoint);
    assert.equal(response.status, 401, endpoint + ' must reject anonymous requests');
  }
  const home = await fetch(base, { redirect: 'manual' });
  assert.equal(home.status, 307); assert.equal(home.headers.get('location'), '/login');
  for (const endpoint of ['/', '/api/auth/session', '/api/film/config']) {
    const response = await fetch(base + endpoint, { headers: { cookie } });
    assert.equal(response.status, 200, endpoint + ' must accept the approved account');
  }
  const crossSite = await fetch(base + '/api/seed', { method: 'POST', headers: { cookie, origin: 'https://attacker.example', 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal(crossSite.status, 403);
  const cron = await fetch(base + '/api/jobs/reconcile'); assert.equal(cron.status, 401);
  console.log('HTTP smoke checks passed:', endpoints.length, 'protected APIs, login redirects, approved session, cross-origin rejection, and cron protection.');
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
