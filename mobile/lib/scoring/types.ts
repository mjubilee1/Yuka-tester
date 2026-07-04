export type Verdict = "buy" | "maybe" | "avoid";

export type ProductCategory =
  | "protein_bar"
  | "greek_yogurt"
  | "cottage_cheese"
  | "protein_milk"
  | "unknown";

export type WeightBand = "under_160" | "160_200" | "over_200";

export type CutAggressiveness = "easy" | "normal" | "aggressive";

export type ScanDisposition = "cart" | "left";

export interface NutritionFacts {
  calories: number | null;
  protein_g: number | null;
  added_sugar_g: number | null;
  sugar_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  sodium_mg: number | null;
}

export interface Product {
  barcode: string;
  name: string;
  brand: string;
  category: ProductCategory;
  nutrition: NutritionFacts;
  ingredients?: string;
  source?: string;
  confidence: "high" | "medium" | "low" | "missing";
  /** e.g. "Per serving (150g)" — omit when unknown */
  serving_label?: string | null;
}

export interface ThresholdRange {
  buy_max?: number;
  maybe_max?: number;
  buy_min?: number;
  maybe_min?: number;
}

export interface CategoryThresholds {
  added_sugar_g: ThresholdRange;
  protein_g: ThresholdRange;
  calories: ThresholdRange;
  protein_per_calorie_min: { buy: number; maybe: number };
}

export interface GoalConfig {
  goal: string;
  displayName: string;
  protein_bar: CategoryThresholds;
  greek_yogurt: CategoryThresholds;
  cottage_cheese: CategoryThresholds;
  protein_milk: CategoryThresholds;
  default: CategoryThresholds;
}

export interface Flag {
  id: string;
  severity: "info" | "warn" | "critical";
  message: string;
}

export interface ScoreResult {
  verdict: Verdict;
  flags: Flag[];
  /** Plain-English rule lines (metric vs threshold) */
  ruleLines: string[];
  explanation: string;
  confidence: Product["confidence"];
  confidenceLabel: string;
  servingLabel: string;
  product: Pick<Product, "barcode" | "name" | "brand" | "category">;
  metrics: {
    protein_g: number | null;
    added_sugar_g: number | null;
    calories: number | null;
    protein_per_calorie: number | null;
  };
}

export interface CompareResult {
  winner: ScoreResult;
  loser: ScoreResult;
  deltas: {
    protein_g: number | null;
    added_sugar_g: number | null;
    calories: number | null;
  };
  /** Fast aisle headline: "Winner: Quest — +8g protein · −3g sugar" */
  headline: string;
  summary: string;
}

export const REASON_CHIPS = [
  "Sugar too high",
  "Low protein",
  "Too many calories",
  "Too expensive",
  "Ingredients / additives",
  "Taste / texture",
  "Prefer other brand",
  "Other",
] as const;

export type ReasonChip = (typeof REASON_CHIPS)[number];
