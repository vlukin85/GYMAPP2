import type { SymbolWeight, SymbolViewProps } from "expo-symbols";
import type { OpaqueColorValue, StyleProp, TextStyle, ViewStyle } from "react-native";
import { WebSvgIcon, type WebSvgIconName } from "./web-svg-icon";

const MAPPING = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "dumbbell.fill": "dumbbell",
  "list.bullet": "list",
  "chart.bar.fill": "chart",
  calendar: "calendar",
  "arrow.forward": "arrow-forward",
  lightbulb: "lightbulb",
  timer: "timer",
  trophy: "trophy",
  "play.fill": "play",
  checkmark: "check",
  "checkmark.circle": "check-circle",
  "chevron.left": "chevron-left",
  "chevron.down": "chevron-down",
  gearshape: "gear",
} as const satisfies Partial<Record<SymbolViewProps["name"], WebSvgIconName>>;

type IconSymbolName = keyof typeof MAPPING;

/** Crisp inline SVGs on web keep the UI polished without icon-font timeouts. */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle | ViewStyle>;
  weight?: SymbolWeight;
}) {
  return <WebSvgIcon name={MAPPING[name]} size={size} color={color} style={style as StyleProp<ViewStyle>} />;
}
