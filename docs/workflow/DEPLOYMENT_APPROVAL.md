# Separate Studio deployment request

Status: owner approved Vercel on 2026-09-17 after the destination-specific request.
Separate project `cm-film-agent-studio` (`prj_nfTEl8jOgjAXT5sSv4tRvPJjoDIM`)
has been created and its runtime allowlist uploaded. The Studio preview is live at
https://cm-film-agent-studio.vercel.app with hosted authentication, media assembly
and separate scheduler checks passing. No Vercel automation bypass was necessary
for the stable production domain; application invitation access remains enforced.

## Reviewable application

- Source: `apps/studio` plus the documented shared adapters, additive migrations,
  tests, resources and scripts in this repository.
- Local preview: `http://127.0.0.1:43189`; illustrative walkthrough: `/demo`.
- Review [implementation evidence and limits](IMPLEMENTATION_STATUS.md) and
  [working decisions](WORKING_DECISIONS.md) before changing the release scope.
- Proposed source branch: `studio/director-workspace` in the existing
  `storyofcarl/cm-film-agent` repository. No merge into the legacy branch is requested.

## Requested actions

1. Upload the reviewed source branch to the existing GitHub repository.
2. Create Vercel project **cm-film-agent-studio** under **carlcompositionms-projects**
   (`team_yUCns6dEqFOnvA3gd6AD9oqU`), root **apps/studio**, and deploy this source.
3. Store only the runtime allowlist below in that project's **Preview and Production**
   settings, using values from ignored local configuration.
4. Create a separate automation bypass secret if Vercel protection requires it.
   Keep it in ignored local configuration and the private Supabase scheduler record.
5. Configure the separate `film-agent-studio-reconcile` minute schedule in the existing
   Supabase database and verify hosted authentication, isolation and job recovery
   using temporary fixtures without arbitrary paid AI generations.

This enables the new server to access the owner's database/media and billable AI
services. Film Agent still requires an approved account. A bypass secret passes
Vercel protection, not Film Agent authentication. Legacy deployment/data/scheduler
remain intact.

## Runtime allowlist

Secrets:

```
SUPABASE_SECRET_KEY
ANTHROPIC_API_KEY
FAL_API_KEY
WAVESPEED_API_KEY
MINIMAX_API_KEY
MODELARK_API_KEY
MODELARK_ASSET_ACCESS_KEY
MODELARK_ASSET_SECRET_KEY
BYTEPLUSVOICE_API_KEY
CRON_SECRET (new, generated for Studio)
```

Public identifiers and runtime configuration:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
REGION
SERVICE
VERSION
BASE_URL
TERMINAL
POLL_INTERVAL_MS
POLL_MAX_ATTEMPTS
MODELARK_API_BASE_URL
MODELARK_MODEL_REASONER
MODELARK_MODEL_SEEDREAM
MODELARK_MODEL_SEEDREAM_PRO
MODELARK_MODEL_SEEDANCE
MODELARK_MODEL_SEEDANCE_FAST
MODELARK_MODEL_SEEDANCE_MINI
MODELARK_MODEL_SEEDANCE_25
MODELARK_MODEL_SEED_AUDIO
MODELARK_ASSET_GROUP_ID
BYTEPLUSVOICE_BASE_URL
ELECTRON_SKIP_BINARY_DOWNLOAD=1
```

Excluded: database connection/password, Vercel token, GitHub token, administration
credentials, `.env` files, local account fixtures, artifacts and unused TOS settings.
No secret values are contained in this document. The setup script uses this fixed
allowlist, not an open-ended prefix match.

## Prepared operations

`scripts/setup-studio-vercel.cjs` creates the separate project and uploads the
allowlisted environment. It must not be run until this new destination is approved.

`scripts/schedule-studio-jobs.cjs` configures its separate scheduler after the hosted
origin and protection path are verified. It writes only the new private endpoint
record and schedule. Never reuse the legacy cron secret or overwrite its schedule.

The separate deployment and hosted checks passed on 2026-09-17. A director-reviewed
real creative pilot remains a release-readiness step before broader production use;
no arbitrary paid generations were authorized or run as part of these checks.
