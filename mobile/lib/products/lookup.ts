import { inferCategory, servingLabelFor } from "../scoring/rules";
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
  serving_quantity?: number;
}

interface OffProduct {
  code: string;
  product_name?: string;
  brands?: string;
  categories?: string;
  nutriments?: OffNutriments;
  completeness?: number;
  serving_size?: string;
  serving_quantity?: number;
  product_quantity?: number | string;
}

interface CacheIndex {
  products: Record<string, Product>;
}

const cacheData = require("../../assets/product-cache.json") as CacheIndex;
const staplesData = require("../../assets/curated-staples.json") as CacheIndex;

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
  const category = inferCategory(name, off.categories);
  const nutrition = extractNutrition(off.nutriments);
  const hasCore =
    nutrition.calories !== null &&
    nutrition.protein_g !== null &&
    (nutrition.sugar_g !== null || nutrition.added_sugar_g !== null);
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
    serving_label: offServingLabel(off, category),
  };
}

function offServingLabel(
  off: OffProduct,
  category: ProductCategory
): string | null {
  const size = off.serving_size?.trim();
  if (size) {
    const qty = off.serving_quantity ?? off.nutriments?.serving_quantity;
    if (qty && !size.includes(String(qty))) {
      return `Per serving (${size})`;
    }
    return `Per serving (${size})`;
  }
  return servingLabelFor({ serving_label: null, category });
}

/** Enrich cache hits with category fix + serving label when missing. */
function normalizeProduct(product: Product): Product {
  const category =
    product.category === "unknown"
      ? inferCategory(product.name)
      : product.category;
  const serving_label =
    product.serving_label ??
    servingLabelFor({ serving_label: null, category });
  return { ...product, category, serving_label };
}

export function lookupCache(barcode: string): Product | null {
  for (const variant of barcodeVariants(barcode)) {
    const staple = staplesData.products[variant];
    if (staple) return normalizeProduct(staple);

    const hit = cacheData.products[variant];
    if (hit) return normalizeProduct(hit);
  }
  return null;
}

export function getCacheSize(): number {
  const keys = new Set([
    ...Object.keys(cacheData.products),
    ...Object.keys(staplesData.products),
  ]);
  return keys.size;
}

export function getStapleCount(): number {
  return Object.keys(staplesData.products).length;
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
