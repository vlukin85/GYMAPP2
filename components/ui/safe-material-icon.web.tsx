import type { OpaqueColorValue, StyleProp, TextStyle, ViewStyle } from "react-native";
import { WebSvgIcon, type WebSvgIconName } from "./web-svg-icon";

const MAPPING: Record<string, WebSvgIconName> = {
  "add-circle": "add-circle",
  "add-circle-outline": "add-circle",
  "auto-awesome": "auto-awesome",
  check: "check",
  "delete-outline": "delete",
  "drag-handle": "drag-handle",
  "open-with": "move",
  refresh: "refresh",
  south: "south",
  storage: "storage",
};

/** Browser counterpart of Material Icons implemented as font-free inline SVG. */
export function SafeMaterialIcon({
  name,
  size = 24,
  color,
  style,
}: {
  name: string;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle | ViewStyle>;
}) {
  return <WebSvgIcon name={MAPPING[name] ?? "check"} size={size} color={color} style={style as StyleProp<ViewStyle>} />;
}
