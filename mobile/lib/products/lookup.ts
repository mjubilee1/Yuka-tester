import type { NutritionFacts, Product, ProductCategory } from "../scoring/types";

interface OffNutriments {
  "energy-kcal_serving"?: number;
  "energy-kcal"?: number;
  proteins_serving?: number;
  proteins?: number;
  sugars_serving?: number;
  sugars?: number;
  "sugars-added_serving"?: number;
  "sugars-added"?: number;
}

interface OffProduct {
  code: string;
  product_name?: string;
  brands?: string;
  categories?: string;
  nutriments?: OffNutriments;
  completeness?: number;
}

interface CacheIndex {
  products: Record<string, Product>;
}

const cacheData = require("../../assets/product-cache.json") as CacheIndex;

export function normalizeBarcode(barcode: string): string {
  return barcode.replace(/\D/g, "");
}

export function barcodeVariants(barcode: string): string[] {
  const digits = normalizeBarcode(barcode);
  const variants = new Set<string>([digits]);
  if (digits.length === 12) variants.add(`0${digits}`);
  if (digits.length === 13 && digits.startsWith("0")) variants.add(digits.slice(1));
  return [...variants];
}

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
  return {
    calories: num(n["energy-kcal_serving"]) ?? num(n["energy-kcal"]),
    protein_g: num(n.proteins_serving) ?? num(n.proteins),
    added_sugar_g: num(n["sugars-added_serving"]) ?? num(n["sugars-added"]),
    sugar_g: num(n.sugars_serving) ?? num(n.sugars),
    carbs_g: null,
    fat_g: null,
    fiber_g: null,
    sodium_mg: null,
  };
}

function mapOffToProduct(off: OffProduct): Product {
  const name = off.product_name ?? "Unknown product";
  const category: ProductCategory = off.categories?.toLowerCase().includes("yogurt")
    ? "greek_yogurt"
    : off.categories?.toLowerCase().includes("bar")
      ? "protein_bar"
      : "unknown";

  const nutrition = extractNutrition(off.nutriments);
  const hasCore =
    nutrition.calories !== null &&
    nutrition.protein_g !== null &&
    nutrition.sugar_g !== null;
  const c = off.completeness ?? 0;
  let confidence: Product["confidence"] = "missing";
  if (c >= 0.7 && hasCore) confidence = "high";
  else if (c >= 0.4 || hasCore) confidence = "medium";
  else if (off.product_name) confidence = "low";

  return {
    barcode: normalizeBarcode(off.code),
    name,
    brand: off.brands?.split(",")[0]?.trim() ?? "Unknown",
    category,
    nutrition,
    source: "open_food_facts",
    confidence,
  };
}

export function lookupCache(barcode: string): Product | null {
  for (const variant of barcodeVariants(barcode)) {
    const hit = cacheData.products[variant];
    if (hit) return hit;
  }
  return null;
}

export function getCacheSize(): number {
  return Object.keys(cacheData.products).length;
}

async function fetchOff(barcode: string): Promise<Product | null> {
  for (const variant of barcodeVariants(barcode)) {
    for (const version of ["v0", "v2"] as const) {
      try {
        const res = await fetch(
          `https://world.openfoodfacts.org/api/${version}/product/${variant}.json`,
          { headers: { "User-Agent": "CutCart/1.0 (Expo; 1-scan-per-user)" } }
        );
        if (!res.ok) continue;
        const data = (await res.json()) as { status: number; product?: OffProduct };
        if (data.status === 1 && data.product) {
          return mapOffToProduct(data.product);
        }
      } catch {
        /* try next */
      }
    }
  }
  return null;
}

export async function lookupProduct(barcode: string): Promise<Product | null> {
  const cached = lookupCache(barcode);
  if (cached) return cached;
  return fetchOff(barcode);
}
