---
name: screenplay-analyzer-2
description: Rapid diagnostic tool for screenplay analysis that identifies strengths, weaknesses, and specific improvement opportunities. Provides comprehensive narrative metrics including length/runtime assessment, style and register analysis, character arc assessment, setup/payoff tracking, tension analysis, plot dynamics evaluation, distinctiveness/specificity scoring, and genre convention adherence. Tags every issue with the screenplay-doctor-2 repair category it maps to. Use when the user requests analysis of an existing screenplay, wants feedback on what's working and what isn't, needs to identify specific problems, or asks for a diagnostic report before enhancement.
---

# Screenplay Analyzer 2

A craft diagnostic. It measures a screenplay against concrete metrics, identifies what's working and what isn't, and produces a prioritized, doctor-ready report. It diagnoses; it does not rewrite (that's screenplay-doctor-2).

Distinct from the **Review Panel** (in screenplay-studio-2): the analyzer measures *craft*; the panel simulates *reception* (Critic/Buyer/Audience). Use the analyzer to fix the script; use the panel to decide whether and for whom it's worth fixing.

## What it scores

Eight dimensions. **Length and Style/Register are checked first** — they're the cheapest to count and the two most common failure modes, and they route the rest of the diagnosis.

### 1. Length & Runtime (CHECK FIRST)
The single most common failure: scripts running well under target. Measure:
- Total page count vs. target (feature 90-120; TV per format).
- Per-act page distribution (≈25 / 50 / 25 for feature) — which act is starved.
- Average scene length; % of scenes under 0.5 page.
- **Structural vs. thin diagnosis:** is it short because of MISSING SCENES (structural — beats absent) or THIN SCENES (underwritten — beats present but resolve too fast)? This verdict tells the doctor which fix to apply.

Output: page count + variance %, per-act breakdown, structural-vs-thin verdict, length health score (1-10).
→ **Doctor: Category 7 (Length Deficiency)**, sub-typed by the verdict.

### 2. Style & Register
- Action-line register: spec-lean vs. novelistic. Flag interiority ("she realizes," "he remembers"), simile/metaphor density, abstract nouns, unfilmable description.
- Action-block length (flag blocks > 4 lines).
- Dialogue/action ratio vs. genre norm.
- Consistency: does register hold, or drift across acts?
- Runs the **AI-tells scrub** (see studio's `ai-tells-scrub.md`): flags high/medium/low-severity tells with page numbers.
- If a Style Bible exists: compliance against it.

Output: register profile, list of novelistic intrusions + AI-tells with page numbers and severity, consistency verdict, style health score (1-10).
→ **Doctor: Category 8 (Register & Prose-Style Repair)**.

### 3. Distinctiveness & Specificity
Per the governing principle, this scores *specificity*, not novelty — invention or deliberate muse-evocation both pass; only the generic default fails.
- Premise: fresh angle or familiar-without-angle?
- Characters: specific and contradictory, or legible types?
- Scenes (spot-check pivotal): turn present? surface/underneath gap? specific anchor detail or generic?
- Theme: dramatized through choice, or stated aloud? (Flag any stated-theme line.)
- If a Creative Intent capsule exists: does the script evoke its touchstones, or drift toward its bad-version-feared?

Output: specificity verdict per element, list of generic-default beats, distinctiveness score (1-10).
→ **Doctor: Category 8/9** (register/specificity) and flags for foundation revisit.

### 4. Character Arc
State changes per major/supporting character; static stretches >30 pages; want/need tension dramatized; arc completion. → **Doctor: Category 3**.

### 5. Setup/Payoff
Setups planted, payoffs delivered, danglers, distribution across acts. → **Doctor: Category 5**.

### 6. Tension Dynamics
Tension range per sequence; flat sections >10 pages; escalation toward climax. → **Doctor: Category 4 (pacing/dragging)**.

### 7. Plot Dynamics
Major turning points present and landing (inciting, act turns, midpoint, climax); reversals; structural soundness. Flag structural deviations and whether they're earned. → **Doctor: Category 6**.

### 8. Scene Function & Genre
Function distribution; genre-convention adherence and freshness (per template-8). → **Doctor: Category 1/2**.

## Output: the diagnostic report

```
SCREENPLAY DIAGNOSTIC — [title] — [pages]pp vs [target]pp

HEALTH SCORES (1-10)
  Length: _   Style/Register: _   Distinctiveness: _
  Character: _   Setup/Payoff: _   Tension: _
  Plot Dynamics: _   Scene/Genre: _

TOP-LINE (cheapest, highest-signal first)
  - Page count: [X vs target, variance%] — [structural / thin]
  - Register: [lean / drifting / novelistic] — [N intrusions]
  - Distinctiveness: [specific / generic in places]

CRITICAL ISSUES  (each tagged → Doctor Category)
  1. [issue] — pp[X-Y] — → Doctor: Category [N]
  ...
MEDIUM ISSUES (tagged)
MINOR ISSUES (tagged)

STRENGTHS  [3, specific — what to protect in revision]

RECOMMENDED REPAIR SEQUENCE
  [ordered list of doctor categories to run, length/structure first]
```

## The analyzer→doctor handoff

Every issue is pre-tagged with its doctor category. The doctor does not re-diagnose; it executes the order slip. The analyzer is the diagnostician, the doctor the surgeon, and the report is the chart between them.

## Quick mode

For a fast read: report **page count vs. target** and a **one-line register read** first (both countable in seconds and your two most common failures), then the top-3 strengths and top-3 issues with categories. Full eight-dimension scoring on request.

## Working notes
- Always state the target page count being measured against; if unknown, infer from format and say so.
- Honest and constructive; protect named strengths in any recommended repair.
- Where a Style Bible or Creative Intent capsule exists, score against them, not generic notions of "good."
