import React, { useEffect, useRef } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { getAdjacentMainTab, type MainTabId } from "@/lib/main-tab-navigation";

type MainTabRoute = "/(tabs)" | "/(tabs)/calendar" | "/(tabs)/exercises" | "/(tabs)/programs" | "/(tabs)/nutrition" | "/(tabs)/stats" | "/(tabs)/settings";

export function MainTabSwipe({ current, children }: { current: MainTabId; children: React.ReactNode }) {
  const swipeOffset = useSharedValue(0);
  const fade = useSharedValue(1);
  const previousTab = useRef(current);
  const transitionTo = (destination: MainTabRoute, direction: number) => {
    swipeOffset.value = withTiming(direction * -18, { duration: 120 });
    fade.value = withTiming(0.58, { duration: 120 }, () => runOnJS(router.replace)(destination as any));
  };
  useEffect(() => {
    if (previousTab.current === current) return;
    const tabOrder: MainTabId[] = ["today", "calendar", "exercises", "programs", "nutrition", "stats", "settings"];
    const direction = tabOrder.indexOf(current) > tabOrder.indexOf(previousTab.current) ? 1 : -1;
    swipeOffset.value = direction * 18;
    fade.value = 0.58;
    swipeOffset.value = withTiming(0, { duration: 210 });
    fade.value = withTiming(1, { duration: 210 });
    previousTab.current = current;
  }, [current, fade, swipeOffset]);
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
