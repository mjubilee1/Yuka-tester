---
name: trust-in-the-number
description: >-
  Cut Cart's #1 product priority: trust in the verdict (Buy/Maybe/Avoid) and
  trust in confidence. Use when changing scoring, thresholds, result/compare UI,
  product lookup, confidence labels, nutrition display, flags, explanations,
  serving size, or any user-facing decision output. Also use when reviewing
  features, prioritizing backlog, or the user mentions trust, confidence,
  verdict credibility, or "the number."
---

# Trust in the Number (Priority #1)

Cut Cart wins only if a gym-goer **believes the verdict** and **understands how sure we are**. That is the #1 improvement we own — ahead of new categories, LLM copy, polish, and growth features.

When this skill applies, **optimize for trust first**. Do not ship chrome that makes the number feel smarter without making it more honest.

## What "the number" means

| Concept | User-facing | Internals |
|---|---|---|
| **Verdict** | Buy / Maybe / Avoid | Deterministic rules in `mobile/lib/scoring/` + `scoring/src/` |
| **Confidence** | How much to trust the nutrition data behind the verdict | `product.confidence`: `high` \| `medium` \| `low` \| `missing` |
| **Why** | Plain-English rule breach vs thresholds | Flags + explanation from `rules.ts` / `cutting.json` |

Confidence is **data quality**, not model certainty. Never imply AI judgment.

## Non-negotiables

1. **Show the rule, not just the badge**  
   Every Avoid/Maybe must name the metric and the threshold in coach language.  
   Good: `Sugar 12g — buy max is 4g for bars on a cut.`  
   Bad: `Not ideal for cutting.` / `Confidence: HIGH`

2. **Confidence must be human and actionable**  
   Never show raw `HIGH` / `MEDIUM` / `LOW` alone. Always pair with *why* and *what to do*.  
   See [copy.md](copy.md).

3. **Serving basis is part of trust**  
   Macros without per-serving / per-container context destroy trust. Prefer explicit basis over pretty layout.

4. **Missing data degrades confidence, never invents nutrition**  
   Incomplete OFF data → lower confidence + softer UX. Do not hallucinate macros or invent thresholds.

5. **Verdict and confidence are separate**  
   A product can be Avoid with high confidence (we trust the sugar is high) or Buy with low confidence (macros incomplete). Never collapse them into one score.

6. **Deterministic rules stay auditable**  
   Thresholds live in `cutting.json` (and mobile mirror). No LLM in the verdict path. Explanations are templates/flags, not free-form generation.

7. **Trust beats coverage**  
   Prefer fewer high-confidence beachhead SKUs over more low-confidence guesses. "Not in catalog" / "low confidence — check the label" is better than a wrong Buy.

## Priority stack (when choosing work)

Do these before almost anything else:

1. Transparent rule display on result + compare
2. Human confidence copy + behavior (warn, don't overclaim)
3. Serving size / basis clarity
4. Align confidence with real data completeness (protein, calories, sugar/added sugar)
5. Flag messages that cite actual numbers vs thresholds
6. Compare deltas that cite the same rules

Defer if they don't raise trust: new categories, LLM explanations, social, animations, B2B.

## Agent workflow

When implementing or reviewing decision UI / scoring:

```
Trust checklist:
- [ ] Verdict reason cites metric + threshold (or explicit "fits all cutting targets")
- [ ] Confidence uses human copy from copy.md (not bare HIGH/MEDIUM/LOW)
- [ ] Low/missing confidence changes UX (caution, not full certainty)
- [ ] Serving / basis visible if macros shown
- [ ] No invented nutrition or thresholds
- [ ] Scoring still deterministic (rules + cutting.json)
- [ ] Mobile + CLI scoring stay consistent if rules change
```

### If changing thresholds (`cutting.json`)

- Update both `mobile/lib/scoring/cutting.json` and root scoring config if duplicated
- Update flag/explanation strings so displayed limits match config
- Run `npm run test:scoring` (and mobile-equivalent checks if present)
- Prefer small, explainable threshold changes over "tuning until it feels right"

### If changing confidence logic

Source of truth patterns live in:

- `mobile/lib/products/lookup.ts` (`mapOffToProduct`)
- `scoring/src/off-client.ts` (`confidenceFromOff`)

Rules of thumb:

| Level | When | User should feel |
|---|---|---|
| `high` | Core macros present + strong completeness / curated cache | Safe to decide in-aisle |
| `medium` | Core macros present but incomplete record | Decide, but glance at label if it matters |
| `low` | Name only or sparse nutrition | Treat as hint; verify label |
| `missing` | No usable product data | No verdict theater — say we can't score |

Keep mobile and `scoring/src` logic aligned.

### If changing result / compare UI

- Lead with verdict, then **why (rules)**, then macros, then confidence
- Compare: lead with deltas tied to cutting metrics (`+8g protein`, `−3g sugar`), not only two badges
- Avoid engineer labels: `confidence`, `completeness`, `OFF`, `cache hit`

## Anti-patterns (reject these)

| Anti-pattern | Why it kills trust |
|---|---|
| Bare `Confidence: HIGH` | Opaque; feels like a black box |
| LLM-written verdicts | Non-auditable; can hallucinate |
| Buy on incomplete macros without warning | User gets burned once and churns |
| Hiding thresholds "to keep UI clean" | Clean but untrusted |
| One 0–100 health score | That's Yuka; we own goal decisions |
| Paid / boosted rankings | Destroys trust moat permanently |
| Softening Avoid to Maybe to reduce friction | Honesty > retention hacks |

## Relationship to the moat

Trust in the number is how we earn the habit that produces rejection data. Without trust, weekly opens die and the data moat never forms.

See also: `notes/competitors-and-moat.md`

## Additional resources

- Human-facing confidence + rule copy: [copy.md](copy.md)
