const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('pg');

async function main() {
  const connectionString = process.env.SUPABASE_DB_URL;
  const config = connectionString ? { connectionString } : {
    host: 'db.' + process.env.SUPABASE_PROJECT_ID + '.supabase.co',
    port: 5432, user: 'postgres', database: 'postgres', password: process.env.SUPABASE_DB_PASSWORD,
  };
  const client = new Client({ ...config, ssl: { rejectUnauthorized: true }, connectionTimeoutMillis: 15000 });
  try {
    await client.connect();
    await client.query('create table if not exists public.film_schema_migrations (name text primary key, applied_at timestamptz not null default now())');
    await client.query('alter table public.film_schema_migrations enable row level security');
    for (const name of fs.readdirSync('supabase/migrations').filter((n) => n.endsWith('.sql')).sort()) {
      const { rows } = await client.query('select name from public.film_schema_migrations where name=$1', [name]);
      if (rows.length) continue;
      await client.query(fs.readFileSync(path.join('supabase/migrations', name), 'utf8'));
      await client.query('insert into public.film_schema_migrations(name) values($1)', [name]);
      console.log('Applied migration:', name);
    }
  } finally { await client.end(); }
}
main().catch((error) => { console.error('Migration failed:', error.code || error.name); process.exitCode = 1; });
