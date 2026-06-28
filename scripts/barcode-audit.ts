#!/usr/bin/env node
/**
 * Barcode audit: measure Open Food Facts hit rate for beachhead categories.
 * Usage: npm run audit:barcodes [-- --limit 50] [-- --delay 300]
 */
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { lookupOpenFoodFacts, hasCoreNutrition } from "../scoring/src/off-client.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

interface SeedEntry {
  barcode: string;
  name: string;
  category: "protein_bar" | "greek_yogurt";
  retailer?: string;
}

interface AuditRow {
  barcode: string;
  name: string;
  category: string;
  found: boolean;
  confidence: string;
  has_core_nutrition: boolean;
  off_product_name: string;
  error: string;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseArgs() {
  const args = process.argv.slice(2);
  let limit = 200;
  let delay = 350;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--limit" && args[i + 1]) limit = parseInt(args[i + 1], 10);
    if (args[i] === "--delay" && args[i + 1]) delay = parseInt(args[i + 1], 10);
  }

  return { limit, delay };
}

async function main() {
  const { limit, delay } = parseArgs();
  const seedPath = join(ROOT, "data/seed-barcodes.json");
  const seed = JSON.parse(readFileSync(seedPath, "utf-8")) as SeedEntry[];
  const toAudit = seed.slice(0, limit);

  console.log(`Auditing ${toAudit.length} barcodes against Open Food Facts...\n`);

  const results: AuditRow[] = [];
  let found = 0;
  let highConf = 0;
  let coreNutrition = 0;

  for (let i = 0; i < toAudit.length; i++) {
    const entry = toAudit[i];
    process.stdout.write(`[${i + 1}/${toAudit.length}] ${entry.barcode} ... `);

    const lookup = await lookupOpenFoodFacts(entry.barcode);
    const row: AuditRow = {
      barcode: entry.barcode,
      name: entry.name,
      category: entry.category,
      found: lookup.found,
      confidence: lookup.product?.confidence ?? "missing",
      has_core_nutrition: lookup.product
        ? hasCoreNutrition(lookup.product.nutrition)
        : false,
      off_product_name: lookup.product?.name ?? "",
      error: lookup.error ?? "",
    };

    results.push(row);

    if (lookup.found) found++;
    if (lookup.product?.confidence === "high") highConf++;
    if (row.has_core_nutrition) coreNutrition++;

    console.log(
      lookup.found
        ? `${row.confidence}${row.has_core_nutrition ? " +nutrition" : ""}`
        : "MISS"
    );

    if (i < toAudit.length - 1) await sleep(delay);
  }

  const hitRate = ((found / toAudit.length) * 100).toFixed(1);
  const highRate = ((highConf / toAudit.length) * 100).toFixed(1);
  const coreRate = ((coreNutrition / toAudit.length) * 100).toFixed(1);

  const byCategory = (cat: string) => {
    const subset = results.filter((r) => r.category === cat);
    const f = subset.filter((r) => r.found).length;
    const h = subset.filter((r) => r.confidence === "high").length;
    return {
      total: subset.length,
      found: f,
      hit_rate: subset.length ? ((f / subset.length) * 100).toFixed(1) : "0",
      high_conf: h,
      high_rate: subset.length ? ((h / subset.length) * 100).toFixed(1) : "0",
    };
  };

  const proteinBars = byCategory("protein_bar");
  const yogurt = byCategory("greek_yogurt");

  const summary = {
    audited_at: new Date().toISOString(),
    total: toAudit.length,
    found,
    hit_rate_pct: parseFloat(hitRate),
    high_confidence: highConf,
    high_confidence_rate_pct: parseFloat(highRate),
    core_nutrition: coreNutrition,
    core_nutrition_rate_pct: parseFloat(coreRate),
    gate_80_pass: parseFloat(highRate) >= 80,
    ocr_needed: parseFloat(highRate) < 70,
    by_category: { protein_bar: proteinBars, greek_yogurt: yogurt },
    results,
  };

  const outDir = join(ROOT, "data/audit-results");
  mkdirSync(outDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const jsonPath = join(outDir, `audit-${timestamp}.json`);
  const csvPath = join(outDir, `audit-${timestamp}.csv`);

  writeFileSync(jsonPath, JSON.stringify(summary, null, 2));

  const csvHeader =
    "barcode,name,category,found,confidence,has_core_nutrition,off_product_name,error\n";
  const csvRows = results
    .map(
      (r) =>
        `${r.barcode},"${r.name.replace(/"/g, '""')}",${r.category},${r.found},${r.confidence},${r.has_core_nutrition},"${r.off_product_name.replace(/"/g, '""')}","${r.error.replace(/"/g, '""')}"`
    )
    .join("\n");
  writeFileSync(csvPath, csvHeader + csvRows);

  console.log("\n=== AUDIT SUMMARY ===");
  console.log(`Total audited:     ${toAudit.length}`);
  console.log(`Found in OFF:      ${found} (${hitRate}%)`);
  console.log(`High confidence:   ${highConf} (${highRate}%)`);
  console.log(`Core nutrition:    ${coreNutrition} (${coreRate}%)`);
  console.log(`Protein bars:      ${proteinBars.hit_rate}% hit, ${proteinBars.high_rate}% high conf`);
  console.log(`Greek yogurt:      ${yogurt.hit_rate}% hit, ${yogurt.high_rate}% high conf`);
  console.log(`80% gate:          ${summary.gate_80_pass ? "PASS" : "FAIL"}`);
  console.log(`OCR needed:        ${summary.ocr_needed ? "YES (<70% high conf)" : "NO"}`);
  console.log(`\nResults: ${jsonPath}`);
  console.log(`CSV:     ${csvPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
