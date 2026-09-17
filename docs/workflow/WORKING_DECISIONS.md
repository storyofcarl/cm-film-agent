# Working decisions for owner review

Authority: D29, 2026-09-16. These are agent choices, not owner-approved requirements.
Proceed with implementation; keep each choice visible and changeable. Confirmed
D01–D25 and D27–D28 take precedence. D26 is superseded.

| ID | Working decision | Reason / change impact | Review status |
| --- | --- | --- | --- |
| WD01 | Add a separate `apps/studio` web application in this repository; keep the existing app at the root. Reuse infrastructure through explicit imports/adapters. | Preserves legacy routes and workflows; deployment uses a separate project/root. Changing layout affects build/deployment, not creative records. | Pending owner review |
| WD02 | Shared nested thumbnail strip at the top of the project workspace, to the right of the full-height left sidebar and above the view content and inspector. Preserve hierarchy and shot selection across views; open a shot to direct it. Keep dedicated Assets, Batches, and History views. | Owner corrected page-dependent placement and clarified that the strip is inside the project, not above its left navigation, on 2026-09-17. D08 supersedes the separate Hierarchy page and bottom-only shot strip. | Placement confirmed by owner; remaining layout open to review |
| WD03 | Review dropdown labels: Pending review, Approved, Needs revision. Store immutable decision events with version ID and a separately selected version per use. | Makes approval unambiguous while preserving old selections and audit history. Labels can change without changing semantics. | Pending owner review |
| WD04 | Human approves complete scene assemblies and final delivery. Optional boards/previs require approval when explicitly chosen as authoritative production guides; exploratory candidates can remain unselected. | Prevents approved individual shots from automatically approving bad joins/timing. Guide requirement applies only to routes using the guide. | Pending owner review |
| WD05 | Present compiled prompts, models, inputs and estimated cost for one initial production-batch release; reuse that authorization only within its scope. Revision batches retain D28's explicit approval. | Keeps spending concrete and reviewable; does not add per-job prompts. Unknown costs remain unknown. | Pending owner review |
| WD06 | No automatic paid retries after ambiguous submission. Recover by provider ID; definitive failures can be included in a newly approved repair plan. | Avoids duplicate charges and unbounded retry spend. Can later add explicit retry allowances to approved plans. | Pending owner review |
| WD07 | Lookdev selection favors a representative planned segment using the actual scene setup. Repeat lookdev when model/task mode or shared prompt/style/reference approach materially changes; isolated shot corrections use normal review. Respect director coverage overrides. | Tests shared approach without multiplying pilots. Repeat triggers remain inspectable and editable. | Pending owner review |
| WD08 | Default to picture-led timing unless supplied master audio is explicitly selected. Preserve verbatim dialogue; master-audio mode uses measured media duration and supplied/derived timing evidence. | Avoids imposing a universal audio-first workflow. Switching timing mode flags affected planning. | Pending owner review |
| WD09 | Accept usable imported media with unknown original prompt/seed, explicitly labeled unknown. Block only operations requiring that missing information; do not invent history. | Allows real project intake; same-prompt/seed finishing cannot claim unavailable provenance. Stricter project compliance can be configured later. | Pending owner review |
| WD10 | Method defaults are visible per stage, with batch/item overrides. Preserve Film Agent and owner-supplied alternatives; choosing a new default affects future work only. | Retains valuable methods and makes experiments traceable without reprocessing accepted work. | Pending owner review |
| WD11 | Delivery includes a reviewable edit, supported video export, and a portable project/shot manifest with prompts, versions, source ranges and approvals. Dedicated professional editorial interchange and advanced audio mastering are explicit extensions if not yet supported. | Ensures a useful complete handoff without claiming an unimplemented finishing capability. Any export limitation must be visible. | Pending owner review |
| WD12 | Use isolated studio tables and storage namespaces in the existing Supabase project; reuse approved authentication identities. Deploy separately from the legacy preview. | Avoids overwriting legacy data and makes removal/revision straightforward. | Pending owner review |
| WD13 | When a provider rate cannot be verified automatically, require a recorded total estimate and its basis before releasing the batch. Never display an unknown cost as zero. | Preserves meaningful cost approval; automatic quotes can replace manual estimates later. | Pending owner review |
| WD14 | Imported manifests cannot carry executable jobs or asserted human approvals into a new production. Validate copied media and attribute intake approval to the agent; retain supplied claims separately. | Supports completed-work intake while preventing forged jobs or approval records. Creative completeness checks remain distinct from technical media checks. | Pending owner review |
| WD15 | Use server-owned execution claims and compare-and-swap project revisions. Uncertain submissions stay visible and are recovered through provider task records without automatic resubmission. | Prevents double charges from refreshes and protects concurrent director edits. | Pending owner review |
| WD16 | Vendor the six supplied method packages as versioned text resources, retaining original references; save their content hash and exact compiled instructions with each crew artifact. | Makes method selection reproducible and preserves original Film Agent alternatives. | Pending owner review |
| WD17 | Process up to four ready jobs concurrently per scheduler pass; continue already-approved work through the protected scheduler, including dependent continuations. | Batch scope remains the complete deliverable while hosted request time and provider concurrency stay bounded. | Pending owner review |
| WD18 | Provide hosted scene/picture renders up to 180 seconds or 30 shots, plus an editorial manifest, OTIO timeline, media links and local renderer for longer productions. | Makes feature-length work deliverable without claiming a serverless request can render an entire feature. Local rendering and editorial interchange require dedicated validation before release. | Pending owner review |
| WD19 | Treat extracted burst designs as candidates. Promote a chosen frame to an asset version, then use its explicit approval dropdown. Storyboard/previs guides have their own review and selection controls. | Preserves source-video/frame/prompt provenance and prevents exploratory designs from becoming approved references implicitly. | Pending owner review |
| WD20 | Separate deployment `cm-film-agent-studio`, same authorized team, root `apps/studio`. | Owner explicitly approved Vercel on 2026-09-17 after the destination-specific request. Hosted preview, allowlisted environment, authentication/media checks and separate private scheduler are complete. Legacy deployment remains separate. | Vercel deployment approved and verified |

## Development verification policy

### Additional release choices

| ID | Working decision | Reason / change impact | Review status |
| --- | --- | --- | --- |
| WD21 | WaveSpeed standard video upscale is the default finish; Pro can be chosen in request controls. Supported same-prompt/seed V2V is a separate option. | Upscale works with unknown seeds and avoids asserting unsupported reproducibility. Published rates are estimates with a source/date. | Pending owner review |
| WD22 | Scene review renders a separate 480-class assembly before scene approval; delivery renders use finishing dimensions. Scene approval can also follow an external editorial review. | Avoids requiring approval before the director can watch the edit. Review renders cannot be accidentally approved as final deliveries. | Pending owner review |
| WD23 | One repair target per asset/shot per revision batch: selected flagged version first, otherwise latest unresolved flagged version. Keep older flags/recipes. Allow per-version repair-method overrides within a mixed batch. | Prevents historical corrections being combined into one replacement. Select an older flagged version to repair it next. | Pending owner review |
| WD24 | Use a 24-item searchable review grid with status filters. Preparation and approval scope remain the complete deliverable batch. | Keeps long productions responsive without loading every video preview at once. Page size is reversible. | Pending owner review |
| WD25 | Pause stops remaining submissions without cancelling tasks already running. Closing an unconfirmed attempt requires a human provider-check record; another attempt needs a newly approved batch. | Provides operational control without silent paid retries. Pending claims have a five-minute grace period. | Pending owner review |
| WD26 | Applied crew proposals can update future shot/asset intent, with source-signature conflict checks. They cannot rewrite historical media recipes, approvals or selections. | Makes prompt revision actionable across the production while preserving history. | Pending owner review |
| WD27 | Private-preview finishing includes picture assembly, source audio, JSON/OTIO and local long-film rendering. DAW, advanced grading, captions/titles, speech timing, team roles and automatic legacy conversion remain extensions. | Keeps the release boundary honest while retaining professional downstream interchange. | Pending owner review |
| WD28 | Rotate scheduler project pages and batch selection; condition manual recovery closure on the exact database state read. | Prevents blocked/older work from starving ready productions and prevents a late successful result being overwritten by manual closure. No additional credentials or database migration are needed. | Pending owner review |
| WD29 | Persistent Properties inspector for the selected film/episode, act, sequence, scene, shot or asset. Container runtime is derived from shots; direction accumulates down the hierarchy. Asset references inherit from the nearest explicit parent selection, and an empty explicit selection means none. Existing unconfigured projects retain all-project-asset defaults. | Implements D30 while keeping authored intent separate from actual version recipes. Changing shared direction or references invalidates affected prepared work; it never buys new generations or rewrites approved media. | Inheritance defaults pending owner review |
| WD30 | Chat is the default wide workspace and stays docked beside manual views. Automatic routing chooses up to three available craft methods before preparing a reply; exact routing and method sources are retained. Proposals update preparation or prepare a batch, never auto-approve media/spend. | Implements D31–D32. Film Agent methods and the bundled OCC methodology remain available; this does not claim arbitrary OCC CLI commands are executable Studio tools. | Layout and routing details pending owner review |
| WD31 | Use project-local readable codes (PRJ, ACT, SEQ, SC, SH, AST, SEG, BAT, JOB) backed by unchanged internal IDs. Allocate codes once and retain counters through saves. | Gives the director and crew stable references without renumbering objects after edits. Version numbers remain scoped to their asset/shot. | Prefix conventions pending owner review |
| WD32 | Mixed uploads enter a project inbox with stable IN codes before assignment. Preserve originals, extracted text, technical checks, warnings and links to assigned versions/guides. PDF/Word/text documents are limited to 20 MB and 500,000 extracted characters; media retains the 500 MB limit. | Supports upload-first crew direction without guessing that a file is already approved or requiring per-object forms. Failed files remain visible, and successful files survive a mixed selection containing errors. Scanned/unreadable text is flagged instead of silently accepted. | Limits and presentation pending owner review |
| WD33 | Prepare a provisional 68-second Last Light pilot with two scenes, five shots and three assets; verify four-plus-one segments under a 15-second planning profile. | Provides concrete material for the real director-reviewed pilot without claiming creative acceptance, current provider pricing or spend authorization. Existing user material can replace it. See pilot/PILOT_REVIEW.md. | Material, profile and creative choices pending owner review |

Use deterministic local fixtures and mocked provider executions to verify paid
paths. Real provider submission requires an approved production batch and actual
cost authorization. Read-only connectivity checks and preview inspection are fine.
Do not represent fixtures as real generated production media. Keep deployment
credentials server-side and out of logs, docs, fixtures, browser bundles and Git.

## Owner corrections to working choices

### WD51 — Notes and learnings are versioned project documents

Under D51, add note/learning purposes in Production docs, with inline manual
creation and normal document version/review controls. Reuse stable document IDs,
append-only revisions, source prompts and portable import history. Notes capture
direction, constraints and decisions; learnings capture observations, supporting
shot/version/job IDs, limits and untested hypotheses. Chat receives these records
on subsequent tasks, including purpose, authorship origin and review status; long
current/approved versions use the existing required-source reads. Agent-created
learnings remain pending, and imports retain supplied approval only as provenance.
No note or learning grants media, lookdev or spending approval. Unsent composition
is kept per project during navigation. This is project-local knowledge; a shared
cross-project knowledge library is not implied. No new approval gate is imposed on
production solely because a note or learning is pending.

### WD50 — Full-length synthetic scale fixture

Extend the private-record/browser check with an optional two-hour production:
1,200 six-second shots across 60 scenes, 12 sequences and three acts; four retained
version recipes per shot; and 40 full screenplay drafts. Verify exact prompts,
seeds, stable shot records, all strip entries, last-shot version access, script
revision append, immutable snapshots and portable export. Versions have no
generated media and remain unapproved. Shared scene prompt blocks exercise record
deduplication; this does not represent thousands of unique provider outputs or
prove the 480 MB capacity ceiling, playback performance or creative quality.
Use only disposable accounts, delete their test records and make no provider calls.

### WD49 — Reset inspection context at project boundaries

Project creation, manifest import and manual project switching share one activation
path. Reset the selected shot/version, inspected document, review note and parent
scope; open the new project's root grid and immediately add it to the project
picker. Chat begins with the new project as context, without IDs from the previous
project. Keep unsent chat drafts per project and document edits per immutable
document ID so switching back restores them. Initial account loading preserves
any work-area navigation already chosen while data was loading. This is a
correctness choice under D29, not a change to approval or execution authority.

### WD48 — Explicit manual shot destination and consistent grid scope

Manual shot creation shows its destination scene. Preselect the currently viewed
scene; when opening a placeholder from a broader scope, require a scene choice
instead of silently using the last scene in the project. Saving opens the created
shot. Grid Add/Edit actions use the container whose contents are shown, including
when returning from a shot to its scene grid. Loading or creating a project opens
the root grid with matching parent scope. Empty containers remain accessible
through their parent grids even before the all-shot strip can represent them.
This is a correctness fix under D29/D46/D49, not a new generation approval gate.

### WD47 — Plan and assemble large preparation outputs

Under D29, extend saved chat tasks with an ordered whole-project output plan.
Require coverage of all existing scene IDs before execution, retain exact section
outputs and reread them through the source index for continuity. Append sections
with the same document key into one draft; preserve metadata and revision lineage.
Combine proposal collections while rejecting repeated definitions, conflicting
updates and repeated project-setting proposals. No proposal or document is
published until all declared parts finish. Applying intent still requires the
existing human action; media, scene and spending approvals are unchanged.

Completed provider calls use WD43 replay, so interruption/cancellation does not
buy the same part again. Malformed parts pause with completed calls retained.
Portable import retains the descriptive part plan and complete requests/responses
without importing executable tasks or approvals. A single document remains capped
at 500,000 characters, with an explicit error rather than truncation. The model
chooses valid creative boundaries; structural checks do not prove creative
completeness, source fidelity or final quality. This remains a working choice for
director review and real-production validation.

### WD46 — Left work-area menu and restored metadata

Implement D49 by removing the hierarchy tree and its standalone Add scene link.
Use strip labels or center grids to navigate/create hierarchy contents. Beneath
the project title, show type, scene count, shot count and summed planned runtime
in small text. These field choices are an implementation interpretation of the
request to restore project details; the status/action cluster stays removed.

### WD45 — Compact range labels and empty trailing slots

Implement D48 with two 14px range rows, short act/sequence names and full names on
hover. The demo has 34 illustrated shots across 10 scenes, six sequences and three
acts, preserving the original first six shots for version review. No real project
or provider generation is changed. Empty trailing slots fill available width and
open the normal shot creation form; they have no IDs, duration or approval and do
not become records until saved. Use the current scene when adding; where no scene
exists, open scene creation first. Header ring/add/edit controls are removed.
Manual container creation/editing lives with the center grid. These exact compact
labels, dimensions and placeholder interactions remain owner-reviewable choices.

### WD44 — Continuous strip, default grids and phase summary

Implement D46 with 96px shot thumbnails and 54px images, colored scene groups,
sticky range labels, edge-disabled pan arrows and wheel/trackpad panning. Keep
all project shots mounted while the center changes. Scene grids edit shot titles
and runtime together; act/sequence grids edit their immediate children's titles.
Version histories and approvals remain untouched by those edits. Rare container
properties are available through Edit rather than taking over the default grid.
This replaces WD42's corner/up navigation and WD39's changing strip scope.

For D47, use read-only approval checkboxes with green/amber/red/gray outlines for
approved/review/revision/not-started. Phase names open the relevant review area.
Latest script drafts, selected asset versions, recorded previs guides, exact
scene approvals and current whole-picture delivery determine the markers. Empty
optional phases remain Not started and introduce no new production gate. Previs
guides are independent records: approving another guide for the same shot does
not silently approve an earlier unreviewed guide. These aggregation rules and
exact sizing are implementation choices for owner review.

### WD43 — Persist and resume chat tasks across requests

Save the instruction and frozen project context before model execution. Store
each exact provider request/result in a server-owned journal and lease the task
atomically. One new provider call runs per worker request; completed calls replay
from saved results. Browser and scheduler workers can resume the same task, so
the Studio path is no longer limited to twelve study passes. Publish the complete
proposal/document only after its required source coverage succeeds.

Stop cancels further work; an already submitted call may finish and retain its
result without publishing a proposal. An uncertain submitted call or changed
replay input pauses for attention rather than buying a duplicate response.
Imported manifests cannot inject executable task journals. The conversation stays
available for another request while tasks run. There is no automatic paid retry
for attention states. Tests use mocks; real creative quality remains unverified.
Full-deliverable output partitioning, record lifecycle and scale validation remain
open. This is a working engineering choice under D29, not a new approval policy.

### WD42 — Implement D45 without another center sidebar

Navigation superseded by D46/WD44; retained here as implementation history.

Use 112-pixel-wide thumbnails with an ID/runtime caption. Container drill-down
buttons sit at the lower-right of the image; the up button stays before the
scrolling thumbnail row and is disabled at the project root. Selection and
drilling are separate actions. The project title and project status stay fixed
above the row. Container runtime is the sum of its descendant shots.

Move manual object controls into the main content flow below the viewer; preserve
version-bound prompts, references and settings. No middle sidebar or strip
dropdown remains. Browser checks cover every hierarchy level, selection without
drilling, a stable project title, compact thumbnail dimensions, below-image
controls, persistent chat, version switching and narrow-screen navigation.

The navigation behavior is owner-directed (D45). Exact sizing and spacing are
working choices for review, not a claim of final UX acceptance.

### WD41 — Immutable text records and multipart project transport

Externalize text values of at least 2 KB into private content-addressed records in
the separate studio-records bucket. Project snapshots keep exact hash references;
unchanged text and unchanged large-record chunks are reused. Loaders verify every
record's size and digest before reconstructing the original text. Inline legacy
Studio snapshots remain readable and migrate only on their next authorized save.
The legacy application and its media bucket are unchanged.

The bucket has no direct-client read/write policies. Server operations remain
owner-scoped; imports get one-time-path upload tickets only for temporary parts.
Project responses above 2 MB return expiring private download descriptors, with
integrity checks in the browser. Large JSON imports upload directly to storage in
parts, then enter the same existing validation/approval flow. Browser exports
contain full text, not internal storage pointers. Storage objects are at most
4 MB so they work within the configured Supabase limit; no text is truncated.

Validation uses a 15,525,873-byte synthetic project with 40 full document versions.
Browser import/load/reload/export, an appended V41, retained original snapshots,
exact text, denied direct record overwrites, cross-owner isolation and stale-write
rejection are checked without provider generation. Ordinary Studio regression
also exercises the unchanged claim/approval workflow with retained prompt records.

Remaining limits are explicit: the operational object index is capped at 12 MB,
the current client/server still reconstructs the whole project in memory, project
state is capped at 480 MB and multipart imports/transfers at 500 MB. The large
fixture proves 15.5 MB behavior, not capacity at those upper bounds. Orphan-record
and expired-transfer garbage collection remains unimplemented; do not delete
anything that retained snapshots reference. Multi-user roles and a normalized,
paged workspace are not newly claimed. This is a delegated choice for owner review.

### WD40 — Indexed source access for large reasoning requests

When the existing complete context exceeds 650,000 characters, retain the full
production inventory and replace long text values with exact source descriptors.
Each descriptor records a content hash, total length and lossless text-part ranges.
The agent may request up to eight parts per read. These are transport parts, not
creative segments, rewritten scenes or generation boundaries. No source is deleted
or silently truncated. Scope remains the full deliverable regardless of selection.

Before saving a preparation proposal, document or next-step action, require source
coverage for current creative intent, current and most recent approved writing,
inspected drafts and inspected/selected recipes. Earlier versions and conversation
remain available by their indexed records. Ordinary discussion can inspect only
the sources relevant to its question. Coverage proves data access, not comprehension,
creative completeness or human approval. All existing human gates remain intact.

Retain successful studies' exact requests, responses and per-call usage, and show
their source-read history beside the reply and resulting document's provenance.
Export/import retains that history as supplied provenance without active approvals.
Method routing receives a supplied-work inventory count rather than duplicating
excerpts from every imported artifact before the actual source study begins.

Working limits: 12 reasoning passes, 48,000-character source parts, 40,000-character
working notes and a 220-second pre-call deadline check. The existing provider call
timeout can extend a running call beyond that check. A failed/over-limit study
does not apply incomplete output. Resumable background preparation, full-deliverable
output partitioning and scalable retained-history storage remain incomplete.
The 12 MB project-store cap still applies and may reject a large audit; saved data
is unchanged. Do not describe this increment as complete feature-film capacity.

This is a delegated implementation choice pending owner review. Tests use mocked
reasoning responses and synthetic source records; no paid model-quality claim is made.

### WD39 — Select an object without replacing the strip scope

The strip's level and title selectors control its displayed scope. Clicking an
act, sequence or scene thumbnail selects that object and opens its central
workspace/properties; it does not drill into the object or replace its siblings.
Changing the level follows the selected object's branch. Container selections
have the same visible selected state as shots and persist across workspace tabs.
The scope's Edit action opens inline Properties instead of a separate modal,
including the existing position-among-siblings control.
Shot thumbnails show the selected production version number beside runtime and
review state; the detailed version selector continues to control inspection.

This implements the proposed selection/scope distinction as a delegated working
choice, pending owner review. It does not imply approval of the overall design.
Browser checks cover non-first scene selection, branch-aware level changes,
selection across file views, inline edits and desktop/mobile layout.

### WD38 — Portable document identity and explicit scale limits

Preserve document family codes, explicit version numbers (including gaps), revision
parents and full recorded prompts when importing a Studio project. Remap internal
IDs into the new project while retaining source identifiers and declared statuses
in a visible Import history. A subsequent import preserves the earlier import
trail. Current approvals remain pending; supplied claims are not human decisions
in the new production. Reject conflicting identifiers, family codes, numbering or
parentage rather than silently changing the history.

Unnumbered legacy root records receive an available version number without
overwriting an explicit supplied number. This compatibility choice is reviewable.
The original file remains the source of record if an ambiguous import is rejected.

Scale audit: chat currently rejects a request above 650,000 combined prompt and
instruction characters. Selecting a scene does not narrow that complete context,
and there is no archive control that resolves this. Remove the misleading error
advice. Preserve all data on rejection and record the limitation. Large-project
context retrieval and whole-deliverable partitioning are the next engineering
priority; the limit is not an acceptable final definition of film support.

### WD37 — Reuse existing representative assets in human lookdev

Under the owner's reuse and supplied-work requirements, asset lookdev now retains
an existing selected usable representative version, or the latest usable version
when none is selected. It does not fall back from a selected Needs revision version
to an older accepted design. Generate only missing representatives. Store reused
version IDs, media and recorded prompt/model/seed separately from new provider jobs.

A batch containing only existing versions is a review with zero new generation
jobs and zero generation cost. It still requires the human lookdev action, and
does not approve individual asset versions or the full asset batch. Mixed batches
retain normal cost approval for their new jobs. Changes to a reused version,
selection, asset direction/type or global setup invalidate its review; rejecting
a reused look after approval blocks remaining asset work until lookdev is reviewed
again. Original unknown provenance stays unknown.

This is a delegated implementation choice for review. Local domain tests and an
authenticated browser check use synthetic uploads; no real lookdev acceptance is
claimed. Deliverable-wide preparation was also rechecked: incidental scene
selection does not reduce an episode's production batch.

Chat now receives current batch/job states, recorded estimates, effective spend
approval, blockers, reused lookdev version IDs, and scene/lookdev review state.
Historical review records are distinguished from a still-valid current approval.
Scene lookdev counts are labeled unprepared until segment planning exists.
Completed historical jobs use summaries; active/failed preparation keeps its
request available for diagnosis. This context does not grant execution authority.

### WD36 — Writing deliverables have versioned homes and chat context

Under D29, save actual writing deliverables returned by chat as separate pending
documents in Scripts or Production docs. Keep ordinary conversation in chat, and
link each filed document back to its exact source reply, prompt, method and model.
Each family receives a stable DOC code. Manual and generated revisions append;
review dropdowns apply only to the inspected version. Branching from an older
version retains that parent and advances the family version number.

Keep full text editable in the center, with a version dropdown, original-upload
link where available, recorded-text download, and source provenance. Unsaved text
survives changing sections. Chat receives the inspected saved version and any
current unsaved edits as distinct context; sending never saves or approves them.
Malformed model document output remains recoverable alongside its filing warning.
Portable imports retain document families and prompt history as explicitly supplied,
unverified provenance while resetting active approvals and removing proposals/jobs.

This is a delegated working choice, not owner acceptance. Mocked generation tests
and authenticated browser checks verify the mechanics without paid model calls.
The strip proposal shown in conversation remains for owner review; neither that
proposal nor these checks establish final UX acceptance.

### WD35 — One scope module and separate project actions

Following D44, combine scope selection, metadata, progress and thumbnail navigation
in one module. Use a level dropdown plus a selector showing the current object's
stable code/title once; show runtime, shot count, location/time where relevant.
Scope progress follows the selected container: scene scope counts selected shot
approvals and separately states scene approval; broader scopes count approved
scenes. Project-wide jobs are explicitly labeled in the detail view. Browsing an
older version does not change these production-selection counts.

Move Export project and Production overview to the left bar. Replace the old
Scene workspace/Review all shots tab row with a compact center view toggle; its
shot grid follows the strip scope. Keep the strip persistent on file/library views
and preserve chat and selection. These presentation choices remain open to owner
review. The repeated standalone header is superseded, not accepted as finished.

### WD34 — Chat receives the inspected version separately from production selection

Under D29, extend D42's version-bound mechanics to chat. Send the currently
inspected version ID as context, resolve its recorded recipe server-side, and
include that object's historical versions for comparison. Browsing or messaging
about an older take never changes production selection, approval or execution.
Retain the inspected ID with the conversation so later replies can distinguish
which take was discussed. Invalid/mismatched IDs fail before paid routing.
File areas are also supplied as context; their location never implies approval.
Selection remains context for a potentially multi-task request, not a task lock.
This is an implementation choice for owner review. Visual/audio inspection is
still limited to explicitly supplied evidence; a recorded URL alone is not proof
that the model has seen or heard its content.

D37–D40 supersede WD30's default wide chat layout: a chat-only right sidebar starts
expanded and can collapse to a permanent rail. It cannot be removed. Manual controls belong in the center; the left bar has a
simple open/closed toggle. D36 rejects breadcrumb navigation in the strip. The
replacement uses direct level controls based on the earlier description, following
the owner's instruction that it was already described. Owner review remains needed;
do not treat passing checks as creative/interaction acceptance.

## Review on return

Give the owner the working preview, implementation/validation status, this decision
list, and any unsupported capabilities. Owner changes supersede these choices;
retain the history rather than rewriting who approved what.
