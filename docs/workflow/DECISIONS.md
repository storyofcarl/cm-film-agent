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
every project view and must not depend on the current page. It sits inside the
project workspace, to the right of the full-height left sidebar, never above
the project navigation. Keep its hierarchy
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

### D30 — Project objects own properties; screens edit the same objects

Confirmed by the owner on 2026-09-17: shots, scenes, sequences, acts and the
film/episode are persistent objects with properties such as runtime, specific
asset references, prompts and creative direction. Screens expose and manipulate
these properties; they do not define separate page-specific production objects.
The project strip chooses the creative context, which persists across screens.
Keep authored intent distinct from derived values (such as aggregate runtime)
and immutable historical version recipes. The selected container's properties
must be directly inspectable, not only represented by its descendant shots.

### D31 — Crew conversation is the primary workflow

Confirmed 2026-09-17. Persistent crew chat is the primary way to direct production.
Manual sections remain available for inspection, approvals and precise edits.
Chat is present while using those sections, not hidden behind a temporary command
form. The crew chooses appropriate available methods/tools from the request and
production state; ordinary conversation does not require selecting a method.
Keep method provenance in history and an advanced override for optional methods.
Established model/job defaults belong in project settings, not chat controls.

### D32 — Start from a concept or supplied completed work

The crew guides concept-only work through writing, direction, typed asset planning,
job preparation and the agreed review gates, with the user directing creative
choices. Alternatively upload completed elements, have the crew inventory and
validate them, and use conversation to fill the gaps. Do not recreate complete work
or require the user to build every object manually. Proposals must be actionable
and inspectable; chat does not bypass generation costs or human approval gates.

### D33 — Direct access to long prompts, references and source segments

Prompts can exceed 3,500 characters. Provide a usable expanded reading/editing
surface. Show versions, the references actually used, full generated source
segments and the ranges used by each shot. A trimmed shot and its original segment
are distinct. Never replace missing historical references with current selections.

### D34 — Typed assets, stable IDs and reusable scoped strip

The crew must recognize characters, locations, props and other asset types using
the Film Agent craft prompts and the OCC methodology/tools as applicable. Retain
the agreed reuse/design-control rule. The strip is one component scoped to the
project, act, sequence or scene. Scenes, shots, assets and other production objects
need stable identifiers shared by chat, manual views, prompts and job records;
renaming or reordering does not change their identity.

### D35 — Clickable production status snapshot

Show a compact project status indicator, such as a ring meter, with the number of
internally approved scenes (for example four of six). Clicking reveals detailed
scene and production status. Derive the count from approvals of current selected
versions, not obsolete approvals or the mere existence of generated footage.

### D36 — Strip interaction rejected; level-view module required

The owner rejected the deployed strip's breadcrumb-driven interaction. The strip
must be a module for viewing the production at different levels. Placement and
navigation tests do not establish acceptance of that interaction. The owner's
initial correction ended at "it should be". The owner subsequently stated that
the strip was already described; proceed from the existing requirement for
project/act/sequence/scene levels and nested thumbnails down to shots. The revised
implementation uses direct level controls instead of breadcrumbs; the owner has
not yet accepted the rendered replacement.

### D37 — Persistent chat must not consume the workspace

The owner clarified that chat should not take up the entire workspace. Keep the
project work visible alongside the persistent conversation. Opening crew chat,
uploading supplied work or selecting the Crew tab must not hide the work area.
The prior default full-width chat interpretation is superseded.

### D38 — Simple left toggle, chat-only right bar, manual center

The left bar has two states: open and closed to icons. Do not add extra sidebar
features or turn this into a more elaborate nesting design. The right sidebar is
open by default unless closed and is dedicated to persistent crew chat. Chat is
the primary way to direct the work. All asset, shot and scene options belong in
the center, where the director can inspect and manually tweak assets and footage.
The right bar must not switch from conversation to object controls.

### D39 — Plain chat labels; no single-task directing banner

Use concise controls such as Chat, Message and Send. Remove repeated "crew"
wording and the "Directing [selected object]" banner. A conversation can direct
multiple tasks; selecting an object in the center must not present the chat as
locked to that object. Selection remains useful contextual data, not a task boundary.

### D40 — Chat collapses; it is never removed

The owner clarified D38: chat is the core control, so its right sidebar cannot
disappear. It starts expanded and may collapse to a narrow persistent rail with
an expand control. Preserve conversation and draft state. There is no remove-chat
action or need to reopen chat from the center.

The owner explicitly states that this UX is nowhere near final. These changes are
iterations on a working draft; neither the overall design nor the replacement
strip interaction has been accepted as finished.

### D41 — Header and project actions sit above the strip (presentation superseded by D44)

The owner identified the scene/context heading as a header, not a shot artifact.
It belongs above the persistent project strip. Export project, production overview,
and the project approval meter stay at that level. Project views do not display
an unrelated shot inspector. The strip groups level controls and the current-scope
selector on the left, Add/Edit on the right, then the thumbnail row. This grouping
is a working design choice for owner review, not an accepted final design.

### D42 — Shot mechanics are directly visible and version-bound

The center displays the selected shot and its mechanics without a Details toggle
or a required modal. One Reviewing version dropdown changes the footage, exact
prompt, approval, recorded references and original source segment together. Source
settings come from historical requests, including duration, resolution, ratio and
audio where recorded; unknown values stay unknown. Editable intent remains separate
from immutable generation history. Optional large prompt expansion remains available.

### D43 — Files have contextual homes and upload icons

The owner requested Assets, Footage, Scripts, Production docs and Audio as the
normal upload locations, with an upload icon in chat. These areas share the existing
project originals and assignment records. Uploading within an area preserves that
area; chat uploads use media type or an obvious screenplay filename as a default.
Filename-based document routing is a working choice, not creative validation or
approval. Footage also exposes the project's shot versions. Existing file ownership,
retention, extraction and approval requirements remain in force.

### D44 — Consolidate the scope information into the strip module

The owner rejected the stacked header, tabs and strip and asked how all relevant
information could live in the module itself. The module must carry its own scope
identity, metadata, status and thumbnails. Shot mechanics remain in the center.
WD35 records the implementation choices made under delegated authority. They are
a working iteration, not an owner-approved final interaction. D44 replaces D41's
presentation; the distinction between project actions and shot artifacts remains.

## Superseded proposals and interpretations

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
