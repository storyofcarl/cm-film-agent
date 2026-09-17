# Film Agent Studio

Separate director-and-crew workspace. Legacy remains at the repository root.
The source of workflow authority is [DECISIONS.md](../../docs/workflow/DECISIONS.md);
delegated choices are in [WORKING_DECISIONS.md](../../docs/workflow/WORKING_DECISIONS.md).
See [implementation status](../../docs/workflow/IMPLEMENTATION_STATUS.md) for evidence
and limitations. This is a private preview, not a claim of completed enterprise certification.

## Run locally

From the repository root with Node 24 and its ignored `.env`:

```
npm ci
npm run studio:dev -- --hostname 127.0.0.1 --port 43189
```

Use `/` for the authenticated workspace and `/demo` for illustrated, temporary sample
data. The sample cannot run paid provider jobs. Existing approved Supabase identities
work in Studio. Sign-in, password setup and sign-out are supported.

Production build/start:

```
npm run studio:build
npm run studio:start -- --hostname 127.0.0.1 --port 43189
```

## Director's workflow

The nested thumbnail strip stays at the top of the project workspace, to the
right of the full-height left sidebar, across every view. Use breadcrumbs to
move through film/episode, acts, sequences and scenes; select a shot to direct it.
View changes retain the hierarchy and shot selection. Shots and containers own
their properties; screens are ways of working with the same production records.

1. Create a film, episode or scene. Import supplied text, a Studio JSON project,
   shot/asset media, or guides. Ask Crew to analyze, write, plan or revise using
   either the original Film Agent method or an owner-supplied method.
2. Review/apply preparation proposals. Edit hierarchy, timed action beats, global
   style, model choices and reference selection directly. These are visible controls.
3. Prepare deliverable-wide batches. The batch shows exact requests, prerequisites,
   estimates, output and recovery state. Independent jobs execute concurrently;
   continuations wait for their source. One approval releases the specified plan.
4. Approve representative asset lookdev, review the full generated asset batch,
   then review required scene lookdev. Default: one segment for each scene needing
   more than three segments; whole-picture override is in Production settings.
5. Review every generated version with its dropdown. Selection and approval are
   distinct. Flag corrections, optionally override each version's repair method,
   and approve one proposed revision batch before running.
6. Watch a draft scene assembly, approve the selected shot versions and scene,
   then prepare upscale or supported same-prompt/seed V2V finishing. New finished
   versions need their own review. Select them and approve the updated scene.
7. Render the approved picture or download its editorial package. Review the final
   render before approving delivery. Supplied completed work can skip satisfied
   creation stages after intake validation.

Pause stops new submissions; it does not cancel provider tasks already running.
Refresh recovers existing jobs without buying them again. Resolve an uncertain
attempt only after checking the provider dashboard and recording the outcome.

## Long productions and delivery

Hosted assembly supports 180 seconds/30 shots per request. Download the delivery
JSON and render longer productions locally:

```
node scripts/studio-render.cjs path/to/picture.delivery.json path/to/output-directory
```

Run that command from the repository root. It downloads signed media links (valid
one hour), assembles the approved shot ranges, and writes the picture, manifest and
OTIO timeline. Existing output is not overwritten. Regenerate the package if links
expire. Keep downloaded source media next to the OTIO timeline for another editor.

## Verification

```
python -m pip install --target .local/otio opentimelineio==0.18.1
npx playwright install chromium
npm test -- --runInBand
npx eslint apps/studio scripts/studio*.cjs tests/studio*.js --max-warnings 0
npm run studio:build
node scripts/check-secrets.cjs --studio-bundle
node scripts/studio-smoke.cjs
```

The smoke script needs the running local production build and administrative test
access from `.env`. It creates and removes temporary users/media and tests database
claims; it makes no paid provider submissions. Synthetic media tests use FFmpeg.

## Persistence and deployment

Studio uses `studio_projects`, `studio_project_versions`, `studio_jobs`, and media
paths `<owner>/studio/<key>`. Three additive migrations are in `supabase/migrations`.
Clients have owner-scoped reads; authenticated server commands control mutations.
Version snapshots retain earlier revisions; project saves use optimistic concurrency.

The separately approved preview is https://cm-film-agent-studio.vercel.app;
use `/demo` for illustrated fixtures and `/` for your approved account.
Deployment authority is in [DEPLOYMENT_APPROVAL.md](../../docs/workflow/DEPLOYMENT_APPROVAL.md).
The separate private scheduler is `film-agent-studio-reconcile`. Do not point the
legacy Vercel project at this application or reuse its scheduler configuration.
