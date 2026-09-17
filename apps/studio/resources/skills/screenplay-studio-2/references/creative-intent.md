# Creative Intent + Muse

This is the human's creative fingerprint, captured once at the start and threaded into every downstream stage. It is the mechanism that keeps the writer anchored to *your* sensibility on page 90, not just to the outline. It is authored at stage 2, immediately after the Spine.

## Why this exists

Human input that lives only at approval gates evaporates after each gate. By the time prose is generated, the model is working from structural documents, not from the taste that makes the work singular — so drift toward the generic is guaranteed. The Creative Intent capsule fixes this: it is a small, dense artifact that rides along in **every scene brief**, so the writer always has the muse in front of it.

It also feeds the choice-based stages: the divergent options offered at each stage are generated *from* this capsule, so they're already in the neighborhood of the user's taste rather than generic alternatives.

## The Capsule

Five fields. Kept short on purpose — this must fit in every brief.

### 1. Touchstones (3-5)
The films, scripts, shows, directors, or even albums/photographs this should evoke. For each, name *what specifically* to draw from — not the whole thing.

> - *Heat* — the professional-respect-between-adversaries register; the diner scene as the model for the central confrontation.
> - *Nightcrawler* — the protagonist's affectless drive; the city-at-night texture.
> - NOT *Ocean's Eleven* — no slickness, no fun-heist tone. Name the anti-touchstones too.

The anti-touchstones (what this is explicitly *not*) are as valuable as the touchstones — they fence off the generic-adjacent versions.

### 2. The feeling chased
In 1-2 sentences: what should the audience *feel*, and what existing work made them feel it? This is the muse in its purest form — and per the governing principle, deliberately chasing a known feeling is a legitimate target, not a failure of originality.

> "The specific dread of watching someone competent do something irreversible and not stop — the *Whiplash* final-rehearsal feeling, sustained across a whole third act."

### 3. The obsession
The thing the human can't stop thinking about that made them want to write this. The personal, specific, possibly-irrational core. This is often the truest source of distinctiveness because it's unfakeable.

> "What it does to a person to be good at something that hurts people."

### 4. The bad version feared
Name the failure mode explicitly. Naming what you're afraid of is one of the strongest steering signals available — it tells the system precisely what to avoid.

> "I'm afraid this becomes a generic antihero prestige-TV pilot — cool sad man, neon, voiceover, nothing actually at stake."

### 5. The non-negotiables (optional)
Specific moments, images, lines, or beats the human is already committed to and wants protected through development.

> "The film has to end on her hands, not her face. There's a scene where the deal happens entirely in subtext over a child's birthday party."

## Choice-based use

The capsule itself is authored through dialogue, but the system should *offer structured prompts* rather than ask open questions:

- For touchstones: propose a few candidate touchstones inferred from the Spine and seed, and let the human confirm/swap/add. ("Given this Spine, I'd reach for *Heat*, *The Insider*, or *Sicario* — which lineage is closest, or name your own?")
- For the feeling: offer 2-3 candidate "feeling chased" framings to react to.
- For the bad version: offer the most likely generic failure mode for this material so the human can confirm or sharpen it.

## How downstream stages use it

- **Every choice-based stage** generates its divergent options anchored to the touchstones and feeling, and runs each candidate against the bad-version-feared as a disqualifier.
- **Every scene brief** (in the writing phase) includes the full capsule. The writer reads it before generating.
- **The Specificity checks and final Gate** use the capsule as the reference for "is this *ours*?" — a beat that evokes a touchstone passes; a beat that drifts toward the bad-version-feared fails.

## Relationship to the Style Bible

The capsule is the *creative* DNA (what to evoke, what to feel, what to avoid). The Style Bible (`style-bible.md`) is the *executional* DNA (register rules, prose texture, line-level craft). The capsule is authored here at stage 2; the Style Bible is derived from it (also at the front, stage 2's style sub-step) so that the muse's *feeling* becomes the prose's *rules*. Touchstones in the capsule become reference_touchstones in the Style Bible.
