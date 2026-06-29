#!/usr/bin/env node
/**
 * Build local product cache from seed barcodes.
 *
 * OFF policy: bulk validation should use static exports, not live API scraping.
 * This script does a ONE-TIME respectful fetch (2s delay, retries) to bootstrap
 * the local cache used by concierge + audit. Re-run only when seed list changes.
 *
 * For full DB coverage later, use OFF Parquet export (see docs/07-off-data-strategy.md).
 *
 * Usage: npm run build:cache [-- --delay 2000] [-- --limit 200]
 */
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { lookupProduct } from "../scoring/src/off-client.js";
import {
  normalizeBarcode,
  saveCacheIndex,
  loadCacheIndex,
} from "../scoring/src/product-cache.js";
import type { Product } from "../scoring/src/types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

interface SeedEntry {
  barcode: string;
  name: string;
  category: "protein_bar" | "greek_yogurt";
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseArgs() {
  const args = process.argv.slice(2);
  let delay = 2000;
  let limit = 200;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--delay" && args[i + 1]) delay = parseInt(args[i + 1], 10);
    if (args[i] === "--limit" && args[i + 1]) limit = parseInt(args[i + 1], 10);
  }
  return { delay, limit };
}

async function main() {
  const { delay, limit } = parseArgs();
  const seedPath = join(ROOT, "data/seed-barcodes.json");
  const curatedPath = join(ROOT, "data/curated-products.json");

  const seed = JSON.parse(readFileSync(seedPath, "utf-8")) as SeedEntry[];
  const toFetch = seed.slice(0, limit);

  const existing = loadCacheIndex()?.products ?? {};
  const products: Record<string, Product> = { ...existing };

  // Load hand-curated products (always included, no API needed)
  try {
    const curated = JSON.parse(readFileSync(curatedPath, "utf-8")) as Product[];
    for (const p of curated) {
      products[normalizeBarcode(p.barcode)] = p;
    }
    console.log(`Loaded ${curated.length} curated products (no API).`);
  } catch {
    console.log("No curated-products.json — skipping.");
  }

  console.log(
    `\nBootstrapping cache for ${toFetch.length} seed barcodes (${delay}ms delay per live lookup)...`
  );
  console.log("OFF policy: this is a one-time bootstrap, not bulk scraping.\n");

  let fetched = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < toFetch.length; i++) {
    const entry = toFetch[i];
    const key = normalizeBarcode(entry.barcode);

    if (products[key]?.confidence === "high") {
      skipped++;
      process.stdout.write(`[${i + 1}/${toFetch.length}] ${key} cached\n`);
      continue;
    }

    process.stdout.write(`[${i + 1}/${toFetch.length}] ${key} ... `);

    const lookup = await lookupProduct(entry.barcode, { liveOnly: true });

    if (lookup.found && lookup.product) {
      const product: Product = {
        ...lookup.product,
        category: entry.category,
      };
      products[key] = product;
      fetched++;
      console.log(`${product.confidence}${lookup.source ? ` (${lookup.source})` : ""}`);
    } else {
      failed++;
      console.log(`MISS (${lookup.error ?? "unknown"})`);
    }

    if (i < toFetch.length - 1) await sleep(delay);
  }

  const index = saveCacheIndex(
    products,
    `seed_bootstrap_${new Date().toISOString()}`
  );

  console.log("\n=== CACHE BUILD SUMMARY ===");
  console.log(`Total in cache:  ${index.count}`);
  console.log(`Newly fetched:   ${fetched}`);
  console.log(`Skipped (exist): ${skipped}`);
  console.log(`Failed:          ${failed}`);
  console.log(`Cache file:      data/product-cache/index.json`);
  console.log("\nNext: npm run audit:barcodes  (uses cache only, no live API)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
