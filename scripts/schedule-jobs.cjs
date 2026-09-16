const { Client } = require('pg');
async function main() {
  const base = new URL(process.argv[2]);
  if (base.protocol !== 'https:' || !process.env.CRON_SECRET || !process.env.SUPABASE_DB_URL) throw new Error('HTTPS deployment URL, CRON_SECRET and SUPABASE_DB_URL required');
  const client = new Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: true }, connectionTimeoutMillis: 15000 });
  try {
    await client.connect();
    await client.query('create extension if not exists pg_cron');
    await client.query('create extension if not exists pg_net with schema extensions');
    await client.query('create schema if not exists film_private');
    await client.query('revoke all on schema film_private from public, anon, authenticated');
    await client.query('create table if not exists film_private.job_endpoint (id boolean primary key default true check (id), url text not null, token text not null)');
    await client.query('revoke all on film_private.job_endpoint from public, anon, authenticated');
    await client.query('insert into film_private.job_endpoint(id,url,token) values(true,$1,$2) on conflict(id) do update set url=excluded.url,token=excluded.token', [new URL('/api/jobs/reconcile', base).href, process.env.CRON_SECRET]);
    const job = "select net.http_post(url := url, headers := jsonb_build_object('Authorization','Bearer ' || token, 'Content-Type','application/json'), body := '{}'::jsonb, timeout_milliseconds := 250000) from film_private.job_endpoint where exists(select 1 from public.film_jobs where status in ('queued','running','pending'));";
    await client.query('select cron.schedule($1,$2,$3)', ['film-agent-reconcile', '* * * * *', job]);
    console.log('Scheduled pending video reconciliation every minute; no HTTP calls occur when the queue is empty.');
  } finally { await client.end(); }
}
main().catch((error) => { console.error('Scheduler setup failed:', error.code || error.name); process.exitCode = 1; });
