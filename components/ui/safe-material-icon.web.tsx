import { Text, type OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

const GLYPHS: Record<string, string> = {
  "add-circle": "+",
  "add-circle-outline": "+",
  "auto-awesome": "✦",
  check: "✓",
  "delete-outline": "×",
  "drag-handle": "≡",
  "open-with": "↕",
  refresh: "↻",
  south: "↓",
  storage: "▣",
};

/** Avoids @expo/vector-icons font loading in the web preview. */
export function SafeMaterialIcon({
  name,
  size = 24,
  color,
  style,
}: {
  name: string;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
}) {
  return (
    <Text
      accessibilityRole="image"
      style={[{ color, fontSize: size, fontWeight: "700", lineHeight: size + 2, textAlign: "center" }, style]}
    >
      {GLYPHS[name] ?? "•"}
    </Text>
  );
}
