# Studio acceptance audit

Updated 2026-09-17. This audit separates implemented behavior from evidence that
still requires a real production and director review. Automated success alone
does not establish creative quality, live provider reliability, or final acceptance.

| Agreed requirement | Implementation and evidence | Remaining acceptance |
| --- | --- | --- |
| Separate Studio; preserve legacy | Separate app, Vercel project, tables, media namespace and scheduler; hosted ownership and namespace checks | No automatic legacy conversion; use the migration path below |
| Project strip on every view, inside the project beside the left sidebar | Breadcrumb interaction rejected (D36); replaced with direct Project/Act/Sequence/Scene controls and level-specific selection. Browser checks preserve scope and selected shot across views | Owner review of the replacement; checks do not substitute for acceptance |
| Left/center/right workspace boundaries | Left opens/closes to icons; chat-only right sidebar starts expanded and collapses to a permanent rail with draft preserved; header/project actions above strip; version mechanics inline in center (D38–D43) | Owner visual review; overall UX explicitly remains a draft |
| Objects own properties; screens manipulate those same objects | Shared Properties inspector; saved container direction/reference scope reaches compiled requests; crew receives selected context | Owner review of inheritance defaults in WD29 |
| Film/episode batch scope and hierarchical shot assembly | Domain and execution tests cover batch preparation, segment packing, atomic beats, continuation and minimum-duration trimming | Real multi-scene production pilot |
| Reusable assets and human lookdev | Explicit reference assignments; version gates and more-than-three-segment scene threshold with picture override | Human review of representative character/location and technical video lookdev |
| Full asset review and explicit shot/version approval | Separate selection/review state, dropdowns, retained decisions and stale approval checks | Director review of an actual complete asset batch and resulting shots |
| Three independent shot repair routes | Frame repair dependencies, trimmed video edit references, unchanged/changed prompt reruns; historical recipes preserved | Live model behavior and director approval of a proposed paid revision batch |
| Prompt, seed, model and reference provenance | Immutable version recipes and project snapshots; unknown imported provenance remains unknown; chat receives inspected-version context separately from production selection (WD34) | Inspect recipes from real paid provider results |
| Supplied completed work and optional methods | Intake validation and conflict tests; original methods plus six supplied packages; proposal application | Real supplied package and director assessment of method outputs |
| Boards, production frames, silhouette previs and bursts | Preparation/extraction/reference mappings; human guide review; inherited direction/reference tests | Real burst extraction quality and previs-to-final fidelity |
| Concurrent jobs and operational recovery | Mocked execution, real atomic database claim, scheduler fairness and race tests | Provider-side concurrency/recovery under real production load |
| Low-resolution review then finishing | Scene approval gates, same-recipe V2V checks and upscale path; synthetic media assembly/export | Real finishing quality and chosen model/resolution support |
| Delivery | Hosted synthetic review render; JSON/OTIO export and official OTIO parsing; local long-film renderer | Director-approved real delivery and downstream editorial check |

## Remaining production milestone

The owner's subsequent D31–D35 additions also require complete upload-led crew
operation. Persistent chat, automatic method selection, property/settings proposals,
batch preparation, text-document upload, source inspection and status snapshot are
implemented and tested. The mixed-media/PDF/DOCX upload inbox now preserves originals,
extracts supported text, flags gaps, and supports crew-proposed or manual assignment.
Scanned-document OCR and audio transcription remain outside current intake coverage.
Real conversational production acceptance remains open. Do not equate method routing
with integration of every external OCC CLI tool.

Run one director-approved multi-scene pilot, using supplied work where available.
The reviewable provisional package is [pilot/PILOT_REVIEW.md](pilot/PILOT_REVIEW.md),
with an importable `last-light-pilot.studio.json`. Hosted import and synthetic
segment planning passed; actual model selection, current pricing, paid execution
and director review remain unverified. WD33 records the provisional material choice.
Prepare the complete deliverable and estimated batch costs first. Human asset and
technical lookdev gates still apply; software development authorization does not
approve a paid production batch or its resulting media. Include one scene of four
or more compiled segments and one short scene, retain a successful lookdev result,
revise only a flagged shot, then finish and export approved scenes. Record actual
provider outcomes and any workflow corrections in the implementation status.

The preview is available for this review. The overall production-readiness goal
remains open until this milestone is resolved; this audit does not approve media
on the director's behalf.

## Deliberate legacy migration path

1. Keep the original legacy project accessible. Create a separate Studio project;
   never edit the legacy project's stored records to make them look like Studio.
2. Upload source writing, direction and shot lists as PDF, Word, text, Markdown
   or Fountain documents. Scanned PDFs need OCR/text supplied separately; review
   extraction warnings before treating a document as complete.
3. Inventory reusable assets and shot media. Import copies through Studio's upload
   and intake flow, preserving originals and mapping each item to its intended
   scene/shot. A valid Studio manifest may carry a prepared hierarchy; a legacy
   manifest is not a Studio manifest and must not be relabelled as one.
4. Preserve available source prompts, models, seeds and reference provenance. Mark
   unavailable values unknown. Do not invent a reproducible recipe from a filename
   or preview image.
5. Validate completeness and timing of supplied work. Record approved supplied
   versions only when validation supports it; keep gaps visible. Prepare only the
   remaining deliverable work, then use the normal human gates for new generations.
6. Compare the imported hierarchy, runtime and media inventory against the legacy
   original before relying on Studio for the production. Keep the original until
   the director accepts that comparison and the resulting delivery.

This is a manual, reviewable migration path. An automatic converter is not part of
the current private preview. Other release limits remain in IMPLEMENTATION_STATUS.md
and WD27; they must not be described as completed enterprise capabilities.
