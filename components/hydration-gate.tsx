import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, View, useColorScheme } from "react-native";
import { useBodyStore } from "@/lib/body-store";
import { useNutritionStore } from "@/lib/nutrition-store";
import { useWorkoutStore } from "@/lib/workout-store";
import { recordLaunchDiagnostic } from "@/lib/launch-diagnostics";

// Гидрация не должна удерживать стартовый экран дольше 2,5 с:
// если AsyncStorage завис или хранилище не ответило, приложение
// всё равно открывается (со значениями по умолчанию).
const HYDRATION_TIMEOUT_MS = 2500;

export const HYDRATION_GATE_TIMEOUT_MS = HYDRATION_TIMEOUT_MS;

const SPLASH_FULL_DARK = require("@/assets/images/splash-full-dark.png");
const SPLASH_FULL_LIGHT = require("@/assets/images/splash-full-light.png");

/**
 * Стартовый экран инициализации: полнокадровый арт с атлетом и надписью
 * IRONRISE внизу (тёмный/светлый вариант по системной теме). Закрывает
 * интерфейс, пока AsyncStorage-загрузки основных хранилищ не заполнены.
 * Не блокирует запуск навсегда — по таймауту приложение открывается
 * в любом случае.
 */
export function HydrationGate() {
  const { ready: workoutReady } = useWorkoutStore();
  const { ready: nutritionReady } = useNutritionStore();
  const { ready: bodyReady } = useBodyStore();
  const colorScheme = useColorScheme();
  const [timedOut, setTimedOut] = useState(false);
  const loggedStage = useRef<"pending" | "ready" | "timeout">("pending");

  const hydrated = workoutReady && nutritionReady && bodyReady;
  const visible = !hydrated && !timedOut;
  const dark = colorScheme !== "light";

  useEffect(() => {
    if (hydrated || timedOut) return;
    const timer = setTimeout(() => {
      setTimedOut(true);
      void recordLaunchDiagnostic(
        "Гидрация хранилищ превысила таймаут, запуск продолжен",
        "warning",
        `Ждали ${HYDRATION_TIMEOUT_MS} мс`,
      ).catch(() => undefined);
    }, HYDRATION_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [hydrated, timedOut]);

  useEffect(() => {
    if (!hydrated || loggedStage.current !== "pending") return;
    loggedStage.current = "ready";
    void recordLaunchDiagnostic("Гидрация хранилищ завершена", "info").catch(
      () => undefined,
    );
  }, [hydrated]);

  if (!visible) return null;

  return (
    <View
      style={[styles.overlay, dark ? null : styles.overlayLight]}
      pointerEvents="auto"
    >
      <Image
        source={dark ? SPLASH_FULL_DARK : SPLASH_FULL_LIGHT}
        resizeMode="contain"
        style={styles.art}
      />
      <ActivityIndicator
        color={dark ? "#C8F169" : "#0F7B5A"}
        style={styles.loader}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0B0F0D",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
    elevation: 50,
  },
  overlayLight: {
    backgroundColor: "#F7F7F5",
  },
  art: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  loader: {
    position: "absolute",
    bottom: 28,
  },
});
