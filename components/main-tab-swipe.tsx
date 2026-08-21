import React, { useEffect, useRef } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import {
  getAdjacentMainTab,
  type MainTabId,
  type MainTabRoute,
} from "@/lib/main-tab-navigation";

export function MainTabSwipe({
  current,
  visibleTabs,
  children,
}: {
  current: MainTabId;
  visibleTabs: readonly MainTabId[];
  children: React.ReactNode;
}) {
  const swipeOffset = useSharedValue(0);
  const fade = useSharedValue(1);
  const previousTab = useRef(current);
  const transitionTo = (destination: MainTabRoute, direction: number) => {
    swipeOffset.value = withTiming(direction * -18, { duration: 120 });
    fade.value = withTiming(0.58, { duration: 120 }, () =>
      runOnJS(router.replace)(destination as any),
    );
  };
  useEffect(() => {
    if (previousTab.current === current) return;
    const direction =
      visibleTabs.indexOf(current) > visibleTabs.indexOf(previousTab.current)
        ? 1
        : -1;
    swipeOffset.value = direction * 18;
    fade.value = 0.58;
    swipeOffset.value = withTiming(0, { duration: 210 });
    fade.value = withTiming(1, { duration: 210 });
    previousTab.current = current;
  }, [current, fade, swipeOffset, visibleTabs]);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: swipeOffset.value }],
    opacity: fade.value,
  }));
  const gesture = Gesture.Pan()
    .activeOffsetX([-32, 32])
    .failOffsetY([-24, 24])
    .onEnd((event) => {
      const destination = getAdjacentMainTab(
        current,
        event.translationX,
        visibleTabs,
      );
      if (destination)
        runOnJS(transitionTo)(destination, event.translationX < 0 ? -1 : 1);
    });
  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[{ flex: 1 }, animatedStyle]}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
}
