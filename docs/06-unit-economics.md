# Unit Economics & Scoring Architecture

**Principle:** Deterministic scoring first. LLM/STT only post-PMF. Cache everything.

---

## Cost model (MVP — no LLM/STT)

| Item | Cost per active user/month | Notes |
|---|---|---|
| Product API / OFF | ~$0 | Free tier + caching |
| Postgres + hosting | ~$0.05–0.15 | Supabase/Railway at low scale |
| Push notifications | ~$0.01 | Trip reminders |
| **Total variable (MVP)** | **~$0.06–0.20** | Sustainable while bootstrapping |

### Post-PMF add-ons (do not ship in MVP)

| Item | Cost per event | At 30 scans + 10 voice/mo |
|---|---|---|
| LLM explanation (uncached) | $0.002–0.02/scan | $0.06–0.60 |
| STT + LLM structure | $0.02–0.08/note | $0.20–0.80 |
| **Heavy user w/ voice+LLM** | — | **$0.50–2.00+/mo** |

**Rule:** Do not enable LLM-on-every-scan until subscription revenue covers ≥3x variable cost.

---

## Scoring architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ Product DB  │────▶│ Rules engine     │────▶│ Verdict         │
│ (nutrition) │     │ (deterministic)  │     │ Buy/Maybe/Avoid │
└─────────────┘     └────────┬─────────┘     └────────┬────────┘
                             │                        │
                             ▼                        ▼
                    ┌──────────────────┐     ┌─────────────────┐
                    │ Flag templates   │     │ Goal overlay    │
                    │ (cached text)    │     │ (cutting)       │
                    └──────────────────┘     └─────────────────┘
```

### Layer 1: Base nutrition flags (product-level, cacheable)

Computed once per product, stored in DB:

- `added_sugar_g` vs category benchmarks
- `protein_g` vs category benchmarks
- `calories` per serving
- `protein_per_calorie` ratio
- `ingredient_count` / ultra-processed heuristics (optional Phase 2)

### Layer 2: Goal overlay (cutting)

Personalized verdict from base flags + user thresholds in `scoring/goals/cutting.json`.

### Layer 3: Explanation templates

No generation at request time. Example:

```json
{
  "flag": "added_sugar_high",
  "template": "{added_sugar_g}g added sugar per serving. For cutting, aim for ≤{max_added_sugar}g."
}
```

Substitute values at render time only.

---

## Cutting thresholds (defaults)

See [`scoring/goals/cutting.json`](../scoring/goals/cutting.json).

| Nutrient | Buy | Maybe | Avoid |
|---|---|---|---|
| Added sugar (g/serving) | ≤4 | 5–8 | >8 |
| Protein (g/serving) | ≥18 | 12–17 | <12 |
| Calories (bar) | ≤220 | 221–280 | >280 |
| Protein/calorie ratio | ≥0.08 | 0.06–0.079 | <0.06 |

Yogurt uses per-container thresholds (adjusted in rules).

---

## Caching strategy

| Cache key | TTL | Invalidation |
|---|---|---|
| `product:{barcode}:flags` | Permanent | Manual refresh on reformulation |
| `product:{barcode}:explanations` | Permanent | Template version bump |
| `product:{barcode}:goal:cutting` | Permanent | Threshold config change |
| `compare:{a}:{b}:cutting` | 7 days | Product update |

---

## LLM usage policy (post-PMF only)

| Use case | Allowed when | Model tier |
|---|---|---|
| Ingredient deep-dive (user tap) | Paid users, on-demand | Small/cheap |
| Unknown ingredient batch enrich | Offline batch | Batch API |
| Voice → structured | Phase 2, if A/B wins | Fine-tuned classifier after 1K labels |

**Never:** LLM sets Buy/Maybe/Avoid. Rules engine only.

---

## Break-even sketch (subscription)

| Assumption | Value |
|---|---|
| Price | $5.99/mo |
| Stripe fee | ~$0.47 |
| Infra per paid user | ~$0.20 |
| **Contribution margin** | **~$5.32** |
| Paid conversion (of W4 retained) | 5–10% target |

At 500 W4-retained users, 5% paid → 25 subs → ~$133/mo revenue. Covers infra; not salary. Need ~2K retained for meaningful bootstrap revenue.

---

## Implementation

- Rules: [`scoring/src/rules.ts`](../scoring/src/rules.ts)
- Templates: [`scoring/templates/`](../scoring/templates/)
- CLI: `npm run score`, `npm run compare`
