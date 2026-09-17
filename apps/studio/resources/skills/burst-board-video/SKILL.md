---
name: burst-board-video
description: Generates Burst Video storyboard prompts for AI video generation models (Seedance, Veo, Kling, Dreamina, etc.) using the 20-shot Rapid Fire format. Use when the user asks for a burst, burst-board, storyboard prompts, shot bursts, or 20-shot breakdowns, or when they reference the Burst Video method. Handles trailers, music videos, shorts, and scene-level bursts. Outputs one .md file per 5-6 bursts.
---

# Burst Board Video

Converts any visual input — script, director's vision, moodboard, music reference, concept — into Burst Video storyboard prompts. Each burst is a single 20-shot prompt formatted for stateless AI video generators.

## Vocabulary

- **Shot**: one numbered line `[N]` inside a burst. A single framed image description.
- **Burst**: one complete 20-shot prompt. Always exactly 20 shots. Always exactly one `[PROMPT]` block.
- **File**: one `.md` output, bundling 5–6 complete bursts. Files exist for the user's organization; they are not units the model sees.

## Stateless model — critical

The downstream video model sees ONLY the content inside a single `[PROMPT]` block. It has no memory of prior shots, no project title, no user context, no awareness of other bursts in the same file. Every burst is a blank slate.

This means:
- Location slug, Cast line, and Style reference MUST all be inside the `[PROMPT]` block
- Every burst in a file repeats the full header independently — the model never reads across bursts
- No image reference placeholders, no `@Name` tags, no model-specific syntax — the skill outputs model-agnostic text only

## Language — critical

Only the numbered shot lines `[1]` through `[20]` are written in compact Simplified Chinese. Everything else stays in English. This matches the Burst Video reference template: Chinese visuals for character-budget efficiency, English audio and English scaffolding for readability and model compatibility.

**English (do not translate):**
- All structural labels: `[PROMPT]`, `Total Duration:`, `Structure:`, `Location:`, `Cast:`, `Style reference:`, `Prompt Set:`
- Location slug content: `INT./EXT. LOCATION - TIME OF DAY`
- Cast line content: character names AND outfit descriptors (e.g., `Cast: Ray (tattered green jacket); Roscoe (slim black tee).`)
- Style reference content: the full descriptive sentence
- Shot-type tags: WIDE, MS, MCU, CU, ECU, OTS, POV, LOW ANGLE, HIGH ANGLE, INSERT, TRACKING, TWO-SHOT, THREE-SHOT, GROUP, OVERHEAD, DUTCH, STATIC
- All dialogue inside quotes (English audio per Prompt Set declaration)

**Chinese (Simplified):**
- The visual description portion of each numbered shot line, written in compact form after the shot-type tag and colon

## Verbatim strings — never alter

These two strings must appear exactly as written. Do not translate, abbreviate, rephrase, or add/remove punctuation:

1. `Structure: 20 Shots (Rapid Fire)`
2. `Prompt Set: Safe Mode (Chinese Visuals + English Audio)`

## Output mode decision

Before generating, determine which mode applies:

- **Per-scene mode**: One 20-shot burst per scene. Use when input is a multi-scene script/trailer and the user wants scene-by-scene coverage. A 16-scene trailer produces 16 bursts.
- **Whole-piece mode**: A single 20-shot burst covering the entire piece (music video, trailer, short, concept). Use when input is a single unified narrative or the user asks for one burst. Produces 1 burst total.

If the user's intent is unclear, ask once. Do not assume.

## File output rules

- Write to `/mnt/user-data/outputs/`
- Bundle 5–6 complete bursts per `.md` file
- Prefer 5 bursts per file; use 6 only when it avoids a trailing file with fewer than 3 bursts
- Whole-piece mode: one burst = one file
- Filename pattern per-scene: `[Project]_Bursts_Scenes[XX-YY].md`
- Filename pattern whole-piece: `[Project]_Burst.md`
- Plain text, no markdown bolding inside the prompt body
- Call `present_files` after all files in a batch are written

### Split math examples
- 16 scenes → 3 files: `Scenes01-05` (5), `Scenes06-10` (5), `Scenes11-16` (6)
- 12 scenes → 2 files: `Scenes01-06` (6), `Scenes07-12` (6)
- 10 scenes → 2 files: `Scenes01-05` (5), `Scenes06-10` (5)
- 5 scenes or fewer → 1 file

## Prompt anatomy

Every burst is one complete, self-contained prompt:

```
[PROJECT TITLE] — Scene [NN] — [SCENE NAME]             ← user-facing header, not sent to model

[PROMPT]
Total Duration: 5 Seconds
Structure: 20 Shots (Rapid Fire)
Location: INT./EXT. LOCATION - TIME OF DAY              ← per-scene mode only; omit in whole-piece mode
Cast: Name (outfit); Name (outfit).
Style reference: [concise English sentence, global to the piece].
Prompt Set: Safe Mode (Chinese Visuals + English Audio)

[1] SHOT-TYPE：中文视觉描述 — CHARACTER: "English dialogue if any."
[2] SHOT-TYPE：中文视觉描述。
...
[20] SHOT-TYPE：中文视觉描述。
```

## Block rules — critical

### Location line (per-scene mode)
- Inside the `[PROMPT]` block.
- Format: `Location: INT./EXT. LOCATION - TIME OF DAY` — standard screenplay slug, concise, not narrative.
- Omit entirely in whole-piece mode.

### Cast
- Inside the `[PROMPT]` block.
- Format: `Cast: Name (outfit descriptor); Name (outfit descriptor).`
- English throughout — label, names, AND outfit descriptors.
- Outfit only — no facial features, no body type, no age. Identity is carried by name + outfit consistency across shots.
- Keep outfit descriptors under 8 words each.
- Omit cast line entirely if no named characters appear (pure environment/title cards).

### Style reference
- Inside the `[PROMPT]` block.
- Full English sentence describing medium, palette, lighting, and aesthetic DNA.
- Global to the entire piece. Write it once, reuse verbatim across every burst in every file.
- Scene-specific addendums only when a scene visually departs from the global look (flashback, dream, animation-within-live-action). Append as second English sentence.

### Shot lines
- Each burst has exactly 20 shots, numbered `[1]` through `[20]`.
- One shot per numbered line.
- Begin with shot-type tag in English caps, followed by Chinese full-width colon `：`.
- Visual description in compact Simplified Chinese, one sentence. Static — describe the frozen image. Avoid motion verbs.
- Dialogue inline at the end of the line, in English, in quotes: `— CHARACTER: "English line."`
- No sound effects, no music cues, no separate audio block.

### Shot type vocabulary (all English)
- ECU (extreme close-up), CU (close-up), MCU (medium close-up), MS (medium shot), MLS, WIDE / LS, ELS
- OTS (over-the-shoulder), POV, TWO-SHOT, THREE-SHOT, GROUP
- INSERT (objects, text, props)
- LOW ANGLE, HIGH ANGLE, OVERHEAD, DUTCH
- STATIC, TRACKING

## Content policy — paraphrase triggers

Video models have content filters. Paraphrase only these categories in the Chinese shot descriptions:

- **Sexual / genital / intimate acts** — describe obliquely (e.g., "床单下两人交缠的轮廓", "磨砂玻璃后的剪影"). Objects: use functional descriptions like "半透明乳胶套" instead of naming explicitly; "白色液体" instead of explicit terms.
- **Extreme violence / gore** — describe aftermath or implication (e.g., "人影瘫倒，暗红渍渐扩" rather than graphic wounds).

Blood, fighting, weapons, drug paraphernalia, implied nudity, strong language — these generally pass. Do not over-sanitize.

Keep visual intent intact when paraphrasing. The editor still needs to know what the frame shows.

## Workflow

1. **Identify input type** — script, treatment, director's vision, moodboard text, bare concept. Take it as given. Do not develop a script first unless the user explicitly asks.
2. **Determine mode** — per-scene or whole-piece. Ask if ambiguous.
3. **Draft style reference in English** — one sentence capturing the look. Reuse verbatim across every burst.
4. **Draft cast lines in English** — one per scene (per-scene mode) or one global (whole-piece mode).
5. **For each burst, extract 20 beats** — the strongest visual moments. Favor ensemble coverage (different characters, angles, scales). Mix shot types deliberately.
6. **Write each shot in compact Chinese** with English shot-type tag and English dialogue.
7. **Apply content policy** — scan Chinese shots for trigger language, paraphrase in place.
8. **Bundle bursts into files** of 5–6 per file (per-scene) or 1 per file (whole-piece). Write to `/mnt/user-data/outputs/`.
9. **Call `present_files`** after the batch is complete.

See `EXAMPLES.md` for a worked file. See `TEMPLATE.md` for a blank copy-paste scaffold.
