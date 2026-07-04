import type {
  CategoryThresholds,
  Flag,
  GoalConfig,
  NutritionFacts,
  ProductCategory,
  Verdict,
} from "./types";

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
  if (text.includes("cottage")) return "cottage_cheese";
  if (
    text.includes("core power") ||
    text.includes("protein shake") ||
    text.includes("protein milk") ||
    text.includes("fairlife") ||
    text.includes("premier protein") ||
    (text.includes("ultra-filtered") && text.includes("milk")) ||
    (text.includes("milk") && text.includes("protein"))
  ) {
    return "protein_milk";
  }
  if (
    text.includes("protein bar") ||
    text.includes("nutrition bar") ||
    text.includes("energy bar") ||
    (text.includes("bar") && !text.includes("chocolate bar"))
  ) {
    return "protein_bar";
  }
  if (text.includes("yogurt") || text.includes("yoghurt") || text.includes("greek")) {
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
  if (category === "cottage_cheese") return config.cottage_cheese;
  if (category === "protein_milk") return config.protein_milk;
  return config.default;
}

function categoryShort(category: ProductCategory): string {
  if (category === "protein_bar") return "bars";
  if (category === "greek_yogurt") return "yogurt";
  if (category === "cottage_cheese") return "cottage cheese";
  if (category === "protein_milk") return "protein milk";
  return "this";
}

export function buildFlags(
  nutrition: NutritionFacts,
  thresholds: CategoryThresholds,
  category: ProductCategory = "unknown"
): Flag[] {
  const flags: Flag[] = [];
  const addedSugar = getAddedSugar(nutrition);
  const ppc = proteinPerCalorie(nutrition);
  const cat = categoryShort(category);

  if (addedSugar !== null) {
    const v = rateHighIsBad(addedSugar, thresholds.added_sugar_g);
    const buyMax = thresholds.added_sugar_g.buy_max;
    if (v === "avoid") {
      flags.push({
        id: "added_sugar_high",
        severity: "critical",
        message: `Sugar ${addedSugar}g — buy max ${buyMax}g for ${cat} on a cut.`,
      });
    } else if (v === "maybe") {
      flags.push({
        id: "added_sugar_moderate",
        severity: "warn",
        message: `Sugar ${addedSugar}g — buy max ${buyMax}g for ${cat}; occasional OK.`,
      });
    }
  }

  if (nutrition.protein_g !== null) {
    const v = rateLowIsBad(nutrition.protein_g, thresholds.protein_g);
    const buyMin = thresholds.protein_g.buy_min;
    if (v === "avoid") {
      flags.push({
        id: "protein_low",
        severity: "critical",
        message: `Protein ${nutrition.protein_g}g — buy min ${buyMin}g for ${cat} on a cut.`,
      });
    } else if (v === "maybe") {
      flags.push({
        id: "protein_moderate",
        severity: "warn",
        message: `Protein ${nutrition.protein_g}g — buy min ${buyMin}g for ${cat}; OK not optimal.`,
      });
    }
  }

  if (nutrition.calories !== null) {
    const v = rateHighIsBad(nutrition.calories, thresholds.calories);
    const buyMax = thresholds.calories.buy_max;
    if (v === "avoid") {
      flags.push({
        id: "calories_high",
        severity: "critical",
        message: `${nutrition.calories} cal — buy max ${buyMax} for ${cat} on a cut.`,
      });
    } else if (v === "maybe") {
      flags.push({
        id: "calories_moderate",
        severity: "warn",
        message: `${nutrition.calories} cal — buy max ${buyMax} for ${cat}; fits if budget allows.`,
      });
    }
  }

  if (ppc !== null && ppc < thresholds.protein_per_calorie_min.maybe) {
    flags.push({
      id: "protein_efficiency_low",
      severity: "warn",
      message: `Low protein per calorie (${(ppc * 100).toFixed(1)}g per 100 cal).`,
    });
  }

  if (addedSugar === null && nutrition.protein_g === null && nutrition.calories === null) {
    flags.push({
      id: "data_incomplete",
      severity: "info",
      message: "Thin data — verify protein / sugar on the package.",
    });
  }

  return flags;
}

/** Plain-English rules for the result screen (trust in the number). */
export function buildRuleLines(
  nutrition: NutritionFacts,
  thresholds: CategoryThresholds,
  category: ProductCategory,
  verdict: Verdict
): string[] {
  const flags = buildFlags(nutrition, thresholds, category);
  const critical = flags.filter((f) => f.severity === "critical" || f.severity === "warn");
  if (critical.length > 0) {
    return critical.slice(0, 3).map((f) => f.message);
  }
  // Buy: keep result screen fast — no long rule essay
  if (verdict === "buy") return [];
  return ["Not enough nutrition data to fully score — check the package."];
}

export function servingLabelFor(
  product: { serving_label?: string | null; category: ProductCategory }
): string {
  if (product.serving_label) return product.serving_label;
  if (product.category === "protein_bar") return "Per serving (1 bar) — check package if multi-pack";
  if (product.category === "greek_yogurt") {
    return "Per serving (est.) — confirm cup vs container on package";
  }
  if (product.category === "cottage_cheese") {
    return "Per serving (est. ½ cup) — confirm on package";
  }
  if (product.category === "protein_milk") {
    return "Per serving (est.) — confirm cup vs bottle on package";
  }
  return "As listed — check package";
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
    if (ppc >= thresholds.protein_per_calorie_min.buy) metricVerdicts.push("buy");
    else if (ppc >= thresholds.protein_per_calorie_min.maybe) metricVerdicts.push("maybe");
    else metricVerdicts.push("avoid");
  }

  if (metricVerdicts.length === 0) return "maybe";
  return worstVerdict(metricVerdicts);
}

export function renderExplanation(
  verdict: Verdict,
  flags: Flag[],
  _productName: string
): string {
  const topFlags = flags.filter((f) => f.severity !== "info").slice(0, 2);
  if (topFlags.length === 0) {
    return verdict === "buy"
      ? "Fits your cut targets."
      : "Check macros on the package.";
  }
  return topFlags.map((f) => f.message).join(" ");
}
