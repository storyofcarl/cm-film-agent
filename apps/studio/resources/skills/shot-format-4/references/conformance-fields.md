# Conformance Fields

The director's playbook (directors-vision-3) declares machine-checkable values; Shot Format carries them per shot so a downstream battery can verify the shot list and close the runtime sum **before** any paid generation. This file defines how each is written and checked.

## Contents
- FN — function tag
- INT — intensity value + carrier
- Typed transitions + runtime closure
- LOCK / TASTE flags
- What the downstream battery checks

## FN — function tag

One primary function per beat, optionally a secondary. Written as a field line:
```
| FN:{primary; sec: secondary}
```
Vocabulary (what the shot does to the audience, independent of size/angle/movement):
- **intensify** — raise arousal/tension (push-in, accelerating cuts, tightening size, rising contrast).
- **isolate** — direct all attention to one element, strip context (CU/ECU, shallow focus, negative space, silence).
- **reveal** — deliver new information (pull-back, rack focus, the cut to the withheld thing, reorienting wide).
- **reorient** — re-establish space/time/relationship (re-establishing wide, match cut, clarifying geography).
- **release** — discharge tension (cut to wide/air, the held resolving frame, the exhale).

Consistency rule: the shot's pacing must match the function. An `intensify` beat is not authored as long sparse holds; a `release` beat is not accelerating fast cuts. The battery cross-checks `FN:` against the shot-length pattern.

## INT — intensity value + carrier

The beat's target on the playbook's 0–10 intensity curve, plus the channel(s) carrying it:
```
| INT:{7; carrier: cut rhythm, stillness}
```
- The value is relative — its meaning comes from contrast with surrounding beats, not its absolute height.
- Name 1–2 **carrier channels** (palette, contrast, cut rhythm, motion, blocking, lens, sound/mix, stillness/silence); the rest recede. Do not max every channel — that is noise, not intensity.
- The battery (a) verifies measured contrast on a keyframe tracks this value and (b) flags beats where all channels are simultaneously maximal.

## Typed transitions + runtime closure

A boundary between shots/scenes/sequences may carry a typed transition that **owns its time**:
```
>> TRANSITION:{type: <type>; picture_delta_s: <Δ>; audio_offset_s: <Δ>}
```
- **`picture_delta_s`** — net change to total *picture* runtime.
- **`audio_offset_s`** — J/L cuts only: how far the audio edit sits from the picture cut. Does **not** change runtime; it shifts audio relative to picture.

| Type | `picture_delta_s` | `audio_offset_s` | Meaning |
|---|---|---|---|
| `cut` | 0 | 0 | hard cut |
| `match` | 0 | 0 | a cut, visually/thematically matched |
| `fade` | **+duration** | 0 | fade to/from black — inserts black time |
| `dissolve` | **−overlap** | 0 | two shots cross-fade over `overlap` s (shared time) |
| `wipe` (timed) | **−overlap** | 0 | transition between two live shots over `overlap` s |
| `J-cut` | 0 | **−lead** | next segment's audio leads its picture by `lead` s |
| `L-cut` | 0 | **+lag** | current segment's audio trails under next picture by `lag` s |

**Runtime closure (the rule that makes totals honest):**
```
total_picture = Σ(shot durations) + Σ(picture_delta_s)
```
asserted equal to the target/master runtime, to the frame. Duration totals at every level (scene, sequence, film) include the transition `picture_delta_s` that fall within them. Without this, every fade and dissolve silently throws the runtime sum off by its time and the error accumulates. J/L `audio_offset_s` values are checked separately — each must fit within the adjacent segment's length.

## LOCK / TASTE flags

Carried verbatim from the playbook, appended to any value (most often a duration):
- **`[LOCK]`** — conform exactly, to the frame; checked deterministically, no human judgment. For values whose exactness is the point (lip-sync, music hits, a precise reveal): `3.00s [LOCK]`.
- **`[TASTE]`** — escalate the value's rightness to a human; the battery surfaces it rather than auto-judging. For values where rightness is a judgment with no ground truth.

Preserve flags exactly; do not strip, add, or reinterpret them.

## What the downstream battery checks

- **Deterministic** (free, at `occ check`/`preview`): runtime closure; transition typed with a `picture_delta_s`; `FN:` present; REF names match the bible; duration format; flags preserved.
- **Pseudo-perceptual** (cheap, at the keyframe-stills canary): measured contrast vs. `INT:`; palette vs. the arc; pacing pattern vs. `FN:`; identity fidelity.
- **Irreducible** (escalate, never vote): whether a `[TASTE]` value is *right*; emotion/story landing; beauty.

Shot Format's job is to carry these so they are present and parseable; the battery does the checking.
