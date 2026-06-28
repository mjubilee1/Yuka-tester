# 4-Week Manual Concierge Test

**Goal:** Prove weekly grocery behavior change before writing app code.  
**Cohort size:** 20 cutting shoppers  
**Your role:** Human "decision engine" via WhatsApp/iMessage or shared Google Sheet

---

## Setup (Week 0, 2–3 days)

### Recruit 20 participants

| Source | Target |
|---|---|
| Personal network (gym, coworkers) | 8 |
| Local fitness coach referral | 6 |
| Reddit r/loseit or r/fitness (local post) | 4 |
| Instagram micro-creator audience | 2 |

**Screening criteria (all required):**

- Currently cutting or maintaining after cut
- Tracks macros at least 3 days/week
- Shops groceries 1+ times per week
- Willing to text barcodes during 2 trips minimum

### Onboard each participant (15 min)

1. Confirm goal profile: cutting defaults (see `scoring/goals/cutting.json`)
2. Add to WhatsApp group or 1:1 thread
3. Send one-pager: "Text me barcodes for protein bars or Greek yogurt. I reply Buy / Maybe / Avoid in under 30 seconds."
4. Record baseline: `concierge/participants.csv`

### Tools you need

- Phone with WhatsApp/iMessage
- `npm run score -- <barcode>` CLI (see README)
- `concierge/trip-log.csv` for every interaction
- Spreadsheet copy of `concierge/metrics-dashboard.csv` for weekly rollups

---

## Weekly protocol

### Week 1 — Activation

**Participant ask:** "On your next grocery trip, scan/text every protein bar or yogurt you consider. Minimum 3 barcodes."

**You track per user:**

- Trip date
- Barcodes sent
- Verdicts given (Buy/Maybe/Avoid)
- Did they report a cart change? (Y/N + which item)
- Reason captured? (one-tap chip or free text)

**Week 1 success:** 15/20 users send 3+ barcodes in one session

### Week 2 — Retention (critical)

**Participant ask:** "Same categories. Try comparing two products — text both barcodes and ask 'which one?'"

**Primary metric:** **W2 retention** = users who scanned again in week 2 / users active in week 1

**Target:** ≥25% (5+ of 20 return). Stretch: ≥40% (8+)

### Week 3 — Comparison + reasons

**Introduce one-tap reason chips** after Avoid/Maybe (see `docs/03-capture-method-ab-test.md`):

```
Why? [Sugar too high] [Low protein] [Too expensive] [Ingredients] [Prefer other brand] [Skip]
```

Track capture rate: reasons submitted / (Avoid + Maybe verdicts)

### Week 4 — Trip summary + paywall probe

After each trip, send manual "cart audit":

```
Your trip: 2 Buy, 1 Maybe, 2 Avoid
Estimated sugar avoided vs last trip: ~12g
Best swap: [Brand A] → [Brand B] (+4g protein, -6g sugar)
```

**Paywall probe (5 users):** "Would you pay $5/mo for unlimited comparisons + trip history?" Record Y/N/Maybe.

---

## Concierge response SLA

| Step | Target time |
|---|---|
| Receive barcode | — |
| Lookup + score | <15 sec |
| Reply with verdict + 1-line reason | <30 sec |
| Comparison (2 barcodes) | <45 sec |

Use `npm run score -- <barcode>` and `npm run compare -- <barcode1> <barcode2>`.

---

## Response template

```
[Product name] — AVOID

Why: 12g added sugar per bar; only 15g protein. For cutting, aim for ≥20g protein and ≤6g added sugar.

Better option you scanned today: [Other product] — BUY (22g protein, 1g sugar)
```

For Maybe:

```
[Product name] — MAYBE

Fits if it's a occasional treat (1x/week). Daily snack? Too calorie-dense at 280 cal for 20g protein.
```

---

## Kill / continue decision (end of Week 4)

| Outcome | Action |
|---|---|
| W2 retention ≥25%, decision impact ≥30% | Proceed to rescoped MVP build |
| W2 retention 15–24% | Extend concierge 2 weeks; test comparison hook harder |
| W2 retention <15% | Pivot wedge (channel or category) — no app build |
| Hit rate <70% in audit | Expand manual seed database before any build |

---

## Files

- `concierge/participants.csv` — cohort roster and screening notes
- `concierge/trip-log.csv` — every scan event
- `concierge/metrics-dashboard.csv` — weekly rollup formulas
- `concierge/weekly-report-template.md` — copy-paste status update
