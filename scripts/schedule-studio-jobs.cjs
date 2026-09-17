// Configure only after the separate Studio destination and automation are approved.
// This creates a separate scheduler record; it never alters the legacy schedule.
const { Client } = require("pg");
const fs = require("node:fs");
async function main() {
  const base = new URL(process.argv[2]);
  if (
    base.protocol !== "https:" ||
    !process.env.CRON_SECRET ||
    !process.env.SUPABASE_DB_URL
  )
    throw new Error(
      "HTTPS Studio URL, CRON_SECRET and SUPABASE_DB_URL required",
    );
  const client = new Client({
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: {
      rejectUnauthorized: true,
      ca: fs.readFileSync("supabase/certs/prod-ca-2021.crt", "utf8"),
    },
    connectionTimeoutMillis: 15000,
  });
  try {
    await client.connect();
    await client.query("begin");
    await client.query("create extension if not exists pg_cron");
    await client.query(
      "create extension if not exists pg_net with schema extensions",
    );
    await client.query("create schema if not exists film_private");
    await client.query(
      "revoke all on schema film_private from public, anon, authenticated",
    );
    await client.query(
      "create table if not exists film_private.studio_endpoint (id boolean primary key default true check (id), url text not null, token text not null, protection_bypass text)",
    );
    await client.query(
      "revoke all on film_private.studio_endpoint from public, anon, authenticated",
    );
    await client.query(
      "insert into film_private.studio_endpoint(id,url,token,protection_bypass) values(true,$1,$2,$3) on conflict(id) do update set url=excluded.url,token=excluded.token,protection_bypass=excluded.protection_bypass",
      [
        new URL("/api/jobs/reconcile", base).href,
        process.env.CRON_SECRET,
        process.env.VERCEL_AUTOMATION_BYPASS_SECRET || null,
      ],
    );
    const job =
      "select net.http_post(url := url, headers := jsonb_strip_nulls(jsonb_build_object('Authorization','Bearer ' || token, 'Content-Type','application/json', 'x-vercel-protection-bypass', protection_bypass)), body := '{}'::jsonb, timeout_milliseconds := 250000) from film_private.studio_endpoint where exists(select 1 from public.studio_projects p, lateral jsonb_array_elements(p.document->'batches') b where b->'approval' <> 'null'::jsonb and b->>'state' in ('approved','running','attention') and ((b->>'paused') is distinct from 'true' or exists(select 1 from jsonb_array_elements(b->'jobs') j where j->>'state' in ('claimed','queued','running','uncertain'))));";
    await client.query("select cron.schedule($1,$2,$3)", [
      "film-agent-studio-reconcile",
      "* * * * *",
      job,
    ]);
    await client.query("commit");
    console.log(
      "Separate Studio scheduler configured; legacy schedule preserved.",
    );
  } finally {
    await client.end();
  }
}
main().catch((error) => {
  console.error("Studio scheduler setup failed:", error.code || error.name);
  process.exitCode = 1;
});
