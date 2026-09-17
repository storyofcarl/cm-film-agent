---
name: directors-vision-3
description: Crafts a directorial playbook for a film or series - the persistent creative blueprint that human crew and AI pipeline skills (Shot Format, Seedance prompt generation) read to execute one coherent vision. Sets visual language, color, lighting, camera strategy, pacing, and a canonical character/location bible, and declares machine-checkable conformance fields (an intensity curve, per-beat function tags, typed transitions that own their durations, a measurable muse/reference block, and lock/taste flags) so a downstream battery can verify shots against the vision before paid generation. Use when establishing the visual approach for a project, building a character/location bible, translating a script or concept into a directorial blueprint, or giving creative direction before shot formatting.
---

# Director's Vision

## Overview

This skill produces a **directorial playbook**: the durable creative blueprint a production reads to execute one coherent vision. It is consumed by humans (director, DP, editor) and by AI pipeline skills (Shot Format, then the Seedance prompt generator). It sets the WHAT and WHY that guide all downstream technical execution.

The playbook is the source of truth for two things:

1. **Canonical identity.** AI generators are stateless and re-describe characters every shot, so drift is the enemy. The character/location **bible** is the single place that fixes what each character and location looks like; Shot Format's REF slots point to the names defined here.
2. **Conformance.** The playbook declares machine-checkable values (intensity curve, function tags, typed transitions, muse defaults, lock/taste flags). A downstream battery verifies the produced shot list against these *before* paid generation, so "as intended" is a checked property, not a vibe.

**Always write the playbook to a file:** `/mnt/user-data/outputs/[Project]_Directors_Playbook.md`. Direction held only in chat cannot anchor a production.

**Pipeline position:** Director's Vision (this skill) → Shot Format (SQ###-SC###-SH### shots, REF slots, carries function/intensity/transition per shot) → Generating Seedance Prompts (resolves REF slots to model tags).

## Notation (read first)

Two flags may be appended to any value in the playbook; they tell the downstream battery how to treat it:

- **`[LOCK]`** — conform exactly, to the frame. Authored deliberately; never round, optimize, or reinterpret. Checked deterministically; no human judgment invoked. Use for lip-sync hits, music-synced cuts, precise reveals.
- **`[TASTE]`** — escalate rightness. The value is intent, but whether it is *right* is a judgment with no ground truth; the battery surfaces it to a human rather than auto-judging. Use for the emotional weight of a hold, a daring tonal choice.

A value with neither flag is a normal conformance target: checked, flagged on divergence, adjustable within tolerance. The more you can leave bare or `[LOCK]`, the less lands in human review.

## Core workflow

When given a script, treatment, or concept, build the playbook in this order:

1. **Establish the spine** — genre, tone, medium, controlling emotional intent, the one-line visual thesis everything serves. (Medium guidance: see [references/visual-language.md](references/visual-language.md).)
2. **Set the world's visual rules** — what the camera always/never does, light logic, lens language, grade baseline, aspect ratio, render look.
3. **Resolve the muse/reference defaults** — name the muse (a director sensibility or titled film) and resolve it into the measurable Muse Block; it fills fields the playbook leaves open. See [references/conformance.md](references/conformance.md).
4. **Map the palette, pacing & intensity arc, and the transition plan** — how color/light/rhythm evolve; the 0–10 intensity curve with carrier channels; the typed, time-owning transitions at each boundary. See [references/pacing-intensity-transitions.md](references/pacing-intensity-transitions.md).
5. **Build the character/location bible** — canonical fixed descriptions (what REF slots resolve to). Spec below.
6. **Track motifs** — recurring elements and the beats they recur in.
7. **Apply per-beat direction** — scene-level direction, each beat carrying a function tag and intensity value. Analysis engine: [references/per-beat-process.md](references/per-beat-process.md).
8. **Write the playbook document** — assemble into the output file (structure below; scaffold in [references/playbook-template.md](references/playbook-template.md)).
9. **Hand off to Shot Format.**

## The playbook document (output contract)

Assemble these sections into the output file:

1. **Visual Thesis** — one paragraph: the controlling visual idea, the medium decision and its consequences, the single feeling the images must produce.
2. **World Rules** — the constants a new team member follows without asking: camera always/never, light logic, lens language, grade baseline, aspect ratio, render look.
3. **Muse Block** — the named sensibility/title resolved into measurable defaults, with strict precedence below explicit declarations. See [references/conformance.md](references/conformance.md).
4. **Palette, Pacing & Intensity Arc** — color/light/rhythm evolution, the 0–10 intensity curve (with carrier channels), and the transition plan (typed, time-owning boundaries). See [references/pacing-intensity-transitions.md](references/pacing-intensity-transitions.md).
5. **Genre Approach** — which genre language(s) apply and where the film subverts them. See [references/genre-reference.md](references/genre-reference.md).
6. **Character / Location Bible** — canonical fixed descriptions. Spec below; the heart of AI consistency.
7. **Motif Tracker** — recurring elements and the beats where they recur.
8. **Per-Beat Direction** — scene-level direction, each beat carrying a **function tag** and **intensity value**, with `[LOCK]`/`[TASTE]` flags where they apply.

For the choice vocabulary that fills these in — shot size, angle, movement, focus, function (`references/visual-language.md`); color and lighting (`references/color-and-light.md`); blocking and symbolism (`references/blocking-and-symbolism.md`) — read the referenced file when authoring that part. A complete worked example is in [references/example.md](references/example.md).

## Character / Location Bible

The bible fixes canonical identity so it never drifts. Each entry is the source of truth that Shot Format's REF slots name and the Seedance step resolves to reference images. The **REF key** (caps, underscore form) is what Shot Format writes into its slots; keep keys stable and unique.

**Character entry:**
```
### [CANONICAL_NAME]  (REF key: NAME_IN_CAPS)
- Identity: age, build, defining physical features (must never change)
- Hair / face: specific, fixed
- Wardrobe: default costume; note arc-driven changes by sequence
- Palette association: colors tied to this character
- Movement signature: how they carry themselves (motion cadence if animated)
- Lighting affinity: how they're typically lit
- Reference target: ShotDeck search terms or precedent stills
```

**Location entry:**
```
### [CANONICAL_NAME]  (REF key: NAME_IN_CAPS)
- Type: INT/EXT, kind of space
- Defining features: unchanging architectural/spatial facts
- Time/weather states: variants (day/night/rain)
- Palette & light: the location's color and lighting logic
- Atmosphere: air, particulate, texture
- Reference target: ShotDeck search terms or precedent stills
```

### Naming convention (required for any name this skill creates)

Generate names deliberately — never filler. For each named character:

1. Identify the character's **[ERA] [CULTURE] [ROLE]**.
2. Select **3 historically accurate given names** from that period/culture.
3. Identify the **etymological meaning** of each.
4. Choose the one that best reflects the character's **defining trait**.
5. Pair with a **period-appropriate surname** from occupation or geography.
6. Suggest **one subtle, era-consistent modification** for uniqueness.

Avoid overused defaults (no "Marcus"; avoid surnames "Chen" and "Martinez"). Record the brief rationale in the bible entry.

## Motif tracker

List each recurring element once with the beats where it appears, so the team plants and pays off consistently. Motifs must be re-stated in each shot downstream (the generator is stateless), so the tracker tells Shot Format which shots carry which motif.
```
| Motif | Meaning | Appears in |
|---|---|---|
| Red balloon | lost innocence | SQ001 (intro), SQ006 (return), SQ012 (payoff) |
```

## Conformance fields passed to Shot Format

Beyond creative direction and the bible, the playbook hands Shot Format five machine-checkable properties so a downstream battery can verify the shot list against this playbook before any spend. Detail and the runtime-closure rule: [references/conformance.md](references/conformance.md).

- **intensity value** (from the curve) for each beat
- **function tag** per beat — `intensify / isolate / reveal / reorient / release`
- **typed transition object** per boundary — `picture_delta_s` / `audio_offset_s`, so `occ check` can close the runtime sum and localize failures
- **muse defaults** — fill any field the playbook left open; never override an explicit declaration
- **`[LOCK]` / `[TASTE]` flags** — preserved verbatim downstream

Shot Format adds fields (or NOTES entries) to carry the function tag, intensity value, and transition object per shot.

## Reference files

Read on demand when authoring the relevant part:

- **[references/visual-language.md](references/visual-language.md)** — medium register; shot size, camera angle, movement, focus, and the five function tags.
- **[references/color-and-light.md](references/color-and-light.md)** — color psychology, color-transition arcs, lighting as storytelling.
- **[references/pacing-intensity-transitions.md](references/pacing-intensity-transitions.md)** — pacing patterns, the intensity curve, the transition plan and runtime-closure rule.
- **[references/blocking-and-symbolism.md](references/blocking-and-symbolism.md)** — blocking/power dynamics, visual metaphors.
- **[references/conformance.md](references/conformance.md)** — the Muse Block, lock/taste detail, and the downstream battery contract.
- **[references/genre-reference.md](references/genre-reference.md)** — per-genre visual languages.
- **[references/per-beat-process.md](references/per-beat-process.md)** — the per-beat analysis engine (Step 7).
- **[references/playbook-template.md](references/playbook-template.md)** — the fill-in scaffold for the output file.
- **[references/example.md](references/example.md)** — a complete worked beat (thriller discovery), bible entry, and naming demonstration.

ShotDeck (https://shotdeck.com) is the recommended reference library for color, camera, lighting, and composition; cite search terms or film/scene precedents so the team finds the same references.

## Key principles

1. Every choice serves the story — no arbitrary "cool-looking" decisions.
2. Genre informs but doesn't dictate — subvert when meaningful.
3. Emotion drives technique — ask "what should the audience feel right now?"
4. Visual consistency creates a language the audience can read.
5. Contrast creates impact; sameness becomes invisible.
6. Simplicity is often strongest.
7. Rhythm is everything.
8. Declare intent so it can be checked — a value written into the playbook can be verified; intent left in prose drifts. Lock what must be exact, flag what is taste, declare the rest.
