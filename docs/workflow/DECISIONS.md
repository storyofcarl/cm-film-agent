# Workflow decision log

Recorded: 2026-09-16. Status refers to design agreement, not implementation.

## Confirmed

### D01 — Replace the interaction model; retain useful capabilities

Build a new interface using Film Agent's tools, prompts, and useful components.
Make prerequisites explicit and expose necessary customization controls.
Discuss and align on workflow before wireframes and UX; implement afterward.

### D02 — Director and crew

The user is the director. The agent and tools are the crew, assisting with
planning, tasks, jobs, production, and revisions. Missing prerequisites may be
created by the agent. Genuine hard gates must remain enforced.
The detailed gate inventory is not yet agreed.

### D03 — Creative hierarchy

Shots combine into scenes, scenes into sequences, sequences into acts, and acts
into a film or episode. Assets are separate reusable production elements.
Each creative level supplies context and direction to executable work.
Scene boundaries follow changes in time/location (D27), including rapid montage
changes; a new scene does not itself require a new lookdev.

### D04 — Segments conform creative work to the model

A segment is a generation unit/data type constrained by the selected model.
It can contain multiple shots; a long shot can span multiple segments.
Segments are actionable production units, separate from the creative hierarchy.
Prefer durations near the model's maximum without splitting a sentence or a
single action. Prefer an ending at a cut; support long-shot continuations.

### D05 — Shots remain independently revisable

Revise shots separately. Never regenerate successful neighboring footage merely
because it shared a segment with a shot that needs revision. Preserve successful
material and replace only the affected shot or portion using an appropriate
generation request and subsequent assembly.

### D06 — Minimum-duration padding

If the intended shot is shorter than the model's minimum, deliberately prompt a
head or tail and trim it after generation. Generated duration and used duration
must remain distinguishable.

### D07 — Assets are selective and reusable

Create an asset for reuse, or when deliberate design/reference control is needed
because the model cannot adequately design the element within generation.
Do not force every one-off element through asset creation. Successful one-offs
may later be promoted for reuse.

### D08 — Nested project strip

Provide thumbnail navigation through film/episode, act, sequence, scene, and
ultimately shot views. Keep shot/take and segment relationships understandable.
The owner's 2026-09-17 correction is explicit: the strip belongs at the top of
every project view and must not depend on the current page. Keep its hierarchy
context and shot selection when switching views. The separate Hierarchy page
and Cut-only bottom strip are superseded by one shared project strip.

### D09 — Deliverable-wide batches are the default

The assignment's deliverable defines its batch scope: scene, episode, or film.
The agent prepares and executes complete runs for characters, locations, prompts,
and other required work, concurrently wherever dependencies permit.
No default piecemeal operation or repeated user-driven advancement through items.
Individual tools remain available when the director chooses manual intervention.

### D10 — Dependency-aware concurrency

Batch scope does not require simultaneous submission of every job. Independent
work runs together; genuine continuations and other dependent work wait for
their prerequisites. Agent efficiency is the default operating behavior.

### D11 — Representative checks before broad spend

The owner specified one character and one location as representative asset
checks at relevant spending points. Retain these in the draft pipeline.
Their exact acceptance criteria remain to be specified. Lookdev release requires
human approval under D23.
The video check is governed by D12, including scene-level validation on long projects.

### D12 — Technical lookdev at the relevant production scope

Use one representative segment to validate a shared technical setup before
broad video spend. Test prompt setup, the global style block, and whether the
approach to the remaining work needs refinement.

On a long project such as a movie, qualifying scenes get technical lookdev by
default because they introduce new scene-level error points. The director may
choose reduced coverage, including one test for the entire picture (D27).
The one-segment principle applies to the setup being validated, not as a cap
of one segment for an entire film. Its purpose remains technical validation,
not creative testing of every segment.

Scene lookdev is itself organized as a batch, concurrently wherever dependencies
permit. It does not change the deliverable-wide batch operating model.
The default scene trigger is more than three planned generation segments (D27),
with director overrides. Triggers for renewed validation remain to be defined.
The director reviews and approves lookdev before dependent batch release (D23).

### D13 — Accepted adaptations from OCC

- Preserve shot-level revision even when initial generation is segment-based.
- Keep segments separate from the creative hierarchy, including long shots
  crossing segment boundaries.
- Keep prompt/reference/audio/continuation behavior model-specific rather than
  transferring one model's conventions to every provider.
- A location lookdev image can establish a design without necessarily becoming
  a generation reference; consistent textual staging may be appropriate.

### D14 — Separate the new application from legacy workflows

The owner accepted a separate application in the same repository, retaining the
current Film Agent as the legacy application. The new app owns its creative data
model, batch orchestration, gates, technical lookdev, and interface.

Selectively reuse provider integrations, authentication, storage, media processing,
and prompt recipes through explicit contracts. The legacy workflow engine must
not govern the new app. Use a separate Vercel preview and isolated data tables and
storage paths during development. Plan migration after the new model is agreed.
Restructuring follows workflow alignment; this decision does not start implementation.

### D15 — Three shot-revision routes

Support three explicit methods, selected according to the requested change:

1. Extract and revise one or more frames, then use the revised frames to guide
   the affected shot generation. The owner's preferred tradeoff is low cost and
   predictability for changes that can be solved in frames.
2. Submit a video edit task. The owner identifies it as more expensive and less
   predictable, but sometimes easier, especially for adding, removing, or making
   one clear targeted change.
3. Regenerate the affected clip completely, with or without changing its prompt.

All routes preserve successful neighboring shots, operate in revision batches,
and retain the earlier versions. A full rerun is one option, not the only revision
control. Provider support and actual costs must be established during implementation.

### D16 — Shot versions and prompt history

Track every shot version and its prompts for compliance, revisiting earlier work,
reuse, and learning. Preserve history across frame edits, video edits, unchanged-
prompt reruns, previs-to-production passes, and resolution finishing.
The version record must retain the actual prompt used, not reconstruct it from
whatever the current global style block or template happens to be.
Detailed audit schema and retention/access policies remain design work.

### D17 — Low-resolution production followed by scene-approved finishing

Typically generate and revise at low resolution until scenes are approved.
After scene approval, either upscale the accepted material or use it as a V2V
reference for a 1080p, 2K, or 4K generation with the same prompt and seed.
The chosen route and target must be supported by the model/tool.

Treat the high-resolution result as a related version, preserving the approved
source and generation settings. Reusing prompt and seed records the requested
recipe; it does not establish that a generative finish is pixel-identical.
Finishing runs are batches over eligible approved scenes.

### D18 — Optional production frames and dummy-character previs

Support optional storyboards and production frames to guide generation.
Also support faceless, color-coded dummies matching the characters' silhouettes
to produce previs. This allows blocking and scene work before final character
approval, or independently of appearance details.

The resulting previs can be used directly as the video reference for production
animation with approved asset references on a model that supports the combination.
Previs is reusable production input, not a disposable exercise or mandatory step.
Pending final character approval must not block the dummy-previs route; approved
asset references are required at the production conversion that uses them.

### D19 — Validate supplied work and enter at any completed stage

The director may bring one or more production steps already completed. The agent
must analyze the supplied elements, check completeness against the applicable
requirements, mark passing work approved, and skip the corresponding creation
steps. Intake is not restricted to starting from a concept or screenplay.

Preserve complete work and address gaps in partially complete work. Approval must
describe what was checked and the scope it covers; the presence of a file alone
does not prove completeness. Existing work can satisfy a gate when it supplies
the evidence that gate actually requires. Detailed validation criteria remain
part of the workflow contract.

### D20 — Incorporate the owner's writing and direction methods

Include the supplied Screenplay Studio 2, Analyzer 2, and Doctor 2 methods for
creative development, diagnosis, and targeted repair. Director's Vision 3 and
Shot Format 4 provide optional direction and shot-list methods that guide later
production. Accept existing equivalents through D19; do not require recreating
them in a particular skill's output format just to progress.

The owner supplied the six archives cataloged in SKILL_CATALOG.md for integration.
Reviewing their methods does not mean they are already installed or wired into
the application. Their original human-stop policies and terminology must be
adapted to the agreed batch workflow and imported-work approval behavior.

### D21 — Burst Board Video for boards and asset exploration

Support the owner's Burst Board Video method: video-generated sequences of
stills for storyboards, using video models for storytelling and spatial awareness.
Also support character and location bursts, with up to 20 characters or locations
in a single five-second video, as described by the owner.

These are optional production methods, available within deliverable-wide batches.
Extracted board frames and design candidates must remain connected to their
source video and prompt. The supplied skill authors prompts; API execution,
frame extraction, candidate mapping, and project integration are new application
work. Reliable output counts and usable frames require validation with the chosen
model; a requested count is not proof of a successful result.

### D22 — Keep overlapping Film Agent methods selectable

Do not replace or remove useful Film Agent skills merely because an owner-supplied
skill covers the same stage. Retain both as selectable methods for the relevant
task. The director can choose the method; the agent may recommend one.
This applies within the new workflow, not only through access to the legacy app.

Method selection must remain distinct from the new application's production
rules: both methods use the agreed hierarchy, batches, dependencies, gates,
version history, and shot-level revision. Exact defaults and selection UI remain
design work. Do not require running every overlapping method on the same task.

### D23 — Lookdev is a human approval gate

The owner clarified: "Lookdev is for the human - not just for the agent."
The agent prepares representative results, performs technical checks, and presents
findings and proposed adjustments. The human reviews and approves lookdev before
the affected production batch is released. Agent technical success alone cannot
clear this gate, even when the broader batch spend has already been authorized.

This applies to representative asset looks and video/scene lookdev. Retain the
agreed technical purpose of video lookdev and the one-segment scope for each
setup being validated. Human review does not mean testing every segment or
manually advancing each job. Independent preparation and other cleared work can
continue while the affected work waits.

Validated supplied completed work still follows D19. A previously human-approved
lookdev result may satisfy the same applicable gate without recreation. Importing
an unreviewed test clip does not turn agent validation into human lookdev approval.
The precise record of prior approval is a remaining intake-detail decision.

### D24 — Human review of the full generated asset batch

After the director approves representative character/location lookdev, the crew
generates the remaining asset batch and presents the full batch together for
human review before those assets become approved production references.
The owner selected full-batch review, not agent acceptance with exceptions only.

Keep review consolidated at the deliverable's batch scope. Collect requested
corrections into a revision batch and preserve successful asset versions. Lookdev
approval establishes the approach; it does not approve unseen generated assets.
Validated supplied completed work continues to follow D19. Independent preparation
and dummy previs can continue without using unapproved assets as final references.

### D25 — Explicit approval dropdowns tied to asset and shot versions

Every asset and shot must have an explicit review-status dropdown. Approval is
tied to the specific version, so the director and crew can identify which version
is approved and which work needs revision in the next batch. Approval can change;
it is not an irreversible lock.

Keep the approved version visible alongside the version being reviewed. Creating
a newer version must not silently approve it or erase the earlier decision.
Record status changes against the relevant version and retain decision history.
Batch review remains the operating model: explicit item/version status does not
require progressing through a one-item-at-a-time wizard.

Proposed labels are Pending review, Approved, and Needs revision. Detailed bulk
controls and revision-queue mechanics are described as proposals in the matrix.

### D27 — Scene boundaries, segment-count lookdev, and director overrides

Scene boundaries follow changes in time/location. A montage may have ten such
changes in ten seconds; these boundaries do not warrant ten lookdev tests.

Default: a scene requiring more than three generation segments gets one
representative lookdev segment. Four or more triggers this default; exactly
three does not. The threshold is based on the planned generation segments, not
elapsed seconds, shot count, or number of retry/version jobs.

The director can choose fewer lookdevs, including one for the entire picture.
Make the selected coverage explicit and apply it to batch planning. The agent
must not enforce the default scene tests after the director chooses reduced
coverage, or reduce coverage itself without that choice. Required lookdev still
needs human approval under D23; coverage choice and approval are distinct.

A suitable approved test segment counts toward production. This rule replaces
D26's duration-threshold interpretation and does not remove asset lookdev,
full-asset-batch review, or asset/shot version approval.

### D28 — Approve the proposed revision batch once before execution

The crew prepares the complete revision batch, proposes the repair methods and
estimated total cost, and obtains one human approval before running it. The owner
selected batch approval instead of automatic execution within a revision budget.

The reviewable plan identifies affected asset/shot versions, correction intent,
repair routes, proposed prompts/references, and scope. The director can adjust
the plan before release. After approval, the crew runs eligible work concurrently
within the approved scope, without per-job confirmation.

Approval to execute does not approve the generated results. New versions retain
their own review status and history under D25. Existing lookdev and approved-asset
requirements still apply. Detailed estimate/retry allowances remain design work;
the crew must not infer unlimited revisions from one batch approval.

### D29 — Proceed autonomously through delivery; flag working decisions

The owner is going remote and instructed: "keep working, and flag the decisions
you make so that I may approve or change when I return, but make the decisions
and proceed until the project end."

This authorizes progressing from the documented workflow into UX, implementation,
validation, and delivery without waiting at the earlier development checkpoints.
Unresolved design choices become explicitly flagged working decisions, not claimed
owner approvals. Record them in WORKING_DECISIONS.md with rationale and change impact.
The owner can approve or revise them on return.

This development delegation preserves the application's human production gates:
lookdev, generated asset/version review, and revision-batch release remain enforced.
It does not authorize arbitrary billable film-generation tests or destructive
replacement of legacy projects. Use simulated provider jobs for paid-path tests
unless the owner has authorized the particular production spend.

## Superseded proposals

### D26 — Earlier duration-threshold interpretation, replaced by D27

The owner selected a threshold rather than testing every scene. The assistant
recorded that as a duration in seconds/minutes still to be supplied. The owner
clarified the actual threshold: more than three generation segments by default,
with the director able to reduce lookdev coverage. No numeric duration is pending.

### S05 — Default lookdev for every scene

The assistant proposed one lookdev segment for every scene in a film/episode.
The owner instead selected a threshold, subsequently clarified as more than
three generation segments with director overrides (D27).

### S04 — Agent-only technical lookdev release

The assistant proposed automatically releasing authorized production after the
agent passed technical lookdev. The owner corrected this: lookdev is for human
review. D23 replaces that proposed authority policy; technical purpose and human
approval are compatible requirements.

### S01 — Assistant incorrectly imposed one pilot for an entire deliverable

After the owner said one segment was sufficient to test the technical setup,
the assistant incorrectly recorded that as a project-wide limit and rejection
of all scene-level testing and duration thresholds. The owner corrected this:
long projects need scene lookdev because scenes introduce new error points.
D12 now reflects that clarification. The earlier assistant suggestion of a
specific threshold (scenes requiring more than one generation) was never approved.
D27 later explicitly authorizes one lookdev for the entire picture as a director
choice; it remains different from imposing that as the universal default.

### S02 — Per-scene creative proof as the purpose of video lookdev

The assistant described checking each scene's creative treatment, performance,
camera, pacing, and cut behavior before release. The owner corrected the purpose:
validate the shared technical prompt/style setup and refine the batch approach.

### S03 — Individual steps as the default unit of agent operation

The first pipeline emphasized progressing individual shots/scenes through stages.
D09 replaces that emphasis with deliverable-wide preparation and production
batches. Dependencies still exist, but the crew manages them.

## Working decisions under delegated authority

The complete stage/gate map, representative asset acceptance criteria, exact
pilot selection and pass criteria, prompt-review interaction, autonomy limits,
revision-batch mechanics, finishing scope, and delivery requirements remain open.
See PIPELINE.md and WORKING_DECISIONS.md. Under D29 the agent chooses and proceeds,
flagging those choices for later owner review rather than blocking development.
