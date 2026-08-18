import type { SymbolWeight } from "expo-symbols";
import { Text, type OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

const GLYPHS = {
  "house.fill": "⌂",
  "paperplane.fill": "↗",
  "chevron.left.forwardslash.chevron.right": "‹/›",
  "chevron.right": "›",
  "dumbbell.fill": "⌁",
  "list.bullet": "☷",
  "chart.bar.fill": "▥",
  calendar: "□",
  "arrow.forward": "→",
  lightbulb: "◉",
  timer: "◷",
  trophy: "★",
  "play.fill": "▶",
  checkmark: "✓",
  "checkmark.circle": "✓",
  "chevron.left": "‹",
  "chevron.down": "⌄",
  gearshape: "⚙",
} as const;

type IconSymbolName = keyof typeof GLYPHS;

/** Uses system glyphs on web so preview rendering never waits for an icon font. */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return (
    <Text
      accessibilityRole="image"
      style={[{ color, fontSize: size, fontWeight: "600", lineHeight: size + 2, textAlign: "center" }, style]}
    >
      {GLYPHS[name]}
    </Text>
  );
}
