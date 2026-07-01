export type Verdict = "buy" | "maybe" | "avoid";

export type ProductCategory = "protein_bar" | "greek_yogurt" | "unknown";

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
  explanation: string;
  confidence: Product["confidence"];
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
