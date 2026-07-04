# Cut Cart (Expo)

Mobile MVP for cutting shoppers — scan, get Buy/Maybe/Avoid, track the cart.

## Run

```bash
cd mobile
npm install
npm start
```

- **iOS simulator:** press `i` — use manual barcode entry on scan screen
- **Physical device:** Expo Go app + scan QR code

### Test barcodes (manual entry)

| Barcode | Product |
|---|---|
| `0894700010137` | Chobani Plain Greek |
| `0888849000012` | Quest Cookie Dough bar |
| `850046331012` | RXBAR Chocolate Sea Salt |
| `859977005014` | Good Culture Cottage Cheese |
| `073420000123` | Daisy Cottage Cheese 4% |
| `811620021977` | fairlife Core Power Chocolate |
| `811620020147` | fairlife 2% Ultra-Filtered Milk |
| `643843200021` | Premier Protein Chocolate |

## Features

- Barcode scan (camera + manual entry)
- Buy / Maybe / Avoid for your cut profile
- In cart / Left it (honest trip audit)
- Plain-English rules + human confidence
- Serving size on every verdict
- Compare with deltas first
- Optional price → $/20g protein
- Trip delta vs last shop + last 3 trips
- Categories: bars, Greek yogurt, cottage cheese, protein milk

## Sync product cache from parent project

When you update the cache in the repo root:

```bash
# from repo root
npm run sync:mobile-cache
```

## Architecture

- `lib/scoring/` — deterministic rules (no LLM)
- `assets/product-cache.json` — beachhead OFF cache
- `assets/curated-staples.json` — high-confidence cut staples (label-accurate servings)
- Live Open Food Facts API — fallback on cache miss (1 call per scan)
