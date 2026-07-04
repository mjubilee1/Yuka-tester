# Trust copy (verdict + confidence)

Use coach language. Short. Specific. No founder or engineer voice.

## Confidence labels

Never show only `HIGH` / `MEDIUM` / `LOW` / `MISSING`.

| Internal | Primary label | Supporting line (pick one) |
|---|---|---|
| `high` | **Data looks solid** | Nutrition fields we need are present. Safe to decide here. |
| `medium` | **Decent data — double-check if unsure** | Core macros are in; label may still differ. |
| `low` | **Thin data — check the label** | We're missing fields. Treat this as a hint. |
| `missing` | **Can't score this yet** | Not enough nutrition data for a cutting verdict. |

### UI patterns

**High (default calm):**
```
Data looks solid
```

**Medium (subtle caution):**
```
Decent data — glance at the label if this is a daily staple
```

**Low (strong caution, still show verdict if computable):**
```
Thin data — verify protein / sugar on the package before you buy
```

**Missing (no fake certainty):**
```
Can't score this yet
We don't have enough nutrition data. Scan another bar/yogurt or check the label.
```

If verdict is shown with `low` confidence, pair them:

```
MAYBE
Thin data — verify on the package
Sugar 7g vs buy max 4g for bars — occasional OK, not daily.
```

## Rule / threshold lines

Pattern: `{metric} {value}{unit} — {relation} {threshold}{unit} for {category} on a cut.`

### Examples (good)

- `Sugar 12g — above buy max 4g for bars on a cut.`
- `Protein 10g — below buy min 18g for bars on a cut.`
- `220 cal — at the buy limit for bars; OK if it fits your day.`
- `Fits cutting targets for sugar, protein, and calories.`

### Examples (bad)

- `Not optimal.`
- `Poor macros.`
- `Score reflects incomplete data.`
- `Confidence: HIGH`
- `Based on our proprietary model.`

## Verdict framing

| Verdict | Tone |
|---|---|
| Buy | Clear green light for the cut goal — still show macros |
| Maybe | Occasional / situational — name what holds it back |
| Avoid | Direct — name the failing metric first |

Avoid moral language ("bad food", "unhealthy"). Prefer goal language ("for a cut", "for daily use").

## Serving basis

Always prefer:

```
Per serving (1 bar / 60g)
Protein 20g · Sugar 1g · 200 cal
```

If basis unknown:

```
Macros as listed (serving size not confirmed — check package)
```

Never imply container totals are per-serving.

## Compare deltas

Lead with cutting-relevant deltas:

```
Winner for your cut: Quest
+8g protein · −3g sugar · same calories
```

Then show each product's verdict + rule lines if space allows.

## Voice checklist

- [ ] Would a trainer say this in the aisle in under 3 seconds?
- [ ] Does it cite a number the user can verify on the label?
- [ ] Does low confidence tell them what to do next?
- [ ] Zero mentions of AI, model, algorithm, completeness score, or OFF?
