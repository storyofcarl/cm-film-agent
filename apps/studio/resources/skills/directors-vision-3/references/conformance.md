# Conformance

The machine-checkable layer of the playbook. These declarations let a downstream battery verify the produced shot list against this vision before any paid generation, and locate where each principle becomes a deterministic check, a measured proxy, or a human escalation.

## Contents
- Muse & reference defaults
- Lock / taste flags
- The five conformance fields passed to Shot Format
- What gets checked where

## Muse & reference defaults

A **muse** is a named director sensibility ("shoot like Deakins") or a titled film ("cut it like *Heat*") used to resolve choices the playbook leaves open. It pulls output off the generic mean toward a specific attractor — in *measurable* terms, not as a vibe.

Two functions, only one safe to automate:
- **Parameter source (use freely):** supplies concrete defaults where the playbook is silent — contrast band, shot-length distribution, lens habits, palette bias, movement default. These become declared defaults the battery checks against.
- **Judge (never):** "does this *feel* like the muse?" has no ground truth; asking a model or a vote to confirm it produces confident false agreement. The muse names the target, never grades the hit. Mark such questions `[TASTE]`.

Resolve the muse into numbers — measure them where you can. Average Shot Length (ASL) and contrast distributions are real, measurable quantities (Cinemetrics / Barry Salt's statistical style analysis); pull them off the reference film rather than estimating.

```
## Muse Block
muse_reference: "<director name or film title>"
asl_target_s:        <average shot length in seconds, e.g. 4.2>
shot_length_range_s: <min–max, e.g. 1.0–12.0>
contrast_band:       <low–high on the 0–10 intensity scale, e.g. 4–8>
palette_bias:        <hue/saturation tendency>
lens_habits:         <focal tendency, e.g. "wide masters 24–35mm, 85mm for faces">
movement_default:    <static | handheld | dolly | mixed>
cut_rhythm:          <pacing tendency>
source_of_values:    <"measured from <film>" | "estimated from <director> body of work">
```

**Precedence (strict):** explicit playbook declaration > muse default > generator bias. The muse never overrides what the vision states outright; it only fills gaps.

## Lock / taste flags

- **`[LOCK]`** — conform exactly, to the frame; checked deterministically, no human judgment. For values whose exactness is the point.
- **`[TASTE]`** — escalate the value's rightness to a human; the battery does not auto-judge it. For values where rightness is a judgment with no ground truth.

Bare values are normal conformance targets: checked, flagged on divergence, adjustable within tolerance.

## The five conformance fields passed to Shot Format

1. **intensity value** (from the curve) for each beat — read by contrast and pacing-signature checks.
2. **function tag** per beat (`intensify / isolate / reveal / reorient / release`) — checked for presence and consistency with the beat's pacing signature.
3. **typed transition object** per boundary (`picture_delta_s` / `audio_offset_s`) — lets `occ check` close `Σ durations + Σ picture_delta == master` and localize failures.
4. **muse defaults** — fill any open field; never override an explicit declaration.
5. **`[LOCK]` / `[TASTE]` flags** — preserved verbatim downstream.

Shot Format carries the function tag, intensity value, and transition object per shot (as fields or NOTES entries).

## What gets checked where

The battery sorts each principle into a tier and fires it at the cheapest gate upstream of the spend:

- **Deterministic** (code-assert, free): runtime closure, transition typing, function-tag presence, lens ∈ world set, aspect/render constancy, REF-key integrity against the bible, motif presence, format. Fire at `occ check` / `preview` (no spend).
- **Pseudo-perceptual** (measure a proxy): contrast vs. intensity curve, palette vs. arc, shot-size/angle/movement vs. declared intent, pacing signature vs. function tag, identity fidelity. Fire at the keyframe-stills canary (cents, before video spend).
- **Irreducible** (escalate, never vote): emotion/story landing, "is this hold the right length," muse vibe-match, beauty. Surface to a human with the supporting artifact.

Vote only on pseudo-perceptual leaves with a real answer; never vote on `[TASTE]` — shared bias produces false consensus.
