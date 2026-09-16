const fs = require('node:fs');
const crypto = require('node:crypto');
async function main() {
  const project = JSON.parse(fs.readFileSync('.vercel/project.json', 'utf8'));
  if (!process.env.CRON_SECRET) {
    process.env.CRON_SECRET = crypto.randomBytes(32).toString('hex');
    fs.appendFileSync('.env', '\nCRON_SECRET=' + process.env.CRON_SECRET + '\n');
  }
  const names = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_SECRET_KEY', 'CRON_SECRET',
    'ANTHROPIC_API_KEY', 'FAL_API_KEY', 'WAVESPEED_API_KEY',
    'REGION', 'SERVICE', 'VERSION', 'BASE_URL', 'TERMINAL', 'POLL_INTERVAL_MS', 'POLL_MAX_ATTEMPTS',
    ...Object.keys(process.env).filter((name) => /^(MODELARK_|BYTEPLUSVOICE_)/.test(name))];
  const body = [...new Set(names)].filter((key) => process.env[key]?.trim()).map((key) => ({ key, value: process.env[key], target: ['preview', 'production'], type: 'encrypted' }));
  body.push({ key: 'ELECTRON_SKIP_BINARY_DOWNLOAD', value: '1', target: ['preview', 'production'], type: 'plain' });
  const response = await fetch('https://api.vercel.com/v10/projects/' + project.projectId + '/env?upsert=true&teamId=' + project.orgId, {
    method: 'POST', headers: { Authorization: 'Bearer ' + process.env.VERCEL_TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error('Environment sync failed: ' + (data.error?.code || response.status));
  }
  console.log('Synced ' + body.length + ' explicit runtime variables. Administration credentials and unused provider keys were excluded.');
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
