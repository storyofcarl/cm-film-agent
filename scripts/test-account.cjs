const fs = require('node:fs');
const crypto = require('node:crypto');
const { createClient } = require('@supabase/supabase-js');
const { createServerClient } = require('@supabase/ssr');
const { stringifyCookie } = require('cookie');

async function main() {
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
  fs.mkdirSync('.local', { recursive: true });
  const file = '.local/smoke-account.json';
  let account;
  if (fs.existsSync(file)) account = JSON.parse(fs.readFileSync(file, 'utf8'));
  else {
    const email = 'film-agent-smoke-' + Date.now() + '@example.com';
    const password = crypto.randomBytes(30).toString('base64url');
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, app_metadata: { film_agent_access: true, test_account: true } });
    if (error) throw error;
    account = { id: data.user.id, email, password };
    fs.writeFileSync(file, JSON.stringify(account));
  }
  const cookies = new Map();
  const client = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: { getAll: () => [...cookies].map(([name, value]) => ({ name, value })), setAll: (items) => items.forEach(({ name, value }) => cookies.set(name, value)) },
  });
  const { error } = await client.auth.signInWithPassword({ email: account.email, password: account.password });
  if (error) throw error;
  fs.writeFileSync('.local/smoke-cookies.json', JSON.stringify({ cookie: stringifyCookie(Object.fromEntries(cookies)) }));
  console.log('Temporary smoke-test account ready; credentials saved only under ignored .local directory.');
}
main().catch((error) => { console.error('Test account failed:', error.code || error.name); process.exitCode = 1; });
