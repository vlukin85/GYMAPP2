import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { ComponentProps } from "react";
import type { OpaqueColorValue, StyleProp, TextStyle } from "react-native";

export type SafeMaterialIconName = ComponentProps<typeof MaterialIcons>["name"];

export function SafeMaterialIcon({
  name,
  size = 24,
  color,
  style,
}: {
  name: SafeMaterialIconName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
}) {
  return <MaterialIcons name={name} size={size} color={color} style={style} />;
}
