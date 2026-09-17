# Proposed pipeline and design plan

Revision: 2026-09-16, including existing-work intake, writing/direction skills, and burst methods.
Status: working proposal. Confirmed constraints are in DECISIONS.md.

The detailed review artifact is [WORKFLOW_MATRIX.md](WORKFLOW_MATRIX.md).
It expands these phases into inputs/outputs, gates, authority, and change rules;
its detailed policies remain proposals pending alignment.

## Current pipeline draft

| Phase | Batch work | Draft checkpoint |
| --- | --- | --- |
| 1. Intake, validation, and planning | Inventory supplied work across all stages; establish scope and requirements. Analyze completeness, approve passing work, and skip satisfied creation steps. Plan the remaining batch. | Record evidence and approval scope; identify only actual gaps, contradictions, and unresolved decisions. |
| 2. Development and concurrent preparation | Where needed, use Studio for writing, Analyzer for diagnosis, Doctor for targeted repairs, and optional Director's Vision/Shot Format for direction and shot planning. Prepare the complete roster, locations, asset specifications, timing, and draft prompts. Run independent work concurrently. | Preserve supplied decisions and complete work; maintain real writing/continuity dependencies. |
| 3. Representative asset checks | Generate one character and one location concurrently. Continue inexpensive preparation while they render. | Human lookdev approval before dependent asset batch release; exact acceptance criteria remain open. |
| 4. Asset batch and prompt completion | Produce required assets and variants in batches. Offer optional conventional boards/frames, Burst Board Video, character/location bursts, and dummy-character previs. Extract and map burst frames. Complete and bind prompts; audit coverage, timing, references, and model compatibility. | Inspect a valid assembled production package. Validate actual burst coverage. Final character approval does not block dummy previs; approved references are needed for the production conversion that uses them. |
| 5. Technical lookdev batch | Default to one representative lookdev segment for scenes requiring more than three generation segments. Honor user-reduced coverage, including one for the whole picture. Run independent tests concurrently and present results/findings. | Human approval of selected lookdev before dependent production release; an agent pass alone is insufficient. Detailed pass/retest criteria remain open. |
| 6. Low-resolution production batch | Release remaining segments for the entire deliverable, normally at low resolution. Use direct generation, frames, or previs plus approved references as appropriate. Run independent jobs together; honor continuations. | Enforce actual input/model constraints; isolate blocked work without losing successful results. |
| 7. Review and revision batch | Assemble and collect shot-level corrections. Choose frame-based revision, video edit, or full rerun for each correction, and execute the jobs in batches. Retain every version and its prompts. | Scene approval makes its selected material eligible for resolution finishing. Delegated approval rules remain open. |
| 8. Resolution finishing batch | Upscale selected material or use the approved clips as V2V references for 1080p/2K/4K generation with the same prompt and seed where supported. Link results to approved source versions. | Start from approved scenes; review generative finishes for changed content, timing, and continuity. |
| 9. Final finishing and delivery batch | Complete edit, sound, visual matching, titles/captions, delivery versions, exports, and verification. | Completeness and specified delivery requirements. |

Every phase can be satisfied by validated supplied work at the relevant scope.
Scene lookdev in phase 5 defaults to one human-reviewed segment for scenes needing
more than three generation segments (D27). The director may reduce coverage,
including one lookdev for the entire picture. Time/location changes in rapid
montages do not alone trigger lookdev. Reuse suitable approved test media.
For newly generated assets, phase 4 includes human review of the full asset batch
together before production-reference use (D24). Representative lookdev approval
does not replace this review. Requested corrections form a revision batch.
Every asset and shot exposes a version-specific approval dropdown (D25), making
the approved version and items needing revision explicit. Approval may change
without erasing history. The next revision batch uses those status records;
newer generated versions do not silently inherit approval.
Where methods overlap, offer both the existing Film Agent method and the
owner-supplied method. These choices are available within the new application;
they do not require switching to the legacy workflow. Defaults remain to be agreed.
Partial completion creates only the remaining tasks. Optional methods are not
mandatory artifacts or hidden prerequisites. A gate is satisfied by evidence of
its requirement, not merely by the existence of some earlier-stage material.

The phases describe work and spending checkpoints, not a wizard that requires
the user to advance every item. Asset jobs and other supporting operations are
part of the production batch; they need not masquerade as video segments.

Optional boards and dummy previs may begin as soon as their actual inputs exist,
including during preparation. Their position in the table is not a requirement
to wait for all final assets. Version/prompt history spans every production route.

## Gate categories to refine

This categorization is proposed, not a completed gate policy:

- Missing prerequisite: the agent can create, obtain, or propose it within its authority.
- Director checkpoint: a required decision at a defined batch boundary.
- Hard constraint: the affected work cannot run until its requirement is satisfied
  or the plan is explicitly changed.

Candidate technical gates include incompatible model inputs, unresolved required
references, missing continuation sources, impossible timing, and incomplete final
delivery. Creative and financial authorization policies need separate agreement.

## Open decisions

1. What exactly the representative character/location checks must prove. Human
   lookdev approval before dependent batch release is confirmed (D23).
2. How the representative pilot segment is selected and what constitutes technical
   success. The default is more than three generation segments with director
   coverage overrides (D27); define which changes require renewed validation.
3. What changes after a successful pilot require reopening technical validation,
   and how scene checks release their affected work within the overall batch.
4. How the director reviews compiled batch prompts and sets crew autonomy,
   spending limits, and permitted revisions.
5. How existing takes, shot source ranges, segment versions, and continuation
   dependencies are represented and reviewed.
6. The desired finishing/delivery scope and where external editorial tools fit.
7. Details of authoring modes and audio-led versus picture-led production.
8. Selection/authority rules for the three revision methods, version retention and
   access, and the audit/history views needed for compliance, reuse, and learning.
9. Upscaler/V2V tool choices, draft and delivery tiers, finishing review criteria,
   and behavior when the chosen provider cannot reuse a seed or support a target.
10. How color-to-character mapping, frame selection, and approved references are
    reviewed when converting dummy previs into production animation.
11. The completeness rubric and evidence required to approve imported work at each
    stage, including media with unavailable original prompts or generation settings.
12. Skill input/output contracts, handling of conflicting supplied direction, and
    burst extraction/coverage checks. See SKILL_CATALOG.md for adaptation notes.

## Existing Film Agent: reuse and replacement

Reuse candidates: inspiration; asset classification; cast/world planning;
character/location variations; normalization; source-preserving breakdown;
shot authoring; camera vocabulary; Compose/Direct/Enrich; storyboard/keyframe
generation; annotated edits; previz; provider adapters; private storage; saved jobs.

Replace or substantially extend: hidden order in the UI; flat timeline/event
structure; prerequisite handling; segment-to-shot mapping; source-range editing;
deliverable-wide orchestration; technical pilot gates; finishing and delivery.

The current production engine requires a blueprint; failed dependencies can
release downstream work; the current preview exporter concatenates full clips.
These are implementation observations, not requirements for the redesign.

## Design work plan

See [BUILD_PLAN.md](BUILD_PLAN.md) for the phased delivery plan and the agreed
separation between the new application and legacy workflows.

1. Continue workflow discussion; maintain this folder after substantive decisions.
2. Confirm the pipeline, objects, batch behavior, and gate policy with the owner.
3. Produce wireframes around the nested strip, batch planning/execution, technical
   pilot review, shot revision, and direct tool access.
4. Refine UX interactions, visible controls, inheritance/overrides, and error states.
5. Agree implementation scope and acceptance criteria, then build and validate.

Current position: baseline documented; D29 authorizes UX and implementation with
remaining choices flagged in WORKING_DECISIONS.md for owner review.
