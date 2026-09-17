# Studio implementation status

Updated 2026-09-16. Local implementation and release checks are complete. The
active goal is not complete: separate hosted deployment and its verification remain.

## Implemented

- Separate `apps/studio` application; legacy remains at the repository root.
- Film/episode/act/sequence/scene/shot navigation, nested thumbnails, editable
  hierarchy, shot ordering, searchable full-batch review, desktop and mobile layouts.
- Exact-version approval dropdowns, independent selection, repair notes/methods,
  prompt/seed/model history, decision events and immutable database snapshots.
- Deliverable-wide segment compilation, complete timed beats, continuation
  dependencies, minimum-duration padding/trimming and independent shot assembly.
- Human representative asset lookdev, full asset review and scene lookdev default
  above three segments; whole-picture override; usable partial pilot reuse.
- Draft production, frame repair, targeted video edit and full rerun (recorded or
  revised prompt). Source video references are trimmed to the intended shot range.
- Storyboards, faceless color-coded previs, burst-frame extraction, candidate
  promotion and explicit guide review/reference selection.
- Six supplied methodology packages plus original Film Agent alternatives. Crew
  artifacts retain exact compiled instructions and source hashes. Explicitly
  applied proposals can add production items or update future intent.
- Supplied text/Studio manifests/media intake. Decode and timing checks precede
  completeness assessment; only supplied completed work can receive agent approval.
  Unknown provenance stays unknown; imported executable jobs/approvals are removed.
- Server-only owner-scoped persistence, compare-and-swap edits, atomic execution
  claims, four concurrent submissions per pass, recovery and pause/resume.
- WaveSpeed upscale and supported same-prompt/seed V2V finishing after scene approval.
- Draft scene review assembly, approved picture render, signed-media delivery
  package, valid OpenTimelineIO timeline and local feature-length renderer.
- Separate deployment and private scheduler setup scripts, prepared but not run.

## Evidence

- Complete automated regression: **82 passing tests across 14 suites**.
- Real synthetic FFmpeg media tests cover trims, mixed audio, dimensions, local
  delivery rendering and parsing exported OTIO with the official Python library.
- Mocked-provider execution covers pilot reuse, human gates, dependent frame repair,
  duplicate claims, uncertain submissions and trimmed video-edit references.
- A continuation audit found and fixed scheduler starvation and a manual-recovery
  race. Dedicated regressions verify access beyond 50 projects, later ready batches,
  pause enforcement and preservation of a concurrent successful provider result.
- Real Supabase smoke checks passed: invitation access, ownership, client-write
  denial, stale edits, upload namespace, snapshots, concurrent atomic claims and
  idempotency. Temporary users/media were cleaned up; no provider jobs were submitted.
- Studio and legacy production builds passed. Studio source lint has zero warnings;
  repository-wide lint passes with 94 existing legacy warnings.
- Source plus Studio browser-bundle scan: **zero configured-secret matches**.
- Desktop/mobile browser checks pass, including nested hierarchy creation/editing,
  keyboard dialog dismissal, and asset-intent edits that preserve historical prompts.
  Screenshots are retained in ignored `artifacts/studio-*.png`; no browser runtime
  errors or mobile page-width overflow were observed.
- Production dependency audit retains three related high advisories in the legacy
  TOS SDK/Axios chain with no available automatic fix. Compatible transitive updates
  were applied. That unused legacy chain is absent from Studio's traced runtime;
  no unreviewed breaking SDK replacement was made.

## Release boundary and limits

- No arbitrary paid Studio generations were run. Provider adapters are reused and
  exercised with mocks; a director-approved real pilot is still required to assess
  artistic quality and live model behavior.
- Provider support varies. Unsupported modes, reference counts, durations and
  resolutions are blocked before submission. Some models cannot use same-seed V2V.
  Multi-segment sources without one reproducible recorded recipe use upscale.
- Unknown provider prices require a manually recorded estimate/basis. This is not
  an automatic spend ceiling or an actual invoice reconciliation system.
- Video completeness analysis samples frames; it cannot independently establish
  exact dialogue, sound quality or every instant of a continuous action.
- Direct document intake accepts text/Markdown/Fountain or a Studio JSON manifest.
  PDF/DOCX extraction and legacy-project conversion are not automated.
- Hosted renders are capped at 180 seconds/30 shots. Longer edits use local render
  or OTIO. There is no full DAW, advanced color grade, caption/title editor or automatic
  lip-sync/master-audio timing system in this release.
- Current persistence is a private-preview JSON project store with a 12 MB save
  limit. Multi-user production roles and large-team concurrent editing are not claimed.

## Deployment blocker

Automatic approval review rejected creating **cm-film-agent-studio** and uploading
runtime credentials because the earlier explicit approvals named **cm-film-agent**.
No new Vercel project, environment upload, Studio automation bypass, scheduler or
hosted deployment has occurred. The concrete request is in
[DEPLOYMENT_APPROVAL.md](DEPLOYMENT_APPROVAL.md). Do not retry via a different route.
