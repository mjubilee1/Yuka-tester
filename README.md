# Yuka-tester

Pre-build validation toolkit for the **AI Grocery Decision Engine**. Implements the post-investor-grill plan: prove weekly grocery behavior change before writing app code.

## Thesis (locked)

> For cutting shoppers, reduce "should I buy this?" from 90 seconds to a 5-second goal verdict — and capture why they rejected it.

**Wedge:** Cutting shoppers · **Categories:** Protein bars + Greek yogurt only

## Quick start

```bash
npm install

# Score a barcode (Open Food Facts lookup + deterministic rules)
npm run score -- 737628006504

# Compare two products
npm run compare -- 737628006504 850046331012

# Audit OFF hit rate for seed barcodes (200 default, ~2 min with rate limiting)
npm run audit:barcodes

# Analyze capture method A/B from concierge logs
npm run analyze:capture

# Run scoring unit tests
npm run test:scoring
```

## Project structure

```
docs/
  01-wedge-decision.md       # Locked persona + categories + success gates
  02-concierge-test-playbook.md
  03-capture-method-ab-test.md
  04-mvp-spec-rescoped.md    # Bootstrap-safe MVP scope
  05-gtm-first100.md         # Coach/creator GTM plan
  06-unit-economics.md       # Cost model + caching strategy

concierge/                   # Manual test tracking (CSV + templates)
gtm/                         # Outreach pipeline + content calendar
data/
  seed-barcodes.json         # 200 beachhead barcodes to audit
  audit-results/             # Generated audit reports

scoring/
  goals/cutting.json         # Threshold config
  src/                       # Deterministic rules engine (no LLM)
scripts/                     # CLI, barcode audit, capture analysis
```

## Validation workflow

1. **Week 0:** Recruit 20 cutting shoppers → [`docs/02-concierge-test-playbook.md`](docs/02-concierge-test-playbook.md)
2. **Weeks 1–4:** Manual concierge via WhatsApp; use `npm run score` for verdicts
3. **Weeks 2–3:** A/B capture test → [`docs/03-capture-method-ab-test.md`](docs/03-capture-method-ab-test.md)
4. **Before build:** Run `npm run audit:barcodes` — need ≥80% high-confidence hit rate
5. **Go/no-go:** W2 retention ≥25% → build rescoped MVP → [`docs/04-mvp-spec-rescoped.md`](docs/04-mvp-spec-rescoped.md)

## Build gates

| Gate | Threshold |
|---|---|
| W2 retention | ≥25% |
| Barcode hit rate (high conf) | ≥80% |
| Reason capture rate | ≥40% |
| Comparison usage (W2 users) | ≥50% |

If W2 <20%, do not build the Expo app. Pivot wedge or channel first.

## Scoring principles

- **Deterministic rules only** — LLM/STT deferred to post-PMF
- **Template explanations** — cached, no per-scan generation cost
- **Auditable thresholds** — see `scoring/goals/cutting.json`

## GTM

Single channel: micro-influencer / fitness coach loop. See [`docs/05-gtm-first100.md`](docs/05-gtm-first100.md).
