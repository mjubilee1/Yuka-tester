import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui";
import { REASON_CHIPS, type ReasonChip } from "@/lib/scoring/types";
import { useTripStore } from "@/store/trip";

export default function ReasonScreen() {
  const router = useRouter();
  const { scanId } = useLocalSearchParams<{ scanId: string }>();
  const setReason = useTripStore((s) => s.setReason);

  const pick = (chip: ReasonChip) => {
    if (scanId) setReason(scanId, chip);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Why?</Text>
        <Text style={styles.subtitle}>Quick tap — helps us learn what matters at the shelf</Text>

        {REASON_CHIPS.map((chip) => (
          <Pressable
            key={chip}
            style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
            onPress={() => pick(chip)}
          >
            <Text style={styles.chipText}>{chip}</Text>
          </Pressable>
        ))}

        <View style={styles.spacer} />
        <AppButton title="Skip" variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { padding: 24, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: "800", color: "#18181b" },
  subtitle: { fontSize: 15, color: "#71717a", marginTop: 8, marginBottom: 24, lineHeight: 22 },
  chip: {
    backgroundColor: "#f4f4f5",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 10,
  },
  chipPressed: { backgroundColor: "#e4e4e7" },
  chipText: { fontSize: 16, fontWeight: "600", color: "#18181b" },
  spacer: { height: 8 },
});
