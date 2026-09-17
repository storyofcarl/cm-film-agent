# Scene Craft

The macro foundation (acts, sequences, arcs) determines whether a story is sound. **Scene craft determines whether it reads as world-class or as competent AI.** This is the layer the legacy templates leave unspecified — they plan stories but not scenes. Authored at stage 9 as a per-scene micro-spec, fast to fill, attached to each scene in the breakdown.

## Why this exists

AI scenes have a recognizable signature: they start when characters arrive, end when they leave, deliver their assigned function, name every emotion, and resolve neatly. Each is *correct* and *flat*. The fixes below are exactly the craft moves that separate produced scenes from generated ones — and several also attack the 55%-length problem at its root (scenes that resolve the instant the plot point lands are both short *and* synthetic).

## The Scene Craft Spec

Six fields per scene. Set at breakdown, checked at audit.

```
- Enter on:      [the latest possible moment — the scene's already in motion]
- Exit on:       [the earliest possible moment / the button — cut before the air goes out]
- The turn:      [what charge flips: + to − or − to +. Every scene turns.]
- Surface:       [what the scene appears to be about]
- Underneath:    [what it's actually about]
- Anchor detail: [one concrete, story-specific, non-generic detail]
```

### Enter late / exit early
The most reliable craft move there is. A produced scene is already moving when we arrive and cuts before resolution settles. AI defaults to the full arrival→business→departure; that habit is both the flat-reading problem and a major source of underwriting (the scene feels "done" early because nothing was withheld).

> ❌ Tom parks. Walks to the door. Knocks. Waits. The door opens. "Hi." "Hi. Come in."
> ✅ Open on the door already open, the conversation already wrong.

### The turn
Every good scene **pivots** — the emotional or situational charge at the end is opposite to the start (hope→dread, control→exposure, alliance→betrayal). A scene with a function (EXP, CON, REV) but no turn is information delivery, which reads inert. The legacy templates track function and never the turn; this field adds it. If a scene can't articulate its turn, it probably shouldn't be a scene — fold it into another.

### Surface vs. underneath (subtext as scene design)
Subtext isn't only a dialogue property; it's a scene-design principle. A scene is *about* something on the surface and something else underneath. The negotiation that's really about respect. The dinner that's really about who's leaving. AI writes scenes that are about exactly what they're about — the loudest flatness tell. Naming both layers forces the gap that makes scenes feel alive.

### Anchor detail
One concrete, specific, story-world detail per scene — sensory, surprising, *observed*. Generic detail ("a cup of coffee," "a busy office") is the most common AI texture tell. The anchor detail is the thing that proves a human imagined *this* scene and not the average of all such scenes. Pull from the World/Tone Bible's sensory signature.

> ❌ "She makes coffee." → ✅ "She measures the grounds with the same chipped scoop her mother used, three level, one heaped — the heaped one her small rebellion."

## Specificity inside sound structure (the reconciliation in practice)

This is where "convention earns the structure; specificity earns the distinction" becomes operational. For each scene:

1. **Structural soundness (the skeleton — obey it):** the scene occupies its correct beat, turns, advances want or theme, connects causally to the next. This is enforced, not subverted.
2. **Specific realization (the flesh — make it singular):** *how* the beat plays out is specific — through invention or muse-evocation. Run the per-scene specificity check:
   - **Obvious version:** how does this beat generically go?
   - **Our version + source:** beaten through invention, or deliberately evoking a touchstone? Either passes.
   - **Fail:** the generic default with no specific choice and no chosen source.

A scene must pass **both**. Sound-but-generic fails (it's AI-competent). Specific-but-structurally-broken fails (it's self-indulgent). The top 100 pass both at once — that's the bar.

## Dialogue distinctiveness (per scene)

The voice bible keeps dialogue *consistent and differentiated*; it doesn't make it *good*. Add, per scene:

- **Obliqueness:** is the key thing said directly or around? AI defaults everyone to ~100% direct. Most charged exchanges should route around the point.
- **Best line:** at least one line specific/surprising enough to remember. If every line is functional, the scene is flat — rewrite the on-the-nose ones.
- **Signature moves:** each character's rhetorical habit (deflects with questions, over-precise, answers a different question) shows up where they speak.

## Choice-based use

At the breakdown stage, for pivotal scenes, offer **2-3 ways to realize the beat** — different turns or different surface/underneath pairings, muse-anchored — and let the human pick the angle. Routine connective scenes can be spec'd directly; reserve the choice format for the scenes that carry weight.

## Validation
A scene passes when: it enters late and exits early; it has an articulable turn; surface and underneath differ; it has a specific anchor detail; it's structurally sound AND specifically realized; and its dialogue has obliqueness and at least one memorable line.

## How the suite uses it
- **Studio (breakdown):** fill the spec per scene; offer choices on pivotal scenes.
- **Studio (writing):** the spec is in the scene brief; the writer executes enter-late/exit-early, the turn, the subtext gap, the anchor detail.
- **Analyzer:** scores scenes for turn presence, subtext gap, specificity, and flat/generic tells.
- **Doctor:** repairs flat scenes by supplying a missing turn, widening the surface/underneath gap, or replacing generic detail with anchor detail.
