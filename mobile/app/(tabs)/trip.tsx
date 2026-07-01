import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { VerdictBadge } from "@/components/ui";
import { useTripStore } from "@/store/trip";

export default function TripScreen() {
  const activeScans = useTripStore((s) => s.activeScans);
  const lastTripSummary = useTripStore((s) => s.lastTripSummary);

  const summary = lastTripSummary;
  const showActive = !summary && activeScans.length > 0;

  if (!summary && activeScans.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No trips yet</Text>
          <Text style={styles.emptyText}>
            Scan products on the Shop tab, then end your trip to see a cart audit here.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const data = summary ?? {
    buy: activeScans.filter((s) => s.score.verdict === "buy").length,
    maybe: activeScans.filter((s) => s.score.verdict === "maybe").length,
    avoid: activeScans.filter((s) => s.score.verdict === "avoid").length,
    totalProtein: activeScans.reduce((a, s) => a + (s.score.metrics.protein_g ?? 0), 0),
    totalSugar: activeScans.reduce((a, s) => a + (s.score.metrics.added_sugar_g ?? 0), 0),
    scans: activeScans,
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Cart audit</Text>
        {showActive && (
          <Text style={styles.hint}>Live trip — end trip on Shop tab to finalize</Text>
        )}

        <View style={styles.summaryCard}>
          <View style={styles.row}>
            <Stat label="Buy" value={data.buy} />
            <Stat label="Maybe" value={data.maybe} />
            <Stat label="Avoid" value={data.avoid} />
          </View>
          <Text style={styles.macroSummary}>
            Trip totals: {Math.round(data.totalProtein)}g protein ·{" "}
            {Math.round(data.totalSugar)}g sugar
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Scans</Text>
        {data.scans.map((scan) => (
          <View key={scan.id} style={styles.scanRow}>
            <View style={styles.scanInfo}>
              <Text style={styles.scanBrand}>{scan.score.product.brand}</Text>
              <Text style={styles.scanName} numberOfLines={2}>
                {scan.score.product.name}
              </Text>
              {scan.reason && (
                <Text style={styles.reason}>Reason: {scan.reason}</Text>
              )}
            </View>
            <VerdictBadge verdict={scan.score.verdict} size="medium" />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { padding: 24, paddingBottom: 48 },
  empty: { flex: 1, justifyContent: "center", padding: 32 },
  emptyTitle: { fontSize: 22, fontWeight: "700", color: "#18181b", textAlign: "center" },
  emptyText: {
    fontSize: 15,
    color: "#71717a",
    textAlign: "center",
    marginTop: 12,
    lineHeight: 22,
  },
  title: { fontSize: 28, fontWeight: "800", color: "#18181b" },
  hint: { fontSize: 14, color: "#ca8a04", marginTop: 8 },
  summaryCard: {
    backgroundColor: "#fafafa",
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#e4e4e7",
  },
  row: { flexDirection: "row", justifyContent: "space-around" },
  stat: { alignItems: "center" },
  statValue: { fontSize: 32, fontWeight: "800", color: "#18181b" },
  statLabel: { fontSize: 13, color: "#71717a", marginTop: 4 },
  macroSummary: { fontSize: 14, color: "#52525b", marginTop: 16, textAlign: "center" },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#18181b",
    marginTop: 28,
    marginBottom: 12,
  },
  scanRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f4f4f5",
    gap: 12,
  },
  scanInfo: { flex: 1 },
  scanBrand: { fontSize: 12, color: "#71717a", fontWeight: "600" },
  scanName: { fontSize: 15, fontWeight: "600", color: "#18181b", marginTop: 2 },
  reason: { fontSize: 12, color: "#a1a1aa", marginTop: 4 },
});
