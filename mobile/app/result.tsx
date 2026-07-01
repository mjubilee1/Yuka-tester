import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton, MacroRow, VerdictBadge } from "@/components/ui";
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
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.brand}>{score.product.brand}</Text>
        <Text style={styles.name}>{score.product.name}</Text>
        <Text style={styles.category}>{score.product.category.replace("_", " ")}</Text>

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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { padding: 24, paddingBottom: 40 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  brand: { fontSize: 14, fontWeight: "600", color: "#71717a", textTransform: "uppercase" },
  name: { fontSize: 24, fontWeight: "800", color: "#18181b", marginTop: 4 },
  category: { fontSize: 13, color: "#a1a1aa", marginTop: 4, marginBottom: 20 },
  confidence: { fontSize: 12, color: "#71717a", marginTop: 12 },
  explanation: { fontSize: 15, color: "#3f3f46", lineHeight: 22, marginTop: 8 },
  flags: { marginTop: 16, marginBottom: 24 },
  flag: { fontSize: 14, color: "#52525b", lineHeight: 20, marginBottom: 6 },
  errorTitle: { fontSize: 22, fontWeight: "700", color: "#18181b" },
  errorText: { fontSize: 15, color: "#71717a", lineHeight: 22, marginVertical: 20 },
  spacer: { height: 12 },
  spacerSm: { height: 8 },
});
