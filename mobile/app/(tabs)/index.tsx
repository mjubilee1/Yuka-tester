import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui";
import { getCacheSize } from "@/lib/products/lookup";
import { goalConfig } from "@/lib/scoring/score";
import { useTripStore } from "@/store/trip";

export default function HomeScreen() {
  const router = useRouter();
  const activeScans = useTripStore((s) => s.activeScans);
  const compareSlot = useTripStore((s) => s.compareSlot);
  const endTrip = useTripStore((s) => s.endTrip);
  const clearActiveTrip = useTripStore((s) => s.clearActiveTrip);

  const buy = activeScans.filter((s) => s.score.verdict === "buy").length;
  const maybe = activeScans.filter((s) => s.score.verdict === "maybe").length;
  const avoid = activeScans.filter((s) => s.score.verdict === "avoid").length;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.kicker}>Cut Cart</Text>
        <Text style={styles.title}>Know what to buy{"\n"}before it goes in the cart</Text>
        <Text style={styles.subtitle}>
          {goalConfig.displayName} · Protein bars & Greek yogurt · {getCacheSize()} products
        </Text>

        {activeScans.length > 0 && (
          <View style={styles.tripCard}>
            <Text style={styles.tripTitle}>Current trip</Text>
            <View style={styles.counts}>
              <CountPill label="Buy" value={buy} color="#16a34a" />
              <CountPill label="Maybe" value={maybe} color="#ca8a04" />
              <CountPill label="Avoid" value={avoid} color="#dc2626" />
            </View>
            <Text style={styles.scanCount}>{activeScans.length} scans</Text>
          </View>
        )}

        {compareSlot && (
          <View style={styles.compareBanner}>
            <Text style={styles.compareText}>
              Compare mode: scan second product to compare with{" "}
              {compareSlot.product.name}
            </Text>
          </View>
        )}

        <AppButton title="Scan product" onPress={() => router.push("/scan")} />

        <View style={styles.spacer} />

        {activeScans.length > 0 && (
          <>
            <AppButton
              title="End trip & see summary"
              variant="secondary"
              onPress={() => {
                endTrip();
                router.push("/(tabs)/trip");
              }}
            />
            <View style={styles.spacerSm} />
            <AppButton title="Clear trip" variant="ghost" onPress={clearActiveTrip} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function CountPill({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View style={styles.pill}>
      <Text style={[styles.pillValue, { color }]}>{value}</Text>
      <Text style={styles.pillLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { padding: 24, paddingBottom: 48 },
  kicker: {
    fontSize: 14,
    fontWeight: "600",
    color: "#71717a",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: "#18181b",
    marginTop: 8,
    lineHeight: 38,
  },
  subtitle: { fontSize: 15, color: "#71717a", marginTop: 12, lineHeight: 22 },
  tripCard: {
    backgroundColor: "#fafafa",
    borderRadius: 16,
    padding: 20,
    marginTop: 28,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: "#e4e4e7",
  },
  tripTitle: { fontSize: 16, fontWeight: "700", color: "#18181b" },
  counts: { flexDirection: "row", gap: 16, marginTop: 16 },
  pill: { alignItems: "center" },
  pillValue: { fontSize: 28, fontWeight: "800" },
  pillLabel: { fontSize: 12, color: "#71717a", marginTop: 2 },
  scanCount: { fontSize: 13, color: "#a1a1aa", marginTop: 12 },
  compareBanner: {
    backgroundColor: "#eff6ff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  compareText: { fontSize: 14, color: "#1d4ed8", lineHeight: 20 },
  spacer: { height: 12 },
  spacerSm: { height: 8 },
});
