import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ReasonChip, ScoreResult, Verdict } from "@/lib/scoring/types";

export interface TripScan {
  id: string;
  barcode: string;
  score: ScoreResult;
  reason?: ReasonChip;
  timestamp: string;
}

export interface TripSummary {
  buy: number;
  maybe: number;
  avoid: number;
  totalProtein: number;
  totalSugar: number;
  scans: TripScan[];
}

interface TripState {
  compareSlot: ScoreResult | null;
  activeScans: TripScan[];
  lastTripSummary: TripSummary | null;
  setCompareSlot: (score: ScoreResult | null) => void;
  addScan: (scan: TripScan) => void;
  setReason: (scanId: string, reason: ReasonChip) => void;
  endTrip: () => TripSummary;
  clearActiveTrip: () => void;
}

function buildSummary(scans: TripScan[]): TripSummary {
  let buy = 0;
  let maybe = 0;
  let avoid = 0;
  let totalProtein = 0;
  let totalSugar = 0;

  for (const s of scans) {
    if (s.score.verdict === "buy") buy++;
    else if (s.score.verdict === "maybe") maybe++;
    else avoid++;
    totalProtein += s.score.metrics.protein_g ?? 0;
    totalSugar += s.score.metrics.added_sugar_g ?? 0;
  }

  return { buy, maybe, avoid, totalProtein, totalSugar, scans };
}

export const useTripStore = create<TripState>()(
  persist(
    (set, get) => ({
      compareSlot: null,
      activeScans: [],
      lastTripSummary: null,
      setCompareSlot: (score) => set({ compareSlot: score }),
      addScan: (scan) =>
        set((state) => ({ activeScans: [...state.activeScans, scan] })),
      setReason: (scanId, reason) =>
        set((state) => ({
          activeScans: state.activeScans.map((s) =>
            s.id === scanId ? { ...s, reason } : s
          ),
        })),
      endTrip: () => {
        const summary = buildSummary(get().activeScans);
        set({ lastTripSummary: summary, activeScans: [], compareSlot: null });
        return summary;
      },
      clearActiveTrip: () => set({ activeScans: [], compareSlot: null }),
    }),
    {
      name: "cut-cart-trip",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        lastTripSummary: state.lastTripSummary,
        activeScans: state.activeScans,
      }),
    }
  )
);

export function verdictColor(verdict: Verdict): string {
  switch (verdict) {
    case "buy":
      return "#10B981";
    case "maybe":
      return "#F59E0B";
    case "avoid":
      return "#EF4444";
  }
}

export function verdictLabel(verdict: Verdict): string {
  return verdict.toUpperCase();
}
