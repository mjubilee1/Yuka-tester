# GTM: First 100 Users

**Channel (one only):** Micro-influencer / fitness coach loop  
**Geo:** Single metro, single retailer chain (Target or Kroger)  
**Timeline:** Weeks 1–8 (concierge overlap + beta)

---

## Why this channel

| Factor | Fit |
|---|---|
| Cutting shoppers | Coaches already serve this persona |
| Protein bars + yogurt | Staple "what should I buy" questions in DMs |
| Concierge test | Coaches can supply 5–10 users each |
| Content hook | "Cart audit" cards are shareable on Stories/Reels |
| CAC | $0–low (product access + affiliate later) |

**Not pursuing in first 100:** Paid ads, broad Reddit, SEO mass content, retailer partnerships.

---

## First 100 breakdown

| Source | Count | Week |
|---|---|---|
| Concierge cohort (direct recruit) | 20 | 0–1 |
| Coach referrals (4 coaches × 5 clients) | 20 | 1–2 |
| Micro-creators (10 creators × 5 audience) | 50 | 2–6 |
| Waitlist overflow from creator posts | 10 | 4–8 |

---

## Coach / creator playbook

### Target profile

- 5K–50K followers (Instagram or TikTok)
- Niche: cutting, macro tracking, gym nutrition — not general wellness
- US-based, shops at Target/Kroger/Walmart

### Offer (no cash initially)

1. Free lifetime access during beta
2. Personal "cart audit" session (concierge-style, 1 trip)
3. Shareable trip summary graphic template (Canva/Figma)
4. Early affiliate rev share if subscription launches (10–20% — define at paywall)

### Ask

- 1 Story/Reel: "I used [App] on my grocery run — here's what I swapped"
- Link to TestFlight/Play beta or concierge WhatsApp for waitlist
- Refer 5 cutting clients who shop weekly

### Outreach template

```
Subject: Cart audit for your cutting clients?

Hi [Name] — building a grocery decision tool for people on a cut (protein bars + yogurt only). 

Looking for 5 coaches/creators to test before launch. You'd get:
- Free beta access
- I'll personally audit one of your grocery trips
- Shareable "cart audit" card for your Stories

Takes 10 min to onboard. Interested?
```

---

## Creator content formats

1. **Ranked shelf:** "Every protein bar at Target ranked for cutting" (uses your seed DB)
2. **Swap reel:** "I almost bought X — app said Avoid — bought Y instead"
3. **Comparison:** Side-by-side scan of Quest vs ONE

All content links to single landing page with waitlist + coach referral code.

---

## Landing page (minimal)

- Headline: "Know what to buy before it goes in the cart"
- Sub: Protein bars & Greek yogurt. Built for cutting.
- CTA: Join beta (email + "who referred you")
- Social proof: Trip summary screenshots from concierge

---

## Referral tracking

| Code prefix | Owner |
|---|---|
| `COACH-` | Fitness coach |
| `CREATOR-` | Micro-influencer |
| `CONCIERGE-` | Direct recruit |

Store in `gtm/referrals.csv`:

```
code,type,owner_name,signup_count,activated_count,w2_retained_count
```

---

## Weekly GTM metrics

| Metric | W4 target | W8 target |
|---|---|---|
| Waitlist signups | 50 | 150 |
| Activated (3+ scans) | 20 | 80 |
| W2 retained | 5 | 25 |
| Creator posts live | 3 | 10 |
| Coaches active | 2 | 4 |

---

## Expansion trigger (after 100)

Only add channel #2 (comparison SEO content) when:

- W2 retention ≥25% in first 100
- Hit rate ≥80% in beachhead
- 3+ organic creator posts without prompting

---

## Files

- [`gtm/outreach-tracker.csv`](../gtm/outreach-tracker.csv) — coach/creator pipeline
- [`gtm/referrals.csv`](../gtm/referrals.csv) — referral codes and conversion
- [`gtm/content-calendar.md`](../gtm/content-calendar.md) — post schedule
