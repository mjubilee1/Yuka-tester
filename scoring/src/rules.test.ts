import { strictEqual } from "assert";
import {
  buildFlags,
  computeVerdict,
  getThresholds,
} from "./rules.js";
import { scoreProduct, compareProducts } from "./score.js";
import type { GoalConfig, Product } from "./types.js";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(
  readFileSync(join(__dirname, "../goals/cutting.json"), "utf-8")
) as GoalConfig;

function makeProduct(overrides: Partial<Product> & { nutrition: Product["nutrition"] }): Product {
  return {
    barcode: "000000000000",
    name: "Test Protein Bar",
    brand: "Test",
    category: "protein_bar",
    confidence: "high",
    ...overrides,
  };
}

// High protein, low sugar → buy
const goodBar = makeProduct({
  nutrition: {
    calories: 200,
    protein_g: 22,
    added_sugar_g: 2,
    sugar_g: 2,
    carbs_g: 20,
    fat_g: 8,
    fiber_g: 3,
    sodium_mg: 200,
  },
});

const goodResult = scoreProduct(goodBar, config);
strictEqual(goodResult.verdict, "buy");

// High sugar, low protein → avoid
const badBar = makeProduct({
  nutrition: {
    calories: 280,
    protein_g: 8,
    added_sugar_g: 15,
    sugar_g: 15,
    carbs_g: 35,
    fat_g: 10,
    fiber_g: 1,
    sodium_mg: 180,
  },
});

const badResult = scoreProduct(badBar, config);
strictEqual(badResult.verdict, "avoid");

// Comparison: good should beat bad
const comparison = compareProducts(goodBar, badBar);
strictEqual(comparison.winner.product.barcode, goodBar.barcode);

// Thresholds load for yogurt
const yogurtThresholds = getThresholds(config, "greek_yogurt");
strictEqual(yogurtThresholds.protein_g.buy_min, 15);

console.log("All scoring tests passed.");
