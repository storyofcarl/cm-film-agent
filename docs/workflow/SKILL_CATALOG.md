# Owner-supplied creative and production methods

Initial review: 2026-09-16. The following source inventory began as design work.
As of 2026-09-17 the six supplied packages are bundled in Studio alongside original
Film Agent prompt templates. Automatic crew routing chooses relevant methods;
advanced overrides remain available. No paid generation was run during review.
All six supplied `.skill` files are ZIP packages. Their main `SKILL.md` files
were read. Additional Studio references read: `foundation-process.md`,
`execution-engine.md`, and `coherence-specificity-gate.md`.
Other bundled references/scripts are inventoried, not fully audited or executed.

## Sources and roles

The owner's OCC `METHODOLOGY.md` is also bundled as `occ-production`, with a
source hash retained for each use. It supplies reference discipline, staging,
source fidelity and model-specific prompt assembly. Original OCC CLI commands
are not thereby installed as callable Studio tools; the Studio contract and
verified provider adapters govern execution. Automatic routing is recorded with
the resulting method sources and full conversation request in crew history.

All paths below are relative to:
`D:\Google Drive\My Drive\AI Tools\Claude Skills\`

| Package path | Main archive member | Role in Film Agent |
| --- | --- | --- |
| `screenplay-studio-2.skill` | `SKILL.md` | Concept, outline, treatment, or draft into foundation and screenplay work; persistent creative intent, style, scene briefs, continuity, and quality checks. Also supports individual targeted methods. |
| `screenplay-analyzer-2.skill` | `SKILL.md` | Diagnose existing writing: length, register, specificity, character, setup/payoff, tension, plot, and scene/genre. Produce prioritized issues mapped to Doctor categories; does not rewrite. |
| `screenplay-doctor-2.skill` | `SKILL.md` | Repair diagnosed or director-named problems; preserve strengths and deliberate choices; verify fixes, including length where relevant. |
| `directors-vision\v3\directors-vision-3.skill` | `directors-vision-3/SKILL.md` | Directorial playbook: visual thesis, world rules, references, palette, pacing, intensity, motifs, character/location direction, and per-beat intent. |
| `Shot Format\v4\shot-format-4.skill` | `shot-format-4/SKILL.md` | Structured shot array with coverage, timing, direction conformance, references, technical notation, prompt paragraphs, storyboard spreadsheet, and readable shot list. |
| `burst-board-video\burst-board-video.skill` | `burst-board-video/SKILL.md` | Author prompts for five-second video bursts of static compositions; adapt to storyboard, character, and location modes. |

## Intake and authority

The owner may supply any of these outputs already completed, including equivalents
created outside these skills. Analyze the work against applicable requirements;
approve complete work and skip its creation. Preserve the source and record the
validation scope and evidence. Only missing or deficient parts enter the work batch.

## Retain overlapping methods

The supplied skills expand the available methods; they do not displace overlapping
Film Agent capabilities. Keep existing Film Agent writing/planning, shot authoring,
Compose/Direct/Enrich, storyboard/keyframe, and other useful methods selectable
where relevant. The source-backed inventory below distinguishes alternatives
from complementary operations; similar names alone do not prove equivalence.

Proposed selection behavior: project defaults with task/batch overrides, an agent
recommendation, and a visible director choice. Defaults and precise UI remain open.
No requirement to run alternatives for comparison unless requested. Record the
chosen method and version with each output. Both method families use the new
workflow's common data, gates, batch execution, and version history.

## Existing Film Agent method inventory

Inspected 2026-09-16 in the current worktree. This is a capability/contract review,
not proof that the functions can be transplanted unchanged or that every route
works with every provider. Links identify the implementation files; function
names identify the exact operations reviewed.

| Work | Existing method and source | Inputs → outputs | Relationship to supplied methods |
| --- | --- | --- | --- |
| Brief development | `writeFilmPrompt`, `normalizeBrief` in [storyboard.js](../../utils/film/core/storyboard.js) | Idea/source plus expansion depth → cinematic narrative; brief → screenplay-formatted source, with passthrough for recognized screenplay headings | Keep lightweight Film Agent development alongside Studio's fuller writing system. Formatting/normalization is not full screenplay development or approval. |
| Shot planning | `storyboardCarve`, `storyboardAuthor`, `uncoveredScriptLines` in [storyboard.js](../../utils/film/core/storyboard.js) | Source, style, references → source spans/shot intentions; per-span authoring → shot material with dialogue checking | Selectable alternative to Shot Format for shot authoring. Preserve coverage and source fidelity in the common contract. |
| Shot direction and prompting | `composeShotAction`, `directShotAction`, `enrichShotAction` in [storyboard.js](../../utils/film/core/storyboard.js) | Text, image roster, optional keyframes/camera locks, direction note or detail level → action/audio prompt material | Retain local tools alongside Director's Vision and Shot Format; local prompt edits complement a project playbook rather than replacing its full scope. |
| Model-duration splitting | `splitIntoShots` in [storyboard.js](../../utils/film/core/storyboard.js) | Long text and optional count goal → duration-constrained text segments | Reuse segmentation ideas under the new segment contract; do not inherit the legacy conflation of shots and segments. |
| Visual inspiration | `planPrompts`, `inspiration` in [operations.js](../../utils/film/core/operations.js) | Idea and optional references → planned image prompts and generated image candidates | Keep image exploration alongside video-burst exploration. Neither becomes a universal mandatory preparation step. |
| Cast and world | `castFromIdea`, `castDraftFromParsed` in [storyboard.js](../../utils/film/core/storyboard.js) | Brief/reference art or parsed roster → character face/body, creature, prop, and location plates | Keep individual image plate generation alongside character/location bursts. Planning a roster and producing final reference plates are separable tasks in the new batch system. |
| Asset variants | `characterVariations`, `locationVariations` in [operations.js](../../utils/film/core/operations.js) | Source image and direction → planned edits and variant images | Keep controlled variants; a burst of new designs is not automatically an equivalent identity-preserving variation operation. |
| Storyboards and guide frames | `storyboardQuickPage`, `storyboardSheet`, `storyboardKeyframe` in [storyboard.js](../../utils/film/core/storyboard.js) | Script or shot material, style and references → board sheet or individual frame images | Selectable image-based route alongside Burst Board Video; Shot Format can provide the shot data for either route. |
| Frame preparation and revision | `maskFrame`, `enhanceStill`, frame-edit modes of `storyboardKeyframe` in [storyboard.js](../../utils/film/core/storyboard.js) | Source frame plus mask/edit/annotation/context → revised or identity-masked image | Useful operations for the frame-based shot revision and dummy-previs routes; revised stills still need video execution and review. |
| Previs conversion | `previzPlan`, `blockoutStill`, `previzTake`, `beautyTake` in [previz.js](../../utils/film/core/previz.js) | Scene/camera → color map and staging → clay still → motion clip → appearance replacement with references | Retain and extend to the owner's character silhouettes and supported production-reference workflows. Burst boards provide compositions; they are not automatically full motion previs. |
| Intake assistance | `classifyAssets` in [director.js](../../utils/film/core/director.js) | Images, idea and expected roles → classifications and role gaps | Reuse as an intake helper; it does not validate all project artifacts or prove a production stage complete. |

The reviewed Film Agent functions do not establish equivalents to Studio's full
screenplay development system or Analyzer/Doctor's complete diagnostic/repair
suite. Preserve genuine overlapping capabilities without inventing a Film Agent
equivalent for every supplied skill.

### Adapter requirements found in the reviewed code

These are observed legacy behaviors and proposed integration requirements,
not newly agreed product restrictions:

- Several authoring functions slice source inputs at 6,000 or 12,000 characters.
  Long-project methods need complete coverage through scoped work packets and
  reconciliation; silent truncation must not count as processing a whole film.
- `splitIntoShots` caps its result at 24 segments and clamps duration using the
  default video model. New segmentation must use the selected model, preserve
  long shots across segments, and plan padding/trims explicitly.
- Cast rendering slices its roster to eight entries; variations have small local
  count caps. Keep useful per-request limits while scheduling the complete roster
  across the deliverable batch, with no omitted remainder.
- Cast planning currently proceeds directly into rendering. Separate planning,
  representative checks, and batch release so selecting the method does not
  bypass spending gates. Its generated `locked` flag is not an approval record.
- Cast body plates depend on face plates, but the reviewed renderer can continue
  after a failed face attempt with no source URL. The new scheduler must enforce
  that actual prerequisite before body generation.
- Compose treats approved keyframes as authority over conflicting text events
  and returns dropped-event notes. The new workflow must make source authority
  explicit and respect director locks; selecting Compose must not silently
  decide an unresolved script-versus-frame conflict.
- Previs currently hardcodes 480p/1080p, a six-color palette, and a five-image
  beauty-pass limit. Those are implementation settings to reconcile with verified
  provider capabilities and the chosen cast/reference mapping, not universal rules.
- Prompt overrides in [promptTemplates.js](../../utils/film/promptTemplates.js)
  live in browser local storage. Preserve editable recipes while adding durable
  method/template versions and exact compiled prompts to job/version history.
- `classifyAssets` falls back to a role when classification is uncertain. Intake
  approval needs explicit evidence and cannot treat such fallback labels as proof.
- The legacy router describes brief-first/card-selected actions and per-action
  confirmation. Keep its useful task vocabulary; the new batch planner supplies
  orchestration and authority instead of adopting that interaction sequence.

These boundaries retain both method families inside the separate new application
while keeping legacy workflows isolated, as agreed in D14 and D22.

## Skill policy adaptation

The source skills' default human stops are not automatically new product gates.
The owner's instructions on batch operation and approval of supplied work take
precedence. Unresolved creative choices still need an explicit authority policy
in the workflow contract; existing choices must not be reopened by default.
Lookdev is explicitly human-approved under D23, regardless of which method
produces it. No skill's automation mode may bypass that production gate.

## Writing suite adaptation

Studio has foundation, execution, and evaluation layers. Its foundation includes
spine, creative intent/style, premise, theme, opposition, characters, world/tone,
structure, and scenes, followed by coherence/specificity validation. Its writing
engine assembles focused scene briefs from persistent state, checks quality per
scene, and reconciles the assembled script. Analyzer diagnoses craft; Doctor
executes targeted repairs. Studio's optional Review Panel simulates reception
and is advisory/read-only, not a production approval authority.

Integration requirements and proposals:

- Adapt foundation human checkpoints to the agreed autonomy and supplied-work
  rules; do not force an imported completed script through fresh foundation choices.
- Preserve project-specific intent and deliberate structural/style choices.
  Numeric page/act defaults must be scoped to the format and agreed target;
  screenplay page estimates do not replace measured production audio/timing.
- Batch independent diagnostics and preparation. Writing tasks that consume prior
  scene state have genuine dependencies; do not promise arbitrary concurrent drafting.
- Rename Studio's review mode called "Segment" to sequence/act review in product
  terminology. It does not mean a model-constrained Film Agent segment.
- Keep diagnostic findings separate from edits and from stage completeness.
  A subjective improvement suggestion does not automatically mandate a rewrite.
- The foundation reference names `character-architecture.md`, which is absent
  from this archive; the main skill points instead to the included
  `template-3-character-development.md`. Resolve that reference during packaging.

## Direction and shot planning adaptation

Director's Vision establishes creative intent and passes reference identities,
intensity/functions, typed transitions, and `[LOCK]` versus `[TASTE]` directives
to Shot Format. Shot Format authors a structured shot array, checks coverage and
runtime, and derives several presentation formats from that array.

Integration requirements and proposals:

- Both methods are optional; supplied direction/shot lists may already satisfy
  their role. Preserve exact locks, source dialogue, and director-selected choices.
- Map canonical character/location keys across these methods and the asset roster.
  Proposed stable internal shot IDs should remain distinct from display numbering.
- Preserve transition timing semantics: picture overlap changes assembled runtime;
  an audio offset alone does not necessarily change picture runtime.
- Shot Format's short-shot/model-duration guidance must not eliminate long shots
  spanning Film Agent segments. Enforce current model limits at compilation.
- Scene-sized authoring and repair tasks operate inside the deliverable-wide batch;
  they do not require the director to advance each scene manually.
- Select prompt/reference conventions through model adapters. Do not universally
  impose exhaustive character redescription, fixed character limits, or one
  model's reference notation on every provider.
- Shot Format's "Burst" prompt-paragraph output is a different concept from
  Burst Board Video's rapid sequence of still compositions.
- File export conventions in the source skills are output adapters, not mandatory
  internal app formats. Audit bundled coverage scripts before adopting them.

## Burst Board Video adaptation

The supplied skill authors self-contained prompt blocks for exactly 20 static
compositions in a five-second burst. It supports per-scene and whole-piece board
organization. It uses a shared style block, cast descriptions, numbered shots,
English labels/dialogue, and compact Chinese visual descriptions. It does not
itself submit provider jobs or extract frames.

The owner's requested product behavior extends this method:

- Storyboard bursts for narrative compositions, plus character and location
  exploration bursts with **up to 20** designs per five-second video.
- The source skill's exact-20 rule must be adapted to the owner's requested count;
  do not silently fill unused entries with invented characters or locations.
- Add provider execution, extraction, frame selection, roster/shot mapping, and
  coverage checks. Validate actual distinct usable outputs rather than assuming
  the requested count was delivered by the model.
- Record source video, exact prompt/settings, extraction timestamps, selected
  frames, and subsequent asset/shot usage. Imported provenance gaps stay explicit.
- Candidate designs are not automatically approved production assets. Reuse the
  relevant approval/check evidence; create assets only when reuse/control calls for it.
- Burst-frame indices are local to the source burst. Map them to project shots or
  design candidates explicitly; one frame is not necessarily one final film shot.
- Preserve the source method's prompt recipes as selectable, versioned recipes;
  verify model suitability before treating language/timing assumptions as universal.

## Review artifact

[WORKFLOW_MATRIX.md](WORKFLOW_MATRIX.md) contains the first draft of stage inputs,
outputs, supplied-work evidence, dependencies, gates, authority, and change rules.
This inventory grounds the available method choices for that review. Detailed
method defaults and approval policy still need owner alignment. Wireframes and
application integration follow that checkpoint.
