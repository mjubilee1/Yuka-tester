import { confidenceLabel } from "./confidence";
import cuttingConfig from "./cutting.json";
import {
  adjustThresholds,
  DEFAULT_PROFILE,
  type CutProfile,
} from "./profile";
import {
  buildFlags,
  buildRuleLines,
  computeVerdict,
  getThresholds,
  inferCategory,
  renderExplanation,
  servingLabelFor,
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

export function scoreProduct(
  product: Product,
  profile: CutProfile = DEFAULT_PROFILE
): ScoreResult {
  const category =
    product.category === "unknown" ? inferCategory(product.name) : product.category;
  const base = getThresholds(goalConfig, category);
  const thresholds = adjustThresholds(base, profile);
  const flags = buildFlags(product.nutrition, thresholds, category);
  const verdict = computeVerdict(product.nutrition, thresholds);
  const ruleLines = buildRuleLines(product.nutrition, thresholds, category, verdict);
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
    ruleLines,
    explanation,
    confidence: product.confidence,
    confidenceLabel: confidenceLabel(product.confidence),
    servingLabel: servingLabelFor({ ...product, category }),
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

function formatDelta(value: number | null, unit: string): string | null {
  if (value === null || value === 0) return null;
  const sign = value > 0 ? "+" : "";
  return `${sign}${value}${unit}`;
}

export function formatCompareHeadline(
  winnerName: string,
  deltas: CompareResult["deltas"]
): string {
  const parts: string[] = [];
  const protein = formatDelta(deltas.protein_g, "g protein");
  if (protein) parts.push(protein);

  // deltas.added_sugar_g is (loser - winner): positive => winner has less sugar
  if (deltas.added_sugar_g !== null && deltas.added_sugar_g !== 0) {
    const less = deltas.added_sugar_g > 0;
    parts.push(
      less
        ? `−${Math.abs(deltas.added_sugar_g)}g sugar`
        : `+${Math.abs(deltas.added_sugar_g)}g sugar`
    );
  }

  if (deltas.calories !== null && deltas.calories !== 0) {
    // deltas.calories is (loser - winner): positive => winner has fewer calories
    const less = deltas.calories > 0;
    parts.push(
      less
        ? `−${Math.abs(deltas.calories)} cal`
        : `+${Math.abs(deltas.calories)} cal`
    );
  }

  if (parts.length === 0) {
    return `Winner: ${winnerName} — similar macros`;
  }
  return `Winner: ${winnerName} — ${parts.join(" · ")}`;
}

export function compareProducts(
  a: Product,
  b: Product,
  profile: CutProfile = DEFAULT_PROFILE
): CompareResult {
  const scoreA = scoreProduct(a, profile);
  const scoreB = scoreProduct(b, profile);

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
    // positive => winner has less sugar / fewer calories (better for cut)
    added_sugar_g: delta(loser.metrics.added_sugar_g, winner.metrics.added_sugar_g),
    calories: delta(loser.metrics.calories, winner.metrics.calories),
  };

  const shortName =
    winner.product.brand && winner.product.brand !== "Unknown"
      ? winner.product.brand
      : winner.product.name.split(" ").slice(0, 2).join(" ");

  const headline = formatCompareHeadline(shortName, deltas);
  const summary = headline;

  return { winner, loser, deltas, headline, summary };
}

export function formatTripDelta(
  current: { totalProtein: number; totalSugar: number },
  previous: { totalProtein: number; totalSugar: number } | null
): string | null {
  if (!previous) return null;
  const parts: string[] = [];
  const dProtein = Math.round(current.totalProtein - previous.totalProtein);
  const dSugar = Math.round(current.totalSugar - previous.totalSugar);
  if (dProtein !== 0) parts.push(`${dProtein > 0 ? "+" : ""}${dProtein}g protein`);
  if (dSugar !== 0) parts.push(`${dSugar > 0 ? "+" : ""}${dSugar}g sugar`);
  if (parts.length === 0) return "Same protein & sugar as last shop";
  return `${parts.join(" · ")} vs last shop`;
}

export { goalConfig };
