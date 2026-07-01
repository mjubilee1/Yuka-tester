import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Verdict } from "@/lib/scoring/types";
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
      <MacroItem label="Protein" value={protein != null ? `${protein}g` : "—"} />
      <MacroItem label="Sugar" value={sugar != null ? `${sugar}g` : "—"} />
      <MacroItem label="Cal" value={calories != null ? `${calories}` : "—"} />
    </View>
  );
}

function MacroItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.macroItem}>
      <Text style={styles.macroValue}>{value}</Text>
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

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  badgeMedium: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  text: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 1,
  },
  textMedium: {
    fontSize: 14,
  },
  macros: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#f4f4f5",
    borderRadius: 12,
    paddingVertical: 16,
    marginVertical: 12,
  },
  macroItem: { alignItems: "center" },
  macroValue: { fontSize: 20, fontWeight: "700", color: "#18181b" },
  macroLabel: { fontSize: 12, color: "#71717a", marginTop: 4 },
  button: {
    backgroundColor: "#18181b",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: "center",
  },
  buttonSecondary: {
    backgroundColor: "#f4f4f5",
  },
  buttonGhost: {
    backgroundColor: "transparent",
  },
  buttonPressed: { opacity: 0.85 },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  buttonTextSecondary: {
    color: "#18181b",
  },
  buttonTextGhost: {
    color: "#71717a",
  },
});
