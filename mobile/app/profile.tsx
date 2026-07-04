import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui";
import { theme } from "@/constants/theme";
import {
  AGGRESSIVENESS,
  WEIGHT_BANDS,
} from "@/lib/scoring/profile";
import type { CutAggressiveness, WeightBand } from "@/lib/scoring/types";
import { useProfileStore } from "@/store/profile";

export default function ProfileScreen() {
  const router = useRouter();
  const weightBand = useProfileStore((s) => s.weightBand);
  const aggressiveness = useProfileStore((s) => s.aggressiveness);
  const setWeightBand = useProfileStore((s) => s.setWeightBand);
  const setAggressiveness = useProfileStore((s) => s.setAggressiveness);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Your cut</Text>
        <Text style={styles.subtitle}>
          Shifts buy limits. Takes 10 seconds — then back to scanning.
        </Text>

        <Text style={styles.section}>Weight</Text>
        <View style={styles.row}>
          {WEIGHT_BANDS.map((band) => (
            <Chip
              key={band.id}
              label={band.label}
              selected={weightBand === band.id}
              onPress={() => setWeightBand(band.id as WeightBand)}
            />
          ))}
        </View>

        <Text style={styles.section}>How hard</Text>
        <View style={styles.row}>
          {AGGRESSIVENESS.map((agg) => (
            <Chip
              key={agg.id}
              label={agg.label}
              selected={aggressiveness === agg.id}
              onPress={() => setAggressiveness(agg.id as CutAggressiveness)}
            />
          ))}
        </View>

        <View style={styles.spacer} />
        <AppButton title="Done" onPress={() => router.back()} />
      </View>
    </SafeAreaView>
  );
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

const { colors, radius } = theme;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: 24 },
  title: { fontSize: 28, fontWeight: "800", color: colors.text },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 8,
    marginBottom: 28,
    lineHeight: 22,
  },
  section: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 10,
    marginTop: 8,
  },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  chip: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.borderMuted,
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  chipText: { fontSize: 14, fontWeight: "700", color: colors.text },
  chipTextSelected: { color: colors.primaryDark },
  spacer: { height: 16 },
});
