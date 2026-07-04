# Competitors & Moat (Build Context)

**Purpose:** Keep this open while building. Yuka and Fig already own large parts of "scan food → get an answer." Your job is not to out-feature them with AI-generated UI — it is to own something they cannot copy by shipping a weekend clone.

**Product reminder:** Cut Cart = goal-specific buy/maybe/avoid for *cutting* shoppers (protein bars + Greek yogurt first), plus *why they rejected*, trip audit, and eventual rejection intelligence for brands.

---

## What Yuka does

**Positioning:** Universal "is this healthy?" score for the mass market.

| Layer | What they ship |
|---|---|
| Core loop | Scan barcode → 0–100 score → color (green/yellow/red) |
| Scoring basis | Nutrition quality + additives (and cosmetics in a separate mode) |
| Personalization | Light — mostly one global health rubric, not your goal this week |
| Coverage | Broad catalog, many countries; strength is *scale of products scored* |
| Business model | Consumer freemium / subscription; brand pressure via public scores |
| Trust story | Independent scoring; brands hate being red-flagged |
| What they optimize | "Should a health-conscious person eat this in general?" |

**What Yuka is *not*:**
- Not goal-aware (cutting vs bulking vs maintenance)
- Not a comparison engine for "which of these two bars fits *my* macros"
- Not a cart / trip habit product
- Not a structured capture of *why you put it back*

**Implication for us:** Matching Yuka's score UX is table stakes and **not a company**. If someone can prompt an LLM to "build a Yuka clone," they can. Do not spend build cycles trying to be a better general health score.

---

## What Fig does

**Positioning:** Personalized *compatibility* for dietary restrictions, allergies, and ingredient avoidances. ("Find foods you can eat.")

| Layer | What they ship |
|---|---|
| Core loop | Build a "Fig" profile → scan or search → green / yellow / red *for you* |
| Scoring basis | Ingredient-level match to diets, allergies, preferences (2,800+ options) |
| Personalization | Deep on *restrictions* (gluten-free, low FODMAP, nightshade-free, etc.) |
| Coverage | Large US grocery catalog + store discovery; some restaurant coverage |
| Business model | Free tier (limited scans) + Fig+ subscription |
| Trust story | Safety and inclusion for restricted eaters — high emotional stakes |
| What they optimize | "Is this safe / allowed given what I must avoid?" |

**What Fig is *not*:**
- Not a macros / cutting coach (protein density, calories, added sugar tradeoffs)
- Not "buy vs skip for fat loss this week"
- Not rejection *reasons* as a data product for brands
- Not trip-level cart improvement over time

**Implication for us:** Fig proves personalization retains when the cost of being wrong is high (allergy, intolerance). Our cost-of-wrong is different: wasted macros, stalled cut, label fatigue — still real, but we must earn weekly habit without medical urgency. Do not try to out-Fig Fig on restriction depth.

---

## Side-by-side (so you don't blur them)

| | **Yuka** | **Fig** | **Cut Cart (us)** |
|---|---|---|---|
| Question answered | Is this healthy? | Can *I* eat this? | Does this fit *my cut* right now? |
| Output | Universal score | Profile compatibility | Buy / Maybe / Avoid + why |
| Persona | General health-aware | Restricted / allergy / diet | Cutting / recomp fitness shopper |
| Categories | Everything | Everything that matches profile | Bars + Greek yogurt first |
| Habit | Occasional scan | Scan when unsure about safety | Every grocery trip in decision aisles |
| Data asset | Product scores at scale | Restriction × product matrix | Goal verdicts + **rejection reasons** + trip deltas |
| Easy to AI-clone? | Yes (score UI + OFF) | Partially (profile + rules) | **Only the shell** — not the habit + why-data |

---

## The AI-coding trap (read this before every feature)

Anyone with Cursor can ship in a weekend:
- Barcode scan screen
- Open Food Facts lookup
- A rules engine or LLM that says buy/skip
- Pretty cards, compare mode, trip summary UI

**That means the app shell is not a moat.** If your roadmap is mostly screens and prompts, you are building something a funded competitor (or Yuka/Fig) can replicate faster than you can defend it.

### What AI coding *cannot* easily replicate

These take time, distribution, trust, and real-world loops — not tokens:

1. **Weekly habit in one persona**  
   Proof that cutting shoppers open you *every trip* and change the cart. Scanner apps die at week 2. Retention is the gate; features are not.

2. **Structured rejection data at the shelf**  
   "I almost bought it but sugar was too high / ingredients felt fake / protein per calorie lost." Captured in the moment, at scale, with consistent taxonomy. Nielsen knows what sold. Nobody owns *why it lost at the shelf* for goal-driven shoppers.

3. **Curated beachhead truth**  
   High-confidence nutrition for the exact SKUs cutting shoppers actually compare (US bars + yogurt), not raw OFF garbage. Manual seeding, audits, retailer-specific shelves — boring work that compounds.

4. **Trust architecture**  
   No paid rankings, no score boosts for brands. Consumer trust is the only asset that makes B2B rejection intel valuable later. One paid placement and the moat dies.

5. **Decision quality over time**  
   Trip summaries, deltas vs last trip, comparison winners — the product gets smarter *because the user has history*, not because the model is bigger.

6. **Brand relationships built on that data**  
   Design partners paying for "why you lost to Quest on the shelf" — sales cycles and credibility that a clone app does not have.

### What looks like a moat but isn't

| Fake moat | Why it fails |
|---|---|
| "We use AI for explanations" | LLM text is commodity; cache templates are enough for MVP |
| Pretty scan UX | Replicable in days |
| Broader category coverage | Yuka/Fig already win on breadth; breadth without habit is a graveyard |
| Generic health score | Yuka owns this narrative |
| Restriction profiles | Fig owns this narrative |
| Proprietary model weights | Without proprietary *behavior data*, weights are a feature |

---

## Our real moat (lock this in)

> **The moat is not the score. It is the trusted, goal-specific decision habit — and the structured "why" that only exists because people use us at the shelf every week.**

Build order should always prefer moat over chrome:

| Priority | Build | Why it's hard to copy |
|---|---|---|
| 1 | W2+ weekly retention in cutting shoppers | Requires real behavior change |
| 2 | Reason capture rate (one-tap chips, etc.) | Needs UX + taxonomy + habit |
| 3 | Beachhead barcode confidence (bars + yogurt) | Manual curation + audits |
| 4 | Comparison + trip delta that changes trip 3 | History compounds |
| 5 | Trust rules (no paid rankings) ever | Policy + brand, not code |
| Later | Aggregated rejection intel for brands | Only valuable if 1–4 are real |

If a feature does not strengthen one of the above, it is optional polish.

---

## Competitive responses (keep answers short)

**"Isn't this just Yuka?"**  
Yuka scores products for general health. We score *decisions for a cut* and capture why people reject. Score is table stakes; habit + why is the product.

**"Isn't this just Fig?"**  
Fig answers "can I eat this given my restrictions?" We answer "should I buy this for my macros this week?" Different question, different persona, different data asset.

**"Why won't they add a button?"**  
They could. They optimize for mass health scores (Yuka) or restriction safety (Fig). Moment-of-decision qual for cutting shoppers + rejection intelligence is a different business model and trust contract. Speed of adding a button ≠ owning the habit or the data.

**"Can't someone AI-code this?"**  
They can ship the shell. They cannot skip years of weekly shelf decisions, curated beachhead data, and trusted rejection history. Build for that gap every week.

---

## Weekly build checklist

Before merging a feature, ask:

1. Does this make a cutting shopper more likely to open us on the *next* grocery trip?
2. Does this capture or improve structured *why* (reject / switch / buy)?
3. Does this deepen beachhead truth (bars + yogurt), not dilute into "all grocery"?
4. Would Yuka or Fig shipping this tomorrow erase our advantage — or only our UI?

If (4) is "erase our advantage," you are polishing a cloneable layer. Redirect to habit, why-data, or curation.

---

## One line to remember

> **Yuka owns "healthy." Fig owns "allowed." We must own "right for my cut — and why I walked away" — and that ownership only exists if people come back every week.**
