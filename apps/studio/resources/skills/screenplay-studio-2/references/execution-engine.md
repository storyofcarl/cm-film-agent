# Execution Engine

Studio 2's writing core. It replaces the legacy chunk engine with a **scene-brief + externalized-state** model (absorbed from the longform-writer architecture), and exposes **autonomy as a user-set dial**: write the whole script on auto-pilot from the approved foundation, or advance segment-by-segment, or scene-by-scene with review at each step.

## Why scene-briefs instead of chunks

The legacy engine wrote 20-25 page chunks with all foundation documents held in the conversation context. Three failures followed from that single choice:

1. **Back-half drift.** By page ~60 the context is crowded with prior pages and audits; the foundation and muse fade from attention, and prose drifts toward generic.
2. **Length slippage.** A chunk-level "write 22 pages" instruction gets averaged away. Per-scene page targets get obeyed.
3. **Register slippage.** Same averaging problem — style holds when it's enforced in each scene's brief, not once per chunk.

The scene-brief engine fixes all three by **externalizing state to files** and assembling a **focused brief per scene** that carries only what that scene needs — so the muse, the plan, the page target, and the register are in front of the writer every single scene, regardless of how long the script is or how many sessions it spans.

## Externalized state

All foundation and progress live in files, not the context window:

```
project/
  foundation/
    spine.md
    creative-intent.md          (the capsule — rides in every brief)
    style-bible.json
    world-tone-bible.md
    theme-and-opposition.md
    characters/                 (voice + arc state per character)
    structure.md
    scenes/                     (one Scene Craft Spec per scene)
  state/
    character-state.json        (live: where each character is NOW)
    open-threads.json           (live: setups planted, awaiting payoff; motifs)
    continuity.json             (live: facts established, props, timeline)
    progress.json               (which scenes drafted, page counts, status)
  draft/
    scenes/                     (drafted scene files)
    assembled.fountain          (compiled script)
```

State is **live**, not static: `open-threads.json` tracks each setup from plant to payoff so threads are harvested deliberately, not reconstructed by a post-hoc audit; `character-state.json` carries each character's current emotional/situational position so the next scene starts from truth. This is also what enables **cross-session** work — close the session, reopen tomorrow, state is intact.

## The scene brief (assembled per scene)

Before writing any scene, the engine assembles a brief by retrieving only the relevant state:

```
SCENE BRIEF — [SQ/SC/SH or scene id]
- Creative Intent capsule:  [full — always included]
- Page target:              [e.g. 2.3 pp]   ← enforced here
- Register:                 [spec_lean | elevated]   ← enforced here
- Scene Craft Spec:         enter-on / exit-on / turn / surface / underneath / anchor detail
- Characters present:       [current state from character-state.json]
- Voice rules:              [for each speaking character]
- Active setups to serve:   [from open-threads.json]
- Motifs available:         [from world-tone-bible motifs]
- Prior scene exit:         [last beat, for continuity]
- High-severity AI-tells:   [live constraints to avoid at generation]
- Structural role:          [the beat this scene occupies — obey it]
```

The brief is the single most important mechanism in Studio 2. Length, register, specificity, and continuity are all enforced *here*, per scene, where instructions are actually obeyed.

## Autonomy Modes (user-set dial)

The user chooses how much to drive. The underlying engine always works scene-by-scene; the mode only controls **where it stops for approval.**

### Mode A — Auto-Pilot
Write the entire script from the approved foundation without stopping for per-scene or per-segment approval.

- Writes every scene from its brief, in order.
- Runs all quality gates after each scene (see below) and **self-corrects silently** when a scene fails.
- Updates live state after each scene.
- Produces a running log so the user can see what happened.
- **Still hard-stops only for genuine creative forks** (see below) and for blocking quality failures it cannot self-correct.
- Ends with the assembled draft + a full quality report.

Best for: a foundation the user trusts completely and wants to see realized end-to-end fast.

### Mode B — Segment
Write one segment at a time (a sequence or an act), then stop for review.

- Writes all scenes in the segment from their briefs, with gates and self-correction.
- Stops at the segment boundary, presents the pages + segment quality report + state changes.
- User approves, redirects, or requests revision before the next segment.

Best for: balancing momentum with control; catching drift at natural structural seams.

### Mode C — Scene
Write one scene at a time, stop after each.

- Writes the scene from its brief, runs gates.
- Presents the scene + its metrics + what changed in state.
- User approves or redirects before the next scene.

Best for: pivotal stretches, tonally tricky sequences, or when the user wants tight authorship.

### Switching modes mid-write
The mode is changeable at any stop. Common pattern: Scene mode through the opening (set the tone precisely), Segment through Act 2, Auto for connective stretches the user trusts. Because the engine is always scene-by-scene underneath, switching costs nothing.

## Quality gates (fire in EVERY mode)

Autonomy controls **approval stops**, never **quality control**. After each scene, in all three modes, the engine checks:

- **Page target:** scene within tolerance of its target. If short, the scene is under-dramatized — add the missing beat (reaction, re-approach, button), never padding. Re-check.
- **Register compliance:** action lines match the scene's assigned register; no interiority/metaphor in lean scenes; elevated only if budgeted.
- **AI-tells scrub:** high-severity tells (stated theme, named emotions, on-the-nose dialogue, generic detail) caught and repaired.
- **Turn present:** the scene pivots; if not, flag.
- **Continuity:** no contradiction with `continuity.json`.
- **Thread service:** scene serves its assigned setups; planted/harvested threads logged.

In **Auto**, failures trigger silent self-correction (and are noted in the log); only an uncorrectable failure stops the run. In **Segment/Scene**, failures are surfaced in the report at the stop.

This is the guarantee that Auto-pilot doesn't reintroduce drift: the gates are identical across modes; only the stopping differs.

## Creative-fork hard stops (even in Auto)

Some decisions are taste, not craft — the engine must not guess. It hard-stops in **every** mode, including Auto, when it hits:

- A genuine branch the foundation didn't resolve (two valid directions for a pivotal beat).
- A choice that contradicts or would require changing a foundation document.
- A proposed **structural deviation** (nonlinear, withheld resolution) — per the governing principle, structure-breaks are human-gated, never auto-taken.
- Anything that would drift toward the **bad-version-feared** in the Creative Intent capsule.

At a fork, the engine presents **2-3 divergent options with a recommendation** (the same choice-based format as the foundation stages) and waits. Auto-pilot resumes after the user picks.

The bar for an Auto hard-stop is deliberately high: interrupt rarely, only for decisions that are genuinely the user's to make. Routine craft choices are the engine's to make and proceed without stopping.

## Page-budget reconciliation (pre-write)

Before any writing begins, in all modes, the engine reconciles the plan against the target:

```
sum(scene.page_target for all scenes)  vs  target_pages
```

If the sum is below ~92% of target, writing does **not** start. The engine reports the gap and which act is starved, and proposes either added scenes (structural) or raised per-scene targets (density) — choice-based, human-gated. This catches the 55%-length problem at the plan stage, before a single page is written.

## Assembly and final pass

After the last scene (or on request):

- Assemble scene files into a formatted script.
- Run the integrator reconciliation: voice consistency across the whole, transitions, global setup/payoff resolution, motif coherence, and **total length vs. target** (the check the chunk model never had).
- Produce the final quality report.
- Hand to analyzer/doctor if the user wants a diagnostic/repair cycle.

## How a run looks (Auto, abbreviated)

```
[reconcile] 48 scenes, 109pp planned vs 110 target — PASS
[scene 1/48] opening image — elevated — 1.1pp — gates PASS
[scene 2/48] — lean — 2.4pp — register PASS, turn PASS
[scene 7/48] — lean — target 2.0pp, drafted 1.2pp — SHORT
   → self-correct: added reaction beat + button → 2.1pp — PASS
[scene 19/48] CREATIVE FORK — protagonist's choice at midpoint
   → presenting 3 options, awaiting selection
   ...
[assemble] 48 scenes → 111pp
[integrate] voice PASS · length PASS · threads 14/14 resolved
[report] ready for review
```
