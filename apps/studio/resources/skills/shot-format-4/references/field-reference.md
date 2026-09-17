# Field Reference

Detailed guidance for each field in the technical-notation shot. The format block and a worked example live in SKILL.md; this file is the per-field depth.

## Contents
- ACTION
- TEMPO + concept
- FN (function) and INT (intensity) — see references/conformance-fields.md
- SUBJECT (with motion notation)
- SCENE
- LIGHT
- GRADE
- CAM
- AUDIO
- DIALOG
- REF

## ACTION

Brief description of what happens. Format: `ACTION:{brief action}; CAMERA:{camera movement};`. Keep concise; expand detail in SUBJECT and the other fields.
- `ACTION:{detective discovers evidence}; CAMERA:{static hold};`
- `ACTION:{car chase through city}; CAMERA:{tracking side};`

## TEMPO + concept

Overall movement energy, then a single thematic concept tag.
- `[STATIC]` minimal movement, contemplative · `[DYNAMIC]` active motion · `[STATIC→DYNAMIC]` builds · `[DYNAMIC→STATIC]` decelerates.
- Concept: `/* Tension */`, `/* Discovery */`, `/* Joy */`. Example: `— [STATIC] /* Dread */`.

## FN and INT

The function tag and intensity value carried from the playbook beat. Full guidance and the runtime-closure rule are in **references/conformance-fields.md**.

## SUBJECT

Character/object descriptions with motion. Include physical appearance, wardrobe/props, motion style, animation style if relevant; separate multiple subjects with semicolons.

**Motion notation** is animation-pipeline language; the *descriptors* also direct motion character in live action.
- `motion: fluid 2s` (12fps animation feel) · `motion: snappy 1s` (24fps) · `motion: stepped 3s` (8fps choppy).
- Live action: prefer plain descriptors — `motion: weighted, deliberate` / `motion: frantic handheld energy`.
- Descriptors: fluid, smooth, floating, drifting, graceful; snappy, sharp, quick, energetic; stepped, staccato, choppy; rotoscope-feel; pose-to-pose; smear frames; impact frames; secondary motion (hair, cloth lag); weighted (mass and gravity).

Examples:
- `SUBJECT:{woman 25; red dress; running; panicked; motion: fluid 2s}`
- `SUBJECT:{detective; trench coat; studying evidence; contemplative; minimal motion}`

## SCENE

Environment and background: interior/exterior and location type; background depth; atmosphere (fog, rain, dust, smoke); time of day, weather; set dressing; spatial scale.
- `SCENE:{interior office; glass walls; city view; modern minimalist; evening}`
- `SCENE:{urban alley; wet pavement; neon reflections; trash and graffiti; night}`

## LIGHT

Key position (front/side/back/top/bottom); fill or neg fill; rim/edge; practicals; quality (soft/harsh/diffused/direct/bounce); shadow specifics; color temperature if relevant.
- `LIGHT:{single harsh key side; neg fill; deep shadows; high contrast noir}`
- `LIGHT:{neon practicals; colored gels pink/cyan; hard shadows; stylized}`

## GRADE

Palette; saturation (saturated/desaturated/muted/vibrant/monochrome); contrast (high/low/flat/crushed blacks/blown highlights); temperature (warm/cool/neutral/golden/icy/steel/amber); accents; optional film-stock or LUT-style (teal-orange, bleach bypass).
- `GRADE:{desaturated cool blues; teal-orange separation; crushed blacks; clinical}`
- `GRADE:{warm golden; soft glow; gentle contrast; romantic nostalgic}`

## CAM

Format: `CAM:{shot size; movement; angle; lens}`.
- **Sizes:** EWS, WS, FS, MS, MCU, CU, ECU.
- **Angles:** eye-level, high, low, dutch, bird's eye, worm's eye.
- **Lenses (35mm equiv):** 14–24mm ultra-wide; 35mm standard wide; 50mm normal; 85mm portrait; 100–200mm telephoto.
- **Movement:** static, locked, handheld shake, smooth glide, tracking, dolly, crane, orbit, pan, tilt, zoom.
- `CAM:{MS; dolly following; eye-level; 35mm}` · `CAM:{ECU; subtle handheld; dutch 15°; 50mm}`

## AUDIO

Dialogue (also use DIALOG field); SFX (specific, evocative); ambient; music (diegetic/score, style, mood); mix notes.
- Mix descriptors: dry/wet/echo/muffled/crisp/harsh/soft; close/distant/layered/isolated.
- `AUDIO:{footsteps echo concrete; dripping water; distant machinery hum; ominous drone}`
- `AUDIO:{silence heavy; breathing only; heartbeat emphasized; tension}`

## DIALOG (optional)

Only when characters speak. Format: `DIALOG:{character; emotion/delivery} "spoken text"`.
- `DIALOG:{Sarah; panicked whisper} "They're coming. We have to go now."`

## REF (reference anchoring)

Format: `REF:{char:"NAME"=" " ; loc:"NAME"=" " ; style:"NAME"=" "}`. Names in quotes must match the Director's Vision bible exactly. Repeat `char:` per character present. Leave every value `" "`; the downstream step fills the model-specific tag. Omit a slot only when it doesn't apply.
- `REF:{char:"ELARA"=" " ; loc:"THRONE_ROOM"=" " ; style:"JEWEL_FANTASY"=" "}`
- `REF:{loc:"CITY_ROOFTOP_NIGHT"=" " ; style:"NEON_NOIR"=" "}` (no character in frame)

Do **not** use "continues," "same as," "maintains," or any language assuming prior context. State visual parameters explicitly in each shot and anchor identity with REF.

## Duration format

Seconds with two decimals: `2.50s` ✓, `2.5s` ✗, `0.75s` ✓, `.75s` ✗. A duration may carry a flag: `3.00s [LOCK]`.
