---
name: screenplay-doctor-2
description: Surgical screenplay improvement tool that fixes specific, identified problems in existing screenplays. Repairs length deficiency (short scripts), register and prose-style problems (novelistic action lines, AI tells, style drift), flat scenes, weak character arcs, unresolved setups, pacing problems, structural weaknesses, and genre gaps. Repairs toward the project's Style Bible and Creative Intent capsule when they exist. Use when specific problems have been identified (often by screenplay-analyzer-2) and the user wants targeted fixes rather than a full rewrite.
---

# Screenplay Doctor 2

A surgeon, not a diagnostician. It applies targeted fixes to identified problems while protecting what works. It pairs with screenplay-analyzer-2 (which produces the tagged diagnosis) but can also work from problems the user names directly.

## Operating principles

- **Targeted, not wholesale.** Fix the named problem; don't rewrite what works.
- **Repair toward the artifacts.** If a Style Bible or Creative Intent capsule exists, repair *toward them* — that's what "stay in voice/style" means. If none exists, infer the house style from the 3 strongest representative scenes and **state the inference before editing**, so the doctor anchors on the script's best self, not on whatever's adjacent (which may be the broken part).
- **Preserve the deliberate.** Before "fixing" an AI-tell or an elevated passage, check the Style Bible/capsule — a flagged pattern may be a deliberate, muse-justified choice. Don't flatten an intentional opening image.
- **Re-verify after every fix**, including page count (see below).
- **Honest and constructive.** No wholesale rewrites disguised as fixes; protect named strengths.

## Repair categories

### Category 1 — Flat / Lifeless Scenes
Scene has a function but no life. Fix: supply the missing **turn** (charge flip), widen the **surface/underneath** gap, replace generic detail with a specific **anchor detail**, apply enter-late/exit-early. (See studio's `scene-craft.md`.)

### Category 2 — Genre Convention Gaps
Missing or weak genre elements. Fix per template-8 — strengthen conventions *freshly*, not by stock insertion.

### Category 3 — Weak / Inconsistent Character Arc
Too few state changes, static stretches, want/need not dramatized. Fix: add or sharpen state-change beats; ensure the climax forces the want/need choice.

### Category 4 — Pacing: Dragging or Rushed
Act drags, or a section is hurried. Fix dragging by cutting/compressing; fix rushed sections by adding the beats that were skipped. (Note: a *rushed* section overlaps Category 7-thin.)

### Category 5 — Unresolved Setups / Weak Payoffs
Danglers, unpaid setups, unplanted payoffs. Fix: plant missing setups upstream; deliver or cut danglers (allow 1 intentional max).

### Category 6 — Structural Weakness
Missing/weak turning points; soft midpoint; climax that doesn't resolve the dramatic question. Fix toward sound structure. **Structural deviations** (nonlinear, withheld resolution) are repaired *toward soundness* unless the deviation is a recorded, human-gated creative decision — confirm before "fixing" an intentional one.

### Category 7 — Length Deficiency  *(the most common repair)*
The script runs short. Two sub-types — apply the one the analyzer's verdict indicates:

**7a. Structurally Short (missing scenes/beats)**
- Diagnosis: page count low AND beat sheet has gaps — acts missing expected scenes (usually Act 2's "fun and games" / B-story / midpoint build).
- Fix: identify under-served beats and **add the missing scenes** — complications, subplot scenes, reaction/aftermath beats. Not more words in existing scenes.
- Re-verify total pages after adding.

**7b. Thin Scenes (underwritten beats)**
- Diagnosis: page count low but scene COUNT is fine — scenes resolve in ~1 page where they should run ~2.
- Fix: expand existing scenes through **dramatization** — the entrance, the second exchange, the reaction, the re-approach, the button. Bring each thin scene to its proper page_target.
- **HARD RULE:** never lengthen by inflating action lines or stacking adjectives. If you're adding description to hit a number, stop — add a dramatic beat instead. (Padding creates the Category 8 problem.)

### Category 8 — Register & Prose-Style Repair
**Novelistic action in lean scenes:** convert to camera-visible action; cut interiority; one image per block, ≤3 lines, present tense. Preserve scenes the Style Bible marks elevated.
**Style drift:** bring outliers to the Style Bible's register; document intentionally-elevated scenes so they aren't "corrected."
**AI-tells:** run studio's `ai-tells-scrub.md`; repair high-severity tells (stated theme, named emotions, on-the-nose dialogue, generic detail) first; preserve deliberate uses.

### Category 9 — Generic / Under-specified
Beats that are sound but generic (fail specificity, not structure). Fix: name the obvious version, then realize it specifically — through invention or muse-evocation per the Creative Intent capsule. Replace stock characters/details/turns with story-specific choices. (Often pairs with a foundation revisit — flag if the genericness is rooted upstream.)

## Workflow

1. **Intake.** Take the analyzer's tagged report, or the user's named problems. Confirm which Style Bible / Creative Intent capsule apply (or infer and state house style).
2. **Sequence the repairs.** Length and structure first (they change page geography), then scene/character/setup, then register/specificity polish, then AI-tells scrub last (surface).
3. **Apply each fix** in its category, protecting named strengths and deliberate choices.
4. **Verify after each fix** — re-run the relevant check AND **re-count pages**: confirm the fix moved the page number in the intended direction. (Length fixes that don't add pages aren't fixes.)
5. **Final pass.** Confirm total length vs. target, register consistency, and that no fix introduced a new problem.

## Verification rule (length-aware)

The legacy doctor never re-counted pages, so length fixes weren't confirmed. Every verification step now includes a page recount. A Category 7 repair is complete only when total pages have measurably moved toward target.

## Relationship to the suite
- **From analyzer:** executes the tagged order slip; no re-diagnosis.
- **Toward the bibles:** repairs aim at the Style Bible and Creative Intent capsule.
- **Not the Review Panel:** the doctor fixes craft; the panel judges reception.
