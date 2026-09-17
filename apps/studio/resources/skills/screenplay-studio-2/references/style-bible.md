# Style Bible

The screenplay's narrative voice, encoded as concrete, checkable rules — the executional DNA that makes prose consistent, intentional, and aimed at the muse. It does for the *writing* what the voice bible does for *character dialogue*. Authored at the front (stage 2, as the style sub-step of Creative Intent + Muse), because if the script evokes a muse, the style *is* the point and must shape everything downstream — not get applied as a finishing coat.

## Why this exists

Without a Style Bible, "style" gets re-decided implicitly on every scene, by every skill, with no memory. That's why prose drifts and why "be leaner" or "be more lyrical" never sticks across a full script. The Style Bible is authored once with the user and then obeyed by the writer, scored by the analyzer, and repaired toward by the doctor. Set it once; it holds across the whole script and across sessions.

It is also the bridge from muse to mechanics: the touchstones in the Creative Intent capsule become the `reference_touchstones` here, and the muse's *feeling* becomes the prose's *rules*.

## Register vs. Rhythm (the key distinction)

Two independent dials. Conflating them is the source of the novelistic-action problem.

- **Register** = *texture*. Spec-lean (default) vs. elevated (lyrical). Controls whether interiority/metaphor are permitted.
- **Rhythm** = *pacing*. Tied to tension level. Controls sentence length and scene speed.

They are orthogonal. A tense scene and a calm scene are **both spec-lean** unless a scene is explicitly flagged elevated. High tension makes a lean scene *shorter and punchier*; it does not make it *lyrical*. Low tension lets a lean scene *breathe*; it does not license metaphor and interiority. This separation is what lets you have "poetic at times" as a deliberate, budgeted choice instead of an accident.

## The Artifact

```json
{
  "project": "TITLE",
  "house_style": {
    "reference_touchstones": [
      "Action economy of a Taylor Sheridan script",
      "Atmospheric restraint of NO COUNTRY FOR OLD MEN — silence carries",
      "NOT the wall-to-wall density of a Shane Black script"
    ],
    "default_register": "spec_lean",
    "tense": "present",
    "person": "implied third (camera POV)",
    "action_block_max_lines": 3,
    "dialogue_action_ratio_target": "45/55"
  },

  "lean_register_rules": {
    "must": [
      "Camera-visible action only — if it can't be photographed, cut it",
      "Subject-verb-object, active voice",
      "One image per block; white space is pacing"
    ],
    "banned": [
      "Interiority: 'she realizes', 'he remembers', 'feeling that...'",
      "Simile/metaphor in routine action",
      "Abstract nouns: longing, emptiness, 'the weight of'",
      "Rhetorical questions in narration",
      "Adverb stacking to inflate length",
      "'we see' / 'we watch' unless house_style permits"
    ]
  },

  "elevated_register": {
    "when_permitted": [
      "Opening image", "Closing image",
      "Major emotional turns (flagged scenes only)",
      "Montage / tonal set-pieces"
    ],
    "rules": [
      "Still present-tense and filmable",
      "One metaphor maximum per scene",
      "No interiority that can't be photographed"
    ],
    "budget": "~5-10 scenes for a feature; list them explicitly"
  },

  "rhythm": {
    "tension_low":  "Varied sentence length, room to breathe — still lean",
    "tension_high": "Short. Punchy. Fragments allowed.",
    "note": "Rhythm changes with tension; REGISTER does not."
  },

  "samples": [
    {
      "register": "spec_lean",
      "context": "routine action",
      "example": "Elena crosses the warehouse. Pauses at every shadow.",
      "why": "Filmable, rhythmic, zero interiority"
    },
    {
      "register": "elevated",
      "context": "opening image",
      "example": "Dawn bleeds across the rooftops. The city, for one held breath, is still.",
      "why": "Deliberate tonal beat — earns its single metaphor"
    },
    {
      "register": "violation",
      "context": "what to avoid",
      "example": "Elena feels the crushing weight of everything she's lost as memories flood back.",
      "why": "Interiority + abstraction + unfilmable — never in lean register"
    }
  ]
}
```

The `violation` sample does the same job as the voice bible's `never_says`: a concrete negative example is the single most effective control for keeping an LLM in register.

## Choice-based authoring

The control surface is three questions, each offered as choices to react to (not open prompts):

1. **Touchstones** — propose 2-3 candidate prose lineages from the capsule's touchstones; the human confirms/swaps. ("Read like Sheridan's economy, McCarthy's restraint, or Sorkin's velocity?")
2. **Default leanness** — offer a position on the lean↔literary axis with an example line at each, human picks.
3. **Elevated budget** — propose how many and which scenes get to be lyrical (opening, closing, the two big turns), human adjusts.

That's the whole dial. Set those three and style becomes consistent and intentional.

## How the suite uses it

| Skill | Uses Style Bible to... |
|-------|------------------------|
| Studio (Phase 1) | Author it with the user, derived from the Creative Intent capsule. |
| Studio (writing) | Obey default_register per scene; go elevated only for budgeted scenes; respect block-length and banned lists. |
| Analyzer | Score the Style & Register dimension *against this bible*, not generic "good prose." |
| Doctor | Category 8 repairs toward this bible; "stay in voice" finally means something specific. |
| Integrator | The register-evaluation pass checks drafts against this same artifact. |

One artifact, whole pipeline.
