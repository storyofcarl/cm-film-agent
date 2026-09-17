# AI-Tells Scrub

A concrete, finite checklist of the surface patterns that make prose read as AI-generated. The deeper distinctiveness work (Spine, specificity, scene craft) removes most genericness; this scrub removes the residual *surface* layer that can survive sound craft. Used by the analyzer to detect (with page numbers) and the doctor to repair (toward the Style Bible).

## Why a separate scrub

Even a well-developed, specific script can carry AI fingerprints at the sentence level — tics that have nothing to do with story and everything to do with how language models default. They're mechanical to catch and mechanical to fix, so they get their own pass rather than diluting the craft audits.

## The checklist

### Structural prose tics
- **Tidy rule-of-three.** Reflexive triplets ("the cold, the dark, the silence"; "she ran, she fell, she rose"). Real prose varies; AI defaults to threes. Flag clusters.
- **"Not just X, but Y."** And its cousins: "It wasn't X. It was Y." Reflexive contrastive framing used for false emphasis.
- **"A mix of X and Y."** Hedged compound descriptors that name two things instead of choosing the precise one.
- **Balanced/hedged phrasing.** Every statement immediately qualified ("powerful, yet fragile"; "confident but unsure"). Reads as the model covering both sides.
- **Summarizing-then-restating.** A line that says the thing, then a line that re-says it slightly differently. Pick one.

### Emotional tells
- **Naming the emotion.** "She felt a wave of grief." "He was overcome with rage." Produced scripts *show*; the named emotion is the tell. (Overlaps the Style Bible's interiority ban — but flag it here at the line level too.)
- **Over-explained reactions.** "He paused, realizing what this meant for everything he'd worked for." The explanation is the tell; trust the action.
- **Theme stated aloud.** A character announcing the point, usually Act 3. The single biggest AI tell in a screenplay. (Cross-ref theme-and-opposition.)

### Action-line tells
- **Stage-managed "we see / we watch / we find."** Unless the Style Bible permits, these narrate the camera instead of the action.
- **Over-choreographed blocking.** Every micro-movement narrated ("he stands, walks to the window, looks out, turns back"). Cut to the meaningful beat.
- **Adverb inflation.** "She walked slowly and carefully across the room." The adverbs pad and weaken; choose a stronger verb or cut.
- **Generic detail.** "A cup of coffee," "a busy street," "an old building." The absence of a specific anchor detail. (Cross-ref scene-craft anchor detail.)

### Dialogue tells
- **Everyone equally articulate.** All characters speak in the same complete, grammatical, on-point register. Differentiation collapsed.
- **On-the-nose exchanges.** Characters say exactly what they mean and want. No obliqueness. (Cross-ref scene-craft.)
- **Exposition hand-offs.** "As you know..." / characters telling each other things they both already know for the audience's benefit.
- **Tidy button lines.** Every scene ending on a too-clean quip or thematic capper. Vary it; let some scenes end raw.

### Resolution tells
- **Everything resolves neatly.** Every thread tied, every beat landing on schedule, no ragged edges. Real scripts leave deliberate roughness.
- **Symmetry overload.** Too-perfect callbacks and parallels that announce themselves. Echoes should reward attention, not demand applause.

## Severity

Not all tells are equal. Repair order:

1. **High (always fix):** theme stated aloud; naming emotions; on-the-nose dialogue; generic detail in pivotal scenes.
2. **Medium (fix unless deliberate):** rule-of-three clusters, "not just X but Y," over-explained reactions, stage-managed camera narration.
3. **Low (fix if dense):** adverb inflation, tidy buttons, minor symmetry. A few are fine; density is the problem.

## Important caveat — some of these are legitimate tools

Each pattern is a *default-overuse* problem, not a banned construction. A rule-of-three can be deliberate and great. A stated theme can be a character's earned, ironic lie. "We see" is correct in some house styles. The scrub flags **reflexive, dense, or unmotivated** use — not every instance. The doctor checks the Style Bible and Creative Intent capsule before repairing: if a "tell" is a deliberate, muse-justified choice, it stays.

## How the suite uses it

- **Analyzer:** runs the scrub as part of the Style & Register dimension; reports flagged instances with page numbers and severity.
- **Doctor:** Category 8 repair; rewrites flagged instances toward the Style Bible, preserving any deliberate use.
- **Studio (writing):** the high-severity tells are included as live constraints in the scene brief, so the writer avoids them at generation rather than only catching them after.
