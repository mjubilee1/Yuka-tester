import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
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
import { scoreProduct } from "@/lib/scoring/score";
import type { ScoreResult } from "@/lib/scoring/types";
import { useCutProfile } from "@/store/profile";
import { useTripStore } from "@/store/trip";

export default function ResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ barcode?: string; error?: string }>();
  const profile = useCutProfile();
  const addScan = useTripStore((s) => s.addScan);
  const setCompareSlot = useTripStore((s) => s.setCompareSlot);
  const [score, setScore] = useState<ScoreResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [priceText, setPriceText] = useState("");

  useEffect(() => {
    if (params.error === "not_found" || params.error === "compare_lost") {
      setLoading(false);
      return;
    }
    if (!params.barcode) {
      setLoading(false);
      return;
    }

    lookupProduct(params.barcode).then((product) => {
      if (!product) {
        setLoading(false);
        return;
      }
      setScore(
        scoreProduct(product, {
          weightBand: profile.weightBand,
          aggressiveness: profile.aggressiveness,
        })
      );
      setLoading(false);
    });
  }, [params.barcode, params.error, profile.weightBand, profile.aggressiveness]);

  const proteinPerDollar = useMemo(() => {
    if (!score?.metrics.protein_g) return null;
    const price = parseFloat(priceText);
    if (!price || price <= 0) return null;
    const per20 = (price / score.metrics.protein_g) * 20;
    return per20;
  }, [priceText, score]);

  const commit = (disposition: "cart" | "left") => {
    if (!score) return;
    const id = `${Date.now()}-${score.product.barcode}`;
    addScan({
      id,
      barcode: score.product.barcode,
      score,
      disposition,
      timestamp: new Date().toISOString(),
    });
    if (disposition === "left") {
      router.replace({ pathname: "/reason", params: { scanId: id } });
      return;
    }
    router.replace("/scan");
  };

  if (params.error === "not_found" || params.error === "compare_lost") {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <Text style={styles.errorTitle}>
            {params.error === "compare_lost" ? "Compare reset" : "Not in catalog yet"}
          </Text>
          <Text style={styles.errorText}>
            {params.error === "compare_lost"
              ? "Couldn’t load the first product. Scan again."
              : "We cover bars, Greek yogurt, cottage cheese, and protein milk. Try another cut staple."}
          </Text>
          <AppButton title="Scan again" onPress={() => router.replace("/scan")} />
        </View>
      </SafeAreaView>
    );
  }

  if (loading || !score) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const isBuy = score.verdict === "buy";
  const showConfidence = !isBuy || score.confidence !== "high";
  const showRules = !isBuy && score.ruleLines.length > 0;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.productCard}>
          <Text style={styles.brand}>{score.product.brand}</Text>
          <Text style={styles.name}>{score.product.name}</Text>
          <Text style={styles.category}>
            {score.product.category.replace(/_/g, " ")}
          </Text>
        </View>

        <VerdictBadge verdict={score.verdict} />
        {showConfidence ? <ConfidenceLine label={score.confidenceLabel} /> : null}
        {showRules ? <RuleLines lines={score.ruleLines} /> : null}

        <MacroRow
          protein={score.metrics.protein_g}
          sugar={score.metrics.added_sugar_g}
          calories={score.metrics.calories}
          servingLabel={score.servingLabel}
        />

        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>$</Text>
          <TextInput
            style={styles.priceInput}
            value={priceText}
            onChangeText={setPriceText}
            placeholder="price (optional)"
            placeholderTextColor={theme.colors.textMuted}
            keyboardType="decimal-pad"
            returnKeyType="done"
          />
          {proteinPerDollar != null && (
            <Text style={styles.ppd}>
              ${proteinPerDollar.toFixed(2)} / 20g protein
            </Text>
          )}
        </View>

        <View style={styles.actions}>
          <AppButton title="In cart" onPress={() => commit("cart")} />
          <View style={styles.spacer} />
          <AppButton title="Left it" variant="danger" onPress={() => commit("left")} />
        </View>

        <View style={styles.spacer} />
        <AppButton
          title="Compare"
          variant="secondary"
          onPress={() => {
            setCompareSlot(score);
            router.replace("/scan");
          }}
        />
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
  productCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },
  brand: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  name: { fontSize: 22, fontWeight: "800", color: colors.text, marginTop: 4 },
  category: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  priceLabel: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.textSecondary,
  },
  priceInput: {
    minWidth: 120,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    backgroundColor: colors.surface,
  },
  ppd: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primaryDark,
  },
  actions: { marginTop: 4 },
  errorTitle: { fontSize: 22, fontWeight: "800", color: colors.text },
  errorText: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    marginVertical: 20,
  },
  spacer: { height: 12 },
});
