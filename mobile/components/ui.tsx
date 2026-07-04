import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Verdict } from "@/lib/scoring/types";
import { theme } from "@/constants/theme";
import { verdictColor, verdictLabel } from "@/store/trip";

interface Props {
  verdict: Verdict;
  size?: "large" | "medium";
}

export function VerdictBadge({ verdict, size = "large" }: Props) {
  const color = verdictColor(verdict);
  return (
    <View
      style={[
        styles.badge,
        size === "medium" && styles.badgeMedium,
        { backgroundColor: color },
      ]}
    >
      <Text style={[styles.text, size === "medium" && styles.textMedium]}>
        {verdictLabel(verdict)}
      </Text>
    </View>
  );
}

interface MacroProps {
  protein: number | null;
  sugar: number | null;
  calories: number | null;
}

export function MacroRow({ protein, sugar, calories }: MacroProps) {
  return (
    <View style={styles.macros}>
      <MacroItem
        label="Protein"
        value={protein != null ? `${protein}g` : "—"}
        color={theme.colors.protein}
      />
      <MacroItem
        label="Sugar"
        value={sugar != null ? `${sugar}g` : "—"}
        color={theme.colors.sugar}
      />
      <MacroItem
        label="Cal"
        value={calories != null ? `${calories}` : "—"}
        color={theme.colors.calories}
      />
    </View>
  );
}

function MacroItem({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.macroItem}>
      <Text style={[styles.macroValue, { color }]}>{value}</Text>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );
}

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost";
}

export function AppButton({ title, onPress, variant = "primary" }: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === "secondary" && styles.buttonSecondary,
        variant === "ghost" && styles.buttonGhost,
        pressed && styles.buttonPressed,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          variant === "secondary" && styles.buttonTextSecondary,
          variant === "ghost" && styles.buttonTextGhost,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

const { colors, radius } = theme;

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: radius.md,
    alignSelf: "flex-start",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  badgeMedium: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.sm,
  },
  text: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  textMedium: {
    fontSize: 14,
  },
  macros: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    paddingVertical: 18,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: colors.borderMuted,
  },
  macroItem: { alignItems: "center" },
  macroValue: { fontSize: 22, fontWeight: "800" },
  macroLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 17,
    paddingHorizontal: 24,
    borderRadius: radius.lg,
    alignItems: "center",
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonGhost: {
    backgroundColor: "transparent",
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonPressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  buttonText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  buttonTextSecondary: {
    color: colors.primaryDark,
  },
  buttonTextGhost: {
    color: colors.textSecondary,
  },
});
