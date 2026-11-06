import { PropsWithChildren, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { minTouchTarget, pressedOpacity, radius, type as typeScale } from "@/lib/design-tokens";

export function Collapsible({ children, title }: PropsWithChildren & { title: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const colors = useColors();

  return (
    <View className="bg-background">
      <TouchableOpacity
        className="flex-row items-center gap-1.5"
        style={{
          minHeight: minTouchTarget,
          borderRadius: radius.tile,
          paddingHorizontal: 4,
        }}
        onPress={() => setIsOpen((value) => !value)}
        activeOpacity={pressedOpacity}
      >
        <IconSymbol
          name="chevron.right"
          size={18}
          weight="medium"
          color={colors.icon}
          style={{ transform: [{ rotate: isOpen ? "90deg" : "0deg" }] }}
        />
        <Text style={[typeScale.heading, { color: colors.foreground }]}>{title}</Text>
      </TouchableOpacity>
      {isOpen && <View className="mt-1.5 ml-6">{children}</View>}
    </View>
  );
}
