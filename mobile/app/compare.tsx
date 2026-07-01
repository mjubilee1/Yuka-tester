import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton, MacroRow, VerdictBadge } from "@/components/ui";
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
        <ActivityIndicator size="large" />
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
          <Text style={styles.cardLabel}>Winner for cutting</Text>
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { padding: 24, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 28, fontWeight: "800", color: "#18181b" },
  summary: { fontSize: 16, color: "#16a34a", fontWeight: "600", marginTop: 12, lineHeight: 24 },
  winnerCard: {
    backgroundColor: "#f0fdf4",
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  loserCard: {
    backgroundColor: "#fafafa",
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#e4e4e7",
  },
  cardLabel: { fontSize: 12, fontWeight: "700", color: "#71717a", textTransform: "uppercase" },
  brand: { fontSize: 13, color: "#71717a", marginTop: 8, fontWeight: "600" },
  name: { fontSize: 18, fontWeight: "700", color: "#18181b", marginTop: 4, marginBottom: 12 },
  spacer: { height: 8 },
});
