# Cut Cart (Expo)

Mobile MVP for cutting shoppers — scan protein bars & Greek yogurt, get Buy/Maybe/Avoid.

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

## Features (MVP v1)

- Barcode scan (camera + manual entry)
- Buy / Maybe / Avoid for cutting goal
- Compare two products
- One-tap rejection reasons (Avoid/Maybe)
- Trip summary / cart audit

## Sync product cache from parent project

When you update the cache in the repo root:

```bash
# from repo root
npm run sync:mobile-cache
```

## Architecture

- `lib/scoring/` — same deterministic rules as CLI (no LLM)
- `assets/product-cache.json` — 203 bundled products (offline-first)
- Live Open Food Facts API — fallback on cache miss (1 call per scan)
