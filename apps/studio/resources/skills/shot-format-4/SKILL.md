---
name: shot-format-4
description: Breaks a screenplay, treatment, or director's playbook into precise SQ###-SC###-SH### cinematographic shots, then renders them into four output styles - technical notation, Seedance burst-format prompts, a storyboard spreadsheet (.xlsx), and a human-readable shot list. Each shot is self-contained for stateless AI video generators, with empty reference slots and brief character/location descriptions. Carries the conformance fields a director's playbook declares (function tag, intensity value, typed transitions that own their durations, lock/taste flags) so a downstream battery can verify the shot list and close the runtime sum before paid generation. Use when translating scripts, storyboards, or creative direction into executable video-generation prompts and production documentation, or when the user asks for a shot list or shot breakdown.
---

# Shot Format

## Overview

This skill does two jobs:

1. **Breakdown** — turns a screenplay, treatment, or director's playbook into discrete shots using a three-level hierarchy: **SEQUENCE → SCENE → SHOT** (`SQ###-SC###-SH###`).
2. **Rendering** — emits those shots in **four output styles** from one shared shot array (see below).

The shot breakdown is the single source of truth; all four styles are renderings of it, produced together by default.

### Stateless generation (the core constraint)

AI video generators have no memory between shots. There is no persistent state, no PERSIST tag, no "same as previous." Each shot must be completely self-contained — it cannot reference "same location," "continues," or assume any context. Every shot re-describes its characters, location, lighting, and grade, even when that feels repetitive. **This repetition is the mechanism that holds a look together across a film; it is not redundancy to trim.** Two mechanisms work together: explicit re-description (drives the look) and reference anchoring (locks exact identity).

### Reference anchoring (model-agnostic)

Different models reference images differently (Seedance `@Image1`–`@Image9`; others use URLs or different tokens), so Shot Format does not hardcode any one syntax. Each shot carries an empty, named slot:

```
| REF:{char:"NAME"=" " ; loc:"NAME"=" " ; style:"NAME"=" "}
```

The slot names the canonical asset (which character, location, style plate) and leaves the value empty `" "` for the downstream step (the Seedance prompt generator or a human) to fill with the model-specific tag. Asset names must match the Director's Vision **bible** exactly. Omit a slot only when it genuinely doesn't apply (e.g. an abstract insert).

### Character budget

Treat **1250 characters per shot** as a safe default for technical notation; the real ceiling is set by the target model. State the active budget at the top of any shot list when it differs.

### Pipeline position

- **Director's Vision** (directors-vision-3) produces the playbook: creative direction, the canonical character/location bible, and the conformance declarations (intensity curve, function tags, transition plan, muse defaults, lock/taste flags).
- **Shot Format** (this skill) breaks the script into shots, carries those conformance fields per shot, and renders the four styles.
- **Generating Seedance Prompts** consumes the shot list, applies the coverage decision tree, resolves REF slots into model tags, and produces final prompts.

**When to use:** breaking a screenplay/treatment into shots; creating shot lists for AI video generation; translating storyboards into specs; producing a storyboard spreadsheet or human shot list; when the user asks for a "shot list," "break this into shots," or "format for video generation."

## Core format (Style 1: Technical Notation)

Every shot follows this exact structure. **Each shot is self-contained — no references to previous shots, no PERSIST/state tag.**

```
- [ SQ[###]-SC[###]-SH[###] [DURATION]s ] ACTION:{brief action}; CAMERA:{camera movement};
— [TEMPO] /* Concept */
| FN:{function; sec: secondary}            ← from the playbook beat (see references/conformance-fields.md)
| INT:{0–10; carrier: channel(s)}          ← intensity value + carrier channel(s)
| SUBJECT:{brief character description; shot-specific details; motion style}
| SCENE:{brief location description; environment; atmosphere}
| LIGHT:{lighting setup; key lights; shadows}
| GRADE:{color palette; saturation; contrast}
| CAM:{shot size; movement; angle; lens equivalent}
| AUDIO:{sound effects; music; ambient; mix notes}
| REF:{char:" " ; loc:" " ; style:" "}
| DIALOG:{speaker; emotion} "dialogue text"   ← OPTIONAL, only when characters speak
```

Between shots/scenes, a boundary may carry a **typed transition that owns its time**:
```
>> TRANSITION:{type: dissolve; picture_delta_s: -1.00; audio_offset_s: 0.00}
```

Durations and other values may carry **`[LOCK]`** (conform exactly) or **`[TASTE]`** (escalate rightness to a human) — e.g. `3.00s [LOCK]`. Preserve these flags verbatim; they come from the playbook.

**Example:**
```
- [ SQ001-SC001-SH003 3.00s [LOCK] ] ACTION:{discover evidence on floor}; CAMERA:{crane down to object};
— [DYNAMIC] /* Discovery */
| FN:{reveal; sec: intensify}
| INT:{7; carrier: stillness, contrast}
| SUBJECT:{bloodied photograph; torn edges; faces visible in filtered light}
| SCENE:{warehouse floor; dusty concrete; debris; evidence of violence}
| LIGHT:{single sunlight shaft on photo; surrounding darkness; dramatic}
| GRADE:{desaturated base; photo colors slightly saturated; emphasized}
| CAM:{MS→CU; crane down smooth; high to low angle; 50mm}
| AUDIO:{photo flutter settles; breathing stops; tension; realization}
| REF:{loc:"WAREHOUSE_INT"=" " ; style:"GRITTY_NOIR"=" "}
>> TRANSITION:{type: L-cut; picture_delta_s: 0.00; audio_offset_s: +0.80}
```

Field-by-field guidance (ACTION, TEMPO, SUBJECT, SCENE, LIGHT, GRADE, CAM, AUDIO, DIALOG, REF, motion notation): **[references/field-reference.md](references/field-reference.md)**.

## The conformance fields (carried from the playbook)

The playbook declares them; Shot Format carries them so the downstream battery can verify the shot list and close the runtime sum **before** any spend. Full detail and the runtime-closure rule: **[references/conformance-fields.md](references/conformance-fields.md)**.

- **`FN:`** — the beat's function (`intensify / isolate / reveal / reorient / release`), optional secondary. Checked for presence and consistency with the shot's pacing.
- **`INT:`** — intensity value 0–10 plus carrier channel(s), from the playbook's intensity curve. Read by contrast and pacing-signature checks.
- **`>> TRANSITION:`** — typed boundary object with `picture_delta_s` (changes runtime) and `audio_offset_s` (J/L cuts only; shifts audio vs. picture, does not change runtime).
- **`[LOCK]` / `[TASTE]`** — preserved verbatim from the playbook.

**Runtime closure:** `total_picture = Σ(shot durations) + Σ(picture_delta_s)`, which must equal the target/master runtime. The duration totals at every level (shot → scene → sequence → film) include transition `picture_delta_s`. A fade adds time (`+`), a dissolve/wipe subtracts the overlap (`−`); cut/match are 0. This is what makes a fade or dissolve stop silently breaking the sum.

## Numbering (summary)

`SQ###` sequence (narrative beat) → `SC###` scene (location/time unit) → `SH###` shot (camera setup). Scene numbers reset at each new sequence; shot numbers reset at each new scene; three digits each, no gaps. Acts are conceptual containers (not numbered); a feature has ~8–15 sequences across 3 acts.

Full hierarchy, "when to start a new sequence/scene/shot," and worked numbering examples: **[references/numbering.md](references/numbering.md)**.

## Four output styles

| # | Style | Format | Audience | Purpose |
|---|---|---|---|---|
| 1 | Technical Notation | `.md` | Pipeline / archival | Full SQ-SC-SH spec, every field. The master record. |
| 2 | Seedance Burst Format | `.md` | AI video models | Each shot as a flowing prompt paragraph — degree adverbs, positive-only description, audio, REF slots. |
| 3 | Storyboard Spreadsheet | `.xlsx` | Production / tracking | One row per shot, full column set, for planning and asset assignment. |
| 4 | Human-Readable Shot List | `.md` | Directors / crew | Clean, scannable, no machine syntax. |

**Default:** produce all four (only specific styles if requested). Write each to `/mnt/user-data/outputs/` and call `present_files`. Naming: `[Project]_Shots_Notation.md`, `[Project]_Shots_Burst.md`, `[Project]_Storyboard.xlsx`, `[Project]_ShotList.md`.

Build the spreadsheet with `scripts/build_storyboard.py` (takes a JSON shot array, writes the .xlsx with the full column set including the conformance columns and a runtime-closure total). One shot rendered in all four styles side by side, plus the automation flow: **[references/output-styles.md](references/output-styles.md)**.

"Burst" here means the Seedance **prompt-paragraph syntax**, not the 20-shot/5-second Rapid Fire constraint — for that, point the user to the separate burst-board-video skill.

## Patterns, pacing, continuity

Common shot patterns (establishing, conversation coverage, reveal, action), pacing patterns, duration targeting, the model clip-length ceiling, and coverage-continuity notes (180°, eyeline, screen direction): **[references/patterns.md](references/patterns.md)**.

Complex camera moves, lighting setups, grading, motion control, and platform notes: **[references/advanced-techniques.md](references/advanced-techniques.md)**.

## Coverage gates (run every time — not optional)

A skill cannot guarantee coverage on its own: the model can under-produce a plausible-looking sparse list and self-report success. So coverage is **enforced in code and looped on**, never trusted to the generator. A 90-minute film is ~5400s — at a 4s ASL that is ~1350 shots, not ~160. The verdict on whether the list actually covers the film is computed by `scripts/check_coverage.py`, not asserted by the model.

**The loop:**

1. **Generate coverage scene by scene** — never the whole film in one pass (that produces the sparse, compressed list). Full coverage per scene: establishing → coverage → inserts → reactions.
2. **Assemble** the shot array (each shot carrying function, intensity, ref, duration, transition/picture_delta).
3. **Build `targets.json` from the playbook:** `master_runtime_s`; `asl_target_s` and `asl_range_s` (muse block); `duration_floor_s`/`duration_ceiling_s` safeguards; optional `intensity_curve`, `manifest`, `bible_keys`.
4. **Run** `python scripts/check_coverage.py shots.json targets.json`.
5. **On any hard FAIL:** fix only the named nodes — break under-covered scenes into fuller coverage, split over-ceiling shots, add missing declared scenes — and re-run.
6. **Loop until exit 0.** Only then emit the four output styles.

**The expected shot count is playbook-derived, with absolute safeguards:** the target comes from the muse ASL and the intensity curve (higher intensity → shorter ASL → more shots), while a duration floor/ceiling sets an absolute count band (`min_shots = master / ceiling`, `max_shots = master / floor`) that holds even if the ASL is mis-set. Full battery, derivation, and gate table: **[references/coverage-gates.md](references/coverage-gates.md)**.

## Output requirements

When generating shot lists, always:

1. Use `SQ###-SC###-SH###` with three digits each; no gaps; reset scene numbers per sequence and shot numbers per scene.
2. Include all required fields per shot (SUBJECT, SCENE, LIGHT, GRADE, CAM, AUDIO, REF), plus `FN:` and `INT:` carried from the playbook; DIALOG only when characters speak.
3. Carry `[LOCK]`/`[TASTE]` flags verbatim; carry `>> TRANSITION:` objects at boundaries.
4. Include a REF slot on every shot, asset names matched to the bible, values empty `" "`.
5. Make each shot self-contained — no "continues," "same," "maintains," no PERSIST.
6. Respect the active character budget (1250 default; state it if different).
7. Calculate durations and **close the runtime**: totals at each level include transition `picture_delta_s`; flag any shot over the model clip ceiling (~10s) for chaining.
8. Produce all four output styles by default unless specific styles are requested.

## Quality checklist

**Format:** SQ###-SC###-SH### three digits each · durations `.##s` (`2.50s` not `2.5s`) · required fields present · `FN:` and `INT:` present · REF slot present, names matched to bible, values empty · DIALOG only on speech · TEMPO + concept present · `[LOCK]`/`[TASTE]` preserved.

**Structure:** sequential numbering, no gaps · scene numbers reset per sequence · shot numbers reset per scene · durations calculated at every level · **runtime closes** (`Σ durations + Σ picture_delta_s == master`) · shots over ~10s flagged for chaining · transitions typed with `picture_delta_s`/`audio_offset_s`.

**Stateless compliance:** each shot self-contained (no "continues/same/maintains," no PERSIST) · brief char/location descriptions in each shot · within the active character budget · style elements repeated explicitly · identity anchored via REF, not assumed.

**Conformance:** every beat carries a function tag · `FN:` consistent with the shot's pacing (an `intensify` beat is not long sparse holds) · `INT:` value present with carrier channel(s) · transition objects own their time · `[LOCK]`/`[TASTE]` carried from the playbook unchanged.

**Output styles:** all four produced unless specific styles requested · spreadsheet built via `scripts/build_storyboard.py` · files written to `/mnt/user-data/outputs/` and presented.

**Coverage gates (binding — emit nothing until this passes):** `scripts/check_coverage.py` run against playbook-derived `targets.json` · all hard gates PASS (exit 0) · runtime closes to master · shot count within the ASL target and the absolute floor/ceiling band · no over-ceiling shots without `[LOCK]` · every declared scene covered. On failure, fix the named nodes and re-run — do not finalize a list that fails the battery.

## Integration with Director's Vision

Invoke after directors-vision-3 provides the playbook. It supplies the creative approach, the canonical bible whose REF keys these shots point to, the motif tracker (which shots re-state which motifs), and the conformance declarations this skill carries per shot. The result is a complete path from creative concept to executable, multi-format, verifiable production documentation.
