# Director workflow UX audit

Date: 2026-09-17. Basis: current hosted `/demo` at source 39bd577, direct
browser navigation/screenshots at 1280 x 720, component inspection, and the
confirmed workflow. Findings and recommendations, not owner acceptance.

## Assessment

The application has substantial production mechanics, but its sections do not yet
consistently support directing a production. Several screens organize stored
records or expose tool commands without making the director's next decision and
its consequences clear. Passing technical tests does not establish usability.

Keep the agreed shell: open/closed left navigation, persistent all-shot strip,
central work surface, persistent right chat, and phase snapshot below chat.
Do not add a center sidebar, replace chat with a wizard, or hide basic shot
mechanics in dialogs. The work is to improve each section within that shell.

Each section must make these questions answerable:

1. What work am I looking at, and which version is it?
2. What is usable, incomplete, awaiting my decision, or blocked—and why?
3. Can I inspect the material closely enough to judge it?
4. Can I direct changes in chat and make the same changes manually?
5. What will approval release, and what will a change affect?

## Section findings and proposed changes

| Section / task | Evidence and current problem | Proposed behavior |
| --- | --- | --- |
| Start with concept or supplied work | New production collects title/scope/brief. Empty Scripts and Audio show only Files, upload, and No files here yet. UploadInbox retains originals and assignments, but its next step is largely explanatory text telling the user to ask chat. | Once a concept or files arrive, chat organizes an inventory and remaining-work plan. Center shows supplied, validated, partial, and conflicting material with links. Ask only about unresolved intent; skip completed work at its actual scope. Do not require a phase wizard. |
| Chat | Persistent placement is right. Source supports saved tasks, proposals, document links and next-action buttons. Empty state is generic. Large proposals and source-study details occupy the narrow chat column. | Chat directs the work and summarizes decisions; a proposal/review link opens its full working material in the center. Show active tasks and pending decisions compactly; selection is context, never a restriction to one task. Keep tool/method choice automatic with optional overrides. |
| Project strip | All-shot strip and project metadata now match the agreed structure. It shows five complete shot thumbs at the inspected width with both sidebars open. | Retain navigation and small ID/runtime thumbs. Do not turn the strip back into a dashboard. Evaluate label readability and panning with long, populated projects as part of acceptance. |
| Production overview | Counts, global style, development output, guides and delivery controls share one page. Two scene-render entry points exist. Development copy says outputs live here while documents also have their own homes. | Make this the project summary: current state, required decisions, missing work, active batches and relevant cost summary. Link into the working sections. Keep source-of-truth documents in their proper homes; avoid duplicate editing surfaces. |
| Scripts | DocumentCard supplies text editing, version approval and provenance, but it is a generic multiline text field per document. No screenplay reading treatment, scene navigation or revision comparison is supplied by this view. Empty state offers upload but no visible writing guidance. | Make the center useful for reading and editing a script, selecting versions, reviewing changes and discussing a passage with chat. Connect scene/shot coverage back to the relevant writing. Manual authoring and imported work must both be first-class. |
| Production docs / notes / learnings | Notes can be added and versioned. Saved notes, learnings and other documents use the same long-card presentation. No purpose/scope search or prioritization is present in ProjectFiles. | Organize direction, shot plans, decisions, notes and learnings so they can be found without scrolling every document. Show scope and evidence links. Distinguish a director instruction from an observation or hypothesis; make the context the agent will use inspectable and correctable. |
| Assets | The view starts with an empty Files area even when three actual assets exist. The grid shows images, names, versions and review dropdowns, but not asset IDs/types. Selecting an asset appends mechanics below the entire collection. There is no manual multi-select review action in ReviewGrid. | Default to the usable asset collection with type/ID, approved version and review state. Put upload in its toolbar. Open a selected asset as a central detail view with a large preview and mechanics below. Provide full-batch review with explicit version-bound bulk changes and preserved exceptions. Show usage before changing a production reference. |
| Boards / previs / bursts | GuidesPanel is inside Overview; shot guide uploads live in shot controls. The panel provides review, source prompt and use-as-reference actions, but these are dispersed from the shots they guide. | Give guides a clear home within Footage and show the relevant guides on each shot. Support checking coverage, selecting burst frames, and inspecting silhouette/color mappings. Make conversion to production references an explicit reviewable handoff; previs remains optional. |
| Scene / act / sequence contents | Grid is appropriate. At the inspected viewport search, filters, page counts, disabled pagination and actions consume substantial height before the media. Each card repeats multiple form fields. | Keep grids; use a compact toolbar and deliberate bulk-edit/review controls. Scene scope needs an identifiable assembly review and scene approval, alongside shot contents. Container properties should not dominate routine review. |
| Shot | Version dropdown, explicit approval, exact prompt, source/reference display and repair options exist below the viewer. Scene approval, lookdev status and Add shot intervene before shot mechanics. Historical recipe and future direction are separate but surrounded by repeated labels/actions. | Keep one shot viewer with its version/review controls directly below, followed by clear inline groups for recorded recipe, generated segment/source range, references, future intent and revision. Keep long prompts readable inline. Scene-level approval belongs to scene review. Make inspected versus selected-for-edit versions unmistakable. |
| Footage / generated segments | Footage is an upload inbox plus a second shot grid. Individual GenerationDetails can show sources, but there is no useful collection-level source-segment view alongside shot use. | Distinguish footage sources/segments, shot uses and guides in this section. A director should be able to open a generated segment, see which shots/ranges use it and repair one shot while retaining good neighbors. |
| Lookdev | Actual batch code retains samples, outputs, prompts and a human approval gate. Results are nested under job details; the default scene rule is in settings and batch preparation. | Present selected tests together with scope, actual setup, technical findings and what approval releases. One segment per qualifying scene by default, with the agreed coverage override. Keep result approval separate from spending approval. |
| Batches / revisions | Empty page emphasizes a revision panel followed by eight preparation buttons and finishing controls. BatchCard provides estimates, job details, blockers and controls, but cost fields and technical jobs dominate. Approve & queue, Run approved jobs, and Refresh results coexist. | Lead with the proposed whole-deliverable plan: included work, preserved work, dependencies, repair methods, estimated spend and unknowns. One clear approval/release action consistent with the scheduler. Show waiting/running/needs-decision/failed/completed work; retain detailed manual overrides without making the user choose every procedure. |
| Audio | Actual Audio section is an upload/player inbox. Assign-to-object controls exist only for image/video entries. | It does not yet support a professional audio workflow. At minimum show dialogue/music/effects/ambience roles, scope/timing, versions and approval, plus links to their use in the picture. Decide the exact in-app editorial boundary separately; do not imply a full DAW exists. |
| Finishing / delivery | Overview houses render/download buttons and result cards. Hosted rendering is explicitly limited to 180 seconds / 30 shots; longer productions require the package/local path. | Provide a focused delivery working view with specification, readiness, missing requirements, approved draft-to-finish lineage and reviewable outputs. Clearly distinguish a project backup, editorial handoff, review render and final deliverable. No new professional mastering capability is implied by rearranging controls. |
| History | Current view is an event-card list; version recipes live elsewhere. | Search/filter by object ID, version, event and date, with links back to the exact record. Surface what changed, who approved it and affected uses. Preserve full audit detail without requiring the director to read raw execution history. |
| Settings / phase snapshot | Project settings hold defaults in the right place. Snapshot provides approved counts in accessible descriptions but its visible labels are mainly generic status. `projectPhases` has no not-applicable state for optional previs and uses latest script drafts. | Show compact counts directly, e.g. Animation 4/6 scenes. Click into the relevant outstanding review. Represent an intentionally omitted optional phase without implying missing mandatory work. Distinguish a new pending draft from the approved version still in use. Keep defaults and advanced method overrides in settings. |

## Confirmed interaction defects

These are observed defects, separate from the recommended redesign:

- **U01 — Cross-section selection:** select The keeper in Assets, then open
  Footage. The character's manual controls remain under the footage grid.
  `switchTab` changes only the tab. Fix section-appropriate inspection without
  destroying useful per-section drafts or intentional chat context.
- **U02 — New project inherits existing brief:** opening New project from The
  Last Light prepopulates its brief with that film's story. The form uses
  `project?.brief` for both new and settings. A new production should start with
  a blank brief unless explicitly duplicated.
- **U03 — Inconsistent version browsing:** the collection version dropdown
  invokes `version.select`, changing production selection; the single-item
  dropdown only changes inspection. Make browsing and selecting-for-use explicit
  and consistent. The grid currently says Selected version, so this is a risky
  interaction difference, not evidence of a mislabeled approval transfer.
- **U04 — Long import readiness remains unverified:** the most recent hosted
  15.5 MB import test timed out waiting for the Scripts document after its API
  response succeeded. Local test passed. Client activation/navigation timing is
  a hypothesis, not a diagnosis. Resolve and reverify the upload-to-workspace
  handoff before treating the latest hosted import flow as passed.

## Work order and acceptance scenarios

1. Fix U01/U02 and diagnose U04. Specify U03's browse/use behavior before changing
   the shared control. Avoid losing drafts or shifting another active task.
2. Make concept-first and mixed-upload entry useful: a source inventory,
   remaining-work plan, document working surface, and chat-to-center handoff.
3. Improve asset collection/detail and whole-batch review; consolidate guides and
   make generated segment/shot relationships visible.
4. Complete shot/scene review and the revision proposal surface. Keep the three
   repair routes, preserved neighbors and one batch spend approval.
5. Improve finishing/delivery readiness, phase summaries and reusable knowledge
   retrieval. Assess audio capability honestly rather than presenting file storage
   as completed post-production.

Validate with realistic populated fixtures, then director review:

- Begin with a concept, develop writing, inspect/edit a draft and prepare the
  missing production work through chat without choosing an internal method.
- Import a mixed partial production; retain originals, recognize completed work,
  expose conflicts, and continue only the missing work.
- Review a complete asset batch, preserve accepted versions and collect exceptions.
- Review a technical lookdev segment, understand its scope and release the
  dependent work without approving unseen results.
- Watch a scene, inspect an older take without changing the edit, collect mixed
  repair methods into one proposal and approve that proposal once.
- Finish an approved scene and inspect the high-resolution result against its
  source; prepare an honest final delivery or editorial handoff.
- Return to a project and recover notes, task state, decisions and relevant
  learnings without searching through the entire conversation.

## Evidence limits

The live demo contains storyboard fixtures, not playable generated production
media. Chat and batch preparation are disabled there. Populated document, batch,
source and task behaviors above were assessed from their implementation; no paid
generation or real creative conversation was run in this audit. This is a
workflow/design audit, not a claim of end-to-end production acceptance.

No runtime changes were made during the initial audit. Recommendations are logged
under WD53 and remain changeable by the director.

## Implementation follow-up — WD54

The first follow-up fixes U01/U02 and changes U03 to explicit browse/use semantics.
The Assets collection now shows codes/types and filters by type or stable code;
opening an asset replaces the collection with a large preview and inline details.
The empty upload section no longer precedes actual assets. Version browsing in a
collection does not change production selection, and opening details preserves
that candidate. Local browser walkthrough and 127 regression tests pass. These
changes do not complete the full asset-batch review or the broader audit backlog.
U04 remains open; it was not rerun or represented as passing in this increment.
