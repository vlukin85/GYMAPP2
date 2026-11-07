import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useBodyStore } from "@/lib/body-store";
import { useNutritionStore } from "@/lib/nutrition-store";
import { useWorkoutStore } from "@/lib/workout-store";
import { recordLaunchDiagnostic } from "@/lib/launch-diagnostics";

// Гидрация не должна удерживать стартовый экран дольше 2,5 с:
// если AsyncStorage завис или хранилище не ответило, приложение
// всё равно открывается (со значениями по умолчанию).
const HYDRATION_TIMEOUT_MS = 2500;

export const HYDRATION_GATE_TIMEOUT_MS = HYDRATION_TIMEOUT_MS;

/**
 * Лёгкий оверлей инициализации: закрывает интерфейс, пока AsyncStorage-загрузки
 * основных хранилищ (тренировки, питание, тело) не заполнены. Не блокирует
 * запуск навсегда — по таймауту приложение открывается в любом случае.
 */
export function HydrationGate() {
  const { ready: workoutReady } = useWorkoutStore();
  const { ready: nutritionReady } = useNutritionStore();
  const { ready: bodyReady } = useBodyStore();
  const [timedOut, setTimedOut] = useState(false);
  const loggedStage = useRef<"pending" | "ready" | "timeout">("pending");

  const hydrated = workoutReady && nutritionReady && bodyReady;
  const visible = !hydrated && !timedOut;

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
    <View style={styles.overlay} pointerEvents="auto">
      <ActivityIndicator color="#C8F169" />
      <Text style={styles.eyebrow}>IRONRISE</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0B0F0D",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    zIndex: 50,
    elevation: 50,
  },
  eyebrow: {
    color: "rgba(200, 241, 105, 0.72)",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 4,
  },
});
