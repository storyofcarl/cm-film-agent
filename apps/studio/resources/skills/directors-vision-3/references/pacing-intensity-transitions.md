# Pacing, Intensity & Transitions

## Contents
- Shot duration patterns
- Intensity curve (the 0–10 conformance target)
- Transition plan (typed, time-owning boundaries + runtime closure)

## Shot duration patterns

- **Accelerating** (building energy/tension): 3s → 2.5s → 2s → 1.5s → 1s → 0.5s
- **Decelerating** (winding down): 1s → 1.5s → 2s → 3s → 4s
- **Steady** (stability): consistent ~2–3s
- **Alternating** (dynamic interest): 1s → 4s → 1s → 4s
- **Chaotic** (disorientation, panic): 2s → 0.5s → 3s → 1s → 0.8s

## Intensity curve

Pacing patterns describe *shape*; the intensity curve assigns a *number*. Declare a target intensity per sequence (and per beat where it matters) on a **0–10 scale** (0 = stillness/rest, 10 = the film's peak). This is the single value the downstream contrast and pacing-signature checks read.

Two principles, both checkable:

1. **Intensity is relative.** A value reads as intense only against its surrounding baseline — the curve's *shape* (its derivative) carries the experience, not its height. A 7 after a run of 3s lands harder than a 7 after a 6. Author a deliberate contour, not a plateau.
2. **Intensity composes through contrast; it does not sum.** Maxing every channel at once (fast cuts + extreme contrast + heavy motion + loud mix) is noise, not intensity. Each point names the **carrier channel(s)** — the 1–2 channels that perform the moment — while the rest recede. A silent locked hold can be a 9 if everything around it was busy.

```
| Seq   | Beat           | Intensity (0–10) | Carrier channel(s)   | Notes                              |
|-------|----------------|------------------|----------------------|------------------------------------|
| SQ001 | ordinary world | 3                | palette, blocking    | warm, slow, settled                |
| SQ002 | inciting       | 6 [TASTE]        | cut rhythm, contrast | first acceleration                 |
| SQ006 | all is lost    | 2                | stillness, silence   | drained — carried by what's absent |
| SQ011 | climax         | 9 [LOCK]         | motion, cut rhythm   | peak; locked to the music hit      |
```

Carrier channels (pick 1–2): palette, contrast, cut rhythm, motion, blocking, lens, sound/mix, stillness/silence. Naming a carrier — and the recessive channels by omission — implements the intensity budget: it tells the DP and editing checks which channel is loud here and which goes quiet. The battery uses the curve to (a) verify measured contrast on a keyframe tracks the declared value, and (b) flag any beat where all channels are simultaneously maximal.

## Transition plan

Every scene/segment boundary declares a **typed transition that owns its time.** This is the one field whose absence is a correctness bug, not a taste gap: an untimed fade or dissolve silently breaks the runtime sum (`Σ durations == master`), and the downstream `check` cannot localize the error.

Each transition carries a type and two time values. Be precise about which applies — conflating them is the error this field exists to prevent:

- **`picture_delta_s`** — net change to total *picture* runtime.
- **`audio_offset_s`** — J/L cuts only: how far the audio edit sits from the picture cut. Does **not** change runtime; it shifts audio relative to picture.

| Type | `picture_delta_s` | `audio_offset_s` | Meaning |
|---|---|---|---|
| `cut` | 0 | 0 | hard cut, no time cost |
| `match` | 0 | 0 | a cut, visually/thematically matched |
| `fade` | **+duration** | 0 | fade to/from black — inserts black time |
| `dissolve` | **−overlap** | 0 | two shots cross-fade over `overlap` s — they share time |
| `wipe` (timed) | **−overlap** | 0 | transitions between two live shots over `overlap` s |
| `J-cut` | 0 | **−lead** | next segment's audio leads its picture by `lead` s |
| `L-cut` | 0 | **+lag** | current segment's audio trails under next picture by `lag` s |

```
| At boundary       | Type     | picture_delta_s | audio_offset_s | Note                          |
|-------------------|----------|-----------------|----------------|-------------------------------|
| SQ001→SQ002       | fade     | +1.50           | 0              | time passing                  |
| SQ002-SC001→SC002 | cut      | 0               | 0              | in-scene                      |
| SQ005→SQ006       | dissolve | -1.00 [LOCK]    | 0              | grief; shots overlap exactly  |
| SQ006-SC002→SC003 | L-cut    | 0               | +0.80          | her line trails over his face |
```

**Runtime closure (the rule the downstream sum uses):**
`total_picture = Σ(shot durations) + Σ(picture_delta_s)`, asserted equal to master to the frame.
J/L `audio_offset_s` values are checked separately — each must fit within the adjacent segment's length (you cannot lead audio by more than the next segment contains).

This maps onto Shot Format's transition notes (cut/fade/dissolve/match/wipe) and onto occ's boundary types (`continue`/`cut`/`scene`): a `scene` boundary is where fades and dissolves typically live, and where the time delta matters most.
