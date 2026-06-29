import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import type { Product } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = join(__dirname, "../../data/product-cache");
const INDEX_PATH = join(CACHE_DIR, "index.json");

export interface CacheIndex {
  built_at: string;
  source: string;
  count: number;
  products: Record<string, Product>;
}

export function normalizeBarcode(barcode: string): string {
  return barcode.replace(/\D/g, "");
}

/** UPC-A (12 digit) and EAN-13 variants for lookup */
export function barcodeVariants(barcode: string): string[] {
  const digits = normalizeBarcode(barcode);
  const variants = new Set<string>([digits]);

  if (digits.length === 12) {
    variants.add(`0${digits}`);
  }
  if (digits.length === 13 && digits.startsWith("0")) {
    variants.add(digits.slice(1));
  }

  return [...variants];
}

let memoryIndex: CacheIndex | null = null;

export function loadCacheIndex(): CacheIndex | null {
  if (memoryIndex) return memoryIndex;
  if (!existsSync(INDEX_PATH)) return null;

  try {
    memoryIndex = JSON.parse(readFileSync(INDEX_PATH, "utf-8")) as CacheIndex;
    return memoryIndex;
  } catch {
    return null;
  }
}

export function clearCacheMemory(): void {
  memoryIndex = null;
}

export function lookupCache(barcode: string): Product | null {
  const index = loadCacheIndex();
  if (!index) return null;

  for (const variant of barcodeVariants(barcode)) {
    const hit = index.products[variant];
    if (hit) return hit;
  }

  return null;
}

export function saveCacheIndex(
  products: Record<string, Product>,
  source: string
): CacheIndex {
  mkdirSync(CACHE_DIR, { recursive: true });

  const index: CacheIndex = {
    built_at: new Date().toISOString(),
    source,
    count: Object.keys(products).length,
    products,
  };

  writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2));
  memoryIndex = index;
  return index;
}

export function mergeIntoCache(newProducts: Product[]): CacheIndex {
  const existing = loadCacheIndex()?.products ?? {};
  const merged = { ...existing };

  for (const p of newProducts) {
    merged[normalizeBarcode(p.barcode)] = p;
  }

  return saveCacheIndex(merged, "merged");
}

export function cacheStats(): { loaded: boolean; count: number; built_at: string | null } {
  const index = loadCacheIndex();
  return {
    loaded: index !== null,
    count: index?.count ?? 0,
    built_at: index?.built_at ?? null,
  };
}
