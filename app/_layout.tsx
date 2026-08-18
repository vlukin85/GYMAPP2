import "@/global.css";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { Platform } from "react-native";
import "@/lib/_core/nativewind-pressable";
import { ThemeProvider } from "@/lib/theme-provider";
import { WorkoutReplacementOverlay } from "@/components/workout-replacement-overlay";
import { ReleaseNotesOverlay } from "@/components/release-notes-overlay";
import { StartupErrorBoundary } from "@/components/startup-error-boundary";
import { WorkoutProvider } from "@/lib/workout-store";
import {
  SafeAreaFrameContext,
  SafeAreaInsetsContext,
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import type { EdgeInsets, Metrics, Rect } from "react-native-safe-area-context";

import { subscribeSafeAreaInsets } from "@/lib/_core/manus-runtime";
import { beginLaunchDiagnostics, completeLaunchDiagnostics, recordStartupChecks } from "@/lib/launch-diagnostics";

SplashScreen.setOptions({ duration: 700, fade: true });

const DEFAULT_WEB_INSETS: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const DEFAULT_WEB_FRAME: Rect = { x: 0, y: 0, width: 0, height: 0 };

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const initialInsets = initialWindowMetrics?.insets ?? DEFAULT_WEB_INSETS;
  const initialFrame = initialWindowMetrics?.frame ?? DEFAULT_WEB_FRAME;

  const [insets, setInsets] = useState<EdgeInsets>(initialInsets);
  const [frame, setFrame] = useState<Rect>(initialFrame);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    void (async () => {
      const launchId = await beginLaunchDiagnostics();
      await recordStartupChecks();
      if (!cancelled) timer = setTimeout(() => void completeLaunchDiagnostics(launchId), 1200);
    })();
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, []);

  const handleSafeAreaUpdate = useCallback((metrics: Metrics) => {
    setInsets(metrics.insets);
    setFrame(metrics.frame);
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const unsubscribe = subscribeSafeAreaInsets(handleSafeAreaUpdate);
    return () => unsubscribe();
  }, [handleSafeAreaUpdate]);

  // Ensure minimum 8px padding for top and bottom on mobile
  const providerInitialMetrics = useMemo(() => {
    const metrics = initialWindowMetrics ?? { insets: initialInsets, frame: initialFrame };
    return {
      ...metrics,
      insets: {
        ...metrics.insets,
        top: Math.max(metrics.insets.top, 16),
        bottom: Math.max(metrics.insets.bottom, 12),
      },
    };
  }, [initialInsets, initialFrame]);

  const content = (
    <GestureHandlerRootView style={{ flex: 1 }}>
          {/* Default to hiding native headers so raw route segments don't appear (e.g. "(tabs)", "products/[id]"). */}
          {/* If a screen needs the native header, explicitly enable it and set a human title via Stack.Screen options. */}
          {/* in order for ios apps tab switching to work properly, use presentation: "fullScreenModal" for login page, whenever you decide to use presentation: "modal*/}
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="oauth/callback" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="barbell" />
            <Stack.Screen name="progress" />
            <Stack.Screen name="export" />
            <Stack.Screen name="import" />
            <Stack.Screen name="compare" />
            <Stack.Screen name="recommendations" />
            <Stack.Screen name="report" />
            <Stack.Screen name="workout" />
            <Stack.Screen name="calendar" />
            <Stack.Screen name="profile" />
            <Stack.Screen name="replace-exercise" />
            <Stack.Screen name="program/ai" />
            <Stack.Screen name="dev/services" />
            <Stack.Screen name="diagnostics" />
          </Stack>
          <WorkoutReplacementOverlay />
          <ReleaseNotesOverlay />
          <StatusBar style="auto" />
    </GestureHandlerRootView>
  );

  const shouldOverrideSafeArea = Platform.OS === "web";

  if (shouldOverrideSafeArea) {
    return (
      <StartupErrorBoundary><ThemeProvider>
        <WorkoutProvider>
        <SafeAreaProvider initialMetrics={providerInitialMetrics}>
          <SafeAreaFrameContext.Provider value={frame}>
            <SafeAreaInsetsContext.Provider value={insets}>
              {content}
            </SafeAreaInsetsContext.Provider>
          </SafeAreaFrameContext.Provider>
        </SafeAreaProvider>
        </WorkoutProvider>
      </ThemeProvider></StartupErrorBoundary>
    );
  }

  return (
    <StartupErrorBoundary><ThemeProvider>
      <WorkoutProvider>
        <SafeAreaProvider initialMetrics={providerInitialMetrics}>{content}</SafeAreaProvider>
      </WorkoutProvider>
    </ThemeProvider></StartupErrorBoundary>
  );
}
