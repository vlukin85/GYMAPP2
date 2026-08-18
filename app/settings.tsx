import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { cacheAllExercisePhotosOnWifi } from "@/lib/exercise-image-cache";
import { getLocalStorageUsage } from "@/lib/local-storage-usage";
import { formatStorageBytes, getUsagePercent } from "@/lib/storage-usage-utils";
import type { LocalStorageUsage } from "@/lib/local-storage-usage";
import { type OneRepMaxFormula } from "@/lib/workout-data";
import { useWorkoutStore } from "@/lib/workout-store";

const formulas: { id: OneRepMaxFormula; title: string; formula: string; description: string }[] = [
  { id: "epley", title: "Эпли", formula: "Вес × (1 + повторы / 30)", description: "Универсальная оценка для большинства рабочих подходов." },
  { id: "brzycki", title: "Бржицки", formula: "Вес × 36 / (37 − повторы)", description: "Удобна для небольшого числа повторений." },
];

export default function SettingsScreen() {
  const colors = useColors();
  const store = useWorkoutStore();
  const { oneRmFormula, setOneRmFormula, plateStepKg, setPlateStepKg, bodyWeightKg, bodyweightVolumePercent, setBodyweightVolumeSettings } = store;
  const [bodyWeight, setBodyWeight] = useState(String(bodyWeightKg));
  const [bodyPercent, setBodyPercent] = useState(String(bodyweightVolumePercent));
  const [bulkState, setBulkState] = useState({ loading: false, completed: 0, total: 0, message: "Скачивай все фото по Wi‑Fi для просмотра без интернета." });
  const [storageUsage, setStorageUsage] = useState<LocalStorageUsage | null>(null);
  const [storageLoading, setStorageLoading] = useState(true);
  const [storageError, setStorageError] = useState(false);
  const links = [
    { title: "Профиль штанги и блинов", subtitle: "Вес грифа и доступные номиналы", route: "/barbell" as const },
    { title: "Рекомендации следующей тренировки", subtitle: "Рабочий вес с объяснением расчёта", route: "/recommendations" as const },
    { title: "График прогресса 1RM", subtitle: "Изменение силового показателя по датам", route: "/progress" as const },
    { title: "Экспорт истории CSV", subtitle: "Файл для Excel и других таблиц", route: "/export" as const },
    { title: "Импорт истории CSV", subtitle: "Загрузка подходов из других приложений", route: "/import" as const },
    { title: "Сравнение тренировок", subtitle: "Объём, длительность и прогресс 1RM", route: "/compare" as const },
    { title: "Месячный PDF-отчёт", subtitle: "Красивые итоги и таблица подходов", route: "/report" as const },
  ];

  const refreshStorageUsage = useCallback(async () => {
    setStorageLoading(true);
    setStorageError(false);
    try {
      setStorageUsage(await getLocalStorageUsage());
    } catch {
      setStorageError(true);
    } finally {
      setStorageLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStorageUsage();
  }, [refreshStorageUsage]);

  const downloadPhotos = async () => {
    setBulkState((state) => ({ ...state, loading: true, completed: 0, total: 0, message: "Проверяем подключение Wi‑Fi…" }));
    const result = await cacheAllExercisePhotosOnWifi((completed, total) =>
      setBulkState((state) => ({ ...state, completed, total, message: `Загружено ${completed} из ${total} фотографий…` })),
    );
    setBulkState({ loading: false, completed: result.cached, total: result.total, message: result.message });
    refreshStorageUsage();
  };

  const photoProgress = bulkState.total ? Math.min(100, Math.round((bulkState.completed / bulkState.total) * 100)) : 0;
  const appSharePercent = storageUsage ? getUsagePercent(storageUsage.appDataBytes, storageUsage.totalBytes) : 0;
  const deviceUsedBytes = storageUsage?.totalBytes && storageUsage.freeBytes !== null ? Math.max(0, storageUsage.totalBytes - storageUsage.freeBytes) : null;
  const deviceUsedPercent = storageUsage ? getUsagePercent(deviceUsedBytes ?? 0, storageUsage.totalBytes) : 0;
  const appBarWidth = storageUsage?.appDataBytes ? Math.max(2, appSharePercent) : 0;

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]} className="px-5" containerClassName="bg-background">
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={27} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Настройки</Text>
          <View style={{ width: 27 }} />
        </View>

        <Text style={[styles.eyebrow, { color: colors.primary }]}>РАСЧЁТ СИЛЫ</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>Формула 1RM</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Выбор применяется к зонам, истории и личным рекордам.</Text>
        <View style={styles.options}>
          {formulas.map((option) => {
            const selected = option.id === oneRmFormula;
            return (
              <Pressable key={option.id} onPress={() => setOneRmFormula(option.id)} style={[styles.option, { backgroundColor: colors.surface, borderColor: selected ? colors.primary : colors.border }]}>
                <View style={[styles.radio, { borderColor: selected ? colors.primary : colors.muted }]}>{selected && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}</View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionTitle, { color: colors.foreground }]}>{option.title}</Text>
                  <Text style={[styles.optionFormula, { color: colors.primary }]}>{option.formula}</Text>
                  <Text style={[styles.optionDescription, { color: colors.muted }]}>{option.description}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Шаг веса</Text>
        <View style={styles.stepRow}>
          {[1.25, 2.5, 5].map((step) => (
            <Pressable key={step} onPress={() => setPlateStepKg(step)} style={[styles.step, { backgroundColor: plateStepKg === step ? colors.primary : colors.surface, borderColor: plateStepKg === step ? colors.primary : colors.border }]}>
              <Text style={{ color: plateStepKg === step ? "#101412" : colors.foreground, fontWeight: "800" }}>{step} кг</Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Упражнения с весом тела</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Для тоннажа приложение использует заданную долю массы тела: например, приседания или отжимания.</Text>
        <View style={styles.bodyFields}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.fieldLabel, { color: colors.muted }]}>Вес тела, кг</Text>
            <TextInput value={bodyWeight} onChangeText={setBodyWeight} keyboardType="decimal-pad" onEndEditing={() => setBodyweightVolumeSettings(Number(bodyWeight) || bodyWeightKg, Number(bodyPercent) || bodyweightVolumePercent)} style={[styles.field, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.fieldLabel, { color: colors.muted }]}>Учитывать, %</Text>
            <TextInput value={bodyPercent} onChangeText={setBodyPercent} keyboardType="number-pad" onEndEditing={() => setBodyweightVolumeSettings(Number(bodyWeight) || bodyWeightKg, Number(bodyPercent) || bodyweightVolumePercent)} style={[styles.field, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }]} />
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Локальное хранилище</Text>
        <View style={[styles.storageCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.storageHeader}>
            <View style={[styles.storageIcon, { backgroundColor: `${colors.primary}17` }]}>
              <MaterialIcons name="storage" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.storageTitle, { color: colors.foreground }]}>Данные на этом устройстве</Text>
              <Text style={[styles.storageSubtitle, { color: colors.muted }]}>
                {storageLoading ? "Считаем размер тренировок, фото и кэша…" : storageError ? "Не удалось прочитать объём. Попробуйте обновить." : "Тренировки, настройки и офлайн-файлы хранятся только локально."}
              </Text>
            </View>
            <Pressable onPress={refreshStorageUsage} accessibilityLabel="Обновить объём хранилища" style={({ pressed }) => [styles.refreshStorage, { borderColor: colors.border, opacity: pressed ? 0.65 : 1 }]}>
              <MaterialIcons name="refresh" size={19} color={colors.primary} />
            </Pressable>
          </View>

          {storageUsage && !storageLoading && !storageError && (
            <>
              <View style={styles.storageNumbers}>
                <View>
                  <Text style={[styles.storageNumberLabel, { color: colors.muted }]}>ЗАНЯТО ПРИЛОЖЕНИЕМ</Text>
                  <Text style={[styles.storageNumber, { color: colors.foreground }]}>{formatStorageBytes(storageUsage.appDataBytes)}</Text>
                </View>
                <View style={styles.storageNumberRight}>
                  <Text style={[styles.storageNumberLabel, { color: colors.muted }]}>СВОБОДНО НА УСТРОЙСТВЕ</Text>
                  <Text style={[styles.storageFree, { color: colors.primary }]}>{formatStorageBytes(storageUsage.freeBytes)}</Text>
                </View>
              </View>
              <View style={[styles.storageTrack, { backgroundColor: colors.border }]}>
                <View style={[styles.storageDeviceFill, { width: `${deviceUsedPercent}%`, backgroundColor: `${colors.muted}55` }]} />
                <View style={[styles.storageAppFill, { width: `${appBarWidth}%`, backgroundColor: colors.primary }]} />
              </View>
              <View style={styles.storageLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendMark, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.legendText, { color: colors.muted }]}>Приложение: {appSharePercent < 0.1 && storageUsage.appDataBytes ? "<0,1" : appSharePercent.toFixed(1)}%</Text>
                </View>
                <Text style={[styles.legendText, { color: colors.muted }]}>Устройство: {formatStorageBytes(deviceUsedBytes)} / {formatStorageBytes(storageUsage.totalBytes)}</Text>
              </View>
              <View style={[styles.storageBreakdown, { borderTopColor: colors.border }]}>
                <Text style={[styles.breakdownText, { color: colors.muted }]}>Данные тренировок: {formatStorageBytes(storageUsage.asyncStorageBytes)}</Text>
                <Text style={[styles.breakdownText, { color: colors.muted }]}>Файлы и офлайн-фото: {formatStorageBytes(storageUsage.filesBytes)}</Text>
              </View>
            </>
          )}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Офлайн-фотографии</Text>
        <View style={[styles.offlineCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.offlineHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.offlineTitle, { color: colors.foreground }]}>Скачать все ракурсы по Wi‑Fi</Text>
              <Text style={[styles.offlineSubtitle, { color: colors.muted }]}>{bulkState.message}</Text>
            </View>
            <Text style={[styles.offlinePercent, { color: colors.primary }]}>{bulkState.loading || bulkState.total ? `${photoProgress}%` : "Wi‑Fi"}</Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
            <View style={[styles.progressFill, { width: `${photoProgress}%`, backgroundColor: colors.primary }]} />
          </View>
          <Pressable onPress={downloadPhotos} disabled={bulkState.loading} style={[styles.downloadButton, { backgroundColor: colors.primary, opacity: bulkState.loading ? 0.6 : 1 }]}>
            <Text style={styles.downloadText}>{bulkState.loading ? "Загружаем фотографии…" : "Скачать для офлайн-режима"}</Text>
          </Pressable>
          <Text style={[styles.wifiHint, { color: colors.muted }]}>Загрузка запускается только через Wi‑Fi с доступом в интернет. Мобильные данные не используются.</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Данные и инструменты</Text>
        {links.map((link) => (
          <Pressable key={link.route} onPress={() => router.push(link.route as never)} style={[styles.link, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.linkTitle, { color: colors.foreground }]}>{link.title}</Text>
              <Text style={[styles.linkSubtitle, { color: colors.muted }]}>{link.subtitle}</Text>
            </View>
            <IconSymbol name="chevron.right" size={20} color={colors.muted} />
          </Pressable>
        ))}
        <View style={[styles.note, { backgroundColor: colors.surface }]}>
          <IconSymbol name="checkmark.circle" size={20} color={colors.primary} />
          <Text style={[styles.noteText, { color: colors.muted }]}>Тренировки, настройки, рекорды и экспортируемые файлы сохраняются на этом устройстве. Для переноса используйте экспорт в CSV или ZIP.</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 16, paddingBottom: 34, gap: 12 },
  header: { minHeight: 42, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerTitle: { fontSize: 16, fontWeight: "800" },
  eyebrow: { fontSize: 11, fontWeight: "900", letterSpacing: 1.2, marginTop: 10 },
  title: { fontSize: 28, fontWeight: "800", marginTop: 5 },
  subtitle: { fontSize: 13, lineHeight: 20, marginTop: 4 },
  options: { gap: 10, marginTop: 10 },
  option: { borderWidth: 1, borderRadius: 18, padding: 14, flexDirection: "row", gap: 12 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: "center", justifyContent: "center", marginTop: 2 },
  radioDot: { width: 11, height: 11, borderRadius: 6 },
  optionTitle: { fontSize: 16, fontWeight: "800" },
  optionFormula: { fontSize: 12, fontWeight: "800", marginTop: 5 },
  optionDescription: { fontSize: 12, lineHeight: 18, marginTop: 7 },
  sectionTitle: { fontSize: 18, fontWeight: "800", marginTop: 9 },
  stepRow: { flexDirection: "row", gap: 9 },
  step: { flex: 1, minHeight: 44, borderRadius: 13, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  bodyFields: { flexDirection: "row", gap: 9 },
  fieldLabel: { fontSize: 10, fontWeight: "800", marginBottom: 5 },
  field: { height: 48, borderWidth: 1, borderRadius: 13, paddingHorizontal: 12, fontSize: 15, fontWeight: "800" },
  storageCard: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 11 },
  storageHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  storageIcon: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  storageTitle: { fontSize: 14, fontWeight: "800" },
  storageSubtitle: { fontSize: 11, lineHeight: 16, marginTop: 3 },
  refreshStorage: { width: 35, height: 35, borderRadius: 11, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  storageNumbers: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  storageNumberRight: { alignItems: "flex-end" },
  storageNumberLabel: { fontSize: 9, fontWeight: "900", letterSpacing: 0.65 },
  storageNumber: { fontSize: 22, fontWeight: "900", marginTop: 4 },
  storageFree: { fontSize: 15, fontWeight: "900", marginTop: 6 },
  storageTrack: { height: 10, borderRadius: 5, overflow: "hidden", position: "relative" },
  storageDeviceFill: { ...StyleSheet.absoluteFillObject, borderRadius: 5 },
  storageAppFill: { position: "absolute", left: 0, top: 0, bottom: 0, borderRadius: 5 },
  storageLegend: { flexDirection: "row", justifyContent: "space-between", gap: 8, alignItems: "center" },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5, flex: 1 },
  legendMark: { width: 7, height: 7, borderRadius: 4 },
  legendText: { fontSize: 10, lineHeight: 14, textAlign: "right" },
  storageBreakdown: { borderTopWidth: 1, paddingTop: 9, gap: 3 },
  breakdownText: { fontSize: 10, lineHeight: 15 },
  offlineCard: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 11 },
  offlineHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  offlineTitle: { fontSize: 14, fontWeight: "800" },
  offlineSubtitle: { fontSize: 11, lineHeight: 16, marginTop: 4 },
  offlinePercent: { fontSize: 15, fontWeight: "900" },
  progressTrack: { height: 7, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4, minWidth: 0 },
  downloadButton: { minHeight: 46, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  downloadText: { color: "#101412", fontSize: 13, fontWeight: "900" },
  wifiHint: { fontSize: 10, lineHeight: 15 },
  link: { minHeight: 67, borderRadius: 16, borderWidth: 1, padding: 13, flexDirection: "row", alignItems: "center", gap: 9 },
  linkTitle: { fontSize: 14, fontWeight: "800" },
  linkSubtitle: { fontSize: 11, marginTop: 4 },
  note: { borderRadius: 16, padding: 14, flexDirection: "row", gap: 10, marginTop: 6 },
  noteText: { flex: 1, fontSize: 12, lineHeight: 18 },
});
