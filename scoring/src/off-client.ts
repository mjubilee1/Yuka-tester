import type { NutritionFacts, Product, ProductCategory } from "./types.js";
import {
  barcodeVariants,
  lookupCache,
  normalizeBarcode,
} from "./product-cache.js";

interface OffNutriments {
  "energy-kcal_serving"?: number;
  "energy-kcal"?: number;
  proteins_serving?: number;
  proteins?: number;
  sugars_serving?: number;
  sugars?: number;
  "sugars-added_serving"?: number;
  "sugars-added"?: number;
  carbohydrates_serving?: number;
  carbohydrates?: number;
  fat_serving?: number;
  fat?: number;
  fiber_serving?: number;
  fiber?: number;
  sodium_serving?: number;
  sodium?: number;
}

export interface OffProduct {
  code: string;
  product_name?: string;
  brands?: string;
  categories?: string;
  ingredients_text?: string;
  nutriments?: OffNutriments;
  completeness?: number;
}

export interface OffLookupResult {
  found: boolean;
  product?: Product;
  raw?: OffProduct;
  error?: string;
  source?: "cache" | "open_food_facts_v0" | "open_food_facts_v2";
}

const USER_AGENT =
  "YukaTester/1.0 (pre-build validation; contact: local dev; 1-call-per-scan)";

function num(v: unknown): number | null {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  return null;
}

function extractNutrition(n: OffNutriments | undefined): NutritionFacts {
  if (!n) {
    return {
      calories: null,
      protein_g: null,
      added_sugar_g: null,
      sugar_g: null,
      carbs_g: null,
      fat_g: null,
      fiber_g: null,
      sodium_mg: null,
    };
  }

  const sodium = num(n.sodium_serving) ?? num(n.sodium);
  return {
    calories: num(n["energy-kcal_serving"]) ?? num(n["energy-kcal"]),
    protein_g: num(n.proteins_serving) ?? num(n.proteins),
    added_sugar_g: num(n["sugars-added_serving"]) ?? num(n["sugars-added"]),
    sugar_g: num(n.sugars_serving) ?? num(n.sugars),
    carbs_g: num(n.carbohydrates_serving) ?? num(n.carbohydrates),
    fat_g: num(n.fat_serving) ?? num(n.fat),
    fiber_g: num(n.fiber_serving) ?? num(n.fiber),
    sodium_mg: sodium !== null ? sodium * 1000 : null,
  };
}

function confidenceFromOff(p: OffProduct): Product["confidence"] {
  const c = p.completeness ?? 0;
  const n = extractNutrition(p.nutriments);
  const hasCore =
    n.calories !== null && n.protein_g !== null && n.sugar_g !== null;
  if (c >= 0.7 && hasCore) return "high";
  if (c >= 0.4 || hasCore) return "medium";
  if (p.product_name) return "low";
  return "missing";
}

export function mapOffToProduct(
  off: OffProduct,
  categoryOverride?: ProductCategory
): Product {
  const name = off.product_name ?? "Unknown product";
  const category =
    categoryOverride ??
    (off.categories?.toLowerCase().includes("yogurt")
      ? "greek_yogurt"
      : off.categories?.toLowerCase().includes("bar")
        ? "protein_bar"
        : "unknown");

  return {
    barcode: normalizeBarcode(off.code),
    name,
    brand: off.brands?.split(",")[0]?.trim() ?? "Unknown",
    category,
    nutrition: extractNutrition(off.nutriments),
    ingredients: off.ingredients_text,
    source: "open_food_facts",
    confidence: confidenceFromOff(off),
  };
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchOffApi(
  barcode: string,
  version: "v0" | "v2"
): Promise<{ ok: boolean; status: number; data?: { status: number; product?: OffProduct } }> {
  const url = `https://world.openfoodfacts.org/api/${version}/product/${barcode}.json`;
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });

  if (!res.ok) {
    return { ok: false, status: res.status };
  }

  const data = (await res.json()) as { status: number; product?: OffProduct };
  return { ok: true, status: res.status, data };
}

async function fetchOffWithRetry(barcode: string): Promise<OffLookupResult> {
  const variants = barcodeVariants(barcode);

  for (const variant of variants) {
    for (const version of ["v0", "v2"] as const) {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const result = await fetchOffApi(variant, version);

          if (result.status === 429 || result.status === 503) {
            await sleep(1000 * (attempt + 1) * 2);
            continue;
          }

          if (!result.ok || !result.data) {
            break;
          }

          if (result.data.status === 1 && result.data.product) {
            const product = mapOffToProduct(result.data.product);
            return {
              found: true,
              product,
              raw: result.data.product,
              source: version === "v0" ? "open_food_facts_v0" : "open_food_facts_v2",
            };
          }

          break;
        } catch (e) {
          if (attempt === 2) {
            return {
              found: false,
              error: e instanceof Error ? e.message : "Unknown fetch error",
            };
          }
          await sleep(1000 * (attempt + 1));
        }
      }
    }
  }

  return { found: false, error: "Product not found in Open Food Facts" };
}

export interface LookupOptions {
  /** Skip live API; local cache only (for bulk audit) */
  cacheOnly?: boolean;
  /** Skip cache; live API only (rare) */
  liveOnly?: boolean;
}

export async function lookupProduct(
  barcode: string,
  options: LookupOptions = {}
): Promise<OffLookupResult> {
  if (!options.liveOnly) {
    const cached = lookupCache(barcode);
    if (cached) {
      return { found: true, product: cached, source: "cache" };
    }
  }

  if (options.cacheOnly) {
    return {
      found: false,
      error: "Not in local product cache — run npm run build:cache or add manually",
    };
  }

  return fetchOffWithRetry(barcode);
}

/** @deprecated Use lookupProduct */
export async function lookupOpenFoodFacts(
  barcode: string
): Promise<OffLookupResult> {
  return lookupProduct(barcode);
}

export function hasCoreNutrition(n: NutritionFacts): boolean {
  return (
    n.calories !== null &&
    n.protein_g !== null &&
    (n.added_sugar_g !== null || n.sugar_g !== null)
  );
}
