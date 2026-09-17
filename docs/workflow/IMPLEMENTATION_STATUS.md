# Studio implementation status

Updated 2026-09-17. The separate private preview is deployed and verified.
The chat-first workspace update is deployed and passed hosted release verification.
A director-reviewed real creative pilot remains outstanding.

## Implemented

- Separate `apps/studio` application; legacy remains at the repository root.
- Persistent crew conversation as the default wide workspace, docked beside manual
  views. Saved replies, project-specific drafts, selected object context, readable
  proposals, and non-executing batch-preparation actions. Automatic method routing
  retains source provenance; model/method defaults live in project settings.
- Stable project-local object codes and explicit project/act/sequence/scene strip
  scope. Clickable approval ring counts current scene approvals, with asset, shot,
  scene and active-job details. Asset types are editable in Properties.
- Expanded prompt editors/readers, exact-version reference inspection, full source
  segment playback and per-shot source ranges. Illustrative demo frames are clearly
  identified as having no generated video segment.
- Film/episode/act/sequence/scene/shot navigation, nested thumbnails, editable
  hierarchy, shot ordering, searchable full-batch review, desktop and mobile layouts.
- Persistent object Properties inspector: editable direction and asset references,
  shot runtime and aggregated container runtime, visible inherited direction,
  and selection shared with crew requests. Changes affect future requests and
  flag stale plans while historical generation recipes remain intact.
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
- Six supplied methodology packages, the OCC methodology, and original Film Agent alternatives. Crew
  artifacts retain exact compiled instructions and source hashes. Explicitly
  applied proposals can add production items or update future intent.
- Supplied text/Studio manifests/media intake. Decode and timing checks precede
  completeness assessment; only supplied completed work can receive agent approval.
  Unknown provenance stays unknown; imported executable jobs/approvals are removed.
- Mixed upload inbox through crew chat: PDF, DOCX, text/Markdown/Fountain/JSON,
  images, video and audio. Originals are retained in private owner storage. Crew
  proposals or manual controls assign usable media to asset/shot versions or guides;
  assignments remain pending completeness review with unknown recipe fields intact.
  Duplicate intake is idempotent, and partial upload failures do not discard successes.
- Server-only owner-scoped persistence, compare-and-swap edits, atomic execution
  claims, four concurrent submissions per pass, recovery and pause/resume.
- WaveSpeed upscale and supported same-prompt/seed V2V finishing after scene approval.
- Draft scene review assembly, approved picture render, signed-media delivery
  package, valid OpenTimelineIO timeline and local feature-length renderer.
- Separate Vercel deployment and private Supabase scheduler, verified live.

## Evidence

- Complete automated regression: **93 passing tests across 18 suites**.
- Real PDF and DOCX extraction, unreadable/oversized document handling, inbox media
  assignment and idempotency are covered. Authenticated integration checks verify
  ownership, retained originals, document text, browser upload controls, visible
  intake results and persistence after reload. The compatible XML parser patch
  was applied; new parser dependencies introduce no remaining production advisories.
- New regressions cover automatic method selection, conversation context, stable
  IDs, typed asset/reference proposals, exact historical source inspection, and the
  4-of-6 scene approval count changing to 3-of-6 after an approved selection changes.
- Browser checks cover persistent chat across all six manual views, retained draft
  text, visible Send control, expanded 4,000-character editing, status details and
  source inspection. Authenticated Supabase checks passed without paid AI calls.
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
- PDF/DOCX intake extracts text, not page layout or embedded-image content. Scanned
  or unreadable documents need OCR/text exports and remain flagged with originals
  available. Unsupported files report per-file errors. JSON uploaded to chat is
  treated as supplied text; explicit Studio-manifest import remains a separate action.
- Audio is retained in the inbox for inventory and access; automatic transcription,
  music analysis and soundtrack assembly are not newly claimed by this release.
- Crew conversation sees full text/inventory and up to six unassigned image references
  per request, with explicit evidence IDs. Other media is not falsely described as
  watched/heard; completeness validation remains a separate intake batch.
- Automatic crew method routing and proposals have mocked-provider coverage;
  conversational quality and autonomous end-to-end production need the real pilot.
- Hosted renders are capped at 180 seconds/30 shots. Longer edits use local render
  or OTIO. There is no full DAW, advanced color grade, caption/title editor or automatic
  lip-sync/master-audio timing system in this release.
- Current persistence is a private-preview JSON project store with a 12 MB save
  limit. Multi-user production roles and large-team concurrent editing are not claimed.

## Deployment progress — 2026-09-17

The owner approved the separate Vercel destination after the explicit request.
**cm-film-agent-studio** is live at https://cm-film-agent-studio.vercel.app.
The illustrative walkthrough is https://cm-film-agent-studio.vercel.app/demo.
Existing approved accounts can sign in. The approved runtime environment is uploaded.
The separate `film-agent-studio-reconcile` minute schedule is enabled; the legacy
schedule remains active and unchanged. Its private endpoint returned 200 with no
pending work. Production-domain checks needed no Vercel automation bypass.
The previous approval blocker is resolved; see [DEPLOYMENT_APPROVAL.md](DEPLOYMENT_APPROVAL.md).

Hosted authentication, ownership, stale-save protection, namespace isolation,
version history and atomic claim checks passed. A synthetic 2-second video was
decoded and assembled to an 854-pixel-wide review, then exported as approved
editorial JSON/OTIO. Temporary users and media were removed; no paid AI calls ran.
All three Studio tables retain row-level security and the fixture project count
returned to zero. Screenshots and the hosted smoke report are in ignored artifacts.

Deployment portability fixes: use the Vercel CLI with an isolated scanned source
snapshot, resolve the physical monorepo install directory, retain npm 12's missing
optional-peer lockfile entries, and use relative FFmpeg tracing patterns. These
do not change provider behavior or the legacy project's Vercel settings.

The project strip now lives inside the project workspace, to the right of the
full-height left sidebar and above the view content and inspector on every project
view. Desktop/mobile checks verified the sidebar placement, all six views, hierarchy navigation without
changing the active view, retained shot selection, and return from Assets to the
selected shot. The updated authenticated smoke also passed; temporary fixtures
were cleaned up and no provider generation was submitted.

The subsequent D31–D35 release is live on the same Studio domain. Hosted checks
verified the persistent wide/docked chat, unchanged drafts during navigation,
long-prompt expansion, status details, source-inspection access, object properties,
and all existing authentication/ownership checks. Temporary fixtures were cleaned
up. The release did not run paid reasoning or generation; automatic craft routing
was verified with mocked provider responses. The real director-reviewed
production pilot remains open.

The mixed-upload inbox is deployed and passed hosted verification on the same
Studio domain. Real PDF, Word, Markdown and image fixtures retained their private
originals; extraction, duplicate handling, assignment provenance, mixed-selection
failure recovery and persistence across reload all passed. A hosted-only missing
PDF canvas dependency was fixed with explicit runtime tracing and lazy PDF loading.
Desktop/mobile navigation and synthetic scene export passed again. Temporary
test accounts and media were removed; no paid AI requests were made.
