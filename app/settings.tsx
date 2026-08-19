import { useCallback, useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { SafeMaterialIcon } from "@/components/ui/safe-material-icon";
import { useColors } from "@/hooks/use-colors";
import { APP_COLOR_THEMES } from "@/lib/app-color-themes";
import { INTERFACE_DENSITY_PRESETS } from "@/lib/interface-density";
import { useInterfaceDensity } from "@/lib/interface-density-provider";
import { useThemeContext } from "@/lib/theme-provider";
import { SVG_ICON_THEMES, useSvgIconTheme } from "@/lib/svg-icon-theme";
import { cacheAllExercisePhotosOnWifi } from "@/lib/exercise-image-cache";
import { getLocalStorageUsage } from "@/lib/local-storage-usage";
import { formatStorageBytes, getUsagePercent } from "@/lib/storage-usage-utils";
import type { LocalStorageUsage } from "@/lib/local-storage-usage";
import { clearGroqApiKey, getGroqApiKey, saveGroqApiKey } from "@/lib/groq-settings";
import { type OneRepMaxFormula } from "@/lib/workout-data";
import { type SetHapticIntensity, useWorkoutStore } from "@/lib/workout-store";
import { useNutritionStore } from "@/lib/nutrition-store";

const formulas: { id: OneRepMaxFormula; title: string; formula: string; description: string }[] = [
  { id: "epley", title: "Эпли", formula: "Вес × (1 + повторы / 30)", description: "Универсальная оценка для большинства рабочих подходов." },
  { id: "brzycki", title: "Бржицки", formula: "Вес × 36 / (37 − повторы)", description: "Удобна для небольшого числа повторений." },
];

const hapticIntensityOptions: { id: SetHapticIntensity; title: string; description: string }[] = [
  { id: "light", title: "Лёгкая", description: "Короткое деликатное подтверждение" },
  { id: "medium", title: "Средняя", description: "Более заметный отклик" },
  { id: "heavy", title: "Сильная", description: "Выраженное подтверждение" },
];
const primaryThemeChoices = APP_COLOR_THEMES.filter((theme) => theme.id === "editorial" || theme.id === "orchid");

export default function SettingsScreen() {
  const colors = useColors();
  const store = useWorkoutStore();
  const { theme: svgIconTheme, setThemeId } = useSvgIconTheme();
  const { themeId: appThemeId, setThemeId: setAppThemeId } = useThemeContext();
  const { density, setDensity } = useInterfaceDensity();
  const { dailyCalorieGoal, dailyMacroGoals, setDailyCalorieGoal, setDailyMacroGoals } = useNutritionStore();
  const { oneRmFormula, setOneRmFormula, plateStepKg, setPlateStepKg, bodyWeightKg, bodyweightVolumePercent, setBodyweightVolumeSettings, hapticIntensity, setHapticIntensity, restTimerSoundEnabled, setRestTimerSoundEnabled, restTimerVibrationEnabled, setRestTimerVibrationEnabled, notificationsEnabled, defaultWorkoutTime, defaultReminderMinutes, setNotificationPreferences } = store;
  const [bodyWeight, setBodyWeight] = useState(String(bodyWeightKg));
  const [bodyPercent, setBodyPercent] = useState(String(bodyweightVolumePercent));
  const [notificationTime, setNotificationTime] = useState(defaultWorkoutTime);
  const [calorieGoalDraft, setCalorieGoalDraft] = useState(String(dailyCalorieGoal));
  const [macroGoalDrafts, setMacroGoalDrafts] = useState({ protein: String(dailyMacroGoals.protein), fat: String(dailyMacroGoals.fat), carbs: String(dailyMacroGoals.carbs) });
  const [bulkState, setBulkState] = useState({ loading: false, completed: 0, total: 0, message: "Скачивай все фото по Wi‑Fi для просмотра без интернета." });
  const [storageUsage, setStorageUsage] = useState<LocalStorageUsage | null>(null);
  const [storageLoading, setStorageLoading] = useState(true);
  const [storageError, setStorageError] = useState(false);
  const [hasGroqKey, setHasGroqKey] = useState(false);
  const [keySheetVisible, setKeySheetVisible] = useState(false);
  const [keyDraft, setKeyDraft] = useState("");
  const [savingGroqKey, setSavingGroqKey] = useState(false);
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
    void getGroqApiKey().then((key) => setHasGroqKey(Boolean(key))).catch(() => setHasGroqKey(false));
  }, [refreshStorageUsage]);
  useEffect(() => { setNotificationTime(defaultWorkoutTime); }, [defaultWorkoutTime]);
  useEffect(() => { setCalorieGoalDraft(String(dailyCalorieGoal)); }, [dailyCalorieGoal]);
  useEffect(() => { setMacroGoalDrafts({ protein: String(dailyMacroGoals.protein), fat: String(dailyMacroGoals.fat), carbs: String(dailyMacroGoals.carbs) }); }, [dailyMacroGoals]);

  const openGroqKeySheet = () => {
    setKeyDraft("");
    setKeySheetVisible(true);
  };
  const saveGroqKey = async () => {
    setSavingGroqKey(true);
    try {
      await saveGroqApiKey(keyDraft);
      setHasGroqKey(true);
      setKeyDraft("");
      setKeySheetVisible(false);
    } catch (error) {
      Alert.alert("Не удалось сохранить ключ", error instanceof Error ? error.message : "Повтори попытку.");
    } finally {
      setSavingGroqKey(false);
    }
  };
  const deleteGroqKey = () => Alert.alert("Удалить личный ключ Groq?", "ИИ-режим станет недоступен, пока ты не добавишь новый ключ.", [
    { text: "Отмена", style: "cancel" },
    { text: "Удалить", style: "destructive", onPress: () => { void clearGroqApiKey().then(() => setHasGroqKey(false)).catch(() => Alert.alert("Не удалось удалить ключ", "Повтори попытку.")); } },
  ]);

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
  const saveMacroGoals = () => { const goals = { protein: Number(macroGoalDrafts.protein), fat: Number(macroGoalDrafts.fat), carbs: Number(macroGoalDrafts.carbs) }; if ([goals.protein, goals.fat, goals.carbs].every((value) => Number.isFinite(value) && value >= 0)) setDailyMacroGoals(goals); else setMacroGoalDrafts({ protein: String(dailyMacroGoals.protein), fat: String(dailyMacroGoals.fat), carbs: String(dailyMacroGoals.carbs) }); };

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

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Стиль интерфейса</Text>
        <View style={[styles.appThemeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={[styles.iconThemeTitle, { color: colors.foreground }]}>Editorial или Orchid Voltage</Text>
          <Text style={[styles.iconThemeHint, { color: colors.muted }]}>Переключайте основной визуальный характер приложения одним нажатием. Выбор сохранится на устройстве.</Text>
          <View style={styles.appThemeGrid}>{primaryThemeChoices.map((theme) => { const selected = theme.id === appThemeId; return <Pressable key={theme.id} onPress={() => setAppThemeId(theme.id)} style={({ pressed }) => [styles.appThemeOption, { backgroundColor: selected ? theme.swatch : colors.background, borderColor: selected ? theme.swatch : colors.border, opacity: pressed ? 0.72 : 1 }]}><View style={[styles.appThemeSwatch, { backgroundColor: selected ? colors.surface : theme.swatch }]} /><View style={{ flex: 1 }}><Text style={[styles.appThemeName, { color: selected ? colors.surface : colors.foreground }]}>{theme.id === "editorial" ? "EDITORIAL" : "ORCHID VOLTAGE"}</Text><Text style={[styles.appThemeHint, { color: selected ? `${colors.surface}CC` : colors.muted }]}>{theme.id === "editorial" ? "Строгая редакционная сетка" : "Мягкие фиолетовые поверхности"}</Text></View>{selected && <IconSymbol name="checkmark" size={17} color={colors.surface} />}</Pressable>; })}</View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Плотность интерфейса</Text>
        <View style={[styles.densityCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={[styles.iconThemeTitle, { color: colors.foreground }]}>Размер текста и расстояние между блоками</Text>
          <Text style={[styles.iconThemeHint, { color: colors.muted }]}>Выберите представление, которое комфортнее для тренировок и чтения статистики.</Text>
          <View style={styles.densityOptions}>{INTERFACE_DENSITY_PRESETS.map((option) => { const selected = density === option.id; return <Pressable key={option.id} onPress={() => setDensity(option.id)} style={({ pressed }) => [styles.densityOption, { backgroundColor: selected ? colors.primary : colors.background, borderColor: selected ? colors.primary : colors.border, opacity: pressed ? 0.72 : 1 }]}><Text style={[styles.densitySample, { color: selected ? colors.surface : colors.foreground, fontSize: option.id === "large" ? 24 : 18 }]}>Aa</Text><View style={{ flex: 1 }}><Text style={[styles.appThemeName, { color: selected ? colors.surface : colors.foreground }]}>{option.title}</Text><Text style={[styles.appThemeHint, { color: selected ? `${colors.surface}CC` : colors.muted }]}>{option.hint}</Text></View>{selected && <IconSymbol name="checkmark" size={17} color={colors.surface} />}</Pressable>; })}</View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Питание</Text>
        <View style={[styles.densityCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={[styles.iconThemeTitle, { color: colors.foreground }]}>Дневные цели калорий и БЖУ</Text>
          <Text style={[styles.iconThemeHint, { color: colors.muted }]}>Плановый калораж за сутки и цели БЖУ сохраняются на устройстве и используются в визуальном прогрессе дневника питания.</Text>
          <Text style={[styles.fieldLabel, { color: colors.muted }]}>Цель, ккал</Text>
          <TextInput value={calorieGoalDraft} onChangeText={setCalorieGoalDraft} onEndEditing={() => { const value = Number(calorieGoalDraft); if (Number.isFinite(value) && value > 0) setDailyCalorieGoal(value); else setCalorieGoalDraft(String(dailyCalorieGoal)); }} keyboardType="number-pad" placeholder="2200" placeholderTextColor={colors.muted} style={[styles.field, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} />
          <View style={styles.macroGoalRow}>{([['protein', 'Белки, г', '150'], ['fat', 'Жиры, г', '70'], ['carbs', 'Углеводы, г', '250']] as const).map(([key, label, placeholder]) => <View key={key} style={styles.macroGoalField}><Text style={[styles.fieldLabel, { color: colors.muted }]}>{label}</Text><TextInput value={macroGoalDrafts[key]} onChangeText={(value) => setMacroGoalDrafts((current) => ({ ...current, [key]: value }))} onEndEditing={saveMacroGoals} keyboardType="number-pad" placeholder={placeholder} placeholderTextColor={colors.muted} style={[styles.field, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} /></View>)}</View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>SVG-иконки</Text>
        <View style={[styles.iconThemeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.iconThemeTitle, { color: colors.foreground }]}>Цвет интерфейсных иконок</Text>
          <Text style={[styles.iconThemeHint, { color: colors.muted }]}>Меняет акцентные SVG-иконки в web-версии без повторной загрузки шрифтов.</Text>
        <View style={styles.iconThemeOptions}>
            {SVG_ICON_THEMES.map((theme) => {
              const selected = theme.id === svgIconTheme.id;
              return (
                <Pressable key={theme.id} onPress={() => setThemeId(theme.id)} style={({ pressed }) => [styles.iconThemeOption, { borderColor: selected ? theme.color : colors.border, backgroundColor: selected ? `${theme.color}16` : colors.background, opacity: pressed ? 0.7 : 1 }]}>
                  <View style={[styles.iconThemeSwatch, { backgroundColor: theme.color }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.iconThemeOptionTitle, { color: colors.foreground }]}>{theme.title}</Text>
                    <Text style={[styles.iconThemeOptionHint, { color: colors.muted }]}>{theme.description}</Text>
                  </View>
                  {selected && <IconSymbol name="checkmark" size={18} color={theme.color} />}
                </Pressable>
              );
            })}
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Таймер отдыха</Text>
        <View style={[styles.restSoundCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <View style={{ flex: 1 }}><Text style={[styles.vibrationTitle, { color: colors.foreground }]}>Звук окончания отдыха</Text><Text style={[styles.vibrationHint, { color: colors.muted }]}>{restTimerSoundEnabled ? "Короткий сигнал прозвучит сразу после нулевого таймера." : "Окончание отдыха будет без звукового сигнала."}</Text></View>
          <Switch value={restTimerSoundEnabled} onValueChange={setRestTimerSoundEnabled} trackColor={{ false: colors.border, true: `${colors.primary}88` }} thumbColor={restTimerSoundEnabled ? colors.primary : colors.muted} />
        </View>
        <View style={[styles.restSoundCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <View style={{ flex: 1 }}><Text style={[styles.vibrationTitle, { color: colors.foreground }]}>Вибрация окончания отдыха</Text><Text style={[styles.vibrationHint, { color: colors.muted }]}>{restTimerVibrationEnabled ? "Короткий тактильный сигнал дополнит окончание отсчёта." : "Окончание отдыха будет без вибрации."}</Text></View>
          <Switch value={restTimerVibrationEnabled} onValueChange={setRestTimerVibrationEnabled} trackColor={{ false: colors.border, true: `${colors.primary}88` }} thumbColor={restTimerVibrationEnabled ? colors.primary : colors.muted} />
        </View>
        <View style={[styles.vibrationCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={[styles.vibrationTitle, { color: colors.foreground }]}>Вибрация при завершении подхода</Text>
          <Text style={[styles.vibrationHint, { color: colors.muted }]}>Интенсивность сохраняется на этом устройстве. В веб-просмотре вибрация не запускается.</Text>
          <View style={styles.vibrationOptions}>
            {hapticIntensityOptions.map((option) => {
              const selected = option.id === hapticIntensity;
              return (
                <Pressable key={option.id} onPress={() => setHapticIntensity(option.id)} style={({ pressed }) => [styles.vibrationOption, { backgroundColor: selected ? `${colors.primary}18` : colors.background, borderColor: selected ? colors.primary : colors.border, opacity: pressed ? 0.72 : 1 }]}> 
                  <View style={[styles.vibrationRadio, { borderColor: selected ? colors.primary : colors.muted }]}>{selected && <View style={[styles.vibrationRadioDot, { backgroundColor: colors.primary }]} />}</View>
                  <View style={{ flex: 1 }}><Text style={[styles.vibrationOptionTitle, { color: colors.foreground }]}>{option.title}</Text><Text style={[styles.vibrationOptionHint, { color: colors.muted }]}>{option.description}</Text></View>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Напоминания о тренировках</Text>
        <View style={[styles.notificationCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.notificationHeader}><View style={{ flex: 1 }}><Text style={[styles.vibrationTitle, { color: colors.foreground }]}>Локальные уведомления</Text><Text style={[styles.vibrationHint, { color: colors.muted }]}>{notificationsEnabled ? "Новые планы в календаре получат напоминание по этим настройкам." : "Новые планы сохраняются без системного напоминания."}</Text></View><Switch value={notificationsEnabled} onValueChange={(enabled) => setNotificationPreferences({ notificationsEnabled: enabled, defaultWorkoutTime, defaultReminderMinutes })} trackColor={{ false: colors.border, true: `${colors.primary}88` }} thumbColor={notificationsEnabled ? colors.primary : colors.muted} /></View>
          <View style={styles.notificationFields}><View style={{ flex: 1 }}><Text style={[styles.fieldLabel, { color: colors.muted }]}>Время по умолчанию</Text><TextInput value={notificationTime} onChangeText={setNotificationTime} onEndEditing={() => setNotificationPreferences({ notificationsEnabled, defaultWorkoutTime: notificationTime, defaultReminderMinutes })} placeholder="18:30" placeholderTextColor={colors.muted} style={[styles.field, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} /></View><View style={{ flex: 1.35 }}><Text style={[styles.fieldLabel, { color: colors.muted }]}>Напомнить за</Text><View style={styles.notificationMinutes}>{[15, 30, 60, 120].map((minutes) => <Pressable key={minutes} onPress={() => setNotificationPreferences({ notificationsEnabled, defaultWorkoutTime: notificationTime || defaultWorkoutTime, defaultReminderMinutes: minutes })} style={[styles.notificationMinute, { backgroundColor: defaultReminderMinutes === minutes ? colors.primary : colors.background, borderColor: defaultReminderMinutes === minutes ? colors.primary : colors.border }]}><Text style={{ color: defaultReminderMinutes === minutes ? "#101412" : colors.foreground, fontSize: 10, fontWeight: "900" }}>{minutes}м</Text></Pressable>)}</View></View></View>
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

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Groq AI</Text>
        <View style={[styles.groqCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.groqHeader}>
            <View style={[styles.groqIcon, { backgroundColor: `${colors.primary}17` }]}><SafeMaterialIcon name="auto-awesome" size={20} color={colors.primary} /></View>
            <View style={{ flex: 1 }}><Text style={[styles.groqTitle, { color: colors.foreground }]}>Личный API-ключ Groq</Text><Text style={[styles.groqSubtitle, { color: colors.muted }]}>{hasGroqKey ? "Ключ сохранён на этом устройстве. Можно заменить его в любой момент." : "Добавь ключ, чтобы создавать программы через Groq AI."}</Text></View>
            <Text style={[styles.groqStatus, { color: hasGroqKey ? colors.success : colors.muted, backgroundColor: hasGroqKey ? `${colors.success}18` : colors.border }]}>{hasGroqKey ? "ГОТОВО" : "НЕТ КЛЮЧА"}</Text>
          </View>
          <View style={styles.groqActions}><Pressable onPress={openGroqKeySheet} style={[styles.groqPrimary, { backgroundColor: colors.primary }]}><Text style={styles.groqPrimaryText}>{hasGroqKey ? "Обновить ключ" : "Добавить ключ"}</Text></Pressable>{hasGroqKey && <Pressable onPress={deleteGroqKey} style={[styles.groqDelete, { borderColor: colors.error }]}><Text style={[styles.groqDeleteText, { color: colors.error }]}>Удалить</Text></Pressable>}</View>
          <Text style={[styles.groqPrivacy, { color: colors.muted }]}>{Platform.OS === "web" ? "Не вводи рабочий ключ в веб-просмотре." : "Ключ хранится в защищённом системном хранилище Android и не добавляется в APK."}</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Локальное хранилище</Text>
        <View style={[styles.storageCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.storageHeader}>
            <View style={[styles.storageIcon, { backgroundColor: `${colors.primary}17` }]}>
              <SafeMaterialIcon name="storage" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.storageTitle, { color: colors.foreground }]}>Данные на этом устройстве</Text>
              <Text style={[styles.storageSubtitle, { color: colors.muted }]}>
                {storageLoading ? "Считаем размер тренировок, фото и кэша…" : storageError ? "Не удалось прочитать объём. Попробуйте обновить." : "Тренировки, настройки и офлайн-файлы хранятся только локально."}
              </Text>
            </View>
            <Pressable onPress={refreshStorageUsage} accessibilityLabel="Обновить объём хранилища" style={({ pressed }) => [styles.refreshStorage, { borderColor: colors.border, opacity: pressed ? 0.65 : 1 }]}>
              <SafeMaterialIcon name="refresh" size={19} color={colors.primary} />
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
      <Modal visible={keySheetVisible} transparent animationType="slide" onRequestClose={() => setKeySheetVisible(false)}><View style={styles.backdrop}><KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.sheetKeyboard}><View style={[styles.sheet, { backgroundColor: colors.background }]}><View style={styles.sheetHeader}><View><Text style={[styles.sheetTitle, { color: colors.foreground }]}>{hasGroqKey ? "Обновить ключ Groq" : "Добавить ключ Groq"}</Text><Text style={[styles.sheetHint, { color: colors.muted }]}>Новый ключ заменит предыдущий на этом устройстве.</Text></View><Pressable onPress={() => setKeySheetVisible(false)} style={[styles.close, { backgroundColor: colors.surface }]}><Text style={[styles.closeText, { color: colors.foreground }]}>×</Text></Pressable></View><TextInput value={keyDraft} onChangeText={setKeyDraft} secureTextEntry autoCapitalize="none" autoCorrect={false} placeholder="gsk_…" placeholderTextColor={colors.muted} style={[styles.keyInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]} /><Pressable disabled={savingGroqKey} onPress={saveGroqKey} style={[styles.saveKey, { backgroundColor: colors.primary, opacity: savingGroqKey ? 0.6 : 1 }]}><Text style={styles.saveKeyText}>{savingGroqKey ? "Сохраняем…" : "Сохранить на устройстве"}</Text></Pressable></View></KeyboardAvoidingView></View></Modal>
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
  iconThemeCard: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 10 },
  iconThemeTitle: { fontSize: 14, fontWeight: "900" },
  iconThemeHint: { fontSize: 11, lineHeight: 16 },
  iconThemeOptions: { gap: 8 },
  iconThemeOption: { minHeight: 52, borderWidth: 1, borderRadius: 13, paddingHorizontal: 11, flexDirection: "row", alignItems: "center", gap: 9 },
  iconThemeSwatch: { width: 18, height: 18, borderRadius: 9 },
  iconThemeOptionTitle: { fontSize: 12, fontWeight: "900" },
  iconThemeOptionHint: { fontSize: 10, marginTop: 2 },
  appThemeCard: { borderWidth: 1, borderRadius: 0, borderLeftWidth: 5, padding: 14, gap: 10 },
  appThemeGrid: { gap: 8 },
  appThemeOption: { minHeight: 58, borderWidth: 1, borderRadius: 0, paddingHorizontal: 11, flexDirection: "row", alignItems: "center", gap: 9 },
  appThemeSwatch: { width: 20, height: 20, borderRadius: 0 },
  appThemeName: { fontSize: 12, fontWeight: "900" },
  appThemeHint: { fontSize: 10, marginTop: 2 },
  densityCard: { borderWidth: 1, borderRadius: 0, borderLeftWidth: 5, padding: 14, gap: 10 },
  densityOptions: { flexDirection: "row", gap: 8 },
  densityOption: { flex: 1, minHeight: 72, borderWidth: 1, borderRadius: 0, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 8 },
  densitySample: { fontWeight: "900", letterSpacing: -1 },
  vibrationCard: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 10 },
  restSoundCard: { borderWidth: 1, borderRadius: 18, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  vibrationTitle: { fontSize: 14, fontWeight: "900" },
  vibrationHint: { fontSize: 11, lineHeight: 16 },
  vibrationOptions: { gap: 8 },
  vibrationOption: { minHeight: 54, borderWidth: 1, borderRadius: 13, paddingHorizontal: 11, flexDirection: "row", alignItems: "center", gap: 9 },
  vibrationRadio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  vibrationRadioDot: { width: 9, height: 9, borderRadius: 5 },
  vibrationOptionTitle: { fontSize: 12, fontWeight: "900" },
  vibrationOptionHint: { fontSize: 10, marginTop: 2 },
  notificationCard: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 11 },
  notificationHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  notificationFields: { flexDirection: "row", gap: 9 },
  notificationMinutes: { flexDirection: "row", gap: 4 },
  notificationMinute: { flex: 1, height: 48, borderWidth: 1, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  bodyFields: { flexDirection: "row", gap: 9 },
  fieldLabel: { fontSize: 10, fontWeight: "800", marginBottom: 5 },
  field: { height: 48, borderWidth: 1, borderRadius: 13, paddingHorizontal: 12, fontSize: 15, fontWeight: "800" },
  macroGoalRow: { flexDirection: "row", gap: 8 },
  macroGoalField: { flex: 1 },
  groqCard: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 11 },
  groqHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  groqIcon: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  groqTitle: { fontSize: 14, fontWeight: "900" },
  groqSubtitle: { fontSize: 11, lineHeight: 16, marginTop: 3 },
  groqStatus: { paddingHorizontal: 7, paddingVertical: 5, borderRadius: 7, overflow: "hidden", fontSize: 8, fontWeight: "900", letterSpacing: 0.5 },
  groqActions: { flexDirection: "row", gap: 8 },
  groqPrimary: { flex: 1, minHeight: 43, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  groqPrimaryText: { color: "#101412", fontSize: 12, fontWeight: "900" },
  groqDelete: { minHeight: 43, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, justifyContent: "center", alignItems: "center" },
  groqDeleteText: { fontSize: 12, fontWeight: "900" },
  groqPrivacy: { fontSize: 10, lineHeight: 14 },
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
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "#090611B8" },
  sheetKeyboard: { width: "100%" },
  sheet: { padding: 20, borderTopLeftRadius: 28, borderTopRightRadius: 28, gap: 12 },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  sheetTitle: { fontSize: 19, fontWeight: "900" },
  sheetHint: { fontSize: 11, marginTop: 3 },
  close: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  closeText: { fontSize: 23, lineHeight: 25 },
  keyInput: { height: 52, borderWidth: 1, borderRadius: 14, paddingHorizontal: 13, fontSize: 14, fontWeight: "700" },
  saveKey: { minHeight: 52, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  saveKeyText: { color: "#101412", fontSize: 13, fontWeight: "900" },
});
