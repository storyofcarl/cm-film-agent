# Patterns, Pacing & Continuity

Shot patterns, rhythm, and the editing-logic notes that guide assembly even though each clip is generated blind.

## Contents
- Common shot patterns
- Duration targeting + clip ceiling
- Pacing patterns
- Coverage continuity notes
- Transitions in context

## Common shot patterns

**Establishing (scene start):**
```
SH001 EWS establishing location (3–5s)
SH002 WS characters in environment (2–3s)
SH003 MS introducing main character (2–3s)
```
**Conversation coverage:**
```
SH001 two-shot (2–3s)
SH002 over-shoulder speaker A (2–3s)
SH003 over-shoulder speaker B (2–3s)
SH004 CU reactions (1–2s each)
SH005 two-shot for the connection beat (3s)
```
**Reveal:**
```
SH001 CU mysterious detail (2s)
SH002 slow pull back (3s)
SH003 WS reveals full context (4s)
```
**Action:** quick cuts (0.5–1.5s), impact frames with shake, dutch angles for disorientation, slow motion on key moments (specify in SUBJECT motion).

## Duration targeting + clip ceiling

- Quick cuts 0.5–1.5s (action, urgency); standard 2–3s (dialogue, exposition); long takes 4–8s (contemplation, building tension); very long 8s+ (establishing, extreme holds).
- **Model clip ceiling:** most generators produce one clip in a limited window (Seedance 2.0 ~4–15s; many cap near 5–10s). A shot longer than the target model's per-generation limit must be split or re-planned — **flag any shot over ~10s for chaining.** Do not silently write 12s holds assuming one generation covers them.

## Pacing patterns

Accelerating (progressively shorter, building tension); decelerating (progressively longer, winding down); steady (consistent, stability); alternating (quick/long for rhythm); chaotic (random, disorientation). The pacing pattern must agree with the beat's `FN:` tag (see references/conformance-fields.md).

## Coverage continuity notes

Generated clips are assembled by a human editor, so the shot list should respect editing logic even though each clip is generated blind:
- **180° rule** — keep screen direction consistent across a conversation's coverage; note intended eyelines when shot/reverse could flip.
- **Eyeline matching** — for inserts and POVs, note where the looking character's gaze lands so the cut reads.
- **Screen direction** — for chases and movement across scenes, keep travel direction consistent (a left-to-right journey) unless a reversal is intentional.
Put these as brief notes in the ACTION field or a NOTES column; they don't change the stateless prompt but guide assembly.

## Transitions in context

Transition *types* are: cut (immediate), fade to black (time passing/ending), dissolve (gentle connection), match cut (visual/thematic match), wipe (stylized). In shot-format-4 a transition is not just a note — it is a typed object that owns its time (`>> TRANSITION:{...}`), so it participates in runtime closure. See references/conformance-fields.md for the `picture_delta_s` / `audio_offset_s` model and the closure rule.
