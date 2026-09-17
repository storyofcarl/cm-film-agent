# Worked Example

A complete beat showing creative direction plus the conformance fields, a bible entry demonstrating the naming convention, and structure guidance.

**User request:** "A detective discovers crucial evidence in a dark apartment. Thriller genre."

## Direction

**Genre:** thriller — tension, mystery, controlled revelation.
**Emotional beat:** discovery/revelation, building from searching to realization.
**FUNCTION:** `reveal ; secondary: intensify`
**Intensity:** rises 4 → 7; carrier channels: cut rhythm, then stillness/silence on the reveal.

**Color:** desaturated cool blues and greys; a single warm practical (desk lamp) makes an isolated pool of light on the evidence, pulling the eye to the discovery point.

**Lighting:** low key, single source (desk lamp), deep shadows; high contrast emphasizes the revelation; practical motivation keeps it grounded.

**Camera:**
- Start — handheld medium shots following Vance searching (restless).
- Middle — slow push-in as he notices something (building focus).
- Peak — static CU on evidence, then ECU on Vance's eyes (realization).
- Resolution — pull back, Vance in context with new knowledge.

**Pacing:** accelerating, 3s → 2s → 1.5s as urgency builds; hold `3.00s [LOCK]` on the evidence reveal (locked to the score); react 2s on Vance.

**Blocking:** enters frame left (unknown territory); moves across frame (active search); stops center frame on noticing (focus); evidence on rule-of-thirds right where his eyeline leads.

**Power:** starts low angle (overwhelmed by the case); shifts to eye level on discovery (gaining control).

**Audio:** sparse — footsteps, breathing, paper; silence on the discovery; a single piano note as realization hits.

**Transition out:** `L-cut` into the next scene — the piano note carries over the cut to the corridor (`audio_offset_s: +1.00`).

**Rationale:** handheld uncertainty builds tension; slow push and stillness create focus; silence and the held frame deliver impact; the eye ECU conveys the paradigm shift before the pull-back contextualizes. The single warm light in cool dark is the "light of truth" in the mystery.

## Bible entry (demonstrating the naming convention)

1940s American detective, defining trait: weary persistence.

```
### Cordell Vance  (REF key: VANCE)
- Names considered: Cordell ("heart"), Merrick ("fame/power"), Sterling ("little star").
  Chose Cordell — the "heart" root fits a detective who feels every case.
  Surname Vance (occupational/geographic, period-appropriate). Modification: drop the
  expected "Detective" honorific in dialogue; colleagues call him "Vance" flat, slightly cold.
- Identity: man, late 40s, heavyset, deep-lined face, perpetual five-o'clock shadow
- Hair / face: greying close crop; tired eyes; one chipped front tooth
- Wardrobe: rumpled grey trench over a brown suit; loosened tie (default)
- Palette association: muted browns and greys; never wears cool colors
- Movement signature: heavy, deliberate; pauses before he moves
- Lighting affinity: hard side light, half his face in shadow
- Reference target: ShotDeck — "film noir detective, single source, 1940s, low key"
```

## Structure guidance

- This is a single scene (one location: dark apartment).
- The discovery beat is one sequence (searching → finding → realizing).
- In a feature it might be SQ004 or SQ005 within Act 2 (Confrontation).
- If the investigation continues to other locations, those become additional scenes within the same sequence; a full investigation sequence might span 3–5 scenes.

Shot Format breaks this into SQ###-SC###-SH### shots whose REF slots read `char:"VANCE"=" "`, carrying the beat's function tag, intensity value, and transition object forward.
