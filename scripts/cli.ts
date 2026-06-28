#!/usr/bin/env node
import { compareProducts, scoreProduct } from "../scoring/src/score.js";
import { lookupOpenFoodFacts } from "../scoring/src/off-client.js";

function formatResult(result: ReturnType<typeof scoreProduct>): string {
  const v = result.verdict.toUpperCase();
  const conf = result.confidence.toUpperCase();
  const lines = [
    `${result.product.brand} — ${result.product.name}`,
    `Barcode: ${result.product.barcode}`,
    `Category: ${result.product.category}`,
    `Verdict: ${v} (confidence: ${conf})`,
    "",
    result.explanation,
  ];

  if (result.metrics.protein_g !== null) {
    lines.push(
      "",
      `Macros: ${result.metrics.protein_g}g protein, ${result.metrics.added_sugar_g ?? "?"}g sugar, ${result.metrics.calories ?? "?"} cal`
    );
  }

  if (result.flags.length > 0) {
    lines.push("", "Flags:");
    for (const f of result.flags) {
      lines.push(`  • [${f.severity}] ${f.message}`);
    }
  }

  return lines.join("\n");
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help")) {
    console.log(`Usage:
  npm run score -- <barcode>
  npm run compare -- <barcode1> <barcode2>

Concierge decision engine for cutting shoppers (protein bars + Greek yogurt).`);
    process.exit(0);
  }

  if (args[0] === "compare" || process.env.npm_lifecycle_event === "compare") {
    const barcodes =
      args[0] === "compare" ? args.slice(1) : args.length >= 2 ? args : [];
    if (barcodes.length < 2) {
      console.error("Provide two barcodes: npm run compare -- <barcode1> <barcode2>");
      process.exit(1);
    }

    const [lookupA, lookupB] = await Promise.all([
      lookupOpenFoodFacts(barcodes[0]),
      lookupOpenFoodFacts(barcodes[1]),
    ]);

    if (!lookupA.found || !lookupA.product) {
      console.error(`Barcode 1 not found: ${lookupA.error}`);
      process.exit(1);
    }
    if (!lookupB.found || !lookupB.product) {
      console.error(`Barcode 2 not found: ${lookupB.error}`);
      process.exit(1);
    }

    const comparison = compareProducts(lookupA.product, lookupB.product);
    console.log(formatResult(comparison.winner));
    console.log("\n--- vs ---\n");
    console.log(formatResult(comparison.loser));
    console.log(`\n${comparison.summary}`);
    return;
  }

  const barcode = args[0];
  const lookup = await lookupOpenFoodFacts(barcode);

  if (!lookup.found || !lookup.product) {
    console.error(`Not found: ${lookup.error ?? "unknown"}`);
    console.error(
      "Tip: Add to data/seed-barcodes.json or manually enter nutrition for concierge."
    );
    process.exit(1);
  }

  const result = scoreProduct(lookup.product);
  console.log(formatResult(result));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
