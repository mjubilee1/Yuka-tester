import type { Product } from "./types";

/** Human confidence labels — never show bare HIGH/MEDIUM/LOW. */
export function confidenceLabel(confidence: Product["confidence"]): string {
  switch (confidence) {
    case "high":
      return "Data looks solid";
    case "medium":
      return "Decent data — glance at label if unsure";
    case "low":
      return "Thin data — verify on the package";
    case "missing":
      return "Can't score this yet";
  }
}
