import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton, MacroRow, VerdictBadge } from "@/components/ui";
import { theme } from "@/constants/theme";
import { lookupProduct } from "@/lib/products/lookup";
import { scoreProduct } from "@/lib/scoring/score";
import type { ScoreResult } from "@/lib/scoring/types";
import { useTripStore } from "@/store/trip";

export default function ResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ barcode?: string; error?: string }>();
  const addScan = useTripStore((s) => s.addScan);
  const setCompareSlot = useTripStore((s) => s.setCompareSlot);
  const [score, setScore] = useState<ScoreResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.error === "not_found") {
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
      const result = scoreProduct(product);
      setScore(result);
      const id = `${Date.now()}-${product.barcode}`;
      addScan({ id, barcode: product.barcode, score: result, timestamp: new Date().toISOString() });
      setLoading(false);

      if (result.verdict === "avoid" || result.verdict === "maybe") {
        setTimeout(() => {
          router.push({ pathname: "/reason", params: { scanId: id } });
        }, 400);
      }
    });
  }, [params.barcode, params.error, addScan, router]);

  if (params.error === "not_found") {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <Text style={styles.errorTitle}>Not in catalog yet</Text>
          <Text style={styles.errorText}>
            Barcode {params.barcode} isn&apos;t in our protein bar / yogurt database. Try
            another product or check the barcode.
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

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.productCard}>
          <Text style={styles.brand}>{score.product.brand}</Text>
          <Text style={styles.name}>{score.product.name}</Text>
          <Text style={styles.category}>{score.product.category.replace("_", " ")}</Text>
        </View>

        <VerdictBadge verdict={score.verdict} />

        <Text style={styles.confidence}>Confidence: {score.confidence.toUpperCase()}</Text>
        <Text style={styles.explanation}>{score.explanation}</Text>

        <MacroRow
          protein={score.metrics.protein_g}
          sugar={score.metrics.added_sugar_g}
          calories={score.metrics.calories}
        />

        {score.flags.length > 0 && (
          <View style={styles.flags}>
            {score.flags.map((f) => (
              <Text key={f.id} style={styles.flag}>
                • {f.message}
              </Text>
            ))}
          </View>
        )}

        <AppButton
          title="Compare with another"
          variant="secondary"
          onPress={() => {
            setCompareSlot(score);
            router.replace("/scan");
          }}
        />
        <View style={styles.spacer} />
        <AppButton title="Scan next product" onPress={() => router.replace("/scan")} />
        <View style={styles.spacerSm} />
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
  productCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 20,
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
  name: { fontSize: 24, fontWeight: "800", color: colors.text, marginTop: 4 },
  category: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  confidence: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 14,
    fontWeight: "600",
  },
  explanation: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    marginTop: 8,
    fontWeight: "500",
  },
  flags: {
    marginTop: 16,
    marginBottom: 24,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: 14,
  },
  flag: { fontSize: 14, color: colors.textSecondary, lineHeight: 22, marginBottom: 4 },
  errorTitle: { fontSize: 22, fontWeight: "800", color: colors.text },
  errorText: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    marginVertical: 20,
  },
  spacer: { height: 12 },
  spacerSm: { height: 8 },
});
