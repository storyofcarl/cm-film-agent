# Hosted Film Agent implementation

Goal: secure Vercel preview using Supabase authentication, owner-scoped projects
and media, durable generation tracking, and a verified filmmaking workflow.

## Verified

- Supabase Data API credentials work.
- Vercel token can access the requested team; no Film Agent project exists yet.
- GitHub repository storyofcarl/cm-film-agent is reachable and empty.
- The archive build command references a missing script. Models already resolve
  from environment variables, so the obsolete prebuild command is removed.

## In progress

- Install dependencies and establish a passing production build.
- Add authenticated API boundary and invite-only access.
- Move projects/library/media to Supabase with ownership policies.
- Direct uploads and signed media delivery for Vercel payload limits.
- Persist generation tasks and implement safe resume/polling.
- Configure bounded FFmpeg processing and validate deployment.
- Deploy preview and run authentication, isolation, storage, and generation checks.

Credentials stay in ignored local environment files. Deploy only explicit runtime
variables; never deploy Vercel tokens or database administration credentials.

## Progress and pending input

- Repaired build passes with Next.js 16; existing React Compiler migration lint
  diagnostics are warnings, and remain visible for the later canvas refactor.
- Supabase sign-in and approved-account enforcement added to all application APIs.
- First 17 focused authentication, media ownership, and SSRF tests pass.
- Local production server tested on 127.0.0.1:43187 (Windows reserves 3000).
- HTTP checks: anonymous home redirects, anonymous config gets 401, approved
  session/home/config get 200. BytePlus model listing and one reasoning call pass.
- Vercel project created: prj_APWxwTLpkiu6gjaG3qtoKgMHUxBg.
- Supabase direct DB hostname does not resolve here; requested session pooler URL.
- Requested owner's email for the first production account.
- Automatic approval review rejected upload of runtime secrets to Vercel.
  Explicit approval for the exact variables and target project is pending.
- Database migrations have NOT run; remote storage/project/jobs tests remain pending.
- No browser surface is available for visual QA in this session.
- Temporary test account credentials/cookies live only under ignored .local;
  remove the temporary account after integration validation.
- All 24 protected API routes reject anonymous requests in local HTTP checks.
- FFmpeg integration check passes with mixed silent/audio clips, dimensions and
  frame rates; 18 total tests pass. Preview render limits are documented.
- Lint has zero errors; existing canvas/compiler migration warnings remain.
- Staged source scan: 168 files, zero configured secrets found (rescan before push).
- Browser bundle scan: 14 files, zero configured secret values found.
- Vercel Node runtime is 24.x; environment count is still zero because the
  environment upload remains blocked pending approval.
- Vercel Deployment Protection applies to previews. Unattended job polling will
  need an approved automation access path before scheduling the callback.
- Initial source checkpoint committed locally as 742fd5f on setup/hosted-preview.
- Limited Next build workers to two after a 19-worker build stalled on Windows;
  the two-worker build compiles and prerenders normally.
- Final local build passes. Final test run: 18/18. Final lint: zero errors,
  92 warnings. Source remains local; no deployment or GitHub push has occurred.
- Local checkpoint 67cb315 includes the worker limit and repeatable migration.
- Automatic approval review also rejected the GitHub source push. Explicit
  approval for source upload to storyofcarl/cm-film-agent, branch
  setup/hosted-preview, is pending. Do not retry either rejected upload until
  the corresponding approval arrives.

## Remaining gates

1. User approval for the explicit Vercel runtime-secret upload.
2. User approval for the explicit GitHub source upload.
3. SUPABASE_DB_URL from Connect > Session pooler (or another authorized migration
   connection). Apply migrations and run scripts/smoke-storage.cjs after this.
4. Owner email for scripts/create-owner.cjs once the preview is deployed.
5. Verify preview deployment protection and an approved scheduler access path,
   then test image/video/audio generation and exports against the live storage.

The goal remains active and is not complete.

## Latest update

- The user explicitly approved both Vercel runtime environment upload and the
  source push to storyofcarl/cm-film-agent on setup/hosted-preview.
- Uploaded 29 runtime settings to Vercel. No administration credentials or unused
  provider keys were uploaded.
- Owner email confirmed and saved only in ignored .local/owner-email.txt.
- Reasoning, image generation and production design now resolve private media
  references to authorized signed URLs before calling providers.
- Asset tool uploads use private Storage directly, and provider registrations use
  the ownership catalogue shared with the filmmaking canvas.
- 25 tests pass, including provider-reference and asset ownership regression checks.
- Session pooler connection is still pending. Migrations have not been applied.
