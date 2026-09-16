const fs = require('node:fs');
const { createClient } = require('@supabase/supabase-js');
async function main() {
  const [email, base] = process.argv.slice(2);
  if (!email || !base || new URL(base).protocol !== 'https:') throw new Error('Usage: create-owner.cjs owner@email.com https://your-preview.vercel.app');
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
  const { data: list, error: listError } = await admin.auth.admin.listUsers();
  if (listError) throw listError;
  const existing = list.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
  const { data, error } = await admin.auth.admin.generateLink({ type: existing ? 'recovery' : 'invite', email });
  if (error) throw error;
  const { error: updateError } = await admin.auth.admin.updateUserById(data.user.id, { app_metadata: { ...data.user.app_metadata, film_agent_access: true, film_agent_role: 'owner' } });
  if (updateError) throw updateError;
  const url = new URL('/auth/confirm', base);
  url.searchParams.set('type', existing ? 'recovery' : 'invite');
  url.searchParams.set('token_hash', data.properties.hashed_token);
  fs.mkdirSync('.local', { recursive: true });
  fs.writeFileSync('.local/owner-setup.html', '<!doctype html><meta name="referrer" content="no-referrer"><title>Film Agent account setup</title><h1>Film Agent</h1><p>This private one-time link lets you set your account password.</p><a href="' + url.href.replaceAll('&', '&amp;') + '">Set up your Film Agent account</a>');
  console.log('Owner approved. Private setup link saved in .local/owner-setup.html. No email was sent.');
}
main().catch((error) => { console.error('Owner setup failed:', error.code || error.message); process.exitCode = 1; });
