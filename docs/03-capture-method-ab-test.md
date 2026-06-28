# Capture Method A/B Test

**Goal:** Pick the MVP feedback capture UX before building voice infrastructure.  
**When:** Concierge weeks 2–3 (overlapping with retention measurement)  
**Hypothesis:** One-tap chips outperform voice in capture rate and do not hurt retention.

---

## Variants

Split cohort into 3 groups (~7 users each). Randomize at onboarding.

| Group | UX after Avoid/Maybe | Voice |
|---|---|---|
| **A — One-tap only** | Show 8 reason chips; must pick one or "Skip" | None |
| **B — Voice optional** | Show chips + "Or record voice note" button | Optional, post-decision |
| **C — Control** | No prompt; optional free-text if user volunteers | None |

### Reason chips (fixed set for test)

1. Sugar too high
2. Low protein
3. Too many calories
4. Too expensive
5. Ingredients / additives
6. Taste / texture (prior bad experience)
7. Prefer other brand
8. Other (free text)

---

## Primary metrics

| Metric | Definition | Winner threshold |
|---|---|---|
| **Capture rate** | Events with reason / (Avoid + Maybe verdicts) | Highest without W2 drop >5pp vs control |
| **Time to capture** | Seconds from verdict to reason logged | <5 sec median for winner |
| **W2 retention by group** | Week 2 return rate | Must not trail control by >5pp |
| **Reason quality** | % mappable to structured taxonomy | ≥90% for one-tap |

### Secondary metrics

- Voice adoption in Group B (% who ever use voice)
- Voice vs chip when both shown (B only)
- Skip rate by group

---

## Protocol

### Week 2

- Groups A and B get reason prompt after every Avoid/Maybe
- Group C: no prompt; log if user sends unprompted reason
- Do **not** mention voice to Group A

### Week 3

- Same UX; add comparison flows (reason after "loser" in comparison)
- Group B: voice is **post-decision only** (never in-aisle interrupt)

### End of Week 3 analysis

```
capture_rate_A vs capture_rate_C → lift from one-tap
capture_rate_B vs capture_rate_A → lift from voice option
W2_A vs W2_C, W2_B vs W2_C → retention impact
voice_share_B → if <10%, deprioritize voice in MVP
```

---

## Decision matrix

| Result | MVP decision |
|---|---|
| A beats C on capture; W2 within 5pp | **Ship one-tap only in MVP** |
| B beats A on capture ≥15pp; W2 within 5pp | Ship one-tap + optional voice post-decision |
| B voice adoption <10% | Defer voice to post-PMF regardless |
| Any variant drops W2 >5pp vs C | Use control (minimal prompt) + trip summary hook instead |

---

## Structured taxonomy (for aggregation)

Map chips to fields for future B2B (logged simply in `trip-log.csv`):

| Chip | `primary_reason` | `concern_type` |
|---|---|---|
| Sugar too high | added_sugar | nutrition |
| Low protein | low_protein | nutrition |
| Too many calories | calorie_density | nutrition |
| Too expensive | price_value | value |
| Ingredients / additives | ingredient_distrust | ingredients |
| Taste / texture | sensory_prior | experience |
| Prefer other brand | competitive_switch | comparison |
| Other | free_text | other |

---

## Voice defer criteria (default assumption)

Unless Group B shows **≥15% capture lift** AND **≥10% voice adoption** without retention harm:

- MVP ships **one-tap only**
- Voice notes deferred to Phase 2
- No STT/LLM cleaning costs in MVP (see `docs/06-unit-economics.md`)

---

## Logging

Add columns to `concierge/trip-log.csv`:

- `ab_group`: A | B | C
- `capture_method`: chip | voice | free_text | none
- `reason_chip`: chip label or empty
- `seconds_to_capture`: integer

Analysis script: `npm run analyze:capture`
