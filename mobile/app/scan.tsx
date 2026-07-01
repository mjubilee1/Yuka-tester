import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui";
import { lookupProduct } from "@/lib/products/lookup";
import { compareProducts, scoreProduct } from "@/lib/scoring/score";
import { useTripStore } from "@/store/trip";

export default function ScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [manualCode, setManualCode] = useState("");
  const [loading, setLoading] = useState(false);
  const scannedRef = useRef(false);
  const compareSlot = useTripStore((s) => s.compareSlot);
  const setCompareSlot = useTripStore((s) => s.setCompareSlot);

  const handleBarcode = useCallback(
    async (barcode: string) => {
      if (loading || scannedRef.current) return;
      scannedRef.current = true;
      setLoading(true);

      try {
        const product = await lookupProduct(barcode);
        if (!product) {
          router.replace({
            pathname: "/result",
            params: { error: "not_found", barcode },
          });
          return;
        }

        if (compareSlot) {
          const slotProduct = await lookupProduct(compareSlot.product.barcode);
          if (!slotProduct) {
            setCompareSlot(null);
            router.replace({
              pathname: "/result",
              params: { error: "compare_lost" },
            });
            return;
          }
          const comparison = compareProducts(slotProduct, product);
          setCompareSlot(null);
          router.replace({
            pathname: "/compare",
            params: {
              winnerBarcode: comparison.winner.product.barcode,
              loserBarcode: comparison.loser.product.barcode,
              summary: comparison.summary,
            },
          });
          return;
        }

        const score = scoreProduct(product);
        router.replace({
          pathname: "/result",
          params: { barcode: product.barcode },
        });
      } finally {
        setLoading(false);
        setTimeout(() => {
          scannedRef.current = false;
        }, 2000);
      }
    },
    [compareSlot, loading, router, setCompareSlot]
  );

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permission}>
        <Text style={styles.permissionTitle}>Camera access needed</Text>
        <Text style={styles.permissionText}>
          Scan barcodes on protein bars and Greek yogurt in the store.
        </Text>
        <AppButton title="Allow camera" onPress={requestPermission} />
        <View style={styles.spacer} />
        <ManualEntry
          manualCode={manualCode}
          setManualCode={setManualCode}
          onSubmit={() => manualCode && handleBarcode(manualCode)}
          loading={loading}
        />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e"],
        }}
        onBarcodeScanned={({ data }) => handleBarcode(data)}
      />
      <SafeAreaView style={styles.overlay}>
        <Pressable onPress={() => router.back()} style={styles.close}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
        <View style={styles.frame}>
          <Text style={styles.frameText}>
            {compareSlot ? "Scan 2nd product to compare" : "Point at barcode"}
          </Text>
        </View>
        {loading && (
          <View style={styles.loading}>
            <ActivityIndicator color="#fff" size="large" />
          </View>
        )}
        <ManualEntry
          manualCode={manualCode}
          setManualCode={setManualCode}
          onSubmit={() => manualCode && handleBarcode(manualCode)}
          loading={loading}
        />
      </SafeAreaView>
    </View>
  );
}

function ManualEntry({
  manualCode,
  setManualCode,
  onSubmit,
  loading,
}: {
  manualCode: string;
  setManualCode: (v: string) => void;
  onSubmit: () => void;
  loading: boolean;
}) {
  return (
    <View style={styles.manual}>
      <Text style={styles.manualLabel}>Or enter barcode (simulator)</Text>
      <TextInput
        style={styles.input}
        value={manualCode}
        onChangeText={setManualCode}
        placeholder="0894700010137"
        placeholderTextColor="#a1a1aa"
        keyboardType="number-pad"
      />
      <AppButton title="Look up" onPress={onSubmit} variant="secondary" />
      {loading && <ActivityIndicator style={{ marginTop: 8 }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  permission: { flex: 1, padding: 24, justifyContent: "center" },
  permissionTitle: { fontSize: 22, fontWeight: "700", marginBottom: 8 },
  permissionText: { fontSize: 15, color: "#71717a", marginBottom: 24, lineHeight: 22 },
  overlay: { flex: 1, justifyContent: "space-between", padding: 16 },
  close: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(0,0,0,0.5)",
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: { color: "#fff", fontSize: 18 },
  frame: {
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  frameText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  loading: { alignSelf: "center" },
  manual: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
  },
  manualLabel: { fontSize: 12, color: "#71717a", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#e4e4e7",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  spacer: { height: 16 },
});
