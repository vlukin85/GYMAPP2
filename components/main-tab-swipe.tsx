import React from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { getAdjacentMainTab } from "@/lib/main-tab-navigation";

type MainTabId = "today" | "calendar" | "exercises" | "programs" | "stats";
type MainTabRoute = "/(tabs)" | "/(tabs)/calendar" | "/(tabs)/exercises" | "/(tabs)/programs" | "/(tabs)/stats";

export function MainTabSwipe({ current, children }: { current: MainTabId; children: React.ReactNode }) {
  const swipeOffset = useSharedValue(0);
  const fade = useSharedValue(1);
  const transitionTo = (destination: MainTabRoute, direction: number) => {
    swipeOffset.value = withTiming(direction * -18, { duration: 120 });
    fade.value = withTiming(0.58, { duration: 120 }, () => runOnJS(router.replace)(destination));
  };
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ translateX: swipeOffset.value }], opacity: fade.value }));
  const gesture = Gesture.Pan()
    .activeOffsetX([-32, 32])
    .failOffsetY([-24, 24])
    .onEnd((event) => {
      const destination = getAdjacentMainTab(current, event.translationX);
      if (destination) runOnJS(transitionTo)(destination as MainTabRoute, event.translationX < 0 ? -1 : 1);
    });
  return <GestureDetector gesture={gesture}><Animated.View style={[{ flex: 1 }, animatedStyle]}>{children}</Animated.View></GestureDetector>;
}
