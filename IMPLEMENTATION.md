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
