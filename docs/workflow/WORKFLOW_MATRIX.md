# Production workflow matrix — draft 1

Prepared: 2026-09-16. Status: implementation baseline under D29; flagged working
decisions remain editable by the owner on return.
Confirmed constraints remain in DECISIONS.md (D01–D25, D27–D28; D26 superseded). The detailed checks,
state names, approval assignments, and change rules below are proposals unless
explicitly identified as confirmed. No application behavior has changed.

## How to read this contract

The deliverable determines the work scope: scene, episode, or film. The crew
builds and executes a plan for that whole scope. Rows describe kinds of work and
dependencies, not screens in a wizard. Independent tasks run concurrently; each
task starts when its actual prerequisites and applicable gates are satisfied.

[SKILL_CATALOG.md](SKILL_CATALOG.md) maps the retained Film Agent methods to their
source functions, inputs/outputs, supplied-skill alternatives, and adapter needs.
It identifies complementary tools as well as genuine overlapping methods.

Every row accepts validated existing work. Passing supplied work is marked
approved by the agent and its creation is skipped (confirmed D19). An optional
method can be not applicable; that is different from a failed required task.
The agent creates missing prerequisites within its authority. A hard gate blocks
only the work dependent on it; the rest of the deliverable batch can proceed.

## Work, inputs, and outputs

| ID / work | Required inputs for this work | Crew operation across the deliverable | Output / what satisfies the work |
| --- | --- | --- | --- |
| W01 Intake and remaining-work plan | Deliverable brief plus whatever material exists | Inventory sources, map them to project scope, validate completeness and consistency, record gaps and conflicts, approve complete supplied elements | Approved imported work, scoped validation report, and remaining-work batch; no blanket restart |
| W02 Writing and creative development, when needed | Concept, treatment, outline, script, or identified writing gaps; project intent and format | Use the selected Film Agent or writing-suite method; diagnose and repair only where needed; carry continuity state through dependent writing; parallelize independent analysis/planning | Adequate source material and applicable creative decisions; full screenplay/foundation documents only when the assignment needs them |
| W03 Direction, shot coverage, and timing | Source/scene intentions, supplied direction, deliverable timing constraints | Use selected Film Agent methods, Director's Vision, Shot Format, or supplied equivalents; establish scene/shot intentions, coverage, timing, and relevant locks | Shot plan and enough direction for the selected production route; formal playbook and particular export formats are optional |
| W04 Asset planning and representative checks | Required reusable or deliberately controlled elements, design intent, chosen methods | Plan the complete roster/locations/variants concurrently; run one representative character and one location check where applicable before broad asset spend | Checked asset approach and specifications for the remaining asset batch; supplied designs/checks can satisfy this |
| W05 Asset production | Asset specifications and cleared applicable checks | Generate the full required roster/locations/variants through selected image or burst methods; extract burst candidates and validate identity/coverage | Usable required asset versions/references; one-off elements remain inline unless reuse/control warrants an asset |
| W06 Optional boards, production frames, and previs | Shot/beat intentions and inputs needed by the chosen route | Batch conventional frames, Burst Board Video, or faceless color-coded silhouette previs; map results to shots/characters/locations | Selected guide frames or reusable previs with source links and color-to-character mapping; direct generation can omit this row |
| W07 Segment planning and prompt compilation | Shot intentions/timing; chosen model profile; references required by the route; applicable style/direction | Pack segments near model maximum without splitting sentences/indivisible actions; plan cuts, continuations, minimum-duration padding and trims; resolve inherited settings into complete requests | Executable segment plan, shot-to-segment ranges, compiled prompts/settings/reference versions, dependency graph, and cost estimate where available |
| W08 Technical lookdev | Valid compiled setup, planned scene segment counts, director-selected lookdev coverage, and representative inputs | Default to one test segment for each scene requiring more than three segments; honor reduced coverage, including one for the entire picture; batch independent tests | Human-reviewed technical lookdev and recorded coverage; reuse successful media when appropriate |
| W09 Draft production | Cleared applicable lookdev, executable requests, actual continuation sources as they become available | Run remaining eligible segments for the deliverable at low resolution by default; direct, frame-guided, or previs-to-production routes; map footage to shot ranges | Draft shot versions and scene assemblies with actual generation recipes; usable neighbors retained when part of a result fails |
| W10 Shot review and revision | Draft assembly, selected versions, and consolidated correction notes | Batch frame extraction/edit-guided regeneration, targeted video edits, or full reruns; choose scope and method per correction; compare versions | Updated shot selections and reviewed scene assemblies; earlier versions and successful neighboring footage preserved |
| W11 Resolution finishing | Approved scene assembly and selected source versions | Batch upscale or V2V finishing to supported 1080p/2K/4K targets; for the V2V route reuse the source prompt and seed where supported | Linked high-resolution versions with checked content, timing, and continuity; approved low-resolution sources preserved |
| W12 Final assembly and delivery | Selected finished material, edit/audio requirements, requested delivery specification | Complete agreed sound, edit, visual matching, titles/captions and export tasks; verify all required media and ranges | Verified delivery package; incomplete assemblies are identified as previews, never silently labeled final |

Character/location bursts belong to W04/W05; storyboard bursts belong to W06.
Exploratory burst checks can validate a method before a larger run. That does not
silently replace the agreed representative character/location checks: evidence
must satisfy the same applicable requirement. Exact equivalence is still open.

## Dependencies, gates, and authority

Lookdev requires human approval (confirmed D23). The crew prepares results and
technical findings; the director approves representative asset looks and video/
scene lookdev before dependent batch release. An agent pass or existing batch
spending authorization does not substitute for this approval. Newly generated
asset batches also require consolidated human review before production-reference
use (confirmed D24). Newly generated
scene and final-delivery approval assignments remain proposed as director-owned.
Validated supplied completed work follows D19; imported lookdev must carry prior
human approval or receive human review to satisfy the lookdev gate.
Revision methods and estimated cost are presented for one human batch approval
before execution (D28). Detailed spending/estimate allowances remain open.

| Work | Real dependency / proposed gate | Proposed approval or release | Failure behavior and concurrency |
| --- | --- | --- | --- |
| W01 | Material must be readable, assigned to a scope, and complete for its claimed use; contradictions cannot be silently resolved | Agent approves passing supplied work (confirmed); director resolves material creative conflicts | Preserve originals; create named gap tasks; continue unaffected planning |
| W02 | Enough intent to write the requested missing material; later writing may depend on prior scene state | Crew performs routine craft; director resolves new consequential creative forks | Repair deficient portions; preserve accepted material; batch independent work |
| W03 | Required source coverage, dialogue/action fidelity, and timing must be feasible; unresolved exact locks block conflicting work | Crew checks coverage/timing; director chooses unresolved creative alternatives | Adjust affected plan or request a direction; do not silently omit coverage or alter locks |
| W04 | Applicable representative design/approach checks and human lookdev approval before broad affected asset production | Director approves lookdev (confirmed D23); agent validates applicability of supplied, previously human-approved checks | Revise representative work and present for approval; continue roster, location planning, prompts, and unrelated preparation |
| W05 | Model supports requested operation; required inputs exist; batch spend is authorized; generated assets require human approval before production-reference use | Crew validates results and presents the full asset batch together; director reviews and approves (confirmed D24) | Collect requested corrections into a revision batch; preserve successful versions; independent preparation can continue |
| W06 | Required shot/beat context exists; dummy previs needs silhouette/color mapping, not final character approval | Crew checks coverage/mapping; director review policy for new boards/previs remains open | Preserve useful frames; repair gaps; unrelated work continues |
| W07 | Requests meet model input/duration constraints; required refs resolve; coverage and trims are explicit | Crew validates compilation; compiled-prompt review/spend release policy still open | Block affected requests; propose compatible route or input repair; never hide unsupported controls |
| W08 | Representative request can execute; applicable lookdev requires human approval before dependent broad video spend | Agent supplies results/findings; director approves lookdev (confirmed D23) | Fix failed setup and present again; human-approved scene setups can release dependent work within the authorized deliverable batch; unapproved setups remain gated |
| W09 | Required references and continuation sources actually exist; lookdev and spending gates passed | Crew schedules authorized work and verifies returned media | Failed prerequisites never count as satisfied; recover ambiguous provider jobs before buying a retry; preserve completed work |
| W10 | Usable source media and required inputs; supported method; human approval of the proposed revision batch before execution | Crew proposes methods/prompts/scope and estimated total cost; director approves the batch once (D28); results receive separate version review | Failed candidate never replaces selected successful take; affected joins reviewed; unrelated shots retained |
| W11 | Scene approved (confirmed); target/tool supported; V2V prompt/seed available for the requested same-recipe route | Crew technical checks; approval policy for generative finishing changes remains open | Retain approved draft; surface unavailable seed/control or drift; select another agreed route without inventing provenance |
| W12 | Required edit ranges, audio and output elements exist and meet delivery specification | Crew verifies completeness; proposed director accepts delivery | Report missing pieces and repair only affected exports/material; retain prior delivery versions |

Provider limits and operation availability are verified during implementation;
this matrix does not assert that every connected model supports every route.
Financial authorization is a project/batch policy to define, not a new prompt
for permission on every individual job.

## Batch handoff after lookdev

Human approval of lookdev is confirmed under D23. Human review of the full
generated asset batch before production-reference use is confirmed under D24.
Detailed spending limits and change/revalidation rules remain proposals.

The crew presents the representative media, the setup it used, findings, and the
dependent work that approval would release. Approval applies to that setup and
scope; it does not authorize silently changing the approach or exceeding the
separately agreed spending authority. Once approved, the crew runs the eligible
work together and consolidates review material and exceptions for the director.
There is no separate start confirmation for each item in that released batch.

After representative character/location lookdev is approved, generate the full
remaining asset run and present it for one consolidated review before newly
generated assets become approved production references. The director can accept
the batch and mark exceptions for a revision batch; successful assets need not
be regenerated. This adds a batch-level acceptance point, not a per-asset wizard.

The agent cannot substitute acceptance of matching assets with exceptions-only
review for the selected full-batch human review. Lookdev approval establishes the
approach; it does not approve unseen generated assets.

This policy retains deliverable-wide scheduling, allows independent preparation
to continue, and respects the existing rule that dummy previs can precede final
character approval. Acceptance policy for optional boards and finished scenes
remains a separate question.

## Completion evidence for supplied work

This is a proposed rubric for implementing the confirmed intake rule. The agent
reports passed, partial, conflicting, or unverifiable requirements at the relevant
scope. It does not treat aesthetic preferences as objective completeness defects.

| Supplied element | Check before approving its claimed stage |
| --- | --- |
| Brief, writing, or direction | Fits assigned deliverable; required source/intent is present; conflicting instructions and missing portions identified; preserve deliberate structure/style choices |
| Shot list | Required story/dialogue/action coverage; scene/shot mapping; sufficient intent and feasible timing for the next operation; no requirement to recreate a playbook merely to use the list |
| Assets/references | Correct identity/variant and intended usage; usable media; sufficient reference coverage for the selected route; no extra asset creation for adequate inline one-offs |
| Boards/bursts | Useful extracted compositions/designs actually exist; mappings and coverage are accurate; missing/distorted frames do not count toward completeness |
| Dummy previs | Readable blocking/timing and silhouette/color mapping; source usable for the intended reference route; final character designs need not be approved yet |
| Technical lookdev | Evidence covers the actual model/task mode, compiled setup, style, reference approach, and relevant scene error points; prior human approval applies to that setup, or human review is required; a finished script or unrelated clip does not establish this |
| Shot media/scene assembly | Usable source ranges, intended coverage, timing, joins and audio where required; scope of acceptance clear; historical prompts/settings retained if supplied |
| Finished media/delivery | Required resolution/format/audio/coverage and completeness; matches intended version/assembly; no forced generation of an already finished deliverable |

Unknown historical prompts/seeds remain explicitly unknown. They do not prove
the supplied media is unusable, but can prevent a specific same-prompt/seed V2V
operation. Required compliance metadata and permissible exceptions remain open.
New app-generated versions must retain their actual prompts under D16.

## Objects and states for review

These definitions clarify the contract; they are not a database schema.

| Object | Meaning |
| --- | --- |
| Film/episode, act, sequence, scene | Creative containers supplying scope, order, and direction; scene boundaries follow changes in time/location, including montage changes; the nested thumbnail strip navigates through them to shots |
| Shot | Editorial/creative unit with intent, versions, and selected media ranges; independently revisable |
| Asset | Reusable or deliberately controlled design/reference element with versions; separate from creative containers |
| Segment | Executable model-constrained video unit; may cover multiple shots, while a long shot can cross segments |
| Shot version/take | A candidate realization linked to source media/ranges, generation/edit lineage, prompts and settings; selecting one preserves the others |
| Edit selection | The source ranges and order used in an assembly; distinguishes generated duration, padding, and used duration |
| Batch | Deliverable-scoped work plan or run, including eligible tasks, dependencies, checkpoints, and authorized spend; may release dependent work in waves |
| Task/job | Task describes needed work; job records a concrete execution attempt. Several shots may share a generated source without sharing revision fate |
| Method | Selectable Film Agent or owner-supplied procedure/prompt recipe; distinct from the model/provider used to execute it |
| Validation/approval | Evidence and acceptance for specified work and versions, with actor and scope; not a timeless boolean for the whole project |

Proposed state separation:

- Work completeness: missing, partial, complete, not applicable.
- Validation: unchecked, passed, failed, needs revalidation.
- Review: pending, approved, changes requested; record agent/director and supplied/generated origin.
- Execution: planned, blocked, ready, queued, running, succeeded, failed, canceled,
  or outcome unknown. Outcome unknown calls for job recovery, not an automatic resubmit.

These are separate dimensions: a successful API job is not proof that the result
is complete or approved. A failed new take does not revoke the prior selected take.
Optional skipped work cannot satisfy a real required dependency.

## Explicit asset and shot review

Confirmed D25: every asset and shot has a review-status dropdown tied to the
specific version. Show the version being reviewed and the currently approved
version explicitly; a generic project-level approval badge is insufficient.
Approval remains changeable, with the previous decisions retained in history.

Proposed dropdown labels and behavior:

| Status | Meaning | Next-batch treatment |
| --- | --- | --- |
| Pending review | This version has no acceptance decision yet | Present for review; do not infer approval from generation success or an older version's approval |
| Approved | This particular version is accepted for its stated use | Identify it explicitly for production/assembly; retain its recipe and decision history |
| Needs revision | This version has requested changes | Include the asset/shot, source version, and correction notes in the proposed next revision batch |

Proposed operational details:

- Batch approval and bulk status changes update explicit item/version records.
  Reviewing the entire asset run together does not require a separate click for
  every passing item. Show affected versions and preserve marked exceptions.
- Show a usable approved version separately from a newer candidate under review.
  Selecting or generating that candidate does not transfer approval to it. Track
  which approved version is chosen for a particular reference or edit use.
- Marking an approved version Needs revision changes its current acceptance state
  without deleting its media or historical approval. Show affected downstream uses
  for review; do not silently replace their pinned versions or buy regenerations.
- Needs revision identifies work for planning. Changing the dropdown alone does
  not submit a paid job. The crew consolidates corrections and selects the method
  within the agreed authority when preparing/releasing the next revision batch.
- Missing correction details are surfaced before a repair that would require
  guessing the director's intent. Execution state remains separate from review:
  a queued/running revision is not already an approved result.
- New revision results start Pending review. Preserve the parent/source version,
  exact prompts, method, references, and approval trail. Avoid duplicate revision
  tasks for the same item/version/request when rebuilding the batch plan.
- Validated supplied work receives explicit status/version records too, with agent
  attribution under D19; it does not silently imply human lookdev approval.
- Shot-version approval and scene approval remain distinct: individual accepted
  shots do not by themselves prove that their assembled timing/joins are approved.
  Scene approval continues to gate resolution finishing.

Example: shot SH012 v2 is approved and used in the edit. A new v3 remains Pending
review. If v3 Needs revision, the next batch targets that request without replacing
v2. If the director explicitly marks v2 Needs revision instead, its current status
changes and dependent uses are flagged, while the original media/history remain.

## Change propagation and preservation

Proposed rule: keep prior artifacts and approvals tied to their actual versions.
A change marks relevant dependents for revalidation, not automatic destruction or
paid regeneration. The crew reports what remains usable and prepares the necessary
revision batch. The director can inspect the effect before consequential spend.

| Changed input | Recheck or update | Preserve by default |
| --- | --- | --- |
| Story/dialogue/action/timing | Affected shot coverage, audio timing, segment boundaries, continuations, and assemblies | Unaffected scenes/shots/assets and earlier source versions |
| Global style or model/task profile | Compiled requests and applicable technical lookdev for work adopting the change; assess scope of existing-media mismatch | Historical compiled prompts and media; do not rewrite their recorded recipes |
| Character/location/variant reference | Requests and media that use that version; relevant scene technical setup and continuity | Other assets and footage; no silent retroactive rebinding to the latest asset |
| Local shot prompt or correction | Affected shot versions and joins/continuations that actually depend on them | Successful neighbors, even when generated in the same segment |
| Segment packing/padding | Request duration, shot ranges, cut/continuation points, and affected assembly timing | Creative shot identity and usable media ranges |
| Selected take or edit range | Scene joins/audio/timing, scene approval applicability, finishing inputs and exports | Other shot selections and prior assemblies |
| Board/previs or dummy mapping | Generations using those frames/clips/mappings; production conversion inputs | Unrelated guides and generations |
| Method choice or recipe version | Future work using the choice; explicit rerun scope if requested | Existing outputs and method provenance; no automatic rerun merely because the default changed |
| Delivery format only | Finishing/export capability and affected outputs | Approved content and edit where still compatible |

## Worked case: a film with mixed completed work

1. The director supplies a script, shot list, approved cast references, some location
   designs, one dummy-previs scene, and one completed scene. The agent validates
   each at its actual scope, approves passing work, and identifies only the gaps.
2. Script development and cast generation are omitted where already satisfied.
   The crew batches missing locations, shot-plan gaps, and prompt preparation
   concurrently. The completed scene remains usable without regenerating it.
3. The director selects Film Agent shot-authoring for missing coverage and the
   supplied Burst Board method for selected scene boards. Other scenes can go
   directly to production; no universal board/playbook requirement is created.
4. Required scene technical checks run as a lookdev batch. Each checks one segment
   for its setup. The previs scene can convert using the approved character refs
   on a supporting model. Qualifying supplied evidence with prior human approval
   avoids duplicate tests. The director reviews newly prepared lookdev before the
   crew releases dependent production; technical pass alone does not release it.
5. The crew runs the eligible draft-production batch. Review notes produce a
   revision batch containing frame-based repairs, video edits, and full reruns.
   Successful shots sharing the original source segments remain intact.
6. Approved scenes enter the finishing batch; source prompts/settings and ancestry
   remain visible. Final assembly is checked against the delivery specification.

## Scene-lookdev operating rule

Confirmed D27: default to one human-reviewed lookdev segment for a scene requiring
more than three planned generation segments. Exactly three does not trigger it;
four or more does. Count the planned production segments, not retries, versions,
shots, or seconds. Scene boundaries follow time/location changes; a ten-second
montage with ten such changes does not create ten mandatory lookdevs.

The director can reduce coverage, including choosing one lookdev for the entire
picture. Record the chosen scope so the crew releases work against that policy,
without silently restoring waived default scene tests. The remaining selected
lookdev still requires human approval. Selecting reduced coverage does not itself
approve a test result, assets, or shots. No numeric duration threshold is pending.

Proposed planning detail: derive segment counts from the current model-conforming
production plan and show the count beside each scene's default eligibility.
If repacking changes a count, surface the effect and retain the director's
explicit coverage choice; do not silently add paid tests. Shared segments spanning
scene boundaries need explicit scene-to-segment mapping, not a forced new creative
hierarchy. Selection and repeat-test details below remain proposals.

The agent proposes an existing planned segment that exercises the scene's actual
prompt/style/reference setup, preferably without waiting on an unavailable
continuation. The director can choose another segment. Selection is about checking
the approach applied to the rest of the batch, not demanding proof of every
creative beat. Do not create extra test segments merely for different shots.

Present the generated segment with the actual compiled prompt/global style,
references, model/settings, detected issues, and proposed adjustments. The human
decides whether the setup is ready for the remaining batch. When the result is
usable, count it toward production; do not regenerate it solely because it began
as lookdev. A scene consisting of one segment can use that result as its draft,
while preserving the distinction between lookdev approval and scene approval.

Proposed repeat rule: re-open lookdev when changing the shared technical approach
in a way that makes the prior test inapplicable—for example, switching model/task
mode, materially changing the global style/prompt construction, or changing how
references or previs are supplied. An isolated shot correction using the already
validated approach follows normal version review; it does not automatically
require a new scene pilot. Preserve earlier media and approval evidence, and show
why a proposed change needs a repeat. Exact triggers remain subject to alignment.

## Revision-batch release

Confirmed D28: approve the proposed batch once before running. The version-status
dropdown identifies which work needs revision, and the crew groups those items
into the next deliverable-scoped revision batch.

Prepare the whole repair plan before requesting one batch
approval. For each item, show its source version, requested correction, suggested
route (frame-based repair, video edit, or full rerun), selected tool/model, actual
proposed prompts and references, and affected edit ranges/dependencies. Summarize
estimated cost and any unavailable cost information without presenting unknown
costs as zero. The director can change methods or exclude items before release.

After approval, execute eligible tasks concurrently and preserve successful
neighbors. New results remain Pending review with their own version records.
Budget authority to generate a version never constitutes approval of that version.
Existing human lookdev and asset-reference gates still apply.

Automatic revision execution within a standing budget was not selected. No
additional rerun allowance is inferred from the batch approval. A more expensive
repair or expanded scope outside the approved authority requires a revised plan;
the exact handling of estimates, retries, and spending limits remains design work.

## Decisions still needed before alignment

Discuss these in small rounds, not as a requirement to answer a questionnaire.

1. Remaining approval authority: boards and the scene/delivery approval policy.
   Human approval of lookdev and full generated asset batches is confirmed D23–D24.
2. Pilot selection, pass criteria, and changes requiring a repeat. Default eligibility
   is more than three generation segments, with director-reduced coverage (D27).
3. Initial-production spending/prompt review and estimate/retry allowances.
   Revision-batch execution requires one human approval of the proposed plan (D28).
4. Completion/compliance evidence for imported work and handling of unknown history.
5. Audio-led versus picture-led timing, finishing review, and exact delivery scope.
6. Method defaults/overrides and how inherited direction conflicts are resolved.

The owner delegated remaining choices and authorized proceeding through delivery
(D29). See WORKING_DECISIONS.md for chosen policies and review impact.
