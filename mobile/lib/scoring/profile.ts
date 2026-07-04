import type { CategoryThresholds, CutAggressiveness, WeightBand } from "./types";

export interface CutProfile {
  weightBand: WeightBand;
  aggressiveness: CutAggressiveness;
}

export const DEFAULT_PROFILE: CutProfile = {
  weightBand: "160_200",
  aggressiveness: "normal",
};

export const WEIGHT_BANDS: { id: WeightBand; label: string }[] = [
  { id: "under_160", label: "Under 160 lb" },
  { id: "160_200", label: "160–200 lb" },
  { id: "over_200", label: "Over 200 lb" },
];

export const AGGRESSIVENESS: { id: CutAggressiveness; label: string; hint: string }[] = [
  { id: "easy", label: "Easy", hint: "More flexible" },
  { id: "normal", label: "Normal", hint: "Balanced cut" },
  { id: "aggressive", label: "Aggressive", hint: "Stricter limits" },
];

/** Scale base thresholds for weight + cut intensity. */
export function adjustThresholds(
  base: CategoryThresholds,
  profile: CutProfile
): CategoryThresholds {
  const agg =
    profile.aggressiveness === "easy"
      ? { sugar: 1.25, protein: 0.85, cal: 1.2 }
      : profile.aggressiveness === "aggressive"
        ? { sugar: 0.75, protein: 1.15, cal: 0.85 }
        : { sugar: 1, protein: 1, cal: 1 };

  const weight =
    profile.weightBand === "under_160"
      ? { protein: 0.9, cal: 0.9 }
      : profile.weightBand === "over_200"
        ? { protein: 1.1, cal: 1.1 }
        : { protein: 1, cal: 1 };

  const round1 = (n: number) => Math.round(n * 10) / 10;
  const round0 = (n: number) => Math.round(n);

  return {
    added_sugar_g: {
      buy_max: round1((base.added_sugar_g.buy_max ?? 5) * agg.sugar),
      maybe_max: round1((base.added_sugar_g.maybe_max ?? 9) * agg.sugar),
    },
    protein_g: {
      buy_min: round0((base.protein_g.buy_min ?? 15) * agg.protein * weight.protein),
      maybe_min: round0((base.protein_g.maybe_min ?? 10) * agg.protein * weight.protein),
    },
    calories: {
      buy_max: round0((base.calories.buy_max ?? 250) * agg.cal * weight.cal),
      maybe_max: round0((base.calories.maybe_max ?? 300) * agg.cal * weight.cal),
    },
    protein_per_calorie_min: {
      buy: base.protein_per_calorie_min.buy * (profile.aggressiveness === "aggressive" ? 1.05 : 1),
      maybe: base.protein_per_calorie_min.maybe,
    },
  };
}

export function profileSummary(profile: CutProfile): string {
  const weight = WEIGHT_BANDS.find((w) => w.id === profile.weightBand)?.label ?? "";
  const agg = AGGRESSIVENESS.find((a) => a.id === profile.aggressiveness)?.label ?? "";
  return `${agg} cut · ${weight}`;
}
