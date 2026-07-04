import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  DEFAULT_PROFILE,
  type CutProfile,
} from "@/lib/scoring/profile";
import type { CutAggressiveness, WeightBand } from "@/lib/scoring/types";

interface ProfileState extends CutProfile {
  setWeightBand: (band: WeightBand) => void;
  setAggressiveness: (agg: CutAggressiveness) => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      ...DEFAULT_PROFILE,
      setWeightBand: (weightBand) => set({ weightBand }),
      setAggressiveness: (aggressiveness) => set({ aggressiveness }),
    }),
    {
      name: "cut-cart-profile",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        weightBand: state.weightBand,
        aggressiveness: state.aggressiveness,
      }),
    }
  )
);

export function useCutProfile(): CutProfile {
  const weightBand = useProfileStore((s) => s.weightBand);
  const aggressiveness = useProfileStore((s) => s.aggressiveness);
  return { weightBand, aggressiveness };
}
