# Working decisions for owner review

Authority: D29, 2026-09-16. These are agent choices, not owner-approved requirements.
Proceed with implementation; keep each choice visible and changeable. Confirmed
D01–D25 and D27–D28 take precedence. D26 is superseded.

| ID | Working decision | Reason / change impact | Review status |
| --- | --- | --- | --- |
| WD01 | Add a separate `apps/studio` web application in this repository; keep the existing app at the root. Reuse infrastructure through explicit imports/adapters. | Preserves legacy routes and workflows; deployment uses a separate project/root. Changing layout affects build/deployment, not creative records. | Pending owner review |
| WD02 | Use a nested thumbnail strip, central scene/shot review viewer, left project navigation, and right director/crew inspector. Include dedicated Assets, Batches, and History views. | Supports whole-project navigation with direct controls and no forced wizard. Layout is reversible without data migration. | Pending owner review |
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
| WD20 | Proposed separate deployment name: `cm-film-agent-studio`, same authorized team, root `apps/studio`. | Automatic approval review rejected project creation/runtime secret upload because prior explicit approvals named the legacy project. No new Vercel project or environment upload has occurred. Complete local work and present the concrete deployment approval; do not bypass this rejection. | Deployment approval required |

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

Use deterministic local fixtures and mocked provider executions to verify paid
paths. Real provider submission requires an approved production batch and actual
cost authorization. Read-only connectivity checks and preview inspection are fine.
Do not represent fixtures as real generated production media. Keep deployment
credentials server-side and out of logs, docs, fixtures, browser bundles and Git.

## Review on return

Give the owner the working preview, implementation/validation status, this decision
list, and any unsupported capabilities. Owner changes supersede these choices;
retain the history rather than rewriting who approved what.
