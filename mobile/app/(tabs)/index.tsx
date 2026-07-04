import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui";
import { theme } from "@/constants/theme";
import { getCacheSize } from "@/lib/products/lookup";
import { profileSummary } from "@/lib/scoring/profile";
import { useCutProfile } from "@/store/profile";
import { cartScans, useTripStore } from "@/store/trip";

export default function HomeScreen() {
  const router = useRouter();
  const profile = useCutProfile();
  const activeScans = useTripStore((s) => s.activeScans);
  const compareSlot = useTripStore((s) => s.compareSlot);
  const endTrip = useTripStore((s) => s.endTrip);
  const clearActiveTrip = useTripStore((s) => s.clearActiveTrip);

  const inCart = cartScans(activeScans);
  const buy = inCart.filter((s) => s.score.verdict === "buy").length;
  const maybe = inCart.filter((s) => s.score.verdict === "maybe").length;
  const avoid = inCart.filter((s) => s.score.verdict === "avoid").length;
  const leftCount = activeScans.filter((s) => s.disposition === "left").length;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>Cut Cart</Text>
        </View>
        <Text style={styles.title}>Know what to buy{"\n"}before it goes in the cart</Text>

        <Pressable
          style={styles.profileChip}
          onPress={() => router.push("/profile")}
        >
          <Text style={styles.profileChipText}>{profileSummary(profile)}</Text>
          <Text style={styles.profileChipEdit}>Edit</Text>
        </Pressable>

        <Text style={styles.subtitle}>
          Bars · yogurt · cottage cheese · protein milk · {getCacheSize()} products
        </Text>

        {inCart.length > 0 && (
          <View style={styles.tripCard}>
            <Text style={styles.tripTitle}>In cart</Text>
            <View style={styles.counts}>
              <CountPill label="Buy" value={buy} color={theme.colors.buy} />
              <CountPill label="Maybe" value={maybe} color={theme.colors.maybe} />
              <CountPill label="Avoid" value={avoid} color={theme.colors.avoid} />
            </View>
            {leftCount > 0 && (
              <Text style={styles.scanCount}>{leftCount} left behind</Text>
            )}
          </View>
        )}

        {compareSlot && (
          <View style={styles.compareBanner}>
            <Text style={styles.compareText}>
              Scan 2nd product to compare with {compareSlot.product.name}
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
    <View style={[styles.pill, { backgroundColor: `${color}18` }]}>
      <Text style={[styles.pillValue, { color }]}>{value}</Text>
      <Text style={styles.pillLabel}>{label}</Text>
    </View>
  );
}

const { colors, radius } = theme;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: 24, paddingBottom: 48 },
  heroBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.sm,
    marginBottom: 12,
  },
  heroBadgeText: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.white,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.text,
    lineHeight: 38,
  },
  profileChip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: 14,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    gap: 10,
  },
  profileChipText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primaryDark,
  },
  profileChipEdit: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 10,
    lineHeight: 20,
    fontWeight: "500",
  },
  tripCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 20,
    marginTop: 24,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: colors.borderMuted,
  },
  tripTitle: { fontSize: 16, fontWeight: "800", color: colors.primaryDark },
  counts: { flexDirection: "row", gap: 12, marginTop: 16 },
  pill: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: radius.md,
  },
  pillValue: { fontSize: 28, fontWeight: "800" },
  pillLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: "600",
  },
  scanCount: { fontSize: 13, color: colors.textMuted, marginTop: 14, fontWeight: "500" },
  compareBanner: {
    backgroundColor: colors.accentLight,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  compareText: {
    fontSize: 14,
    color: colors.primaryDark,
    lineHeight: 20,
    fontWeight: "600",
  },
  spacer: { height: 12 },
  spacerSm: { height: 8 },
});
