import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui";
import { theme } from "@/constants/theme";
import { REASON_CHIPS, type ReasonChip } from "@/lib/scoring/types";
import { useTripStore } from "@/store/trip";

export default function ReasonScreen() {
  const router = useRouter();
  const { scanId } = useLocalSearchParams<{ scanId: string }>();
  const setReason = useTripStore((s) => s.setReason);

  const finish = (chip?: ReasonChip) => {
    if (scanId && chip) setReason(scanId, chip);
    router.replace("/scan");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Why are you skipping it?</Text>
        <Text style={styles.subtitle}>One tap — then keep moving</Text>

        {REASON_CHIPS.map((chip) => (
          <Pressable
            key={chip}
            style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
            onPress={() => finish(chip)}
          >
            <Text style={styles.chipText}>{chip}</Text>
          </Pressable>
        ))}

        <View style={styles.spacer} />
        <AppButton title="Skip" variant="ghost" onPress={() => finish()} />
      </ScrollView>
    </SafeAreaView>
  );
}

const { colors, radius } = theme;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: 24, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: "800", color: colors.text },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 22,
  },
  chip: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: colors.borderMuted,
  },
  chipPressed: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  chipText: { fontSize: 16, fontWeight: "700", color: colors.text },
  spacer: { height: 8 },
});
