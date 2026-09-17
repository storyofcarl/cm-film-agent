# occ Methodology — source to finished video

The playbook for taking a creative source (screenplay, script, treatment) to a
finished video with occ. Every rule here was paid for in a real production
cycle — follow them and the next project skips the re-learning.

---

## 1. Know the model before you build (Seedance 2.0)

- **Omni-reference.** Seedance takes cast/asset reference *images* directly and
  binds them to `@Image1…@Image9` tags. You reference assets; you do not
  describe them. (The count is **per model** — 2.5 takes 30; see §14. occ
  prints the segment's own cap in its `refs=N/M` ledger, so read that, not the 9.)
- **Natively multi-shot.** One generation of up to ~15s renders *many* shots
  with hard cuts — one multi-shot **segment** — and everything inside that one
  generation is mutually consistent. Consistency holds *within* a generation,
  not across.
  → Prefer dense multi-shot segments in fewer generations over many short
  single-shot clips (more separate generations = more drift).
  - **Terminology (do not conflate).** A *segment* is one Seedance generation;
    it may hold many hard cuts or none — that alone does **not** make it a
    "burst." A **burst** (burst frame video) is a distinct format: a rapid-fire
    ~5-second clip of ~20 shots, handled by the burst-board-video skill. Never
    call a segment a burst, and never call a segment's multi-shot Action a
    "shot burst."
- **Prompt limit ≈ 3000–4000 characters.** Simplified Chinese is far denser and
  native to the model — write shot direction in Chinese.
- **`generate_audio` is one on/off switch.** For a music video whose real track
  is muxed in post, keep it **off**: generated singing trips output-audio
  moderation *and* gets discarded anyway.
  - **Pure-instrumental output audio trips moderation too.** A segment whose
    only generated audio is score fails `OutputAudioSensitiveContentDetected`
    deterministically; the same score cue under dialogue passes (EmptySpace:
    2 score-only fails, 13 score-under-dialogue passes). On a generated-audio
    project, give dialogue-free segments a per-segment `no_music: true` +
    an `<>` SFX ambience cue, and let `()` score cues ride only segments
    that carry dialogue.

## 2. The references rule

The single biggest source of wasted spend. Get this right.

- **Never describe anything that has a reference.** A text description fights
  and overrides the reference image. `@Image2 Teacher` — nothing more.
- **Characters → reference images.** Turnaround sheets, attached per shot.
- **Realistic / live-action people → trusted-library assets.** Seedance
  intercepts reference images of real-looking humans (deepfake / copyright
  safety), so a raw photo is rejected. Such a cast member is referenced by a
  *pre-registered* `asset://asset-...` from the BytePlus private portrait
  library (virtual-portrait or real-human). In `project.yaml` it is written
  `cast: { Name: { asset: asset-... } }`; occ @Image-tags it exactly like an
  image reference, so "never describe a reference" still applies. Registering
  the asset is done outside occ (console / asset API); occ only consumes the id.
- **Environments → text descriptions, NOT reference images.** A set-plate
  reference pins the camera to that plate's exact angle and kills camera
  variety. Describe the location in text; reuse the *same* description in every
  segment it appears, so the set stays consistent while the camera is free.
- **Only describe what has no reference** — props, lighting changes, wardrobe
  changes, weather.
- **A reference shows appearance, not behaviour.** Mechanics a still can't
  convey — a character that floats instead of walking, has no arms, moves a
  certain way — go in a **cast note** (`cast: { Name: { image: …, note: … } }`),
  rendered right after the name in the Cast line.

## 3. From source to storyboard

Inputs vary — you won't always get a clean, timecoded production screenplay.

- **Stay close to the source.** Don't paraphrase or invent the creative; honor
  what's there. Group its beats/shots into segments of **≤15 seconds** (the
  ceiling is per model — 2.5 renders up to 30s; see §14 — but the *authoring*
  rule is to cut at the beat, not at the API's limit).
- **Dialogue and lyrics are always verbatim.** Spoken and sung words are
  reproduced exactly, never paraphrased or translated — they drive performance,
  lip-sync, and the muxed audio. (This is the strict rule; "stay close" covers
  everything else.)
- **Fill gaps deliberately and flag them.** If the input is thinner than a full
  screenplay, the gap-filling is creative work — do it explicitly and surface
  it, never silently.
- **Segments are not scenes — every segment stages itself.** The hierarchy is
  shot < segment < scene: a shot is one camera setup, a segment is one
  generation holding 1 or more shots, a scene spans 1 or more segments.
  Generation is stateless: anything unstated gets invented,
  and what the model invents for an unstaged segment is a scene OPENING (an
  arrival, an establishing wide — the EmptySpace re-entrance bug). Every
  segment therefore carries its own mid-scene staging — who is where, what
  action is already in progress — through text ("she is still behind the
  second-row spacesuit, its arm in her hand") or through a ref (chain video,
  start frame, keyframe). Establishing/entrance language belongs ONLY to a
  scene's true first segment.
- The occ **storyboard table** is: `Segment ID | Cast | Location | Action |
  Duration`. One row = one segment = one generation.

## 4. Shot craft

This section is **shotlist mode** (the default). In **directed mode** (§11) the
model directs and none of the per-shot rules below are authored — do not mix
the two in one segment.

- Each segment's Action is a **dense, explicit multi-shot sequence** — numbered shots,
  each with shot size, angle, camera move, and cut.
- After the opening **establishers, go closer** — CU / MCU / ECU. Use low
  angles, forced perspective, moving camera (push-ins, tracking, orbits,
  whip-cuts), and **insert shots**.
- Vary cut density with the music/energy — fast in choreo and breakdowns, held
  in silences and beats that need to land.
- Performance scenes are pure singing and dancing.
- **One named-style reference for the whole piece** (e.g. a director — "in the
  style of Hype Williams") carries enormous weight; never vary style per shot.
- **Scope cast and props to where they're relevant** — a creature mentioned
  three times in the lyric should not appear in every segment.

## 5. Prompt assembly

occ assembles each prompt deterministically. **The header is English only — no
Chinese ever appears in the header. Chinese lives only in the Action body.**

```
Style: <one project style>
Cast: <name> (@Image1, mechanics note, English); <name> (@Image2); …   (name first;
            the @Image tag and any animation-mechanic note sit in the parens, "; "-joined)
No text. No Music.
<Prompt Set declaration — e.g. Prompt Set: Safe Mode (Chinese Visuals + English Audio)>
Scene: <location slug> (@ImageN)
<the dense multi-shot sequence — Chinese direction, English dialogue verbatim>
[location change →] Scene: <new location slug> (@ImageN)
<shots in the new location>
```

- **Location is a `Scene:` tag + a screenplay slug, inline at scene/shot level —
  never a global header line and never parameterized into the tag.** A
  `Scene: <slug> (@ImageN)` precedes each location's shots, with the set-plate's
  `@Image` in parens: `Scene: INT. - KIDS BEDROOM - NIGHT (@Image4)`,
  `Scene: EXT. BEDWORLD (@Image5)` (a void location can drop the time-of-day).
  When the location changes mid-segment, a **new** `Scene:` slug precedes the new
  location's shots. The plate is still attached as an omni-ref reference_image
  (cast first, then plates, in @Image order); occ consumes the tag for numbering
  but emits no header location line — the `Scene:` slug is authored in the body.
- **Never re-describe what a referenced plate already shows.** With a location
  plate the image *is* the set — strip the room/void description from the shots;
  they carry only action, blocking, lighting *changes*, lens, camera.
- **Cast notes are English and carry only animation mechanics** a still can't
  convey (`wings used as hands`, `quadruped`); no appearance.
- The negatives (`No text.` / `No Music.`, from `no_text` / `no_music`) and the
  Prompt Set declaration sit **before** the Chinese body. The old trailing
  "no background music" sentence is gone; "No Music." is the form.
- Shot direction in Simplified Chinese; dialogue/lyrics English, verbatim.
- Stay under the character limit — `occ preview` reports counts.

## 6. Prompt wording — what the model hears

Seedance renders what the words point at, not what you meant.

- **Negation backfires.** "No humans" plants the word *humans* and the model
  renders them. Never phrase a constraint as the negation of the thing you don't
  want — state what you *do* want instead.
- **Positive constraints can over-force.** "Only these three characters on
  screen" made the model put all three in *every* shot — including beats where
  one should be absent or asleep. A roster limit is not a per-shot mandate; let
  the Action govern who is present. Keep global `header_tag` assertions to what
  is genuinely global.
- **The model only knows words it was trained on.** An invented name — a made-up
  species, a brand term — constrains nothing. Refer to the cast by their
  reference-bound names and the generic word for "character"; never an invented
  term.
- **Trigger words pull in their literal subject.** "Children" / "kids" in a room
  description renders literal human children. Describe a space by its contents,
  not its occupants.
- **State time-of-day explicitly.** Omit it and the model defaults to bright
  daylight. The location description carries the baseline (e.g. "a bedroom at
  night, dark sky outside the window"); one-off changes go in the Action.

## 7. Workflow & guardrails

- **`occ preview` before every paid run.** Assemble all prompts, read them, get
  sign-off. Never discover a bad prompt after paying.
- **Iterate cheap** — low resolution (480p) for revision cycles; a final pass
  re-renders at full resolution.
- **Parallel generation** — independent segments generate at once; only chain
  continuations wait for a previous frame.
- **A chain continuation stacks three anchors.** (1) `reference_video` = the
  previous segment's whole clip — scene and motion continuity; the prompt is
  prefixed `向后延长「视频1」：` (Extend Video 1). (2) Cast reference images
  stay attached and @Image-tagged — re-anchors identity each segment so a long
  chain doesn't drift. (3) The previous segment's last frame is registered as
  a trusted-library asset and appended as the next `reference_image`
  (omni-ref's start-frame mechanism, prompt-labelled `起始帧 Start frame：
  @ImageN`) — a literal first-frame anchor. **Note:** the omni-ref start frame
  is just another `reference_image`, *not* the API `first_frame` role (that
  role is mutually exclusive with reference media; the omni-ref one coexists
  with `reference_video` and cast `reference_image`s fine). The
  video-extension half is from the rainy_night_tavern reference; the omni-ref
  start frame and re-anchored cast are occ's extensions for asset-library
  realistic-human cast.
- **At the chain cap, break the VIDEO — not every anchor.** `max_chain` exists
  because each video continuation degrades the picture, but the default break
  (`cap_break: fresh`) drops the whole three-anchor stack at once and hands the
  model a stateless segment to open — which is the §3 scene-opening bug, bought
  deliberately. `cap_break: start-frame` (project-level, under `defaults:`)
  makes that link a **start-frame link** instead: no `reference_video` and no
  extension directive, but the previous segment's last frame still rides as the
  omni-ref start frame with the cast references re-attached, so the staging
  carries across the break and only the degradation stops. The link then heads
  the next video chain — with `max_chain: 4` a long scene runs head, three
  continuations, start-frame link, three continuations, and so on. It waits on
  its predecessor and folds it into the reuse hash exactly as a continuation
  does (a regenerated predecessor invalidates it). On 2.5 it is neither an
  extension nor a first/last-frame task (§14), so it keeps the board's authored
  `ratio`. `preview` and `scan` name it: `chain=start-frame (cap-break after 4)`.
- **Stitch only a complete set** — never publish a film with gaps. On any
  failure, keep the finished segments (reuse makes a re-run cheap) and report.
- **Retry once, then triage** — a failed segment auto-retries once; if it fails
  again it is *not* re-burned blindly — diagnose the cause (a uniform,
  deterministic failure is a config/prompt problem, not bad luck).
- **Reuse** — unchanged segments are copied free; revise one segment, re-run,
  and only that segment regenerates.
- **Mux the master audio** as a pipeline step; verify film and track lengths
  match.
- **Verify every deliverable** — test a link with a real request before sending
  it; check a stitched file's duration and streams.

## 8. Process discipline

The meta-lesson under all of the above: **understand the model and the source
material fully before building or spending.** Most wasted cost in a cycle comes
from acting first — generating before the references are wired, before the
prompts are reviewed, before the model's behavior is understood. Study first,
preview always, spend last.

## 9. Production-review addenda (paid for on LSN)

- **Runtime must equal the master audio — verify before spending.** The
  storyboard's total duration must sum to the audio length; a 79-min storyboard
  for a 95-min film is an error. `reference_audio` guides the *performance*, not
  the *clip length* — Seedance renders to the `duration` you send, so durations
  must be derived from the audio grid at authoring time, never deferred to a
  later "conform." Segment count is not fixed: it is `audio_length ÷ ~15s` (the
  divisor is the model's window — 30s on 2.5, §14 — so the same audio takes
  roughly half as many segments there; add cuts as needed). Timing is a
  **lookup** against the script↔SRT, not a guess.
- **Audio via video-ref, not audio-ref.** Seedance often alters a
  `reference_audio`, but stays faithful to audio carried in a `reference_video`.
  Cut the master to the segment grid, package each slice as an MP4, feed it as
  the video reference (audio-via-video).
- **Cast is image-only; no persistent notes.** Gens are stateless and the cast
  reference image carries identity, so a persistent "note" only leaks (a
  one-time troll transform written as a note made the character morph in every
  scene). Describe nothing about a referenced character except a **wardrobe
  change** or a **relative-size note** (scale a still can't convey). The
  reference design is the authority — never script an action that contradicts it
  (a bald character "blowing hair from his face" grows a wisp to obey the text).
- **Indoor/outdoor reference variants.** When the cast has indoor and outdoor
  (coated) designs, pick the reference by the shot's INT./EXT. slug; the coat
  comes from the image, not the text.
- **State time-of-day every segment** (from the slug) — stateless gens otherwise
  flicker day↔night.
- **Each ~15s gen is a dense hard-cut segment, never one held angle.** Carry the
  shotlist's per-shot durations and put explicit HARD CUTs between shots, or the
  model holds one setup for the whole gen. (A shotlist-mode lesson: a shot-shaped
  prompt without cuts holds. Directed mode — §11 — hands cut density to the
  model; validate its cut behavior at look-dev before trusting it.) Scenes must **enter and exit** (an
  establishing in-beat and a hand-off out-beat), never stop mid-action.
- **Cover every shotlist shot 1:1** and audit it — too few gens forces dropped
  actions. Verify coverage (all shot IDs present) and runtime (= audio) before
  rendering.
- **Chaining locks style, not just continuity.** A reference-less gen drifts in
  style; chaining each gen from the previous last frame (as an omni-ref start
  frame image, not the exclusive first_frame role — which would lock out the
  audio video-ref) keeps the look consistent across the whole film.

## 10. Lip-sync word grid (precise vocal timing) — paid for on Go2Bed

For a song/dialogue piece whose **segment prompts carry a Performance (lip-sync)
tag** — exact per-word beats so the model mouths the words on time without an
audio reference — you need an accurate **word grid**: every lyric word with a real
start/end measured against the master.

- **The Performance tag IS the lip-sync mechanism — do NOT use audio references.**
  No `reference_audio`, no audio-via-video. The word grid replaces them (it is the
  whole point of the method). This **supersedes §9's audio-via-video** for any
  piece using Performance tags, and it keeps the `reference_video` slot empty and
  free for a real video continuation (a chain) — never spend the video-ref slot on
  audio. (Generate silent: `audio: false`; the master is muxed in post.)

- **MEASURE ON THE ISOLATED VOCAL STEM, NEVER THE MIX. (root-cause rule)**
  Forced-aligning the lyric to the full mix makes the backing music — especially
  the instrumental that continues after a vocal phrase ends inside a cue — read as
  voice, so the aligner **spreads the phrase's words late to fill the cue window**.
  Result: a systematic **~0.45s lag, worst in the densest (loudest) sections**.
  Separate the vocal first (torchaudio `HDEMUCS_HIGH_MUSDB_PLUS`, chunked) and
  align on that. This was the entire cause of the Go2Bed "everything after 1:35
  drifts late" bug; nothing else (timecode, A/V sync, SRT windows, render) was at
  fault — verified by cross-correlation (0.0 ms A/V) and re-measurement.
- **Anchor to objective voiced BLOCKS, and align each block's words as a unit.**
  From the clean vocal's energy envelope, detect voiced segments (singing on/off,
  merging dips < ~0.12s). A segment is one *continuous* singing block. Gather ALL
  the words that fall in a block and **align them together inside that block** on
  the vocal. This is the crux: do NOT align per SRT cue — when several cues are
  sung back-to-back with no silence they share one voiced block, and a per-cue
  window (or per-cue voiced-trim) bleeds into the next cue's audio and re-spreads
  the words late (the Go2Bed "slips again at 1:53" bug). Per-block gives: no
  late-spread, no edge-clamp, no cross-repeat match (each block is independent).
- **Duplicates eat the gap, never push placement.** CTC drops repeated identical
  words ("gonna ×6", "bed ×4"); when you add them back, spread them to fill the
  gap up to the next word — every measured word stays exactly where it was.
- **Inherent limit — flag, don't hide.** Back-to-back *identical* repeated choruses
  ("I wanna stay up…" sung twice) are ±0.3s ambiguous to any aligner (it can't tell
  which repeat it's on). Distribute those evenly or pin by hand; it's a few words,
  separate from the lag bug.
- **Performance tag = zero-based per segment**, words on local beats with explicit
  `(rest Ns)` for every silence ≥ ~0.5s; clip starts at 0.00s.
- **Verify free before spending: render a karaoke test mp4 against the ISOLATED
  vocal** (music stripped, so sync is unambiguous) and watch it. Cross-correlate
  the muxed audio vs master to rule out A/V offset. Only then spend.
- Reference pipeline (Go2Bed): vocal-separate → voiced segments → per-phrase align
  on the stem → `<proj>.words.json` (`{w,s,e,spk}`) → Performance tags + karaoke
  test mp4.

## 11. Directed mode (Seedance as director)

Opt-in per project: `defaults: mode: directed` (shotlist stays the default).
Seedance is natively multi-shot and was built to direct — sometimes an imposed
shot list fights that instinct. Directed mode hands shot selection to the model.

- **Declare the mode at kickoff, before boarding.** It changes how the
  storyboard and prompts are *authored* (and what craft-lint checks), so the
  decision must precede the storyboard phase — it is not a render-time switch.
- **The Action is a mini-script, not a shot list.** Scene action, staging,
  business, entrances/exits, dialogue verbatim — **no per-shot direction**
  (no `[SHOT n]`, no sizes, no camera moves). Shot sizes, angles, coverage and
  cut rhythm are the model's.
- **The cinematography header names a directing STYLE — never moves.** The
  project `cinematography:` field renders as an English `Cinematography: ...`
  line after `Style:` on directed segments (or carry it in `style:` itself).
  It states the directorial register — a named director or school, tone,
  pacing sensibility — and nothing shot-mechanical: a specific move or a
  beat-mapped note in the global header rides EVERY segment and limits the
  direction (paid for on EmptySpace look-dev; "no local notes in the global
  area"). A specific move that matters (an opening slow push-in) is a LOCAL
  note in that segment's body. occ injects no other directive: the
  script-shaped body is itself the handoff signal.
- **What does not change:** one row = one segment = one gen ≤15s (per model, §14); runtime =
  the audio grid; the references rule (§2); dialogue/lyrics verbatim; segments
  still enter and exit; state time-of-day; preview before any spend.
- **The mini-script must CHOREOGRAPH.** Directed mode hands the model the
  camera — never the performance. A body that transcribes dialogue with the
  lead parked at a mark films as a static lecture (EmptySpace v04: "3 mins of
  her standing in one place"). Every beat carries a physical idea tied to its
  line — entrances and exits, movement through the space, business with the
  set and the other figures in it. "Actions carry boarded performance"
  applies with full force here; only the shot-mechanics are delegated.
- **Hybrid boards.** `mode:` overrides per segment
  (`segments: {ID: {mode: shotlist}}`) — let the model direct the piece, pin
  the segments you must control with an explicit shot list.
- **Text-described locations suit directed mode best.** A set plate pins the
  camera (§2) — legal, but it constrains the very freedom the mode buys. The
  same tension applies to storyboard refs and motion refs (they dictate
  cinematography/motion over the model's directing).
- **Look-dev the cut behavior first.** §9's "an undirected gen holds one
  setup" lesson came from shotlist-mode prompts; directed mode's premise is
  the opposite. Confirm on a cheap 480p slice that the model actually cuts
  and covers a script-shaped body before any wide spend.
- craft-lint is mode-aware: directed segments skip the per-shot checks and
  instead flag shot-direction contamination inside a directed Action.

## 12. When the model is not Seedance (MiniMax Hailuo H3)

Seedance is the default and everything above assumes it. H3 is available
per project or per segment (`video_model: minimax-h3`) **when asked for** — it
is a deliberate choice, never a fallback. §8 applies with full force: understand
this model before building or spending on it, because four of its behaviours
invalidate rules you would otherwise carry over.

- **There is no 480p.** §7's "iterate cheap at 480p" has no equivalent — the
  tiers are 768P and 2K, and occ maps 480p/720p up to 768P. Revision cycles on
  H3 cost 768P prices ($0.08/s; 2K is $0.13/s). Budget accordingly or iterate
  on Seedance and finish on H3.
- **Generated audio cannot be turned off.** §1's "`generate_audio` is one on/off
  switch" is a Seedance fact. H3 has no switch: every clip carries generated
  audio. For a muxed-master project that is harmless (the mux replaces it), but
  the Seedance moderation lore in §1 — score-only segments failing, `no_music`
  per segment, the audio-off retry — does not transfer, and occ skips the
  audio-off retry rather than re-buying an identical request.
- **A chain is an image chain, not a video extension.** §7's three-anchor
  continuation and §9's "chaining locks style" both rest on Seedance's
  `reference_video` extension. H3 has none: its reference-video role is a
  *reference*, not a continuation. occ therefore chains on the previous last
  frame plus re-attached cast references — a weaker anchor. Look-dev a chain
  slice before committing a long one, and expect more drift across a chain than
  Seedance gives.
- **Keyframes and references are mutually exclusive.** Seedance takes a
  first/last frame alongside cast and plate references; H3 refuses a request
  carrying both. A board built on both mechanisms will not run on H3 unmodified.
- **Realistic / live-action cast is SIMPLER on H3 — this is the one rule above
  that relaxes rather than tightens.** §2 routes real-looking humans through a
  pre-registered BytePlus `asset://` id *because Seedance intercepts reference
  images of them*. H3 does not intercept: it takes the person's photograph
  directly as a reference image. So on H3 a live-action cast member is written
  like any other — `Name: path/to/photo.png` — with no asset registration, no
  console round-trip, and no dependency on a library occ does not own. The
  `asset://` id is an Ark address; occ refuses it on H3 and says to swap it for
  the source image. (A trusted-library *voice* asset likewise becomes a plain
  audio file.) Everything else in §2 still holds — above all, never describe a
  cast member who has a reference.

What does NOT change: the references rule (§2), dialogue/lyrics verbatim,
segments staging themselves, runtime = the audio grid, ≤15s segments, and
`occ preview` before every paid run. The prompt format is unchanged too —
@Image tags, Cast/Scene lines, the same body — but that format was tuned on
Seedance, so **look-dev H3 on a slice before any wide spend**, especially its
cut density and its handling of @Image references.

## 13. When the model is FLUX 3 (Black Forest Labs)

`video_model: flux-3`, per project or per segment, **when asked for**. H3 (§12)
bends four rules; FLUX 3 removes the mechanism §2 is built on, so this is not a
model you port a board to — it is a model you author *for*. §8 applies with
maximum force.

- **THE ONE THAT DECIDES EVERYTHING: there are no omni-reference images.** BFL's
  own note is "Omni Reference … will be available soon". A FLUX 3 request has no
  slot for a cast turnaround, a set plate, a storyboard panel or an in-shot @K
  still, and no `@Image` tag addresses anything. The only images it takes are
  **keyframes** — pictures that literally become frames of the rendered clip.
  So §2's central instruction inverts: with nothing to reference, a character
  **must** be described in text, and described the same way in every segment.
  occ refuses a referenced project on FLUX at plan time (`occ preview` fails,
  naming the segment and the fix) rather than sending a character sheet to the
  keyframe slot, where it would appear on screen.
  → Use FLUX for pieces with no cast-identity requirement, or for a single
  segment that has none. A film that needs a consistent face stays on Seedance.
- **Identity, such as it is, comes from keyframes and the chain.** One image
  opens the clip; two open and close it; occ's seeded chain heads, seam anchors
  and continuation frames all route there automatically. An end frame with no
  start frame is refused — a lone image is always the *opening* frame.
- **The chain is a real continuation.** `v2v` carries the clip on from the
  supplied video's final frames, so §7's chaining logic holds and §9's "chaining
  locks style" holds with it — but keyframes and a continuation are exclusive
  modes, so a continuation carries no start-frame image alongside. It also means
  the *other* two users of occ's video slot have no expression: **audio-via-video
  (§9) and motion refs are impossible here** — a clip fed to FLUX is continued,
  not watched. occ refuses both.
- **It writes the audio; it never hears any.** No `reference_audio`, no voice
  asset, no audio-via-video — which means §9's audio-via-video method and §10's
  word-grid *inputs* are both off the table. Dialogue, ambience, effects and
  music are written into the prompt as words (BFL's four layers: speech,
  ambience, effects, music), with the spoken line in quotation marks and the
  speaker named. `generate_audio` **is** a real switch (unlike H3), so a
  muxed-master project renders silent exactly as on Seedance.
- **Resolution is `hd` or `fhd`; duration is 5–20s.** No 480p — `hd` is the
  floor, so §7's cheap-iteration pass costs `hd`. The 5s floor rounds a 4s
  segment up (announced in the log, because it is billed); the 20s ceiling is
  the one place FLUX is *more* generous than Seedance's 15 — but §3's ≤15s
  segment rule is about authoring, not the API, so do not stretch a segment
  past the beat it holds just because the model would allow it.
- **The prompt is English prose, not the Chinese shot list.** §1's "write shot
  direction in Chinese" is a Seedance fact (its training and its density). FLUX
  is prompted in natural English — describe the shot, name the camera move in
  plain words, put dialogue in quotes. occ's header (Style / Cast / SCENE /
  negatives) assembles the same way and reads fine as English; what must not
  survive the port is the Chinese body and any `@Image` reference the board
  was built around.
- **Spend is unmeasurable in occ's units.** FLUX bills in credits and reports no
  billed seconds, so `measured_usd` is null with a reason and `--max-spend-usd`
  cannot bite. Bound a FLUX run with `--max-segments` and the credit balance at
  BFL, and reconcile from `results/<seg>.json` (`_create.cost`). See README.
- **Not wired, on purpose:** BFL's `draft: true` fast preview and its
  `draft_enhance` full-quality replay — the only cheap-iteration lever the model
  has. Wiring them means adding a field to the canonical plan and the reuse
  hash, which re-hashes every existing project's plans; it is a decision to
  take deliberately, not a flag to slip in.

What does NOT change: dialogue/lyrics verbatim, segments staging themselves
(§3 — statelessness is worse here, not better, with no references to re-anchor
on), runtime = the audio grid, and `occ preview` before every paid run. **Look-dev
FLUX on a slice before any wide spend** — above all whether a text-described
character holds across two segments, which is the whole question the missing
reference slot raises.

## 14. Seedance 2.5 (`video_model: seedance-2.5`)

Opt-in per project or per segment — 2.0 stays the default, and the bare name
`seedance` still means 2.0, because re-pointing it would change what every
existing board renders on. 2.5 is the *same request shape* wearing wider caps,
so unlike H3 (§12) and FLUX (§13) nothing above is invalidated. Four things
change, and one of them will fail a run if it is not understood first.

- **Segments run to 30s, and the length is the board author's choice.** occ
  does not stretch a segment to fill the window and does not shorten one to fit:
  a duration over the model's cap is **refused at plan time**, naming the
  segment, the ask, the model and the cap, while re-boarding is still free. §3's
  "cut at the beat" is the authoring rule and it does not move — but the beat
  that genuinely runs 22 seconds no longer has to be split across a seam, and a
  90-minute film needs roughly half the generations (§9's `audio_length ÷ ~15s`
  becomes `÷ ~30s`).
- **480p, 720p and 1080p.** 2.5 launched with 480p/720p only; a vendor update
  (2026-08, first used on the Spookley 2K finish) added 1080p, so a hi-res
  finish no longer forces the board back to 2.0. There is still no 4K. §7's
  "iterate cheap at 480p" works exactly as it always has. occ passes the tier
  through and the API validates — an unsupported tier 400s at create, unbilled.
- **Output is `mov` by default, and that is what fixes chain degradation.**
  2.5 takes an `output_format`: `mp4` (its own default, 4:2:0) or `mov` (H.264
  **yuv444p** + PCM). occ asks for **mov on every 2.5 segment**. The reason is
  §7's chain: a continuation is fed the previous clip as its `reference_video`,
  so an mp4 chain re-encodes 4:2:0 into 4:2:0 at every link and the generation
  loss compounds down the chain — which is a large part of what "each
  continuation degrades the video" (`max_chain`) has always meant. A mov chain
  does not accumulate it. Set `output_format: mp4` (project or segment) to
  override; occ names the effective format on every `preview` and `scan` line,
  and the segment file on disk carries the real extension. Everything occ does
  to a mov *intermediate* — trimming to the grid, padding a silent track —
  stays in mov, so the pipeline never becomes the loss the format was chosen to
  avoid. The final stitched master is still an mp4: it is delivered, not
  generated from.
- **Audio is a REAL reference here, and that is what gives the chain back its
  video slot.** §9's audio-via-video is a 2.0 workaround: 2.0 drifts from a
  `reference_audio`, so the slice is packaged as an MP4 and spends the one
  `reference_video` slot — which is why a chained board with audio falls back to
  the weaker last-frame image chain. 2.5 takes up to **10 audio references**
  (wav/mp3, 2–30s each, ≤30s and ≤15MB combined) as real `audio_url` content
  items carrying the `reference_audio` role, with **no image or video required
  beside them**. So on 2.5 the slice is wired as audio (an mp3 in
  `audio_via_video_ref:` is re-routed for you; an actual video is not, because
  occ does not demux), the prompt says `Use @audio1 for music and all dialogue
  throughout.`, and `reference_video` goes back to carrying the genuine mov→mov
  extension. Both ride one request alongside the cast and plate images. An
  audio-only segment (no cast, no plate) is also legal here, where on 2.0 occ
  has to drop the slice rather than buy a refusal.
- **THE HAZARD: 2.5 infers the TASK TYPE from your prompt, and then locks
  parameters to it.** There is no task parameter. Whenever a reference role is
  attached, the model reads the wording and decides whether it is generating,
  **extending** (extend/continue wording + a reference video) or **editing**
  (edit / add / remove / delete / modify / replace / change-to — and 替换 / 添加
  / 删除 / 修改). Each type then *requires* specific values: an extension and a
  first/last-frame task must send `ratio: adaptive`; an editing task must send
  `ratio: adaptive` **and** `duration: -1`. Get it wrong and the request is not
  rejected — **the task queues, bills, and fails asynchronously** with
  `InvalidParameter.TaskTypeConstraint`. You pay a round trip to be told what
  your own prompt said.
  - occ reads the same words and **sets the locked values itself**, silently
    (ratio never legitimately differs mid-chain, so there is nothing to decide)
    but **noted on every `preview` line** — the artifact spend is authorized
    against shows the values that will actually be sent, never the ones the
    board wrote.
  - **On `adaptive`, the output aspect ratio is INHERITED from the source clip
    or frame.** So on a chain, the **head establishes the AR for the whole
    chain** — get the head's ratio right and every continuation follows it.
  - **occ's omni-ref start frame is NOT a first/last-frame task.** The lock
    applies to the *exclusive* `first_frame` / `last_frame` content roles. The
    frame occ appends to a chain continuation, a seeded head or a seam anchor is
    an ordinary `reference_image` that the prompt labels `Start frame: @ImageN`
    — which is exactly why it can sit beside `reference_video` and the cast refs
    where the real role cannot (§7). Those segments keep the ratio the board
    authored; only a genuine extension, a genuine edit, or a request that really
    transmits the exclusive role is forced to `adaptive`.
  - **The edit-verb rule for authors: never write an edit verb into a segment
    that attaches a video** unless you mean it. "Remove the mug from the table"
    over a motion reference is read as an instruction to edit that clip, the
    runtime becomes the vendor's rather than the audio grid's, and the segment
    stops matching the slice it was cut for. Write the beat as what is in
    frame, not as a change to make. `craft-lint` flags this before spend.
- **Refs: 30 images / 10 videos / 10 audios** (each video and audio set capped
  at 30s total). occ carries at most one video and one audio per request, so
  only the image count has an occ expression — the `refs=N/30` ledger. §2 is
  otherwise unchanged: more slots is not licence to describe a reference, and a
  set plate still pins the camera.
- **Timestamps in the body are honored.** A beat may be delimited `[0-10s]` /
  `(0-3s)` instead of `[SHOT n]`; 2.5 reads them as beat boundaries, 2.0 ignores
  them harmlessly. occ accepts either spelling everywhere it breaks or lints a
  body — it neither requires nor rewrites them. This is a marker style, not a
  new authoring mode: shotlist (§4) and directed (§11) are still the two modes.
- **Concurrency is 20 tasks per model** (enterprise; an individual key gets 3;
  the cap was 10 until an 11th concurrent task was accepted on 2026-09-09).
  This is not a queue — an over-quota task *errors*. occ caps the run at 20 on 2.5
  automatically; a lower configured `concurrency:` is still respected. On an
  individual key, set `concurrency: 3` yourself.

What does NOT change: the references rule (§2), dialogue/lyrics verbatim,
segments staging themselves (§3), runtime = the audio grid (§9), the Chinese
body / English header prompt format (§5), and `occ preview` before every paid
run. **Look-dev 2.5 on a slice before any wide spend** — above all a chained
slice, to confirm the mov chain holds where the mp4 one drifted.
