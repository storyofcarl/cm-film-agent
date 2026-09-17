# Advanced Shot Format Techniques

This reference provides advanced cinematographic patterns and technical specifications for complex video generation scenarios.

## Contents
- Complex Camera Movements
- Advanced Lighting Setups
- Advanced Grading Techniques
- Motion Control Specifications
- Complex Scene Specifications
- Audio Design Patterns
- Multi-Character Dialogue
- Visual Effects Integration
- Cross-Shot Consistency Without State
- Platform-Specific Considerations
- Troubleshooting Common Issues
- Advanced Shot Transitions
- Time Manipulation

## Complex Camera Movements

### Combined Movements

**Dolly + Pan** (moving and turning simultaneously)
- Example: `CAM:{MS; dolly left + pan right tracking subject; eye-level; 35mm}`
- Use for: Following action while maintaining composition

**Crane + Tilt** (rising/falling while tilting)
- Example: `CAM:{WS→EWS; crane up + tilt down; high angle revealing; 24mm}`
- Use for: Dramatic reveals, establishing shots with scope

**Orbit + Push** (circling while moving closer)
- Example: `CAM:{CU→ECU; orbit 180° + push in; eye-level; 50mm}`
- Use for: Intense emotional moments, building to revelation

### Speed Variations

Specify camera movement speed when critical:
- `slow dolly` (contemplative, building)
- `rapid dolly` (urgency, energy)
- `accelerating push` (building intensity)
- `decelerating pull` (settling, resolution)

## Advanced Lighting Setups

### Rembrandt Lighting
`LIGHT:{key 45° side-front; triangle highlight under eye; fill minimal; rim separation}`
- Classic portrait lighting with triangle of light on shadow side

### Butterfly Lighting
`LIGHT:{key directly above-front; butterfly shadow under nose; fill soft; glamorous}`
- Beauty lighting, symmetrical, flattering

### Split Lighting
`LIGHT:{key 90° side; half face lit, half shadow; dramatic; no fill}`
- Extreme drama, mystery, duality

### Rim/Edge Lighting Dominant
`LIGHT:{key back-side; rim defines edge; front minimal; silhouette tendency}`
- Separation, mystery, dramatic outline

### Motivated Practical Patterns
- Window light: `LIGHT:{window right; soft natural; falloff left; motivated}`
- Screen glow: `LIGHT:{screen blue uplight on face; dark ambient; technology mood}`
- Fire light: `LIGHT:{fire orange flicker; warm irregular; dancing shadows}`
- Candle: `LIGHT:{candle warm soft; close intimate; gentle falloff}`

## Advanced Grading Techniques

### Specific LUT Styles

**Teal-Orange (Thriller/Action Standard)**
`GRADE:{teal shadows; orange highlights; high separation; cinematic blockbuster look}`

**Bleach Bypass (Gritty Realism)**
`GRADE:{desaturated; crushed blacks; blown highlights; high contrast; silver retention look}`

**Cross-Processing (Fashion/Music Video)**
`GRADE:{shifted colors; cyan shadows; yellow highlights; contrasty; stylized}`

**Day-for-Night (Faux Night)**
`GRADE:{heavy blue; underexposed; add grain; simulate night from day footage}`

### Selective Color Grading

`GRADE:{monochrome base; red coat only color; high contrast; Schindler's List approach}`
- Isolate single element with color in otherwise B&W image

`GRADE:{desaturated 70%; warm skin tones preserved; cool environment; subject emphasis}`
- Partially desaturate everything except skin tones

### Film Stock Emulations

**Kodak Vision3 5219 (500T)**
- Warm skin tones, rich blacks, slight grain, cinematic standard

**Fuji Velvia (Slide Film)**
- Highly saturated, punchy colors, contrasty, landscape/commercial look

**Kodak Portra (Portrait)**
- Flattering skin tones, soft colors, gentle contrast, natural beauty

Note in GRADE field: `GRADE:{Kodak 5219 emulation; warm rich; cinematic}`

## Motion Control Specifications

### Animation Timing

**Full Animation (on 1s):** 24fps, every frame
- `motion: smooth 1s` - Fluid, realistic, no stutter

**Limited Animation (on 2s):** 12fps, every other frame
- `motion: fluid 2s` - Standard animation, slight stutter adds style

**Very Limited (on 3s):** 8fps, every third frame
- `motion: stepped 3s` - Choppy, stylized, energy-saving technique

### Advanced Motion Descriptors

**Anticipation**
- `motion: anticipation before action; coil then release; snappy 2s`
- Character prepares visibly before action

**Follow-Through**
- `motion: follow-through on stop; secondary motion; fluid 2s`
- Body parts continue motion after main body stops

**Overlap**
- `motion: overlapping action; limbs lag; fluid 2s; natural timing`
- Different parts move at different times

**Smear Frames**
- `motion: smear frames on fast movement; motion blur stretching; impact`
- Exaggerated blur frames on quick actions

**Impact Frames**
- `motion: impact frame hold 3 frames; strong pose; then release`
- Strong held pose on impacts for emphasis

**Ease In/Ease Out**
- `motion: ease in slow; accelerate; ease out slow; smooth 2s`
- Gradual acceleration and deceleration (natural physics)

## Complex Scene Specifications

### Multi-Layer Depth

**Foreground/Midground/Background Specifications**

```
SCENE:{foreground: rain streaks on camera; midground: character walking through puddles; background: city lights bokeh; three distinct depth planes}
```

### Atmospheric Effects

**Volumetric Lighting**
`SCENE:{warehouse; dust particles; volumetric light shafts; atmospheric depth; haze}`

**Weather Integration**
`SCENE:{urban street; rain heavy; puddle reflections; mist rising from warm ground; neon bleeding in water}`

**Particle Systems**
`SCENE:{forest; fireflies floating; pollen drifting; magical particles; layered depth}`

### Environmental Storytelling

Include story-telling details:
```
SCENE:{detective's office; cork board with photos connected by string; coffee stains on documents; flickering fluorescent; obsessive workspace}
```

## Audio Design Patterns

### Layered Soundscapes

**Sparse (Tension)**
```
AUDIO:{breathing only; heartbeat low; pin-drop silence broken; minimal; MIX:isolated}
```

**Rich (Immersion)**
```
AUDIO:{city ambience layered: traffic distant, pedestrians near, construction far, pigeon wings, street musician; MIX:complex environmental}
```

**Subjective (Character POV)**
```
AUDIO:{muffled underwater quality; heartbeat emphasized; dialogue distant; ringing tone high; MIX:subjective disassociation}
```

### Music Integration

**Diegetic (In-World)**
`AUDIO:{radio playing jazz; character reaches over, turns up volume; diegetic source; room acoustics}`

**Non-Diegetic (Score)**
`AUDIO:{orchestral score swelling; emotional underscore; non-diegetic; audience only}`

**Diegetic→Non-Diegetic Transition**
`AUDIO:{car radio song; camera pulls back, song swells to full score; diegetic becomes non-diegetic}`

### Sound Design Transitions

**Pre-Lap Audio**
- Sound from next shot begins before visual cut
- `AUDIO:{pre-lap: next scene's rain starts; current scene ending; transition prepared}`

**Post-Lap Audio**
- Sound from previous shot continues into next
- `AUDIO:{post-lap: previous explosion reverb continues; ringing ears; impact carried}`

**Sound Bridge**
- Audio connects two disparate shots
- `AUDIO:{phone ring bridges location change; continuous sound; connection}`

## Multi-Character Dialogue

### Overlapping Speech

```
DIALOG:{Mark; interrupting} "But that's not what I—"
DIALOG:{Sarah; talking over} "—you never listen! That's the problem!"
```

### Group Conversations

```
DIALOG:{Multiple speakers; overlapping chaos} "What?" "No way!" "Are you serious?" "This can't be—"
```

### Off-Screen Voice

```
DIALOG:{Detective; off-screen} "Don't move."
| SUBJECT:{suspect; frozen; eyes widening; fear registering}
```

## Visual Effects Integration

### Practical FX

**Fire/Smoke**
`SUBJECT:{building; practical fire effects; smoke billowing; heat distortion; real elements}`

**Water/Rain**
`SUBJECT:{character; practical rain rig; soaked clothing; water streams; real wetness}`

### Post-Production FX Markers

Note intended VFX in the NOTES column or SUBJECT field:
- `SUBJECT:{character; mark for cape VFX; practical costume; digital cape added post}`
- NOTES: `green screen background; replace with cityscape in post; match character lighting to future comp`

## Cross-Shot Consistency Without State

Generators have no memory and no PERSIST tag. Consistency across shots comes from two mechanisms only: **explicit re-description** and **reference anchoring (REF slots)**.

### Evolving State Through Re-Description

To show change across shots, describe the new absolute state each time — never "now wetter than before."

**Shot 1:**
`SCENE:{warm lighting; character dry; normal world}` · `REF:{char:"NAME"=" " ; style:"WARM_NORMAL"=" "}`

**Shot 2:**
`SCENE:{cooling light; character's shoulders damp; rain beginning}` · `REF:{char:"NAME"=" " ; style:"COOL_RAIN"=" "}`

**Shot 3:**
`SCENE:{cool blue light; character fully soaked, hair flattened; heavy rain}` · `REF:{char:"NAME"=" " ; style:"COOL_RAIN"=" "}`

### Thematic Motifs

Re-state the motif in SCENE every time it should appear; track it in the Director's Vision motif tracker so you know which shots carry it.
```
SCENE:{... red balloon visible in background; blue-grey palette; urban isolation}
```

### Character Arc Through Wardrobe/Posture

Encode arc as concrete, absolute description in SUBJECT, re-stated per shot:
```
Shot 1: SUBJECT:{NAME; clean pressed suit; confident upright posture}
Shot 5: SUBJECT:{NAME; suit rumpled, tie loosened; defeated slumped posture}
Shot 10: SUBJECT:{NAME; jacket gone, sleeves rolled; determined squared posture}
```
The REF `char:` slot keeps the *face* consistent; the SUBJECT text drives the *change*.

## Platform-Specific Considerations

### Aspect Ratios

**Horizontal (16:9)** - Standard
- Note: `CAM:{WS; locked; 16:9 standard horizontal}`

**Vertical (9:16)** - Social Media
- Note: `CAM:{MS; locked; 9:16 vertical for social}`
- Adjust compositions for vertical framing

**Square (1:1)** - Instagram
- Note: `CAM:{MCU; locked; 1:1 square for Instagram}`

**Cinematic (2.39:1)** - Widescreen
- Note: `CAM:{EWS; locked; 2.39:1 anamorphic widescreen}`

### AI Platform Limitations

### AI Platform Notes

Match specifications to the target model's strengths and limits. Per-generation clip length and reference-tag syntax vary, so confirm the active model before finalizing.

**Seedance 2.0** (primary pipeline tool):
- 4–15s per generation; native synchronized audio; up to 9 image refs (@Image1–9), 3 video, 3 audio
- No negative prompts — describe only what IS present
- Multi-shot "shot switch" chaining within one generation

**Kling:**
- Strong motion and physics; good for dynamic action
- Image-to-video with start/end frame control

**Vidu:**
- Fast iterations; reference-to-video character consistency features

**Dreamina:**
- Storyboard-to-video workflows; tight integration with shot-style inputs

When the target model is unknown, write model-agnostic specs (keep REF slots empty, state durations plainly, avoid model-specific keywords) and let the generating-seedance-prompts skill or the operator adapt.

## Troubleshooting Common Issues

### Problem: Visual Inconsistency Between Shots

**Solution:** Strengthen re-description and lock the REF slot
```
Repeat the exact look in every shot's LIGHT and GRADE: key right 45°, fill left soft, rim back; cool blue grade #1A4D6E; character red jacket #C41E3A.
Anchor identity with REF:{char:"NAME"=" " ; style:"COOL_NOIR"=" "} pointing to the same reference plate each time.
```

### Problem: Motion Looks Unnatural

**Solution:** Specify motion style more clearly
```
SUBJECT:{character walking; motion: weighted 2s; heel-to-toe; natural gait; slight secondary motion in arms; realistic physics}
```

### Problem: Audio Doesn't Match Mood

**Solution:** Layer audio more thoughtfully
```
AUDIO:{base: room tone quiet; layer 2: distant traffic; layer 3: clock ticking; layer 4: breathing; MIX:tension through minimal layering}
```

### Problem: Color Grade Inconsistent

**Solution:** Use specific color values and reference points
```
GRADE:{cool blue #2C4A7C shadows; warm highlight #D4A574; 60% saturation; contrast ratio 4:1; specific parameters for consistency}
```

## Advanced Shot Transitions

### Match Cut

```
Shot 1: SUBJECT:{character closes eyes}
Shot 2: ACTION:{match cut}; SUBJECT:{same character opens eyes different location}
```

### J-Cut / L-Cut

```
Shot 1: AUDIO:{dialogue continues into next shot; J-cut}
Shot 2: ACTION:{visual cuts but audio carries}; AUDIO:{previous dialogue finishing}
```

### Graphic Match

```
Shot 1: SUBJECT:{circular clock face; centered; graphic emphasis}
Shot 2: ACTION:{graphic match}; SUBJECT:{circular portal; same position; visual echo}
```

### Whip Pan Transition

```
Shot 1: CAM:{MS; whip pan right exit frame; motion blur transition}
Shot 2: CAM:{MS; whip pan enters left; continuous motion feel; matched speed}
```

## Time Manipulation

### Slow Motion

```
SUBJECT:{bullet shell ejecting; motion: slow motion 120fps to 24fps playback; 5x slower; detail visible}
```

### Fast Motion (Time Lapse)

```
SCENE:{city street; motion: time lapse 1440x speed; day to night in 2s; clouds rushing; light painting trails}
```

### Speed Ramping

```
SUBJECT:{fighter punching; motion: speed ramp (normal→slow→normal); impact at slowest; emphasis}
```

## This reference enables advanced technical specifications for complex video generation scenarios. Use these techniques when projects require sophisticated cinematographic control beyond basic shot formatting.
