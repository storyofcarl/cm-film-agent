# Hosted Film Agent implementation

## Current deployment

- Preview: https://cm-film-agent-preview.vercel.app
- Vercel project: cm-film-agent, prj_APWxwTLpkiu6gjaG3qtoKgMHUxBg.
- Supabase project: vrovjqmcoqqoctljugdh.
- Source: https://github.com/storyofcarl/cm-film-agent/tree/setup/hosted-preview
- Runtime: Node 24, Next.js 16.3.5, React 18.
- The user approved the GitHub source upload, Vercel runtime configuration, and
  protected automation access. All three are configured.
- Owner account created for the user-confirmed address; the private setup link is
  in ignored .local/owner-setup.html. No email was sent.
- Anthropic, fal, and WaveSpeed runtime credentials were approved for this project.

## Additional model providers

- Claude Sonnet 5 is the default writing/planning model, with Claude Opus 5 and
  the configured Seed reasoner selectable. Claude supports private image references;
  video review uses six sampled frames and explicitly excludes audio analysis.
- MiniMax H3 and H3 Max run through fal. Both include native audio and 5–15 second
  clips. H3 supports multimodal references; Max supports opening/closing frames.
- WaveSpeed image choices: Nano Banana Pro, Nano Banana 2, GPT Image 2,
  GPT Image 2.5 Sunburst, and GPT Image 2.5 Flare. Reference images use edit endpoints.
- Provider task IDs are saved as owned jobs before returning to the browser.
  Image and video results are copied into private Storage before success is recorded.
- Live tests completed for all five image models, both video models, Nano Banana 2
  editing, both Claude models, Claude image understanding, and sampled-frame video
  review. Authenticated output retrieval passed for every generated asset.
- 36 regression tests pass; lint has no errors. Production build passes.

## Implemented

- Invite-only Supabase authentication with server-controlled access approval.
- Authentication on all 24 application APIs and same-origin write protection.
- Owner-scoped projects, version history, media library, private Storage, provider
  assets, and generation jobs. All public Film Agent tables have RLS enabled.
- Browser uploads go directly to private Storage. Playback uses signed URLs after
  ownership verification; providers receive authorized media references.
- Video tasks persist before the submit response. Polling verifies ownership and
  stores successful outputs before marking tasks complete. A Generations panel
  recovers completed results after navigation.
- Supabase pg_cron/pg_net checks pending jobs every minute. Callback credentials
  and the approved Vercel automation secret reside in a private database schema.
  Deployment Protection stays enabled.
- Provider destinations and credentials cannot be overridden by browser payloads.
  Remote-media requests reject private network destinations and unsafe redirects.
- FFmpeg preview exports normalize frame size, frame rate, and silent/audio clips.
- BytePlus audio configuration accepts a host URL or the complete creation URL.
- A verified provider asset group is pinned in runtime settings for consistent
  registration across serverless instances.
- Secrets remain excluded from Git and deployment sources. Only approved runtime
  settings are in Vercel; database and administration credentials remain local.

## Validation

- Production builds pass locally and on Vercel.
- 25 focused tests pass, including authentication, owner isolation, provider
  references, network restrictions, and actual FFmpeg processing.
- Lint has zero errors. Existing canvas/compiler migration warnings remain.
- Live HTTP checks pass for all 24 protected routes, approved sign-in, home
  redirects, cross-origin rejection, and callback authentication.
- Both SQL migrations applied over verified TLS using Supabase's published CA.
- Live project save/load/update/version/delete and private media delivery pass.
  Forged provider-task ownership and cross-owner uploads are rejected.
- Live reasoning, image generation, asset registration, brief audio generation,
  four-second image-to-video generation, and two-clip MP4 export pass.
- Image, audio, video and export files downloaded successfully through the private
  media endpoint. Verification artifacts are in ignored .local.
- Scheduled reconciliation runs successfully; the test video is durably stored.
- Source scan: 180 tracked files checked before the security-update push, zero
  configured secrets found. Rescan after subsequent source changes.

## Limits and next phase

This is the hosted foundation and a working private preview. The complete
enterprise UI/UX redesign and additional provider adapters are still future work.

- Preview exports are limited to 20 clips, 3 minutes, and 200 MB of source input.
  Longer and 4K exports need a dedicated rendering worker.
- No browser surface is available in this session, so visual/browser interaction
  QA remains pending.
- Review legacy dependencies and canvas/compiler warnings during the next phase.
  Next.js was patched after deployment auditing identified security advisories.
- Image/audio generation remains synchronous. Broader job tracking, quotas,
  workspace roles, billing controls, and operational monitoring remain future work.
- Project/library deletion retains media so shared references are not broken;
  storage retention and cleanup controls need a product workflow.
