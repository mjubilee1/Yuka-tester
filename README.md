# Yuka-tester

Pre-build validation toolkit for the **AI Grocery Decision Engine**. Implements the post-investor-grill plan: prove weekly grocery behavior change before writing app code.

## Thesis (locked)

> For cutting shoppers, reduce "should I buy this?" from 90 seconds to a 5-second goal verdict — and capture why they rejected it.

**Wedge:** Cutting shoppers · **Categories:** Protein bars + Greek yogurt only

## Quick start

```bash
npm install

# 1. Build local product cache (one-time; respectful OFF API usage)
npm run build:cache

# 2. Audit cache coverage against seed list (no live API)
npm run audit:barcodes

# 3. Score a barcode (cache first → live API fallback, 1 call per scan)
npm run score -- 0894700010137

# Compare two products
npm run compare -- 0888849000012 850046331012

# Concierge / A/B analysis
npm run analyze:concierge
npm run analyze:capture

npm run test:scoring
```

## Important: Open Food Facts usage

**Do not bulk-scrape the live OFF API.** OFF blocks that and recommends nightly static exports instead.

| Task | Method |
|---|---|
| Bulk audit / hit rate | Local cache (`npm run audit:barcodes`) |
| Bootstrap cache | `npm run build:cache` once (2s delay per item) |
| Concierge / user scan | `npm run score` (cache → single live API call) |
| Full DB at scale | OFF Parquet export (see `docs/07-off-data-strategy.md`) |

Previous 16.5% "hit rate" was **rate limiting**, not missing data. v0 API + local cache fixes this.

## Project structure

```
docs/
  01-wedge-decision.md       # Locked persona + categories + success gates
  02-concierge-test-playbook.md
  03-capture-method-ab-test.md
  04-mvp-spec-rescoped.md
  05-gtm-first100.md
  06-unit-economics.md
  07-off-data-strategy.md    # OFF compliance + cache architecture

concierge/                   # Manual test tracking (CSV + templates)
gtm/                         # Outreach pipeline + content calendar
data/
  seed-barcodes.json         # 200 beachhead barcodes
  curated-products.json      # Hand-verified products (no API)
  product-cache/index.json   # Local cache (generated)
  audit-results/             # Audit reports

scoring/                     # Deterministic rules engine (no LLM)
scripts/                     # CLI, cache build, audit, analysis
```

## Validation workflow

1. **Week 0:** Recruit 20 cutting shoppers → `docs/02-concierge-test-playbook.md`
2. **Build cache:** `npm run build:cache` then `npm run audit:barcodes`
3. **Weeks 1–4:** Manual concierge via WhatsApp; use `npm run score` for verdicts
4. **Weeks 2–3:** A/B capture test → `docs/03-capture-method-ab-test.md`
5. **Go/no-go:** W2 retention ≥25% + cache hit rate ≥80% → build MVP

## Build gates

| Gate | Threshold |
|---|---|
| W2 retention | ≥25% |
| Local cache hit rate (high conf) | ≥80% on seed list |
| Reason capture rate | ≥40% |
| Comparison usage (W2 users) | ≥50% |

If cache <80% after bootstrap: add to `curated-products.json` or plan OCR path.

## GTM

Single channel: micro-influencer / fitness coach loop. See `docs/05-gtm-first100.md`.
