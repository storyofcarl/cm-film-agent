# Per-Beat Analysis Process

The engine for the playbook's Per-Beat Direction section, and for any time a specific scene needs shot-level creative direction.

## Step 1: Identify core elements

- **Genre/tone:** which conventions apply.
- **Emotional beat:** what the audience should feel (tension, romance, action, discovery, loss, joy).
- **Character dynamics:** power relationships, emotional states, conflicts.
- **Narrative function:** setup, escalation, climax, resolution, transition.
- **Story structure:** which act (conceptual), which sequence (numbered beat), new scene or continuation.
- **Function tag (required, machine-read):** one primary from {intensify, isolate, reveal, reorient, release}, optionally one secondary. Record as a parseable line:
  ```
  FUNCTION: <primary> [; secondary: <secondary>]
  ```
  Example (discovery building to realization): `FUNCTION: reveal ; secondary: intensify`
  The beat's pacing signature must be consistent with this tag — an `intensify` beat is not long sparse holds; a `release` beat is not accelerating fast cuts. The battery cross-checks the two.

## Step 2: Determine visual approach

- **Color palette:** from emotion and genre (warm/cool, saturated/desaturated, accents).
- **Lighting mood:** from tone and what's hidden/revealed (high/low key, naturalistic/stylized).
- **Camera language:** from character dynamics (sizes, angles, movement).
- **Pacing rhythm:** from the narrative beat (accelerating, steady, decelerating).

## Step 3: Make specific recommendations

- Shot sizes for intimacy/impact; angles for power; movement for energy.
- Duration targets for pacing (flag `[LOCK]` if exact length matters, `[TASTE]` if a human should judge rightness).
- **Intensity value** (0–10) and carrier channel(s), consistent with the curve.
- Color grading direction; lighting setup and key/fill approach; audio design.

## Step 4: Explain creative rationale

Connect every choice to emotional intent; reference genre conventions; explain how choices serve the story; note what the audience should feel and understand.

## Step 5: Hand off to Shot Format

Provide clear direction ready for technical translation, or let Shot Format translate the creative vision into SQ###-SC###-SH### shots whose REF slots point back to the bible.
