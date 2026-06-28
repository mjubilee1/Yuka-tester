import type { NutritionFacts, Product, ProductCategory } from "../src/types.js";

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

  const sodium = num(n.sodium_serving) ?? num(n.sodium);
  return {
    calories: num(n["energy-kcal_serving"]) ?? num(n["energy-kcal"]),
    protein_g: num(n.proteins_serving) ?? num(n.proteins),
    added_sugar_g:
      num(n["sugars-added_serving"]) ?? num(n["sugars-added"]),
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
    barcode: off.code,
    name,
    brand: off.brands?.split(",")[0]?.trim() ?? "Unknown",
    category,
    nutrition: extractNutrition(off.nutriments),
    ingredients: off.ingredients_text,
    source: "open_food_facts",
    confidence: confidenceFromOff(off),
  };
}

export async function lookupOpenFoodFacts(
  barcode: string
): Promise<OffLookupResult> {
  const normalized = barcode.replace(/\D/g, "");
  const url = `https://world.openfoodfacts.org/api/v2/product/${normalized}.json`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "YukaTester/1.0 (validation bootstrap)" },
    });

    if (!res.ok) {
      return { found: false, error: `HTTP ${res.status}` };
    }

    const data = (await res.json()) as {
      status: number;
      product?: OffProduct;
    };

    if (data.status !== 1 || !data.product) {
      return { found: false, error: "Product not found in Open Food Facts" };
    }

    const product = mapOffToProduct(data.product);
    return { found: true, product, raw: data.product };
  } catch (e) {
    return {
      found: false,
      error: e instanceof Error ? e.message : "Unknown fetch error",
    };
  }
}

export function hasCoreNutrition(n: NutritionFacts): boolean {
  return (
    n.calories !== null &&
    n.protein_g !== null &&
    (n.added_sugar_g !== null || n.sugar_g !== null)
  );
}
