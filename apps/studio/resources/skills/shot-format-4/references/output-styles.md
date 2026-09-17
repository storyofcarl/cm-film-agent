# Output Styles Reference

All four styles render the **same** shot array. Below, one shot is shown in each style so the mapping is clear. The technical notation is the source; the other three are derived from it.

## Contents
- Source shot (the data every style draws from)
- Style 1 — Technical Notation
- Style 2 — Seedance Burst Format
- Style 3 — Storyboard Spreadsheet
- Style 4 — Human-Readable Shot List
- Automation flow

## Source shot

```
- [ SQ001-SC001-SH001 3.20s ] ACTION:{Holloway enters cautiously}; CAMERA:{slow push following};
— [STATIC→DYNAMIC] /* Tension */
| FN:{reveal; sec: intensify}
| INT:{5; carrier: cut rhythm, contrast}
| SUBJECT:{man 30s, athletic, short dark hair; tactical vest; weapon drawn; scanning; tense; motion: smooth 2s}
| SCENE:{abandoned warehouse interior; dusty; shafts of light through broken windows; industrial decay}
| LIGHT:{hard sunlight shafts; deep shadows; high contrast; dust particles}
| GRADE:{desaturated; warm sunlight accents; crushed blacks; gritty}
| CAM:{MS; slow dolly following; low angle; 35mm}
| AUDIO:{footsteps echo concrete; metal creak distant; wind through windows}
| REF:{char:"HOLLOWAY"=" " ; loc:"WAREHOUSE_INT"=" " ; style:"GRITTY_NOIR"=" "}
>> TRANSITION:{type: cut; picture_delta_s: 0.00; audio_offset_s: 0.00}
```

## Style 1 — Technical Notation (.md)

The block above, verbatim. The master record: complete, machine-parseable, archival. Every field present, the conformance fields (`FN:`, `INT:`, transition) carried, REF slots empty, no prose.

## Style 2 — Seedance Burst Format (.md)

The same shot as a flowing, self-contained prompt paragraph in the syntax downstream generators consume: every action verb gets a degree adverb, describe only what IS present (no negatives), include audio, keep REF slots empty. The `FN:`/`INT:`/transition fields are pipeline metadata — they do **not** appear in the prose prompt, but they travel with the shot in the array for the battery and the editor.

```
SQ001-SC001-SH001 | 3.20s

Gritty noir thriller. Medium shot, slow dolly pushing in from a low angle on a
35mm lens. A man in his 30s, athletic, short dark hair, wearing a tactical vest,
moves cautiously forward with his weapon drawn, scanning the space tensely and
deliberately. An abandoned warehouse interior, dusty air, hard shafts of sunlight
cutting through broken windows, industrial decay. Hard high-contrast sunlight,
deep shadows, dust particles drifting through the light. Desaturated grade with
warm sunlight accents and crushed blacks. Footsteps echo sharply off concrete,
distant metal creaks, wind moves through the windows.

Character reference @char("HOLLOWAY")=" ". Location reference @loc("WAREHOUSE_INT")=" ".
Style reference @style("GRITTY_NOIR")=" ".
```

## Style 3 — Storyboard Spreadsheet (.xlsx)

One row per shot, full column set, built by `scripts/build_storyboard.py`. Columns:

| Col | Field | | Col | Field |
|---|---|---|---|---|
| A | Shot ID | | K | Scene |
| B | Dur (s) | | L | Light |
| C | Function | | M | Grade |
| D | Intensity | | N | Audio |
| E | Carrier | | O | Dialogue |
| F | Size | | P | Ref (char/loc/style) |
| G | Angle | | Q | Transition (out) |
| H | Movement | | R | Δpic (s) |
| I | Lens | | S | Notes |
| J | Action / Subject | | | |

(The script's exact column order is authoritative.) The totals row sums duration **and** Δpic so the sheet shows `total_picture` — runtime closure, not a naïve duration sum. Shots over the clip ceiling are flagged in Notes; `[LOCK]`/`[TASTE]` flags ride in the duration/notes cells.

## Style 4 — Human-Readable Shot List (.md)

Clean and scannable for directors and crew. No machine syntax, no empty slots; the function and a plain-language intensity may appear as a short tag, but `INT:` numbers, REF, and motion notation are dropped.

```
## SEQUENCE 001 — Warehouse Discovery
### Scene 001 — Warehouse Interior (INT. DAY)

**1.1**  (3.2s)  MS · low angle · slow dolly in · 35mm  · reveal
Holloway enters cautiously, weapon drawn, scanning the dusty warehouse as
sunlight cuts through broken windows. Tense.
Look: desaturated, gritty, crushed blacks, warm light accents.
Sound: echoing footsteps, distant metal creak, wind.
→ cut
```

## Automation flow

1. Build the shot breakdown once as a JSON array (each shot carrying `function`, `intensity`, `carrier`, and any `transition`/`picture_delta`).
2. Style 1 — format each shot as the notation block.
3. Style 2 — reflow each shot's fields into a prompt paragraph (metadata stays in the array, out of the prose).
4. Style 3 — pass the JSON array to `scripts/build_storyboard.py`.
5. Style 4 — format a prose-light digest.

Keep the shot array as the single source so the four never drift apart, and so the conformance fields stay attached to every rendering.
