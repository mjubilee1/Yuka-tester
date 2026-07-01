import cuttingConfig from "./cutting.json";
import {
  buildFlags,
  computeVerdict,
  getThresholds,
  inferCategory,
  renderExplanation,
} from "./rules";
import type {
  CompareResult,
  GoalConfig,
  Product,
  ScoreResult,
  Verdict,
} from "./types";

const goalConfig = cuttingConfig as GoalConfig;

function verdictRank(v: Verdict): number {
  return v === "buy" ? 3 : v === "maybe" ? 2 : 1;
}

export function scoreProduct(product: Product): ScoreResult {
  const category =
    product.category === "unknown" ? inferCategory(product.name) : product.category;
  const thresholds = getThresholds(goalConfig, category);
  const flags = buildFlags(product.nutrition, thresholds);
  const verdict = computeVerdict(product.nutrition, thresholds);
  const explanation = renderExplanation(verdict, flags, product.name);

  const addedSugar = product.nutrition.added_sugar_g ?? product.nutrition.sugar_g;
  const ppc =
    product.nutrition.protein_g !== null &&
    product.nutrition.calories !== null &&
    product.nutrition.calories > 0
      ? product.nutrition.protein_g / product.nutrition.calories
      : null;

  return {
    verdict,
    flags,
    explanation,
    confidence: product.confidence,
    product: {
      barcode: product.barcode,
      name: product.name,
      brand: product.brand,
      category,
    },
    metrics: {
      protein_g: product.nutrition.protein_g,
      added_sugar_g: addedSugar,
      calories: product.nutrition.calories,
      protein_per_calorie: ppc,
    },
  };
}

export function compareProducts(a: Product, b: Product): CompareResult {
  const scoreA = scoreProduct(a);
  const scoreB = scoreProduct(b);

  let winner: ScoreResult;
  let loser: ScoreResult;

  const rankDiff = verdictRank(scoreA.verdict) - verdictRank(scoreB.verdict);
  if (rankDiff > 0) {
    winner = scoreA;
    loser = scoreB;
  } else if (rankDiff < 0) {
    winner = scoreB;
    loser = scoreA;
  } else {
    const ppcA = scoreA.metrics.protein_per_calorie ?? 0;
    const ppcB = scoreB.metrics.protein_per_calorie ?? 0;
    if (ppcA >= ppcB) {
      winner = scoreA;
      loser = scoreB;
    } else {
      winner = scoreB;
      loser = scoreA;
    }
  }

  const delta = (w: number | null, l: number | null) =>
    w !== null && l !== null ? w - l : null;

  const deltas = {
    protein_g: delta(winner.metrics.protein_g, loser.metrics.protein_g),
    added_sugar_g: delta(loser.metrics.added_sugar_g, winner.metrics.added_sugar_g),
    calories: delta(loser.metrics.calories, winner.metrics.calories),
  };

  const parts: string[] = [];
  if (deltas.protein_g !== null && deltas.protein_g !== 0) {
    parts.push(`${deltas.protein_g > 0 ? "+" : ""}${deltas.protein_g}g protein`);
  }
  if (deltas.added_sugar_g !== null && deltas.added_sugar_g !== 0) {
    parts.push(
      `${deltas.added_sugar_g > 0 ? "-" : "+"}${Math.abs(deltas.added_sugar_g)}g sugar`
    );
  }

  const summary =
    parts.length > 0
      ? `${winner.product.name} wins for cutting (${parts.join(", ")}).`
      : `${winner.product.name} wins for cutting — similar macros, slightly better efficiency.`;

  return { winner, loser, deltas, summary };
}

export { goalConfig };
