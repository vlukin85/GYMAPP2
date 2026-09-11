import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

type CompanionMode = "idle" | "set" | "rest" | "sync";

const modeLabels: Record<CompanionMode, string> = {
  idle: "ОЖИДАНИЕ",
  set: "ПОДХОД",
  rest: "ОТДЫХ",
  sync: "СИНХРОНИЗАЦИЯ",
};

const modeDescriptions: Record<CompanionMode, string> = {
  idle: "Пульт готов получить активную тренировку с телефона",
  set: "Одно действие — завершить текущий подход",
  rest: "Таймер отдыха запущен после завершения подхода",
  sync: "Состояние тренировки передаётся в IronRise",
};

export default function CompanionPrototypeScreen() {
  const colors = useColors();
  const [mode, setMode] = useState<CompanionMode>("idle");
  const [isConnected, setIsConnected] = useState(false);

  const accent = mode === "rest" ? colors.warning : colors.primary;
  const watchStatus = useMemo(
    () => (isConnected ? "IRONRISE • ПОДКЛЮЧЕНО" : "IRONRISE • НЕ ПОДКЛЮЧЕНО"),
    [isConnected],
  );

  const handlePrimaryAction = () => {
    if (mode === "idle") {
      setIsConnected(true);
      setMode("set");
      return;
    }
    if (mode === "set") {
      setMode("rest");
      return;
    }
    if (mode === "rest") {
      setMode("set");
      return;
    }
    setIsConnected(true);
    setMode("set");
  };

  return (
    <ScreenContainer className="p-5" edges={["top", "left", "right", "bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text className="text-xs font-black tracking-widest text-primary">
              IRONRISE / WATCH COMPANION
            </Text>
            <Text className="mt-2 text-3xl font-black text-foreground">
              Пульт тренировки
            </Text>
            <Text className="mt-2 max-w-xl text-sm leading-5 text-muted">
              Первый прототип интерфейса для Huawei Watch GT 6: крупные действия,
              минимум навигации и управление одной рукой.
            </Text>
          </View>
          <View
            style={[
              styles.connectionPill,
              {
                borderColor: isConnected ? colors.success : colors.border,
                backgroundColor: isConnected
                  ? `${colors.success}16`
                  : colors.surface,
              },
            ]}
          >
            <View
              style={[
                styles.connectionDot,
                { backgroundColor: isConnected ? colors.success : colors.muted },
              ]}
            />
            <Text
              style={{
                color: isConnected ? colors.success : colors.muted,
                fontSize: 11,
                fontWeight: "900",
                letterSpacing: 0.5,
              }}
            >
              {isConnected ? "CONNECTED" : "OFFLINE"}
            </Text>
          </View>
        </View>

        <View style={styles.workspace}>
          <View
            style={[
              styles.watchFrame,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={[styles.watchCrown, { backgroundColor: colors.border }]} />
            <View
              style={[
                styles.watchFace,
                { backgroundColor: "#0B0D10", borderColor: `${accent}55` },
              ]}
            >
              <View style={styles.watchTopline}>
                <Text style={styles.watchTiny}>{modeLabels[mode]}</Text>
                <Text style={styles.watchTiny}>09:41</Text>
              </View>

              {mode === "idle" && (
                <View style={styles.watchCenter}>
                  <Text style={styles.watchEyebrow}>СЛЕДУЮЩАЯ</Text>
                  <Text style={styles.watchExercise}>Жим лёжа</Text>
                  <Text style={[styles.watchMetric, { color: accent }]}>4 × 8</Text>
                  <Text style={styles.watchHint}>Нажмите старт на часах</Text>
                </View>
              )}

              {mode === "set" && (
                <View style={styles.watchCenter}>
                  <Text style={styles.watchEyebrow}>УПРАЖНЕНИЕ 01</Text>
                  <Text style={styles.watchExercise}>Жим лёжа</Text>
                  <Text style={[styles.watchMetric, { color: accent }]}>СЕТ 2 / 4</Text>
                  <View style={styles.watchStats}>
                    <Text style={styles.watchStat}>80 кг</Text>
                    <Text style={styles.watchStat}>8 повторов</Text>
                  </View>
                </View>
              )}

              {mode === "rest" && (
                <View style={styles.watchCenter}>
                  <Text style={[styles.watchEyebrow, { color: colors.warning }]}>ОТДЫХ</Text>
                  <Text style={[styles.restTimer, { color: colors.warning }]}>01:24</Text>
                  <Text style={styles.watchExercise}>Следующий: сет 3</Text>
                  <Text style={styles.watchHint}>Вибрация за 10 секунд</Text>
                </View>
              )}

              {mode === "sync" && (
                <View style={styles.watchCenter}>
                  <Text style={styles.watchEyebrow}>СВЯЗЬ</Text>
                  <Text style={styles.syncIcon}>↕</Text>
                  <Text style={styles.watchExercise}>Синхронизация</Text>
                  <Text style={styles.watchHint}>Состояние сохранено в телефоне</Text>
                </View>
              )}

              <Pressable
                onPress={handlePrimaryAction}
                style={({ pressed }) => [
                  styles.watchAction,
                  {
                    backgroundColor: accent,
                    transform: [{ scale: pressed ? 0.96 : 1 }],
                  },
                ]}
              >
                <Text style={styles.watchActionText}>
                  {mode === "idle"
                    ? "СТАРТ"
                    : mode === "set"
                      ? "ЗАВЕРШИТЬ"
                      : mode === "rest"
                        ? "ПРОПУСТИТЬ"
                        : "ПРОДОЛЖИТЬ"}
                </Text>
              </Pressable>
            </View>
            <View style={[styles.watchButton, { backgroundColor: colors.border }]} />
          </View>

          <View style={styles.controlPanel}>
            <View
              style={[
                styles.panelCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text className="text-xs font-black tracking-widest text-muted">
                СОСТОЯНИЕ ПУЛЬТА
              </Text>
              <Text className="mt-2 text-lg font-black text-foreground">
                {modeLabels[mode]}
              </Text>
              <Text className="mt-1 text-sm leading-5 text-muted">
                {modeDescriptions[mode]}
              </Text>
              <Text className="mt-4 text-xs font-semibold text-muted">
                {watchStatus}
              </Text>
            </View>

            <View style={styles.modeGrid}>
              {(Object.keys(modeLabels) as CompanionMode[]).map((option) => {
                const selected = option === mode;
                return (
                  <Pressable
                    key={option}
                    onPress={() => setMode(option)}
                    style={({ pressed }) => [
                      styles.modeButton,
                      {
                        backgroundColor: selected ? `${colors.primary}18` : colors.surface,
                        borderColor: selected ? colors.primary : colors.border,
                        opacity: pressed ? 0.72 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: selected ? colors.primary : colors.foreground,
                        fontSize: 12,
                        fontWeight: "900",
                      }}
                    >
                      {modeLabels[option]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={() => setIsConnected((value) => !value)}
              style={({ pressed }) => [
                styles.secondaryAction,
                {
                  borderColor: isConnected ? colors.success : colors.border,
                  backgroundColor: colors.surface,
                  opacity: pressed ? 0.72 : 1,
                },
              ]}
            >
              <Text
                style={{
                  color: isConnected ? colors.success : colors.foreground,
                  fontSize: 13,
                  fontWeight: "900",
                }}
              >
                {isConnected ? "Отключить часы" : "Симулировать подключение"}
              </Text>
            </Pressable>
          </View>
        </View>

        <View
          style={[
            styles.contractCard,
            { backgroundColor: `${colors.primary}10`, borderColor: `${colors.primary}44` },
          ]}
        >
          <Text className="text-xs font-black tracking-widest text-primary">
            КОНТРАКТ ПУЛЬТА
          </Text>
          <Text className="mt-2 text-sm leading-5 text-foreground">
            Телефон хранит программу и историю. Часы получают только активное
            состояние, отправляют команды «старт / завершить / пропустить отдых»
            и возвращают подтверждение синхронизации.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 20,
    paddingBottom: 32,
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 16,
    justifyContent: "space-between",
  },
  connectionPill: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  connectionDot: {
    borderRadius: 999,
    height: 7,
    width: 7,
  },
  workspace: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 24,
  },
  watchFrame: {
    alignItems: "center",
    borderRadius: 58,
    borderWidth: 1,
    minHeight: 474,
    paddingHorizontal: 16,
    paddingVertical: 22,
    width: 286,
  },
  watchCrown: {
    borderRadius: 8,
    height: 38,
    position: "absolute",
    right: -8,
    top: 112,
    width: 10,
  },
  watchFace: {
    borderRadius: 112,
    borderWidth: 2,
    flex: 1,
    minHeight: 410,
    overflow: "hidden",
    padding: 22,
    width: 250,
  },
  watchTopline: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  watchTiny: {
    color: "#A2ABB6",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
  },
  watchCenter: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  watchEyebrow: {
    color: "#A2ABB6",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  watchExercise: {
    color: "#F3F5F7",
    fontSize: 19,
    fontWeight: "900",
    marginTop: 8,
    textAlign: "center",
  },
  watchMetric: {
    fontSize: 27,
    fontWeight: "900",
    marginTop: 12,
  },
  watchStats: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  watchStat: {
    color: "#C8CFD7",
    fontSize: 10,
    fontWeight: "800",
  },
  watchHint: {
    color: "#7F8994",
    fontSize: 10,
    marginTop: 10,
    textAlign: "center",
  },
  restTimer: {
    fontSize: 43,
    fontWeight: "900",
    letterSpacing: 1,
    marginTop: 14,
  },
  syncIcon: {
    color: "#F3F5F7",
    fontSize: 38,
    fontWeight: "900",
    marginTop: 16,
  },
  watchAction: {
    alignItems: "center",
    borderRadius: 999,
    minWidth: 142,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  watchActionText: {
    color: "#0B0D10",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  watchButton: {
    borderRadius: 8,
    height: 54,
    marginRight: -32,
    position: "absolute",
    right: 0,
    top: 224,
    width: 8,
  },
  controlPanel: {
    flex: 1,
    gap: 12,
    minWidth: 280,
  },
  panelCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
  },
  modeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  modeButton: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  secondaryAction: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  contractCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
  },
});
