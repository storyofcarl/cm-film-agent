# New application delivery plan

Status: authorized execution plan, 2026-09-16 (D29).
Architecture separation and production rules remain binding. Proceed through the
phases using explicitly flagged working decisions for unresolved details.

## 1. Align on the production contract

Prepare a stage-by-stage matrix for the complete deliverable batch. For each stage,
specify inputs, crew work, outputs, concurrent jobs, dependencies, required decisions,
hard gates, failure behavior, and what a change invalidates.

Define assets, shots, scenes, sequences, acts, film/episode, segments, takes, edit
ranges, batches, and jobs in plain language before defining database tables.
Keep creative hierarchy separate from generation boundaries.

Cover asset checks, technical pilot scope, scene lookdev on long projects, compiled
prompt review, source/timing fidelity, three shot-revision routes, version/prompt
history, optional boards/dummy previs, scene-approved resolution finishing, and
director authority. Resolve the open
questions in PIPELINE.md through iterative discussion rather than one broad questionnaire.

Include entry from any completed stage, agent validation/approval of supplied
work, and skipping satisfied steps. Map the six supplied skills into optional
operations with explicit inputs/outputs; resolve inherited stop policies and
terminology against the agreed batch contract. Include burst-board and
character/location burst generation, extraction, and mapping.
Inventory overlapping Film Agent methods alongside the supplied skills and retain
them as selectable alternatives with compatible input/output contracts.

Deliverable: reviewed workflow matrix, object definitions, and gate/state rules.
Checkpoint: documented baseline complete; D29 authorizes proceeding with flagged choices.

## 2. Wireframe the director's workspace

Explore the nested thumbnail strip, context at each hierarchy level, batch planning
and status, agent assistance, technical lookdev review, shot/take comparison and
replacement, and direct access to tool controls. Include revision-route selection,
per-version prompts/settings and lineage, previs conversion, and finishing choices.
Show the intake inventory with approved supplied work, named gaps, and the remaining
batch. Include optional writing/direction methods and burst-frame selection/mapping.
Expose method selection, agent recommendations, director overrides, and the method
used for existing outputs. Do not hide alternatives behind the legacy application.

Show inherited settings and local overrides explicitly. Every blocked operation
must explain what it needs and what the crew can do to resolve it.
Lookdev review must present representative media and agent findings to the human,
with approve/revise actions controlling dependent batch release. A technical pass
must not appear as human approval or automatically clear this gate.
Also show full generated asset-batch review before production-reference use,
with consolidated corrections and retained successful versions (D24).
Every asset and shot must show a review-status dropdown, the reviewed version,
and the approved version (D25). Include batch status actions, revision notes,
decision history, and the resulting next-revision-batch view. Keep candidate
review status distinct from the version selected for production or assembly.
Do not force the director through a per-item wizard.

Deliverable: connected wireframes using one representative project and concrete
normal, blocked, failed, and revision states.
Checkpoint: inspect connected flows and record UX choices for owner review; proceed under D29.

## 3. Validate the UX in a prototype

Use simulated jobs and representative media to exercise the workflow without
paid generation. Refine information hierarchy, controls, review behavior, and
visual design together. Verify that the director can understand and operate a
whole batch without hidden prerequisites or repeated item-by-item intervention.

Deliverable: interactive prototype and agreed behavior/acceptance criteria.

## 4. Establish the separate application foundation

Create the new application alongside legacy in the same repository. Choose exact
folder/package names during technical design. Preserve the legacy app's operation.

Provide a separate Vercel preview and isolated tables and storage paths. Design
versioned creative records, generation records, and edit references. Keep the
legacy workflow engine out of the new orchestration path.
Retain actual compiled prompts and effective settings for each shot version,
including frame edits, video edits, reruns, previs conversions, and finishing.

Inventory each reused provider/prompt/media component and define its contract.
Carry forward ownership checks, server-side secrets, durable results, and protection
against duplicate paid submissions. Add tests where extraction or behavior changes
create meaningful risk; do not transplant UI-coupled assumptions blindly.

Deliverable: isolated deployable foundation and documented reuse boundaries.

## 5. Implement an end-to-end production batch

Build the actual batch scheduler, prerequisite handling, lookdev gates, compiled
model requests, job tracking, and shot-level assembly/revision. Connect the UX to
these capabilities. Model scene/episode/film scope from the beginning.

Use a small multi-scene project as the initial validation case. This is a build
validation scope, not a product restriction to small or piecemeal assignments.

Required scenarios:

- Import a mixed package of completed and partial work; approve complete elements
  after validation and batch only the missing work without recreating approved items.
- Use supplied direction/shot lists and targeted screenplay analysis/repair without
  forcing a full writing or Director's Vision workflow.
- Choose either an overlapping Film Agent method or an owner-supplied method within
  the new workflow; retain method/version provenance and apply the same batch rules.
- Generate board and character/location bursts, validate and extract useful frames,
  and preserve frame-to-source/prompt links and intended shot/asset mappings.
- Prepare all independent character, location, and prompt work concurrently.
- Perform technical lookdev at the appropriate project/scene scope and release
  affected production work only after human lookdev approval and other gates clear.
- Default scene lookdev to scenes requiring more than three generation segments
  (D27): verify three versus four segments, a rapid montage with many time/location
  changes, and an explicit one-lookdev-for-the-picture override. Honor the selected
  coverage, retain human approval, and reuse suitable approved test media.
- Verify that agent technical success and existing batch spend authorization cannot
  bypass lookdev approval, while independent preparation and cleared work continue.
- After approved asset lookdev, present the full generated asset batch for human
  review; prevent unapproved assets from becoming production references and collect
  requested corrections into a revision batch without regenerating successful assets.
- Run independent segments concurrently and honor continuation dependencies.
- Keep a failed prerequisite from releasing dependent paid work.
- Recover an existing job after interruption without buying it again.
- Map a multi-shot generation to independently editable shot ranges.
- Replace one shot while preserving successful neighboring footage.
- Exercise frame-based revision, targeted video editing, and full reruns with
  unchanged or changed prompts; retain the source version and actual prompts.
- Retrieve an earlier shot version and its generation recipe for comparison/reuse.
- Change asset/shot review status for an exact version; preserve prior decisions,
  keep new candidates unapproved, and build the next revision batch from explicit
  Needs revision records without duplicate submissions or loss of successful media.
- Produce faceless, color-coded silhouette previs before character approval,
  then use it as a video reference with approved assets for production animation.
- Use optional storyboard/production frames without making them universal gates.
- Approve scenes at low resolution, then batch upscale or supported V2V finishing
  with the same prompt/seed, keeping source and finished versions linked.
- Pad and trim a shot below the selected model's minimum duration.
- Continue a long shot across segment boundaries.
- Surface affected work after an approved setup or input changes.

Deliverable: a functioning production batch from prepared source through a
reviewable assembly and a completed shot-revision batch.

## 6. Finish, scale, and migrate deliberately

Implement the agreed finishing and delivery scope. Validate long-project navigation,
provider concurrency limits, operational recovery, costs, and media retention.
Run a real pilot production, review the experience with the director, and correct
workflow failures before broad adoption.

Define an explicit import/migration path for legacy projects once the new model
is stable. Retain access to originals; do not perform automatic in-place conversion.

Deliverable: verified production workflow, delivery package, and migration plan.

## Current review artifact

2026-09-17: implement the owner's persistent top-strip correction across every
project view, validate desktop/mobile navigation and retained selection, then
complete the now-approved separate Vercel preview and hosted checks.

Implementation has progressed into the separate Studio application. See
[IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) for evidence, known limits
and remaining deployment work. Phases 1–5 have a working local implementation;
phase 6 has verified synthetic finishing/export and still needs the authorized
hosted preview and a director-approved real pilot. This does not mean all future
professional post-production features are finished.

[WORKFLOW_MATRIX.md](WORKFLOW_MATRIX.md) now contains draft 1 of the phase-1
contract: work and outputs, dependencies, proposed gates/authority, supplied-work
evidence, object/state definitions, change propagation, and a mixed-input example.
The owner has authorized proceeding under D29. Remaining decisions are recorded
in WORKING_DECISIONS.md. Implementation starts from this baseline; no legacy
replacement or project migration is implicit.
