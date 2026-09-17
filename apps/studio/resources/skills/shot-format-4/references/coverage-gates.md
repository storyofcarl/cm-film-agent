# Coverage Gates

The deterministic verification pass that runs **every time** before shot-format-4 emits outputs. It exists because a skill (instructions) cannot guarantee coverage on its own — the model executing it can under-produce and self-report success. So the verdict moves into code (`scripts/check_coverage.py`), the model only *proposes*, and the workflow **loops until the gates pass**. This is the maker pattern: decompose the film into scenes, generate full coverage per scene, verify each leaf and the whole in code, fix only the failing nodes, re-verify to zero hard failures.

## Contents
- Why this exists (the failure it prevents)
- How the coverage target is derived (ASL + intensity), with safeguards
- The gates
- The generate→check→fix loop
- What it cannot check (the ceiling)

## Why this exists

A 90-minute film is ~5400s. At a 4s average shot length that is ~1350 shots; at 8s, ~675. A list of ~160 shots is ~33s per shot — slower than almost any narrative film, i.e. drastically under-covered. The model produces such a list when "close the runtime / cover the film" is a *described rule* rather than an *enforced check*: it generates a plausible-looking sparse subset and declares success. Two failure shapes result, and the battery catches both:
- **Gap:** realistic durations that sum to far less than the runtime (most of the film uncovered).
- **Inflation:** durations padded so the seconds add up, producing impossible long takes.

## How the coverage target is derived

The expected shot count is **not** a fixed number — it comes from the playbook:
- **ASL target** (muse block `asl_target_s`) gives the flat expectation: `expected = master_runtime / asl_target`.
- **Intensity curve**, when provided, refines it per sequence: higher intensity → shorter ASL → more shots. `expected = Σ (seq_duration / asl_for_intensity(intensity))`, where intensity 0 maps to the long end of `asl_range_s` and 10 to the short end.

**Absolute safeguards (independent of ASL)** bound the plausible count for any project duration, from the per-shot duration limits:
- `duration_floor_s` (default 0.3s) and `duration_ceiling_s` (default 12s, ~the model clip ceiling).
- `min_shots = ceil(master / duration_ceiling_s)` — you cannot cover the runtime with fewer shots than this without exceeding the max-shot length.
- `max_shots = floor(master / duration_floor_s)`.
- The produced count must fall within `[min_shots, max_shots]` regardless of what ASL says. This is the floor/ceiling guard that holds even if the ASL target is mis-set.

## The gates

Run by `scripts/check_coverage.py shots.json targets.json`. Each returns a deterministic verdict; the report names the specific failing nodes; exit code 0 only if all **hard** gates pass.

| Gate | Hard? | Checks |
|---|---|---|
| G1 runtime closure | hard | `Σ(durations) + Σ(picture_delta) == master` within tolerance; reports % covered and uncovered seconds |
| G2 count safeguard | hard | actual count within the absolute `[min_shots, max_shots]` band |
| G3 ASL coverage | hard | actual ≥ `coverage_floor_ratio` × ASL-expected (intensity-weighted if a curve is given) |
| G4 duration bounds | hard | every shot within `[floor, ceiling]` unless `[LOCK]` (deliberate long take) |
| G6 conformance presence | hard | every shot carries function, intensity, ref, duration |
| G7 numbering integrity | hard | ids parse `SQ###-SC###-SH###`; contiguous from 001 per scene; no gaps |
| G8 ref integrity | hard* | every REF name ∈ bible (*only if `bible_keys` provided) |
| G9 manifest coverage | hard* | every declared scene has ≥1 shot (*only if `manifest` provided) |
| G5 per-scene density | soft | flags scenes whose average shot length exceeds the ceiling (under-covered) |

The two fake-coverage shapes fail on **different** gates — a gap fails G1; inflation passes G1 but fails G4/G5 — so neither slips through.

## The generate → check → fix loop

1. **Decompose by sequence/scene.** Do not generate a 90-minute film in one pass; that is what produces the sparse, compressed list (context decay). Generate full coverage one scene at a time (establishing → coverage → inserts → reactions per references/patterns.md).
2. **Assemble** the shot array (carry function, intensity, ref, duration, transition/picture_delta per shot).
3. **Build targets.json** from the playbook: `master_runtime_s`, `asl_target_s`, `asl_range_s` (muse block), `duration_floor_s`/`duration_ceiling_s` safeguards, optional `intensity_curve`, `manifest` (declared scenes), `bible_keys`.
4. **Run `check_coverage.py`.** Read the report.
5. **On any hard FAIL:** fix only the named nodes — break under-covered scenes into fuller coverage, split over-ceiling shots, add the missing declared scenes — and re-run. Do **not** finalize.
6. **Repeat until exit 0.** Only then emit the four output styles.

The model never certifies coverage; the script does. The loop guarantees convergence to full coverage rather than a plausible-looking subset.

## What it cannot check (the ceiling)

These gates guarantee the **mechanical floor**: the runtime closes, the film is fully covered at the declared density, durations are sane, every shot is conformant and numbered. They do **not** judge whether the coverage is *good* — the right angles, the right rhythm, whether a scene's specific shots serve the story. That is the taste ceiling, and it escalates to a human or to the downstream visual battery (keyframe-stills canary). Full mechanical coverage is what this guarantees every time; a well-shot film is what that coverage makes possible.
