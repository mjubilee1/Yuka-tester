import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { VerdictBadge } from "@/components/ui";
import { theme } from "@/constants/theme";
import { useTripStore } from "@/store/trip";

export default function TripScreen() {
  const activeScans = useTripStore((s) => s.activeScans);
  const lastTripSummary = useTripStore((s) => s.lastTripSummary);

  const summary = lastTripSummary;

  if (!summary && activeScans.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Text style={styles.emptyIconText}>🛒</Text>
          </View>
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

  const showActive = !summary && activeScans.length > 0;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Cart audit</Text>
        {showActive && (
          <Text style={styles.hint}>Live trip — end trip on Shop tab to finalize</Text>
        )}

        <View style={styles.summaryCard}>
          <View style={styles.row}>
            <Stat label="Buy" value={data.buy} color={theme.colors.buy} />
            <Stat label="Maybe" value={data.maybe} color={theme.colors.maybe} />
            <Stat label="Avoid" value={data.avoid} color={theme.colors.avoid} />
          </View>
          <View style={styles.macroBar}>
            <Text style={styles.macroSummary}>
              {Math.round(data.totalProtein)}g protein · {Math.round(data.totalSugar)}g sugar
            </Text>
          </View>
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

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View style={[styles.stat, { backgroundColor: `${color}15` }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const { colors, radius } = theme;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: 24, paddingBottom: 48 },
  empty: { flex: 1, justifyContent: "center", padding: 32, alignItems: "center" },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyIconText: { fontSize: 32 },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 12,
    lineHeight: 22,
  },
  title: { fontSize: 28, fontWeight: "800", color: colors.text },
  hint: {
    fontSize: 14,
    color: colors.maybe,
    marginTop: 8,
    fontWeight: "600",
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 20,
    marginTop: 20,
    borderWidth: 2,
    borderColor: colors.borderMuted,
  },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  stat: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: radius.md,
  },
  statValue: { fontSize: 30, fontWeight: "800" },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    fontWeight: "600",
  },
  macroBar: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  macroSummary: {
    fontSize: 15,
    color: colors.primaryDark,
    textAlign: "center",
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
    marginTop: 28,
    marginBottom: 12,
  },
  scanRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
    gap: 12,
  },
  scanInfo: { flex: 1 },
  scanBrand: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  scanName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginTop: 2,
  },
  reason: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
});
