#!/usr/bin/env node
/**
 * Fetch real barcodes from Open Food Facts search API and write data/seed-barcodes.json
 * Usage: npm run fetch:seeds [-- --bars 100 --yogurt 100]
 */
import { writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "../data/seed-barcodes.json");

interface OffSearchProduct {
  code: string;
  product_name?: string;
  brands?: string;
  countries_tags?: string[];
}

interface SeedEntry {
  barcode: string;
  name: string;
  category: "protein_bar" | "greek_yogurt";
  retailer?: string;
  countries?: string[];
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function searchOff(
  params: Record<string, string>,
  pageSize: number
): Promise<OffSearchProduct[]> {
  const base = "https://world.openfoodfacts.org/cgi/search.pl";
  const query = new URLSearchParams({
    action: "process",
    json: "1",
    page_size: String(pageSize),
    fields: "code,product_name,brands,countries_tags",
    ...params,
  });

  const url = `${base}?${query}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "YukaTester/1.0 (seed fetch)" },
  });

  if (!res.ok) {
    throw new Error(`Search failed: HTTP ${res.status}`);
  }

  const data = (await res.json()) as { products?: OffSearchProduct[] };
  return data.products ?? [];
}

function toSeed(
  products: OffSearchProduct[],
  category: SeedEntry["category"]
): SeedEntry[] {
  const seen = new Set<string>();
  const entries: SeedEntry[] = [];

  for (const p of products) {
    const code = p.code?.replace(/\D/g, "");
    if (!code || code.length < 8 || seen.has(code)) continue;
    if (!p.product_name) continue;

    seen.add(code);
    entries.push({
      barcode: code,
      name: p.product_name.trim(),
      category,
      countries: p.countries_tags,
    });
  }

  return entries;
}

function parseArgs() {
  const args = process.argv.slice(2);
  let bars = 100;
  let yogurt = 100;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--bars" && args[i + 1]) bars = parseInt(args[i + 1], 10);
    if (args[i] === "--yogurt" && args[i + 1]) yogurt = parseInt(args[i + 1], 10);
  }
  return { bars, yogurt };
}

async function fetchCategory(
  searches: Record<string, string>[],
  target: number,
  category: SeedEntry["category"]
): Promise<SeedEntry[]> {
  const collected: SeedEntry[] = [];
  const seen = new Set<string>();

  for (const params of searches) {
    if (collected.length >= target) break;
    try {
      const products = await searchOff(params, Math.min(100, target * 2));
      for (const entry of toSeed(products, category)) {
        if (seen.has(entry.barcode)) continue;
        seen.add(entry.barcode);
        collected.push(entry);
        if (collected.length >= target) break;
      }
    } catch (e) {
      console.warn(`Search failed for ${JSON.stringify(params)}:`, e);
    }
    await sleep(500);
  }

  return collected.slice(0, target);
}

async function main() {
  const { bars, yogurt } = parseArgs();
  console.log(`Fetching ${bars} protein bars + ${yogurt} Greek yogurts from OFF...\n`);

  const barSearches = [
    { search_terms: "quest protein bar", tagtype_0: "countries", tag_contains_0: "contains", tag_0: "en:united-states" },
    { search_terms: "rxbar", tagtype_0: "countries", tag_contains_0: "contains", tag_0: "en:united-states" },
    { search_terms: "one protein bar", tagtype_0: "categories", tag_contains_0: "contains", tag_0: "protein-bars" },
    { search_terms: "pure protein bar", tagtype_0: "categories", tag_contains_0: "contains", tag_0: "protein-bars" },
    { search_terms: "clif builders", tagtype_0: "categories", tag_contains_0: "contains", tag_0: "protein-bars" },
    { search_terms: "premier protein bar", tagtype_0: "categories", tag_contains_0: "contains", tag_0: "protein-bars" },
    { search_terms: "think protein bar", tagtype_0: "categories", tag_contains_0: "contains", tag_0: "protein-bars" },
    { search_terms: "kind protein bar", tagtype_0: "categories", tag_contains_0: "contains", tag_0: "protein-bars" },
    { tagtype_0: "categories", tag_contains_0: "contains", tag_0: "protein-bars", tagtype_1: "countries", tag_contains_1: "contains", tag_1: "en:united-states" },
  ];

  const yogurtSearches = [
    { search_terms: "chobani greek", tagtype_0: "countries", tag_contains_0: "contains", tag_0: "en:united-states" },
    { search_terms: "fage total", tagtype_0: "countries", tag_contains_0: "contains", tag_0: "en:united-states" },
    { search_terms: "oikos greek", tagtype_0: "countries", tag_contains_0: "contains", tag_0: "en:united-states" },
    { search_terms: "siggi's yogurt", tagtype_0: "countries", tag_contains_0: "contains", tag_0: "en:united-states" },
    { search_terms: "two good yogurt", tagtype_0: "countries", tag_contains_0: "contains", tag_0: "en:united-states" },
    { search_terms: "kirkland greek yogurt", tagtype_0: "countries", tag_contains_0: "contains", tag_0: "en:united-states" },
    { tagtype_0: "categories", tag_contains_0: "contains", tag_0: "greek-yogurts", tagtype_1: "countries", tag_contains_1: "contains", tag_1: "en:united-states" },
    { tagtype_0: "categories", tag_contains_0: "contains", tag_0: "greek-yogurts" },
  ];

  const barEntries = await fetchCategory(barSearches, bars, "protein_bar");
  console.log(`Protein bars collected: ${barEntries.length}`);

  const yogurtEntries = await fetchCategory(yogurtSearches, yogurt, "greek_yogurt");
  console.log(`Greek yogurt collected: ${yogurtEntries.length}`);

  const combined = [...barEntries, ...yogurtEntries];
  writeFileSync(OUT, JSON.stringify(combined, null, 2) + "\n");
  console.log(`\nWrote ${combined.length} entries to ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
