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
  servingLabel?: string;
}

export function MacroRow({ protein, sugar, calories, servingLabel }: MacroProps) {
  return (
    <View style={styles.macrosWrap}>
      {servingLabel ? <Text style={styles.serving}>{servingLabel}</Text> : null}
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
    </View>
  );
}

export function ConfidenceLine({ label }: { label: string }) {
  return <Text style={styles.confidence}>{label}</Text>;
}

export function RuleLines({ lines }: { lines: string[] }) {
  if (lines.length === 0) return null;
  return (
    <View style={styles.rules}>
      {lines.map((line) => (
        <Text key={line} style={styles.ruleLine}>
          {line}
        </Text>
      ))}
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
  variant?: "primary" | "secondary" | "ghost" | "danger";
}

export function AppButton({ title, onPress, variant = "primary" }: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === "secondary" && styles.buttonSecondary,
        variant === "ghost" && styles.buttonGhost,
        variant === "danger" && styles.buttonDanger,
        pressed && styles.buttonPressed,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          variant === "secondary" && styles.buttonTextSecondary,
          variant === "ghost" && styles.buttonTextGhost,
          variant === "danger" && styles.buttonTextDanger,
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
  macrosWrap: { marginVertical: 12 },
  serving: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
    marginBottom: 8,
  },
  macros: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    paddingVertical: 18,
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
  confidence: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 10,
    fontWeight: "600",
  },
  rules: {
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: 14,
    gap: 8,
  },
  ruleLine: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 21,
    fontWeight: "600",
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
  buttonDanger: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.avoid,
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
  buttonTextDanger: {
    color: colors.avoid,
  },
});
