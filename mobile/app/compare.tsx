import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  AppButton,
  ConfidenceLine,
  MacroRow,
  RuleLines,
  VerdictBadge,
} from "@/components/ui";
import { theme } from "@/constants/theme";
import { lookupProduct } from "@/lib/products/lookup";
import { compareProducts } from "@/lib/scoring/score";
import type { CompareResult } from "@/lib/scoring/types";
import { useCutProfile } from "@/store/profile";
import { useTripStore } from "@/store/trip";

export default function CompareScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    winnerBarcode: string;
    loserBarcode: string;
    headline?: string;
  }>();
  const profile = useCutProfile();
  const addScan = useTripStore((s) => s.addScan);
  const [comparison, setComparison] = useState<CompareResult | null>(null);

  useEffect(() => {
    Promise.all([
      lookupProduct(params.winnerBarcode),
      lookupProduct(params.loserBarcode),
    ]).then(([a, b]) => {
      if (!a || !b) return;
      setComparison(
        compareProducts(a, b, {
          weightBand: profile.weightBand,
          aggressiveness: profile.aggressiveness,
        })
      );
    });
  }, [
    params.winnerBarcode,
    params.loserBarcode,
    profile.weightBand,
    profile.aggressiveness,
  ]);

  if (!comparison) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const { winner, loser, headline } = comparison;
  const title = params.headline ?? headline;

  const addWinnerToCart = () => {
    addScan({
      id: `${Date.now()}-${winner.product.barcode}`,
      barcode: winner.product.barcode,
      score: winner,
      disposition: "cart",
      timestamp: new Date().toISOString(),
    });
    router.replace("/scan");
  };

  const leaveBoth = () => {
    const ts = new Date().toISOString();
    const loserId = `${Date.now()}-${loser.product.barcode}`;
    addScan({
      id: `${Date.now()}-${winner.product.barcode}`,
      barcode: winner.product.barcode,
      score: winner,
      disposition: "left",
      timestamp: ts,
    });
    addScan({
      id: loserId,
      barcode: loser.product.barcode,
      score: loser,
      disposition: "left",
      timestamp: ts,
    });
    router.replace({ pathname: "/reason", params: { scanId: loserId } });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.headline}>{title}</Text>

        <View style={styles.winnerCard}>
          <Text style={styles.winnerLabel}>Winner for your cut</Text>
          <Text style={styles.brand}>{winner.product.brand}</Text>
          <Text style={styles.name}>{winner.product.name}</Text>
          <VerdictBadge verdict={winner.verdict} size="medium" />
          <ConfidenceLine label={winner.confidenceLabel} />
          <RuleLines lines={winner.ruleLines} />
          <MacroRow
            protein={winner.metrics.protein_g}
            sugar={winner.metrics.added_sugar_g}
            calories={winner.metrics.calories}
            servingLabel={winner.servingLabel}
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
            servingLabel={loser.servingLabel}
          />
        </View>

        <AppButton title="In cart (winner)" onPress={addWinnerToCart} />
        <View style={styles.spacer} />
        <AppButton title="Left both" variant="danger" onPress={leaveBoth} />
        <View style={styles.spacer} />
        <AppButton title="Scan another" variant="ghost" onPress={() => router.replace("/scan")} />
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
  headline: {
    fontSize: 20,
    color: colors.primaryDark,
    fontWeight: "800",
    lineHeight: 28,
    backgroundColor: colors.primaryMuted,
    padding: 14,
    borderRadius: radius.md,
  },
  winnerCard: {
    backgroundColor: colors.buyBg,
    borderRadius: radius.xl,
    padding: 20,
    marginTop: 20,
    borderWidth: 2,
    borderColor: colors.border,
  },
  loserCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 20,
    marginTop: 16,
    marginBottom: 20,
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
  spacer: { height: 10 },
});
