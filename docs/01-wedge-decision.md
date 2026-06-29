# Wedge Decision (Locked)

**Status:** Committed before any build  
**Date:** June 28, 2026

## One sentence thesis

> For cutting shoppers, we reduce "should I buy this?" from 90 seconds of label reading to a 5-second goal verdict — and capture why they rejected it.

---

## One persona (only)

### Primary: Cutting shopper

| Attribute | Specification |
|---|---|
| Age | 28–40 |
| Behavior | Already tracks macros (MyFitnessPal, Cronometer, or similar) |
| Shop cadence | 1–2 grocery trips per week |
| Goals | Fat loss or recomposition; high protein, controlled calories, low added sugar |
| Budget | Budget-aware but willing to pay for better macros when value is clear |
| Pain | Label fatigue in protein bars, yogurt, snacks; compares 2–3 options per category |
| Trigger | Opens app before or during shop when buying "decision-heavy" categories |

### Explicitly deferred personas

Parents, environment-aware shoppers, financially flexible upgraders, and general "health-aware skeptics" are **Phase 2+**. Do not design MVP for them.

---

## Two category beachhead (only)

Launch coverage is limited to these aisles until 80%+ barcode hit rate is proven in-store.

### 1. Protein bars

- High scan intent during cutting
- Dense nutrition labels, confusing marketing ("20g protein" vs sugar alcohols)
- Strong comparison behavior (Quest vs ONE vs Kirkland vs RXBAR)
- ~40–60 SKUs per major retailer

### 2. Greek yogurt (and high-protein yogurt)

- Weekly staple for cutting shoppers
- Key decision variables: protein, sugar, calories, price per gram protein
- ~20–35 SKUs per major retailer

### Out of scope for Phase 0–1

All other grocery categories. No "full store" positioning until beachhead hit rate and W2 retention pass gates.

### Data source

Bulk validation uses **local product cache** built from OFF static data policy (see [`docs/07-off-data-strategy.md`](07-off-data-strategy.md)). Live OFF API: 1 call per real user scan only.

---

## One habit metric

| Metric | Target (validation) | Kill threshold |
|---|---|---|
| Weekly scan sessions | 1+ per shopper per grocery trip | <20% W2 retention in concierge cohort |
| Scans per session | 3+ in beachhead categories | Median <2 scans/session at week 2 |
| Decision impact | 1+ cart change per trip (buy/switch/avoid) | <30% report cart change by trip 2 |

---

## Success gates before Expo build

1. Concierge cohort (n=20): **≥25% W2 retention** (returned for trip 2)
2. Barcode audit: **≥80% high-confidence hit rate** in protein bars + Greek yogurt at target retailer
3. Capture method: **≥40% reason capture rate** with winning UX (one-tap or voice)
4. Comparison test: **≥50% of trip-2 users** use comparison at least once

If any gate fails, pivot wedge or channel — do not build the app.

---

## Retailer focus (validation)

Single geography, single chain for first 4 weeks:

- **Chain:** Target or Kroger (pick one based on local access)
- **Stores:** 2 locations max
- **Geo:** One metro area (founder's local market)

Rationale: maximize in-person observation, seed database for one shelf set, simplify concierge response time.
