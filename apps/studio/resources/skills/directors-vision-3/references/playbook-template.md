# [PROJECT TITLE] — Director's Playbook

> Persistent creative blueprint. Read by human crew and AI pipeline skills. Source of truth for visual language, canonical identity, and the machine-checkable conformance targets. Shot Format's REF slots resolve to the bible below.
> **Notation:** any value may be flagged `[LOCK]` (conform exactly) or `[TASTE]` (escalate rightness to a human). Bare values are normal conformance targets.

## 1. Visual Thesis
[One paragraph: the controlling visual idea; the medium and what it means for the look; the single feeling the images must produce.]
**Medium:** [animation — render look / live action / hybrid — seam logic]
**Aspect ratio:** [e.g. 2.39:1]   **Grade baseline:** [default look]

## 2. World Rules
- **Camera always:** [ ]
- **Camera never:** [ ]
- **Light logic:** [motivated/stylized; what sources exist]
- **Lens language:** [e.g. 35mm real world, 85mm memory]
- **Color baseline:** [default before the arc moves it]
- **Animation/render look:** [if applicable]

## 3. Muse Block
> Source not judge. Precedence: explicit declaration > muse default > generator bias. "Feels like the muse" is `[TASTE]`.
```
muse_reference:      [<director name or film title>]
asl_target_s:        [e.g. 4.2]
shot_length_range_s: [e.g. 1.0–12.0]
contrast_band:       [low–high on 0–10, e.g. 4–8]
palette_bias:        [ ]
lens_habits:         [ ]
movement_default:    [static | handheld | dolly | mixed]
cut_rhythm:          [ ]
source_of_values:    ["measured from <film>" | "estimated from <director>"]
```

## 4. Palette, Pacing & Intensity Arc

| Act / Sequence | Palette | Light | Cutting rhythm | ShotDeck ref |
|---|---|---|---|---|
| Act 1 | | | | |
| Act 2 | | | | |
| Act 3 | | | | |

[Prose notes on the transitions: where and why the look shifts.]

### Intensity Curve
> 0–10 per seq/beat. Shape carries the experience. Each point names 1–2 carrier channels; the rest recede.

| Seq | Beat | Intensity (0–10) | Carrier channel(s) | Notes |
|---|---|---|---|---|
| SQ001 | | | | |

### Transition Plan
> `picture_delta_s` changes runtime; `audio_offset_s` (J/L only) shifts audio vs picture. Closure: `total_picture = Σ(shot durations) + Σ(picture_delta_s)` == master.

| At boundary | Type | picture_delta_s | audio_offset_s | Note |
|---|---|---|---|---|
| | [cut/match/fade/dissolve/wipe/J-cut/L-cut] | | | |

*Deltas: cut/match 0,0 · fade +duration,0 · dissolve/wipe −overlap,0 · J-cut 0,−lead · L-cut 0,+lag.*

## 5. Genre Approach
**Dominant:** [ ]   **Secondary:** [ ]   **Deliberate subversions:** [ ]

## 6. Character / Location Bible
> Canonical, fixed. REF keys (CAPS) are what Shot Format writes into REF slots.

### Characters
#### [Name]  (REF key: NAME)
- Names considered / etymology / choice rationale: [per naming convention]
- Identity / Hair-face / Wardrobe / Palette / Movement / Lighting / Reference target: [ ]

### Locations
#### [Name]  (REF key: NAME)
- Type / Defining features / Time-weather states / Palette & light / Atmosphere / Reference target: [ ]

### Style Plates
#### [Name]  (REF key: NAME)
- [The look this plate fixes — e.g. GRITTY_NOIR: desaturated, crushed blacks, hard side light, warm practical accents. ShotDeck refs.]

## 7. Motif Tracker

| Motif | Meaning | Appears in |
|---|---|---|
| | | |

[Motifs are re-stated per shot downstream — the generator is stateless.]

## 8. Per-Beat Direction
> Each beat carries FUNCTION + intensity. Pacing signature must match FUNCTION (battery cross-checks).

### [SQ### — Beat name]
- **FUNCTION:** [intensify / isolate / reveal / reorient / release] [; secondary: ___]
- **Intensity:** [0–10] — carrier channel(s): [ ]
- **Emotional beat / Color-light / Camera / Pacing / Blocking-power / Audio:** [ ]
- **Transition out:** [type + picture_delta_s / audio_offset_s]
- **Rationale:** [ ]
- **Characters/locations present (REF keys) / Motifs present:** [ ]
