import React from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import { getAdjacentMainTab } from "@/lib/main-tab-navigation";

type MainTabId = "today" | "calendar" | "exercises" | "programs" | "stats";

export function MainTabSwipe({ current, children }: { current: MainTabId; children: React.ReactNode }) {
  const gesture = Gesture.Pan()
    .activeOffsetX([-32, 32])
    .failOffsetY([-24, 24])
    .onEnd((event) => {
      const destination = getAdjacentMainTab(current, event.translationX);
      if (destination) runOnJS(router.replace)(destination);
    });
  return <GestureDetector gesture={gesture}><View style={{ flex: 1 }}>{children}</View></GestureDetector>;
}
