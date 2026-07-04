import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton, MacroRow, VerdictBadge } from "@/components/ui";
import { theme } from "@/constants/theme";
import { lookupProduct } from "@/lib/products/lookup";
import { compareProducts } from "@/lib/scoring/score";
import type { CompareResult } from "@/lib/scoring/types";
import { useTripStore } from "@/store/trip";

export default function CompareScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    winnerBarcode: string;
    loserBarcode: string;
    summary?: string;
  }>();
  const addScan = useTripStore((s) => s.addScan);
  const [comparison, setComparison] = useState<CompareResult | null>(null);

  useEffect(() => {
    Promise.all([
      lookupProduct(params.winnerBarcode),
      lookupProduct(params.loserBarcode),
    ]).then(([a, b]) => {
      if (!a || !b) return;
      const result = compareProducts(a, b);
      setComparison(result);

      const ts = new Date().toISOString();
      const existing = new Set(
        useTripStore.getState().activeScans.map((s) => s.barcode)
      );

      for (const score of [result.winner, result.loser]) {
        if (existing.has(score.product.barcode)) continue;
        addScan({
          id: `${Date.now()}-${score.product.barcode}`,
          barcode: score.product.barcode,
          score,
          timestamp: ts,
        });
      }
    });
  }, [params.winnerBarcode, params.loserBarcode, addScan]);

  if (!comparison) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const { winner, loser, summary } = comparison;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Comparison</Text>
        <Text style={styles.summary}>{params.summary ?? summary}</Text>

        <View style={styles.winnerCard}>
          <Text style={styles.winnerLabel}>Winner for cutting</Text>
          <Text style={styles.brand}>{winner.product.brand}</Text>
          <Text style={styles.name}>{winner.product.name}</Text>
          <VerdictBadge verdict={winner.verdict} size="medium" />
          <MacroRow
            protein={winner.metrics.protein_g}
            sugar={winner.metrics.added_sugar_g}
            calories={winner.metrics.calories}
          />
        </View>

        <View style={styles.loserCard}>
          <Text style={styles.cardLabel}>Other option</Text>
          <Text style={styles.brand}>{loser.product.brand}</Text>
          <Text style={styles.name}>{loser.product.name}</Text>
          <VerdictBadge verdict={loser.verdict} size="medium" />
          <MacroRow
            protein={loser.metrics.protein_g}
            sugar={loser.metrics.added_sugar_g}
            calories={loser.metrics.calories}
          />
        </View>

        <AppButton title="Scan another" onPress={() => router.replace("/scan")} />
        <View style={styles.spacer} />
        <AppButton title="Done" variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </SafeAreaView>
  );
}

const { colors, radius } = theme;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: 24, paddingBottom: 40 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  title: { fontSize: 28, fontWeight: "800", color: colors.text },
  summary: {
    fontSize: 16,
    color: colors.primaryDark,
    fontWeight: "700",
    marginTop: 12,
    lineHeight: 24,
    backgroundColor: colors.primaryMuted,
    padding: 14,
    borderRadius: radius.md,
  },
  winnerCard: {
    backgroundColor: colors.buyBg,
    borderRadius: radius.xl,
    padding: 20,
    marginTop: 24,
    borderWidth: 2,
    borderColor: colors.border,
  },
  loserCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 20,
    marginTop: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },
  winnerLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.buy,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  brand: {
    fontSize: 13,
    color: colors.primary,
    marginTop: 8,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  name: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
    marginTop: 4,
    marginBottom: 12,
  },
  spacer: { height: 8 },
});
