# Working production methodology

Design baseline: 2026-09-16. See DECISIONS.md for authority and corrections.
This describes the intended workflow, not capabilities already implemented.

## Direct the crew through persistent conversation

Chat is the primary workspace. Start with a concept or upload existing work and
describe what is complete, what should be preserved and what remains. The crew
inventories the production, chooses appropriate available craft methods, and guides
the next meaningful creative decisions. It prepares actionable writing, hierarchy,
asset, settings and batch proposals; the director can inspect and refine them in
chat or use the manual views. Human media and cost gates continue to apply.

The conversation stays with the project and remains available beside manual views.
Established defaults live in project settings. Method provenance stays in history,
with an advanced override available rather than a method selector in ordinary chat.
Use stable object codes when referring to scenes, shots and assets. The top strip
can scope itself to the project, act, sequence or scene without changing object
identity. The status snapshot reports current scene approvals and opens details.

Long prompts need an expanded reading/editing surface. Version inspection must
show recorded references and the full source segments, including the trim ranges
used for a shot. Missing provenance remains explicitly unknown.

## Work at the deliverable's scope

An assignment to produce a scene, episode, or film creates a batch at that scope.
The agent organizes complete preparation and production runs. Character work,
location work, prompt authoring, and other independent tasks proceed concurrently.
Dependencies are handled by the crew; the director should not need to advance
each item manually. Individual tools remain directly accessible.

## Enter from existing work

Intake inventories material at every stage: creative development, scripts,
direction, shot lists, assets, boards, previs, generated shots, approved scenes,
and finished material. Match each element to the work and scope it satisfies.
Validate completeness and consistency against the project requirements and
actual downstream needs. Mark passing work approved and skip its creation.

Proposed intake results are: approved from supplied work, partial with named gaps,
missing, conflicting/needs a decision, and not applicable. These are proposed UI
labels; the confirmed behavior is agent validation, approval, and skipping.
Retain the original, validation evidence, source/version, and approval attribution.
Do not fabricate missing historical prompts or settings for imported media.

Plan the remaining batch from this inventory. Fill or repair only the gaps;
do not rewrite complete material to match an internal template. A supplied script
does not force a new screenplay-development run, and a supplied shot list need
not wait for a newly authored Director's Vision. Check their real dependencies.
Revalidate affected dependents when source material changes, preserving the
history of prior approvals and successful work.

Approval is scoped: a finished screenplay does not itself prove a technical
video setup. Supplied lookdev can satisfy that check when it demonstrates the
applicable setup and carries prior human approval. An unreviewed imported test
still needs human lookdev review. Subjective suggestions for improvement should not automatically
turn otherwise complete director-supplied work into a compulsory rewrite.

## Use the owner's writing and direction methods

Screenplay Studio supplies concept/foundation/drafting methods; Analyzer diagnoses
existing writing; Doctor repairs identified issues while protecting what works.
Director's Vision supplies creative direction and explicit constraints; Shot
Format turns direction/source into structured shot coverage and timing.
These are selectable methods or ways to fill missing work, not a mandatory chain.
Retain overlapping Film Agent methods as alternatives within the new application.
Expose the method choice at the relevant task/stage; the agent can recommend and
the director can override. The chosen method follows the common batch and gate
contract. Selecting a method does not require running all alternatives.
Record the method and recipe version with outputs and generation provenance.
See SKILL_CATALOG.md for the reviewed sources and necessary adaptations.

Preserve chosen creative intent, writing style, production style, and exact locks
as distinct information. Proposed mappings should expose conflicts between them
instead of silently blending or overwriting the director's decisions.
The source writing engine carries scene continuity state: retain genuine writing
dependencies while batching independent analysis, planning, and production work.

## Separate creative structure from generation

Creative structure:

`Film / Episode → Act → Sequence → Scene → Shot`

Scene boundaries follow changes in time/location. Preserve those boundaries even
in a rapid montage; scene identity alone does not trigger a lookdev test.

Assets supply reusable or deliberately controlled elements. Segments translate
the creative material into requests that a chosen model can execute. A segment
may cover several shots; a long shot may require several segments. Do not model
segments as a mandatory parent between scenes and shots.

Shot intent, generated takes, and the ranges selected for the edit need distinct
records. The exact data schema is a later design task.

## Prepare comprehensively before broad spend

Establish the source, intended creative direction, model choices, timing approach,
and reusable material across the batch. The agent may propose or produce missing
inputs, while surfacing creative additions and respecting actual hard gates.

Use the existing Film Agent prompt and tool capabilities as reusable operations.
Do not preserve hidden UI sequencing as if it were a necessary production rule.

## Use selective representative checks

The draft pipeline retains one representative character and one location before
full asset production. Their acceptance criteria still need agreement.

Before broad video generation, use one technical pilot segment for the setup
being validated.
Its purpose is to prove the shared prompt setup, global style block, reference
assembly, and technical approach, and reveal whether that approach needs
refinement before applying it to the remaining work that shares that setup.

Default to one representative lookdev segment for a scene requiring more than
three planned generation segments. Four or more qualifies; exactly three does
not. Time/location changes in a montage do not themselves trigger tests. Count
production segments, not seconds, shots, retry jobs, or versions.

The director may reduce coverage, including one lookdev for the entire picture.
Record and honor that choice in the batch plan. A single test need not prove every
scene setup to be a valid director-selected coverage policy. The agent cannot
reduce coverage on its own or silently restore the default after an override.

Organize these scene checks as a batch and run independent checks concurrently.
Their technical purpose does not remove human review: the director reviews the
lookdev results and approves the setup before dependent production is released.
The agent supplies checks, findings, and recommended refinements; it cannot
substitute its own pass for the director's approval. Representative character
and location lookdev also require human approval. The more-than-three-segments
default and director override are confirmed D27; repeat-test triggers remain open.
Coverage choice is separate from approval of the selected lookdev results.

If a pilot reveals a problem, correct the affected setup before releasing the
work that depends on it, then present the corrected lookdev for human approval.
Exact pass criteria remain open. Batch spending authorization alone does not
clear lookdev. Independent preparation and cleared work continue during review.
An approved pilot should be reused when it is suitable production material;
low-resolution material follows the scene-approved finishing paths below.

## Review the complete generated asset batch

After human approval of representative character/location lookdev, generate the
remaining asset batch and present it together for human review. Those new assets
must be approved before they become production references. An agent conformity
check helps review but cannot replace it with exceptions-only reporting.

Collect requested corrections into a revision batch; preserve successful asset
versions. Keep independent preparation and dummy previs moving where they do
not require unapproved final references. Validated supplied completed work follows
the existing intake rule. Lookdev approval and completed-asset approval are
separate gates.

## Optional visual preparation and previs

The director/crew can choose direct generation, storyboards, production frames,
or dummy-character previs according to the work. These are available branches,
not universal prerequisites.

For dummy previs, use faceless, color-coded figures with the characters' silhouettes.
Maintain the color-to-character mapping so production conversion can replace the
correct figures with the approved asset references. Use this route to establish
blocking, action, camera, and scene timing while character designs remain pending
or when appearance details would distract from scene work.

Use the previs clip directly as a production video reference with the approved
asset references when the selected model supports it. Track the source clip,
mapping, references, and resulting production version. Previs approval and final
appearance review are distinct; final character approval is not a gate on starting
dummy previs.

## Burst boards and character/location bursts

Offer video-generated still bursts alongside conventional storyboard and asset
image methods. For boards, extract the useful frames and map them to the intended
story beats or shots. For character/location exploration, request up to 20 designs
in one five-second burst, extract candidates, and map them to the planned roster
or locations. Usable designs may become references or reusable assets after the
applicable review; generating a candidate alone does not establish approval.

Batch burst jobs across the deliverable, sharing the intended style and required
context. Preserve the video, exact prompt, extraction timestamps, and links to
the selected frames. Check actual frame coverage, separability, and identities;
repair missing or unusable results without treating an incomplete burst as complete.

A burst frame number is not automatically a project shot identifier. A rapid
five-second board/design burst is not a final scene-duration previs or a normal
production segment. Shot Format's separate "Burst" paragraph format also must
not be confused with this video method.

## Compile for the selected model

Keep model-specific prompt formats, reference semantics, task modes, audio
behavior, duration limits, and continuation mechanisms in explicit profiles.
Verify provider capabilities when implementing them; OCC observations are useful
evidence, not universal or permanently current API specifications.

Pack segments toward the model's maximum duration while preserving sentences
and complete actions. Prefer cut boundaries. A long-shot continuation needs
explicit continuity inputs rather than an assumption that a new generation
remembers the previous one.

When a shot is shorter than the minimum, prompt a deliberate head or tail and
trim it afterward. Do not confuse billable generated time with final edit time.
An action that cannot fit the chosen model creates a planning conflict to resolve,
not permission to silently split or omit it.

## Preserve successful work

Review and revise at shot level. Keep successful source media and its selected
ranges. A correction can require a new segment request, but it must not force
regeneration of neighboring shots that already work.

Run the resulting revision jobs as a batch. Changes affecting a continuation
join should make that dependency visible rather than silently replacing it.

Expose three revision routes:

| Route | Intended use and tradeoff |
| --- | --- |
| Frame-based revision | Extract one or more frames, edit them, and use the revised frames to guide the affected shot. A lower-cost, more predictable approach for changes that can be specified visually in frames. |
| Video edit | Send the source video and a targeted edit instruction. Useful for adding/removing elements and clear single-task changes; potentially easier, but more expensive and less predictable. |
| Full clip rerun | Generate another take of the affected shot/clip using the same prompt or a revised prompt. Preserve the earlier take and successful neighbors. |

The agent proposes routes, prompts, scope, and estimated total cost for the whole
revision batch. The director approves that plan once before execution (D28), and
the crew then runs eligible jobs without per-item confirmation. New results still
require version review; approval to run does not approve the output. These
tradeoffs are the owner's production guidance, not a
universal pricing guarantee across providers. Frame extraction/editing alone is
not a finished video revision: the resulting video must still be generated or
edited, assembled, and reviewed.

## Shot history and provenance

Every shot version retains its prompts and its relationship to earlier versions
for compliance, comparison, reuse, and learning. Preserve the approved take while
new candidates are generated; selection of a new version must not erase history.

Proposed version-record fields for the data design:

- Shot, segment/job, version, and parent/source-version identifiers.
- Revision method, instruction, and the requested change.
- Exact compiled prompt, resolved global style block, and template/profile version.
- Provider/model, seed requested and returned when available, resolution, duration,
  aspect ratio, and other effective generation settings.
- Ordered references and their asset versions; source clip ranges and extracted
  frame timestamps where applicable.
- Generated media, chosen edit ranges, execution status, timestamps, and cost
  information where available.
- Author/agent attribution, review notes, acceptance decisions, and selected take.

This field list is proposed implementation detail. Tracking shot versions and
their actual prompts is confirmed. Retention, access, and audit-export requirements
still need definition. Stored provenance supports traceability; it must not be
presented as a guarantee that repeating an API request reproduces identical output.

## Explicit review status and the next revision batch

Every asset and shot has a review-status dropdown tied to its specific version.
Show which version is currently approved and which version is being reviewed.
Approval can be changed; retain who changed it, when, and the previous decision.
A new version does not inherit approval automatically.

Proposed labels: Pending review, Approved, Needs revision. The next revision batch
is assembled from explicit Needs revision records and their correction notes,
with the source versions retained. A status change plans work; it does not itself
submit a paid generation. Batch review/bulk actions must still record the exact
status of each affected version. Detailed controls remain UX design work.

Keep review state separate from job state and from selected edit/reference usage.
New candidates must not silently replace an approved source. Scene approval is
still a separate assembly decision before resolution finishing.

## Scene approval and resolution finishing

Normally generate and revise at a low supported resolution until the scene is
approved. Do not automatically spend on a full-resolution version of every draft.

For approved scenes, choose and batch one of the finishing routes:

- Upscale the selected material using an appropriate tool.
- Use the approved low-resolution clip as a V2V reference and generate a 1080p,
  2K, or 4K version using the same prompt and seed, where supported.

Preserve the actual draft prompt and seed for the second route; do not silently
substitute a newer global prompt or invent a seed that was never recorded.
Unsupported target resolutions, V2V modes, or seed controls must be visible.
The exact tool selection and exception handling remain open design decisions.

Link finished results to their approved sources as new versions. Review a
generative finish for changed content, timing, and continuity before selecting it
for delivery. Approval of one scene can make it eligible for the finishing batch
without requiring that every scene in the film be finished first.

## Navigate the production through a nested strip

Thumbnail navigation runs from the full deliverable through acts, sequences,
scenes, and shots. The strip is shared at the top of every project view, above
the workspace content and inspector, to the right of the full-height project
sidebar. It never sits above the project navigation. Changing views preserves its hierarchy context
and shot selection. Higher levels inform executable work. Segment relationships
and job state must remain accessible from the relevant creative context.

Treat the selected shot, scene, sequence, act or film/episode as a persistent
object with properties. Runtime, asset references, prompts and direction belong
to that object; each screen exposes different properties or actions for it.
Changing screens preserves the selected context. Derived aggregate values and
immutable version recipes remain distinct from editable creative intent.

The Properties inspector exposes film/episode, act, sequence, scene, shot and asset
records from the same selection. Shared direction is included in descendant
requests. Reference scope can inherit or explicitly override its parent, including
an empty reference selection; source-version approval gates still apply. Container
runtime is derived from its shots rather than an independently drifting value.
These inheritance defaults are WD29 and remain open to owner revision.

## OCC principles to retain in the pipeline draft

- Preserve dialogue and lyrics verbatim; surface deliberate source adaptations.
- Audit source coverage and timing before rendering.
- Inspect the actual compiled production requests before paid execution.
- Make every stateless segment carry the staging it needs.
- Use measured timing when a master audio track defines the deliverable.
- Reuse successful work and diagnose failures instead of blindly rebuying them.
- Verify deliverables and distinguish complete delivery from a partial preview.

These principles inform the draft. Their exact enforcement and approval rules
still need alignment. In particular, the OCC rule to retry a failed segment once
must not be transferred to ambiguous submissions where a paid job may already
exist; job recovery and a new generation are different operations.
