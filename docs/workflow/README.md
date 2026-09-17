# Film Agent workflow redesign

This folder is the working record for the new director-and-crew workflow.
It was created on 2026-09-16 from the design discussion with the project owner.

## Documents

- [DECISIONS.md](DECISIONS.md): confirmed decisions, corrections, and superseded proposals.
- [METHODOLOGY.md](METHODOLOGY.md): current operating rules derived from those decisions.
- [PIPELINE.md](PIPELINE.md): proposed production pipeline, open questions, and the design work plan.
- [WORKFLOW_MATRIX.md](WORKFLOW_MATRIX.md): reviewable stage inputs/outputs,
  dependencies, proposed gates/authority, intake evidence, objects, and change rules.
- [BUILD_PLAN.md](BUILD_PLAN.md): phased delivery plan for the separate new application.
- [WORKING_DECISIONS.md](WORKING_DECISIONS.md): delegated choices awaiting owner review,
  with rationale and change impact; development proceeds under D29.
- [SKILL_CATALOG.md](SKILL_CATALOG.md): reviewed owner-supplied writing, direction,
  shot-planning, and burst-video methods, with integration adaptations.

## Authority and status

Actual build/verification progress is in [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md).
The owner approved the separate Vercel destination on 2026-09-17; the approved
scope is recorded in [DEPLOYMENT_APPROVAL.md](DEPLOYMENT_APPROVAL.md).

The owner's latest explicit instructions take precedence. Confirmed decisions
are distinct from proposals; describing a pipeline here does not mean every
stage or gate has been approved.

The owner authorized autonomous development through delivery (D29). The workflow
matrix is the implementation baseline; unresolved details are working decisions
flagged for later review. Product approval gates remain requirements. Documents
describe intended behavior; implementation status is tracked in BUILD_PLAN.md.

The earlier IMPLEMENTATION.md and DEPLOYMENT.md describe the existing application,
not the agreed design of its replacement workflow.

## Maintenance

After each substantive design exchange, update the decision log and reconcile
the methodology and pipeline. Retain corrections as superseded entries so an old
proposal cannot silently return as a requirement. Keep unresolved items explicit.

Reference material: `D:\agentWork\one click generation\METHODOLOGY.md` (OCC).
It was read as production experience and design input. It was not modified or
adopted wholesale. Current owner decisions override conflicting OCC practices.

Do not store credentials or private generated media in this folder.
