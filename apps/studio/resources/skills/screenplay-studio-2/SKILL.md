---
name: screenplay-studio-2
description: Complete end-to-end screenplay development system that produces world-class, distinctive screenplays from concept to final draft. Runs a spine-led, choice-based foundation process (human-gated at every stage), then a scene-brief execution engine with a user-set autonomy dial (auto-pilot, segment-by-segment, or scene-by-scene). Enforces length, register/style, and specificity throughout, with an on-demand Critic/Buyer/Audience review panel. Use when the user wants to create a professional screenplay from (1) a concept or logline, (2) an existing outline or treatment, (3) a rough draft needing elevation, or (4) a complete development process with built-in quality and originality controls.
---

# Screenplay Studio 2

A full screenplay development studio. Its goal is narrow and demanding: **unique, rapidly crafted, world-class screenplays in a specific chosen style — never reading as generic or AI.** It achieves this through a human-gated foundation process that builds distinctiveness in before any pages exist, a scene-brief engine that enforces length and style where instructions are actually obeyed, and quality controls that catch genericness cheaply.

## The Governing Principle

> **Convention earns the structure; specificity earns the distinction.**
> Obey the legacy skeleton the top 100 screenplays share. Make every *choice inside that skeleton* specific — through invention OR deliberate evocation of a chosen muse. The only enemy is the generic default that belongs to no one.

This resolves the central tension of the suite: correctness and distinctiveness are orthogonal, not opposed. The canon proves it — *Parasite* is a flawless three-act escalation realized through choices no one saw coming. Structure is enforced by default; structural deviation (nonlinear time, withheld resolution) is a **human-gated exception** with a stated reason, never an AI default. Distinctiveness is **specificity, not novelty** — evoking the feeling of *Heat* is a legitimate target, not a failure of originality.

## Architecture

Studio 2 runs in three layers:

1. **Foundation (craft + originality)** — a spine-led, choice-based, human-gated process that produces the externalized state the writer works from. This is where distinctiveness is won.
2. **Execution (the writing engine)** — a scene-brief engine over externalized file-state, with a user-set autonomy dial. This is where length and style are enforced.
3. **Evaluation (quality + reception)** — the analyzer/doctor companion skills (craft diagnostics and repair) plus the on-demand Review Panel (Critic/Buyer/Audience reception simulation).

## Reference documents

Read the relevant reference before applying it. All in `references/`.

**Foundation / craft:**
- `foundation-process.md` — the backbone: principle, spine-led order, choice-based authoring, per-stage specificity checks. **Read first.**
- `spine.md` — the one idea everything derives from (authored and gated first).
- `creative-intent.md` — the muse capsule (touchstones, feeling chased, obsession, bad-version-feared); rides in every scene brief.
- `theme-and-opposition.md` — theme as arguable claim; opposition developed to protagonist depth.
- `world-tone-bible.md` — specific world logic, sensory signature, motifs, tonal refusals.
- `style-bible.md` — executional/muse DNA; register-vs-rhythm; JSON schema.
- `scene-craft.md` — enter-late/exit-early, the turn, surface/underneath, anchor detail, dialogue distinctiveness.
- `coherence-specificity-gate.md` — holistic foundation validation before export.
- `ai-tells-scrub.md` — surface-tic checklist (used live at write-time and by analyzer/doctor).

**Execution:**
- `execution-engine.md` — scene-brief engine, externalized state, autonomy modes, quality gates, page-budget reconciliation.

**Evaluation:**
- `review-panel.md` — on-demand Critic/Buyer/Audience reception pass.

**Legacy structural templates** (retained, now length-aware — see "Templates" below):
- `template-1-film-outline.md` through `template-8-genre-enhancement.md`.

## Workflow

### Phase 1 — Foundation (human-gated, choice-based)

Follow `foundation-process.md`. Build the foundation in this order, **presenting 2-3 divergent options with a recommendation at each stage** and letting the user select or redirect (never generate-then-veto):

```
1. SPINE                       → spine.md
2. CREATIVE INTENT + MUSE      → creative-intent.md (+ style-bible.md derived here)
3. PREMISE                     → the spine as situation
4. THEME                       → theme-and-opposition.md (Part 1)
5. OPPOSITION                  → theme-and-opposition.md (Part 2)
6. CHARACTERS                  → template-3 + contradiction/specificity additions
7. WORLD / TONE                → world-tone-bible.md
8. STRUCTURE                   → template-1, template-4, template-5
9. SCENES                      → template-2 + scene-craft.md (Scene Craft Spec per scene)
10. COHERENCE & SPECIFICITY GATE → coherence-specificity-gate.md
11. EXPORT                     → externalized state for the engine
```

At the close of each stage, run the **light per-stage specificity check** (name the obvious version; confirm ours beats it via invention or muse; fail only the generic default).

The Spine and the Coherence & Specificity Gate are the two non-negotiable bookends. **Human approval is required at every stage** — but it is generative (pick a direction) rather than custodial (approve a proposal).

**Foundation deliverables** are written to the project's `foundation/` directory as the externalized state the engine reads (see `execution-engine.md` for the layout).

### Phase 2 — Execution (user sets the autonomy dial)

Follow `execution-engine.md`.

1. **Page-budget reconciliation (pre-write, mandatory).** Sum scene page_targets vs. target. If below ~92%, do **not** start writing — report the gap and the starved act, offer to add scenes or raise targets (choice-based). This catches the length problem before page one.

2. **Ask the user for the autonomy mode** (this is a creative-control choice, so present it directly):
   - **Auto-Pilot** — write the whole script from the foundation; stop only for genuine creative forks or uncorrectable failures.
   - **Segment** — write a sequence/act, stop for review.
   - **Scene** — write one scene, stop after each.
   - Mode is switchable at any stop.

3. **Write scene-by-scene from assembled briefs.** Each brief carries the Creative Intent capsule, page_target, register, Scene Craft Spec, current character state, voice rules, active setups, available motifs, prior-scene exit, and high-severity AI-tells to avoid.

4. **Quality gates fire after every scene in every mode** (page target, register, AI-tells, turn, continuity, thread service). Auto self-corrects silently and logs; Segment/Scene surface results at the stop. Autonomy controls *stops*, never *quality control*.

5. **Creative-fork hard stops** fire even in Auto: unresolved branches, anything that would change a foundation doc, proposed structural deviations, or drift toward the bad-version-feared. Present 2-3 options + recommendation; resume after selection.

6. **Update live state** after each scene (character-state, open-threads, continuity, progress).

### Phase 3 — Assembly, integration, evaluation

1. Assemble scene files into a formatted script.
2. **Integrator reconciliation** across the whole: voice consistency, transitions, global setup/payoff resolution, motif coherence, and **total length vs. target** (the check the legacy chunk model never had).
3. Produce the final quality report.
4. Optional **analyzer → doctor** diagnostic/repair cycle.
5. Deliver the formatted screenplay file.

## The Review Panel (invoke on request)

At any point the user can call the **Review Panel** (`review-panel.md`) on an outline, beat sheet, treatment, foundation package, or draft. It returns independent Critic, Buyer, and Audience reads, where-they-agree / where-they-collide, and "the one thing." It is advisory and read-only — it never edits or auto-revises. Distinct from the analyzer (craft diagnostic): the panel simulates *reception*.

## Entry points

- **From concept:** full Phase 1 → 2 → 3.
- **From outline/treatment:** map existing material onto the foundation stages, filling Spine, Creative Intent, and the gaps; flag any stage the material skipped; then Phase 2 → 3.
- **From rough draft:** run analyzer for diagnosis, reconstruct the missing foundation (especially Spine, Style Bible, Creative Intent), then doctor-driven revision against it.
- **Targeted:** invoke individual references (e.g. Style Bible authoring, Review Panel, a single foundation stage) without the full pipeline.

## Working with the user

**Choice-based throughout.** Wherever the suite needs creative direction, present 2-3 divergent options with a recommendation rather than an open question. The user authors by selecting and redirecting.

**Human-gated where it matters; autonomous where it doesn't.** Gate creative decisions (foundation directions, forks, structural deviations, mode choice). Execute craft autonomously (word choice, action lines, scene-level pacing, quality-driven self-correction, formatting).

**Honest and constructive.** Critical assessment is never suppressed; delivery stays constructive. No manufactured concerns, no false consensus.

## Critical success factors

1. Read the relevant reference before applying it.
2. Build distinctiveness in at the foundation — never rely on the writing phase to rescue a generic foundation.
3. Enforce length and register **per scene, in the brief** — never at chunk level.
4. Run quality gates in every autonomy mode; auto-pilot suppresses stops, not checks.
5. Keep structure sound by default; treat structural deviation as a human-gated exception.
6. Reward specificity (invention or muse), reject only the generic default.
7. Keep the Creative Intent capsule in front of the writer at every scene.
