# Burst Board Video — Blank Templates

Copy-paste scaffolds. Only the numbered shot lines go in Chinese. Everything else stays English.

---

## Per-scene mode template (one complete burst)

```
[PROJECT TITLE] — Scene [NN] — [SCENE NAME]

[PROMPT]
Total Duration: 5 Seconds
Structure: 20 Shots (Rapid Fire)
Location: [INT./EXT. LOCATION - TIME OF DAY]
Cast: [Name (outfit)]; [Name (outfit)].
Style reference: [one English sentence — medium, palette, lighting, aesthetic DNA].
Prompt Set: Safe Mode (Chinese Visuals + English Audio)

[1] SHOT-TYPE：[中文视觉描述] — [CHARACTER: "English dialogue if any."]
[2] SHOT-TYPE：[中文视觉描述]。
[3] SHOT-TYPE：[中文视觉描述]。
[4] SHOT-TYPE：[中文视觉描述]。
[5] SHOT-TYPE：[中文视觉描述]。
[6] SHOT-TYPE：[中文视觉描述]。
[7] SHOT-TYPE：[中文视觉描述]。
[8] SHOT-TYPE：[中文视觉描述]。
[9] SHOT-TYPE：[中文视觉描述]。
[10] SHOT-TYPE：[中文视觉描述]。
[11] SHOT-TYPE：[中文视觉描述]。
[12] SHOT-TYPE：[中文视觉描述]。
[13] SHOT-TYPE：[中文视觉描述]。
[14] SHOT-TYPE：[中文视觉描述]。
[15] SHOT-TYPE：[中文视觉描述]。
[16] SHOT-TYPE：[中文视觉描述]。
[17] SHOT-TYPE：[中文视觉描述]。
[18] SHOT-TYPE：[中文视觉描述]。
[19] SHOT-TYPE：[中文视觉描述]。
[20] SHOT-TYPE：[中文视觉描述]。
```

### Verbatim strings — never alter
- `Structure: 20 Shots (Rapid Fire)`
- `Prompt Set: Safe Mode (Chinese Visuals + English Audio)`

### Header reuse across bursts
Cast line and style reference repeat inside every `[PROMPT]` block — the model sees each burst independently. Write the full line every time.

### Location changes per scene
The `Location:` slug is scene-specific. Update for each burst.

---

## Whole-piece mode template (single burst, single file)

```
[PROJECT TITLE] — Full Burst

[PROMPT]
Total Duration: 5 Seconds
Structure: 20 Shots (Rapid Fire)
Cast: [Name (outfit)]; [Name (outfit)].
Style reference: [one English sentence — medium, palette, lighting, aesthetic DNA].
Prompt Set: Safe Mode (Chinese Visuals + English Audio)

[1] SHOT-TYPE：[中文视觉描述] — [CHARACTER: "English dialogue if any."]
[2] SHOT-TYPE：[中文视觉描述]。
...
[20] SHOT-TYPE：[中文视觉描述]。
```

No `Location:` line — whole-piece bursts span multiple locations.

---

## Filename patterns

- Per-scene: `[Project]_Bursts_Scenes[XX-YY].md` — e.g., `BadNanas_Bursts_Scenes01-05.md`
- Whole-piece: `[Project]_Burst.md` — e.g., `LegendOfTheSnowman_Burst.md`

Use underscores, no spaces, two-digit scene numbers. Filenames stay Latin.

---

## File-split math for per-scene mode

Bundle 5–6 complete bursts per `.md` file. Prefer 5; use 6 only to avoid a trailing file with fewer than 3 bursts.

- 16 scenes → 3 files: `Scenes01-05`, `Scenes06-10`, `Scenes11-16`
- 12 scenes → 2 files: `Scenes01-06`, `Scenes07-12`
- 10 scenes → 2 files: `Scenes01-05`, `Scenes06-10`
- 7 scenes → 2 files: `Scenes01-04`, `Scenes05-07`
- 5 scenes or fewer → 1 file
