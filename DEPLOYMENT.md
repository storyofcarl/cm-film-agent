# Deploying Film Agent

The hosted application uses Next.js on Vercel and Supabase Auth, Postgres, and
private Storage. AI generation uses the configured BytePlus/ModelArk account.
Additional provider keys may stay in local `.env` until their adapters are added.

## Local setup

Use Node 24. Copy `.env.example` to `.env` and populate the settings.
Never commit environment files. Install and build:

```powershell
$env:ELECTRON_SKIP_BINARY_DOWNLOAD='1'
npm.cmd ci
npm.cmd run build
npm.cmd run start -- --hostname 127.0.0.1 --port 43187
```

Port 43187 avoids the reserved Windows port ranges encountered on the setup
machine. Desktop packaging remains in the source, but hosted API routes no longer
read or write arbitrary server filesystem project paths.

## Supabase

Required runtime values:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY` (server only)

Add a Session pooler connection string as `SUPABASE_DB_URL` for migration tools.
Use the exact host from Supabase's Connect dialog and URL-encode the database
password when constructing a URI. TLS certificate validation stays enabled.
Migration scripts trust supabase/certs/prod-ca-2021.crt, downloaded from the
Supabase dashboard's official certificate URL:
https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt

```
node --env-file=.env scripts/migrate.cjs
```

The migrations create owner-scoped projects, version history, asset-library
records, provider assets, jobs, and the private `film-media` bucket. Row-level
security is enabled. Provider task/asset ownership is writable only by the server.

Accounts need `app_metadata.film_agent_access = true`, set through an
administrative operation. Signing up in Supabase alone does not grant access.
To create the initial owner after deployment:

```
node --env-file=.env scripts/create-owner.cjs OWNER_EMAIL HTTPS_DEPLOYMENT_URL
```

This creates a private local account-setup link under `.local`; it sends no email.
The owner opens the link and chooses their own password.

## Vercel

Local-only administration settings: `VERCEL_TOKEN`, `VERCEL_ORG_ID`.
These and the database password must never be uploaded as runtime variables.

```
node --env-file=.env scripts/setup-vercel.cjs
node --env-file=.env scripts/sync-vercel-env.cjs
```

The environment-sync script uploads only an explicit runtime allowlist and
generates `CRON_SECRET` locally if needed. Run it only after the environment upload
has been authorized. The owner approved the current deployment's upload.

Build: `npm run build`. Installation skips Electron's desktop binary.
`.vercelignore` excludes credentials, local test artifacts, and desktop tooling.
Functions allow up to 300 seconds. All application APIs validate a Supabase user
and the approved-account flag; the job reconciliation route validates its
separate secret. Public pages are sign-in and account setup.

## Media and processing

Uploads go directly from the browser to a private Supabase bucket using signed
upload tokens. Stable media references resolve to short-lived signed download
URLs after ownership checks. Bytes are not routed through Vercel for playback.
Project manifests replace large inline assets with durable media references.

Video task IDs are stored before returning to the browser. Polling checks task
ownership, and successful videos and continuity frames are preserved to Storage.
The Generations panel makes completed tasks accessible after navigation.
Ambiguous submission failures do not automatically create another paid task.

To preserve pending videos without an open browser, schedule the reconciliation
endpoint after deploying and checking its accessibility:

```
node --env-file=.env --env-file=.local/automation.env scripts/schedule-jobs.cjs HTTPS_DEPLOYMENT_URL
```

This uses Supabase pg_cron and pg_net, invokes the endpoint once per minute only
while image or video jobs are pending, and keeps the request secret in a private schema.
If Vercel Deployment Protection blocks this endpoint, configure an approved
automation access path before relying on unattended reconciliation.
The current preview has an approved automation secret in ignored
.local/automation.env. Test requests attach it only to the preview origin.
Pin MODELARK_ASSET_GROUP_ID for hosted deployments to reuse the same provider
asset group across function instances. The current preview has a verified group.

FFmpeg uses temporary files only. Preview exports support up to 20 clips,
three minutes, and 200 MB of source media, with a bounded processing time.
Clips normalize audio, frame rate, and dimensions before joining. The first
clip determines aspect ratio; output fits a 1080p landscape or portrait frame.
Full-length or 4K professional exports need a dedicated rendering worker.

Deleting a project retains media so other projects cannot lose shared assets.
Library deletion removes the library entry, not bytes referenced by productions.

## Verification

```
npm test -- --runInBand
npm run lint
npm run build
node --env-file=.env scripts/test-account.cjs
node --env-file=.env scripts/smoke-http.cjs
node --env-file=.env scripts/smoke-storage.cjs
node --env-file=.env scripts/check-secrets.cjs
```

HTTP/storage checks default to `http://127.0.0.1:43187`; set `FILM_TEST_URL` for
a deployed preview. They use an isolated test account stored in ignored `.local`.
Remove that account after validation. Lint preserves pre-existing React Compiler
migration diagnostics as warnings until the canvas refactor.

See IMPLEMENTATION.md for actual completed checks and pending deployment work.

## Additional providers

Set ANTHROPIC_API_KEY, FAL_API_KEY, and WAVESPEED_API_KEY on the server to enable
the catalog in utils/providerModels.js. They are included in the explicit Vercel
runtime upload list. Model IDs are public; credentials are never sent to browsers.

The Writing & planning selector chooses Claude Sonnet 5, Opus 5, or the existing
Seed reasoner. Video review through Claude extracts six frames with FFmpeg and
does not assess sound. H3 and H3 Max include native audio. On canvas, H3 keyframe
shots use only the opening/closing frames; clear keyframes for multimodal references.
WaveSpeed images use saved jobs and remain recoverable through Generations.
