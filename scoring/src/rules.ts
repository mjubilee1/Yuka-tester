import type {
  CategoryThresholds,
  Flag,
  GoalConfig,
  NutritionFacts,
  ProductCategory,
  Verdict,
} from "./types.js";

type MetricVerdict = Verdict;

function rateHighIsBad(
  value: number | null,
  thresholds: { buy_max?: number; maybe_max?: number }
): MetricVerdict | null {
  if (value === null) return null;
  const buyMax = thresholds.buy_max ?? Infinity;
  const maybeMax = thresholds.maybe_max ?? Infinity;
  if (value <= buyMax) return "buy";
  if (value <= maybeMax) return "maybe";
  return "avoid";
}

function rateLowIsBad(
  value: number | null,
  thresholds: { buy_min?: number; maybe_min?: number }
): MetricVerdict | null {
  if (value === null) return null;
  const buyMin = thresholds.buy_min ?? 0;
  const maybeMin = thresholds.maybe_min ?? 0;
  if (value >= buyMin) return "buy";
  if (value >= maybeMin) return "maybe";
  return "avoid";
}

function worstVerdict(verdicts: MetricVerdict[]): Verdict {
  if (verdicts.includes("avoid")) return "avoid";
  if (verdicts.includes("maybe")) return "maybe";
  return "buy";
}

function getAddedSugar(n: NutritionFacts): number | null {
  if (n.added_sugar_g !== null) return n.added_sugar_g;
  if (n.sugar_g !== null) return n.sugar_g;
  return null;
}

function proteinPerCalorie(n: NutritionFacts): number | null {
  if (n.protein_g === null || n.calories === null || n.calories === 0) return null;
  return n.protein_g / n.calories;
}

export function inferCategory(name: string, categories?: string): ProductCategory {
  const text = `${name} ${categories ?? ""}`.toLowerCase();
  if (
    text.includes("protein bar") ||
    text.includes("nutrition bar") ||
    text.includes("energy bar") ||
    text.includes("bar")
  ) {
    return "protein_bar";
  }
  if (
    text.includes("yogurt") ||
    text.includes("yoghurt") ||
    text.includes("greek")
  ) {
    return "greek_yogurt";
  }
  return "unknown";
}

export function getThresholds(
  config: GoalConfig,
  category: ProductCategory
): CategoryThresholds {
  if (category === "protein_bar") return config.protein_bar;
  if (category === "greek_yogurt") return config.greek_yogurt;
  return config.default;
}

export function buildFlags(
  nutrition: NutritionFacts,
  thresholds: CategoryThresholds
): Flag[] {
  const flags: Flag[] = [];
  const addedSugar = getAddedSugar(nutrition);
  const ppc = proteinPerCalorie(nutrition);

  if (addedSugar !== null) {
    const v = rateHighIsBad(addedSugar, thresholds.added_sugar_g);
    if (v === "avoid") {
      flags.push({
        id: "added_sugar_high",
        severity: "critical",
        message: `${addedSugar}g sugar — above cutting limit (≤${thresholds.added_sugar_g.buy_max}g ideal).`,
      });
    } else if (v === "maybe") {
      flags.push({
        id: "added_sugar_moderate",
        severity: "warn",
        message: `${addedSugar}g sugar — acceptable occasionally, not daily.`,
      });
    }
  }

  if (nutrition.protein_g !== null) {
    const v = rateLowIsBad(nutrition.protein_g, thresholds.protein_g);
    if (v === "avoid") {
      flags.push({
        id: "protein_low",
        severity: "critical",
        message: `${nutrition.protein_g}g protein — below ${thresholds.protein_g.maybe_min}g target for cutting.`,
      });
    } else if (v === "maybe") {
      flags.push({
        id: "protein_moderate",
        severity: "warn",
        message: `${nutrition.protein_g}g protein — OK but not optimal (aim ≥${thresholds.protein_g.buy_min}g).`,
      });
    }
  }

  if (nutrition.calories !== null) {
    const v = rateHighIsBad(nutrition.calories, thresholds.calories);
    if (v === "avoid") {
      flags.push({
        id: "calories_high",
        severity: "critical",
        message: `${nutrition.calories} cal — calorie-dense for a cutting snack.`,
      });
    } else if (v === "maybe") {
      flags.push({
        id: "calories_moderate",
        severity: "warn",
        message: `${nutrition.calories} cal — fine if it fits your daily budget.`,
      });
    }
  }

  if (ppc !== null) {
    if (ppc < thresholds.protein_per_calorie_min.maybe) {
      flags.push({
        id: "protein_efficiency_low",
        severity: "warn",
        message: `Low protein per calorie (${(ppc * 100).toFixed(1)}g per 100 cal).`,
      });
    }
  }

  if (addedSugar === null && nutrition.protein_g === null && nutrition.calories === null) {
    flags.push({
      id: "data_incomplete",
      severity: "info",
      message: "Nutrition data incomplete — verdict is low confidence.",
    });
  }

  return flags;
}

export function computeVerdict(
  nutrition: NutritionFacts,
  thresholds: CategoryThresholds
): Verdict {
  const addedSugar = getAddedSugar(nutrition);
  const ppc = proteinPerCalorie(nutrition);

  const metricVerdicts: MetricVerdict[] = [];

  const sugarV = rateHighIsBad(addedSugar, thresholds.added_sugar_g);
  const proteinV = rateLowIsBad(nutrition.protein_g, thresholds.protein_g);
  const calV = rateHighIsBad(nutrition.calories, thresholds.calories);

  if (sugarV) metricVerdicts.push(sugarV);
  if (proteinV) metricVerdicts.push(proteinV);
  if (calV) metricVerdicts.push(calV);

  if (ppc !== null) {
    if (ppc >= thresholds.protein_per_calorie_min.buy) {
      metricVerdicts.push("buy");
    } else if (ppc >= thresholds.protein_per_calorie_min.maybe) {
      metricVerdicts.push("maybe");
    } else {
      metricVerdicts.push("avoid");
    }
  }

  if (metricVerdicts.length === 0) return "maybe";
  return worstVerdict(metricVerdicts);
}

export function renderExplanation(
  verdict: Verdict,
  flags: Flag[],
  productName: string
): string {
  const verdictLabel = verdict.toUpperCase();
  const topFlags = flags.filter((f) => f.severity !== "info").slice(0, 2);
  if (topFlags.length === 0) {
    return `${productName} — ${verdictLabel}. Fits cutting goals based on available nutrition data.`;
  }
  return `${productName} — ${verdictLabel}. ${topFlags.map((f) => f.message).join(" ")}`;
}
