import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  LayoutAnimation,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  UIManager,
  View,
} from "react-native";
import { setAudioModeAsync, useAudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
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
import {
  createAndShareLocalBackup,
  pickLocalBackup,
  restoreLocalBackup,
} from "@/lib/local-backup-device";
import type {
  LocalBackupPayload,
  LocalBackupPreview,
} from "@/lib/local-backup";
import {
  loadLocalBackupRecord,
  loadLocalBackupReminderPreferences,
  recordSuccessfulLocalBackup,
  saveLocalBackupReminderPreferences,
  type BackupReminderFrequency,
  type LocalBackupRecord,
  type LocalBackupReminderPreferences,
} from "@/lib/local-backup-reminder";
import {
  clearGroqApiKey,
  getGroqApiKey,
  saveGroqApiKey,
} from "@/lib/groq-settings";
import { type OneRepMaxFormula } from "@/lib/workout-data";
import {
  type RestCompletionSound,
  type RestCompletionVibrationPattern,
  type SetHapticIntensity,
  useWorkoutStore,
} from "@/lib/workout-store";
import { useNutritionStore } from "@/lib/nutrition-store";
import {
  HOME_WIDGETS,
  type HomeWidgetId,
  useHomeWidgets,
} from "@/lib/home-widgets";
import {
  MAIN_TABS,
  type MainTabId,
  useMainTabPreferences,
} from "@/lib/main-tab-preferences";
import {
  BODY_METRICS,
  DAILY_ACTIVITY_LEVELS,
  useBodyStore,
} from "@/lib/body-store";
import { calculateDailyCalorieGuide } from "@/lib/body-calculations";
import {
  connectHealthConnectHeartRate,
  getHealthConnectStatus,
  type HealthConnectStatus,
} from "@/lib/health-connect";
import {
  loadLockScreenHeartRateVisible,
  saveLockScreenHeartRateVisible,
} from "@/lib/lock-screen-heart-rate-privacy";
import {
  DEFAULT_LAUNCH_SPLASH_DURATION_MS,
  LAUNCH_SPLASH_DURATION_OPTIONS,
  loadLaunchSplashDuration,
  saveLaunchSplashDuration,
  type LaunchSplashDuration,
} from "@/lib/launch-splash-settings";
import { previewNativeRestCompletionSound } from "@/modules/ironrise-rest-timer";

const formulas: {
  id: OneRepMaxFormula;
  title: string;
  formula: string;
  description: string;
}[] = [
  {
    id: "epley",
    title: "Эпли",
    formula: "Вес × (1 + повторы / 30)",
    description: "Универсальная оценка для большинства рабочих подходов.",
  },
  {
    id: "brzycki",
    title: "Бржицки",
    formula: "Вес × 36 / (37 − повторы)",
    description: "Удобна для небольшого числа повторений.",
  },
];

const hapticIntensityOptions: {
  id: SetHapticIntensity;
  title: string;
  description: string;
}[] = [
  {
    id: "light",
    title: "Лёгкая",
    description: "Короткое деликатное подтверждение",
  },
  { id: "medium", title: "Средняя", description: "Более заметный отклик" },
  { id: "heavy", title: "Сильная", description: "Выраженное подтверждение" },
];
const restCompletionSoundOptions: {
  id: RestCompletionSound;
  title: string;
  description: string;
}[] = [
  {
    id: "female",
    title: "Женский голос",
    description: "Короткая голосовая команда о завершении отдыха",
  },
  {
    id: "male",
    title: "Мужской голос",
    description: "Уверенная голосовая команда о следующем подходе",
  },
  {
    id: "siren",
    title: "Сирена",
    description: "Короткий заметный электронный сигнал",
  },
];
const restCompletionVibrationOptions: {
  id: RestCompletionVibrationPattern;
  title: string;
  description: string;
}[] = [
  { id: "short", title: "Короткая", description: "Один короткий импульс" },
  {
    id: "long",
    title: "Длинная",
    description: "Один заметный длинный импульс",
  },
  {
    id: "pulse",
    title: "Пульсирующая",
    description: "Три коротких последовательных импульса",
  },
];

function CompletionVolumeSlider({
  value,
  onChange,
  colors,
}: {
  value: number;
  onChange: (value: number) => void;
  colors: ReturnType<typeof useColors>;
}) {
  const [width, setWidth] = useState(1);
  const updateVolume = (locationX: number) =>
    onChange(
      Math.round(
        (0.1 + Math.max(0, Math.min(1, locationX / width)) * 0.9) * 10,
      ) / 10,
    );
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (event) => updateVolume(event.nativeEvent.locationX),
    onPanResponderMove: (event) => updateVolume(event.nativeEvent.locationX),
  });
  const ratio = (value - 0.1) / 0.9;
  return (
    <View style={styles.volumeWrap}>
      <View style={styles.volumeHeader}>
        <Text style={[styles.vibrationTitle, { color: colors.foreground }]}>
          Громкость сигнала
        </Text>
        <Text style={[styles.volumeValue, { color: colors.primary }]}>
          {Math.round(value * 100)}%
        </Text>
      </View>
      <View
        onLayout={(event) =>
          setWidth(Math.max(1, event.nativeEvent.layout.width))
        }
        {...panResponder.panHandlers}
        style={[styles.volumeTrack, { backgroundColor: colors.border }]}
        accessibilityLabel={`Громкость сигнала ${Math.round(value * 100)} процентов`}
      >
        <View
          style={[
            styles.volumeFill,
            { width: `${ratio * 100}%`, backgroundColor: colors.primary },
          ]}
        />
        <View
          style={[
            styles.volumeThumb,
            {
              left: `${ratio * 100}%`,
              borderColor: colors.primary,
              backgroundColor: colors.background,
            },
          ]}
        />
      </View>
      <Text style={[styles.vibrationHint, { color: colors.muted }]}>
        Регулирует громкость IronRise внутри доступного системного уровня
        Android.
      </Text>
    </View>
  );
}
const primaryThemeChoices = APP_COLOR_THEMES.filter(
  (theme) => theme.id === "editorial" || theme.id === "orchid",
);

function triggerTabDragHaptic(phase: "start" | "move") {
  if (Platform.OS === "web") return;
  if (Platform.OS === "android") {
    const pattern =
      phase === "start"
        ? Haptics.AndroidHaptics.Drag_Start
        : Haptics.AndroidHaptics.Segment_Tick;
    void Haptics.performAndroidHapticsAsync(pattern).catch(() => undefined);
    return;
  }
  if (phase === "start") {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
      () => undefined,
    );
  } else {
    void Haptics.selectionAsync().catch(() => undefined);
  }
}

type SettingsCategoryId =
  | "training"
  | "home"
  | "appearance"
  | "body"
  | "reminders"
  | "data";
const SETTINGS_CATEGORIES: {
  id: SettingsCategoryId;
  title: string;
  keywords: string[];
}[] = [
  {
    id: "training",
    title: "Тренировка",
    keywords: [
      "тренировка",
      "подход",
      "1rm",
      "вес",
      "блины",
      "таймер",
      "отдых",
      "звук",
      "вибрация",
    ],
  },
  {
    id: "home",
    title: "Главный экран",
    keywords: [
      "главный",
      "сегодня",
      "виджет",
      "вкладка",
      "нижняя панель",
      "навигация",
      "перенос",
      "цитата",
      "вибрация",
    ],
  },
  {
    id: "appearance",
    title: "Внешний вид",
    keywords: [
      "внешний",
      "стиль",
      "тема",
      "цвет",
      "иконки",
      "плотность",
      "текст",
    ],
  },
  {
    id: "body",
    title: "Питание и тело",
    keywords: [
      "питание",
      "калории",
      "расход",
      "активность",
      "движение",
      "бжу",
      "белки",
      "жиры",
      "углеводы",
      "тело",
      "рост",
      "возраст",
      "цель",
      "обхват",
    ],
  },
  {
    id: "reminders",
    title: "Напоминания",
    keywords: ["напоминание", "уведомление", "время", "календарь"],
  },
  {
    id: "data",
    title: "Данные и сервисы",
    keywords: [
      "данные",
      "хранилище",
      "фото",
      "офлайн",
      "экспорт",
      "импорт",
      "groq",
      "api",
      "health connect",
      "пульс",
      "часы",
      "инструменты",
      "приватность",
      "экран блокировки",
    ],
  },
];

export default function SettingsScreen() {
  const colors = useColors();
  const store = useWorkoutStore();
  const { theme: svgIconTheme, setThemeId } = useSvgIconTheme();
  const { themeId: appThemeId, setThemeId: setAppThemeId } = useThemeContext();
  const { density, setDensity } = useInterfaceDensity();
  const {
    dailyCalorieGoal,
    dailyMacroGoals,
    setDailyCalorieGoal,
    setDailyMacroGoals,
  } = useNutritionStore();
  const {
    visibility: homeWidgets,
    order: homeWidgetOrder,
    compact: compactWidgets,
    dragHapticsEnabled,
    setWidgetVisible,
    setWidgetCompact,
    setWidgetDragHapticsEnabled,
    moveWidget,
    resetWidgets,
  } = useHomeWidgets();
  const {
    visibility: tabVisibility,
    order: tabOrder,
    compact: tabCompact,
    setTabVisible,
    moveTab,
    setTabCompact,
    resetTabs,
  } = useMainTabPreferences();
  const {
    profile: bodyProfile,
    heightCm,
    ageYears,
    goals: bodyGoals,
    measurements: bodyMeasurements,
    activityLevel,
    setProfile: setBodyProfile,
    setProfileDetails,
    setGoals: setBodyGoals,
    setActivityLevel,
  } = useBodyStore();
  const {
    oneRmFormula,
    setOneRmFormula,
    plateStepKg,
    setPlateStepKg,
    bodyWeightKg,
    bodyweightVolumePercent,
    setBodyweightVolumeSettings,
    hapticIntensity,
    setHapticIntensity,
    restTimerSoundEnabled,
    setRestTimerSoundEnabled,
    restTimerCompletionSound,
    setRestTimerCompletionSound,
    restTimerCompletionVolume,
    setRestTimerCompletionVolume,
    restTimerVibrationEnabled,
    setRestTimerVibrationEnabled,
    restTimerVibrationPattern,
    setRestTimerVibrationPattern,
    notificationsEnabled,
    defaultWorkoutTime,
    defaultReminderMinutes,
    setNotificationPreferences,
  } = store;
  const [bodyWeight, setBodyWeight] = useState(String(bodyWeightKg));
  const [bodyPercent, setBodyPercent] = useState(
    String(bodyweightVolumePercent),
  );
  const [notificationTime, setNotificationTime] = useState(defaultWorkoutTime);
  const [calorieGoalDraft, setCalorieGoalDraft] = useState(
    String(dailyCalorieGoal),
  );
  const [macroGoalDrafts, setMacroGoalDrafts] = useState({
    protein: String(dailyMacroGoals.protein),
    fat: String(dailyMacroGoals.fat),
    carbs: String(dailyMacroGoals.carbs),
  });
  const [heightDraft, setHeightDraft] = useState(
    heightCm ? String(heightCm) : "",
  );
  const [ageDraft, setAgeDraft] = useState(ageYears ? String(ageYears) : "");
  const [bodyGoalDrafts, setBodyGoalDrafts] = useState<Record<string, string>>(
    () =>
      Object.fromEntries(
        BODY_METRICS.map((metric) => [
          metric.id,
          bodyGoals[metric.id] ? String(bodyGoals[metric.id]) : "",
        ]),
      ),
  );
  const [bulkState, setBulkState] = useState({
    loading: false,
    completed: 0,
    total: 0,
    message: "Скачивай все фото по Wi‑Fi для просмотра без интернета.",
  });
  const [storageUsage, setStorageUsage] = useState<LocalStorageUsage | null>(
    null,
  );
  const [storageLoading, setStorageLoading] = useState(true);
  const [storageError, setStorageError] = useState(false);
  const [backupBusy, setBackupBusy] = useState(false);
  const [lastBackupPreview, setLastBackupPreview] =
    useState<LocalBackupPreview | null>(null);
  const [lastBackupRecord, setLastBackupRecord] =
    useState<LocalBackupRecord | null>(null);
  const [backupReminderPreferences, setBackupReminderPreferences] =
    useState<LocalBackupReminderPreferences>({
      enabled: true,
      frequency: "monthly",
    });
  const [hasGroqKey, setHasGroqKey] = useState(false);
  const [keySheetVisible, setKeySheetVisible] = useState(false);
  const [keyDraft, setKeyDraft] = useState("");
  const [savingGroqKey, setSavingGroqKey] = useState(false);
  const [healthConnectStatus, setHealthConnectStatus] =
    useState<HealthConnectStatus>({
      state: "unsupported",
      heartRateGranted: false,
      message: "Проверяем Health Connect…",
    });
  const [lockScreenHeartRateVisible, setLockScreenHeartRateVisible] =
    useState(true);
  const [settingsCategory, setSettingsCategory] =
    useState<SettingsCategoryId>("training");
  const [settingsQuery, setSettingsQuery] = useState("");
  const [launchSplashDuration, setLaunchSplashDuration] =
    useState<LaunchSplashDuration>(DEFAULT_LAUNCH_SPLASH_DURATION_MS);
  const femaleRestSoundPreviewPlayer = useAudioPlayer(
    require("@/assets/sounds/rest-complete-female.wav"),
  );
  const maleRestSoundPreviewPlayer = useAudioPlayer(
    require("@/assets/sounds/rest-complete-male.wav"),
  );
  const sirenRestSoundPreviewPlayer = useAudioPlayer(
    require("@/assets/sounds/rest-complete-siren.mp3"),
  );
  const links = [
    {
      title: "Профиль штанги и блинов",
      subtitle: "Вес грифа и доступные номиналы",
      route: "/barbell" as const,
    },
    {
      title: "Рекомендации следующей тренировки",
      subtitle: "Рабочий вес с объяснением расчёта",
      route: "/recommendations" as const,
    },
    {
      title: "График прогресса 1RM",
      subtitle: "Изменение силового показателя по датам",
      route: "/progress" as const,
    },
    {
      title: "Экспорт истории CSV",
      subtitle: "Файл для Excel и других таблиц",
      route: "/export" as const,
    },
    {
      title: "Импорт истории CSV",
      subtitle: "Загрузка подходов из других приложений",
      route: "/import" as const,
    },
    {
      title: "Сравнение тренировок",
      subtitle: "Объём, длительность и прогресс 1RM",
      route: "/compare" as const,
    },
    {
      title: "Месячный PDF-отчёт",
      subtitle: "Красивые итоги и таблица подходов",
      route: "/report" as const,
    },
  ];

  const previewRestCompletionSound = useCallback(async () => {
    if (previewNativeRestCompletionSound(restTimerCompletionSound)) return;
    await setAudioModeAsync({ playsInSilentMode: true });
    const player =
      restTimerCompletionSound === "female"
        ? femaleRestSoundPreviewPlayer
        : restTimerCompletionSound === "male"
          ? maleRestSoundPreviewPlayer
          : sirenRestSoundPreviewPlayer;
    player.volume = restTimerCompletionVolume;
    player.seekTo(0);
    player.play();
  }, [
    femaleRestSoundPreviewPlayer,
    maleRestSoundPreviewPlayer,
    restTimerCompletionSound,
    restTimerCompletionVolume,
    sirenRestSoundPreviewPlayer,
  ]);

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
    void loadLocalBackupRecord().then(setLastBackupRecord);
    void loadLocalBackupReminderPreferences().then(
      setBackupReminderPreferences,
    );
    void getGroqApiKey()
      .then((key) => setHasGroqKey(Boolean(key)))
      .catch(() => setHasGroqKey(false));
    void getHealthConnectStatus().then(setHealthConnectStatus);
    void loadLockScreenHeartRateVisible().then(setLockScreenHeartRateVisible);
  }, [refreshStorageUsage]);
  useEffect(() => {
    setNotificationTime(defaultWorkoutTime);
  }, [defaultWorkoutTime]);
  useEffect(() => {
    setCalorieGoalDraft(String(dailyCalorieGoal));
  }, [dailyCalorieGoal]);
  useEffect(() => {
    setMacroGoalDrafts({
      protein: String(dailyMacroGoals.protein),
      fat: String(dailyMacroGoals.fat),
      carbs: String(dailyMacroGoals.carbs),
    });
  }, [dailyMacroGoals]);
  useEffect(() => {
    setHeightDraft(heightCm ? String(heightCm) : "");
    setAgeDraft(ageYears ? String(ageYears) : "");
  }, [heightCm, ageYears]);
  useEffect(() => {
    setBodyGoalDrafts(
      Object.fromEntries(
        BODY_METRICS.map((metric) => [
          metric.id,
          bodyGoals[metric.id] ? String(bodyGoals[metric.id]) : "",
        ]),
      ),
    );
  }, [bodyGoals]);
  useEffect(() => {
    void loadLaunchSplashDuration()
      .then(setLaunchSplashDuration)
      .catch(() => undefined);
  }, []);

  const selectLaunchSplashDuration = (value: LaunchSplashDuration) => {
    setLaunchSplashDuration(value);
    void saveLaunchSplashDuration(value);
  };

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
      Alert.alert(
        "Не удалось сохранить ключ",
        error instanceof Error ? error.message : "Повтори попытку.",
      );
    } finally {
      setSavingGroqKey(false);
    }
  };
  const deleteGroqKey = () =>
    Alert.alert(
      "Удалить личный ключ Groq?",
      "ИИ-режим станет недоступен, пока ты не добавишь новый ключ.",
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Удалить",
          style: "destructive",
          onPress: () => {
            void clearGroqApiKey()
              .then(() => setHasGroqKey(false))
              .catch(() =>
                Alert.alert("Не удалось удалить ключ", "Повтори попытку."),
              );
          },
        },
      ],
    );
  const connectHealthConnect = () =>
    void connectHealthConnectHeartRate().then(setHealthConnectStatus);

  const downloadPhotos = async () => {
    setBulkState((state) => ({
      ...state,
      loading: true,
      completed: 0,
      total: 0,
      message: "Проверяем подключение Wi‑Fi…",
    }));
    const result = await cacheAllExercisePhotosOnWifi((completed, total) =>
      setBulkState((state) => ({
        ...state,
        completed,
        total,
        message: `Загружено ${completed} из ${total} фотографий…`,
      })),
    );
    setBulkState({
      loading: false,
      completed: result.cached,
      total: result.total,
      message: result.message,
    });
    refreshStorageUsage();
  };
  const createBackup = async () => {
    setBackupBusy(true);
    try {
      const backup = await createAndShareLocalBackup();
      const result = await recordSuccessfulLocalBackup({
        createdAt: backup.exportedAt,
        storageEntryCount: backup.storageEntryCount,
        mediaFileCount: backup.mediaFileCount,
      });
      setLastBackupPreview(backup);
      setLastBackupRecord(result.record);
      Alert.alert(
        "Резервная копия подготовлена",
        "В системном меню выберите «Сохранить на устройство» или папку «Загрузки». Такой файл сохранится после удаления IronRise.",
      );
    } catch (error) {
      Alert.alert(
        "Не удалось создать копию",
        error instanceof Error ? error.message : "Попробуйте ещё раз.",
      );
    } finally {
      setBackupBusy(false);
    }
  };
  const updateBackupReminderPreferences = async (
    patch: Partial<LocalBackupReminderPreferences>,
  ) => {
    const previous = backupReminderPreferences;
    const next = { ...previous, ...patch };
    setBackupReminderPreferences(next);
    try {
      const result = await saveLocalBackupReminderPreferences(next);
      setBackupReminderPreferences(result.preferences);
      setLastBackupRecord(result.record);
    } catch {
      setBackupReminderPreferences(previous);
      Alert.alert(
        "Не удалось обновить напоминание",
        "Проверьте разрешение на уведомления и повторите попытку.",
      );
    }
  };
  const applyBackup = async (backup: LocalBackupPayload) => {
    setBackupBusy(true);
    try {
      await restoreLocalBackup(backup);
      setLastBackupPreview({
        exportedAt: backup.exportedAt,
        storageEntryCount: backup.storageEntryCount,
        mediaFileCount: backup.mediaFileCount,
      });
      Alert.alert(
        "Данные восстановлены",
        "Полностью закройте и снова откройте IronRise, чтобы все экраны загрузили восстановленные данные.",
      );
    } catch (error) {
      Alert.alert(
        "Не удалось восстановить данные",
        error instanceof Error
          ? error.message
          : "Исходные данные не были изменены.",
      );
    } finally {
      setBackupBusy(false);
    }
  };
  const chooseBackup = async () => {
    setBackupBusy(true);
    try {
      const backup = await pickLocalBackup();
      if (!backup) return;
      Alert.alert(
        "Восстановить эту копию?",
        `Копия от ${new Date(backup.exportedAt).toLocaleString("ru-RU")}: ${backup.storageEntryCount} записей и ${backup.mediaFileCount} фото. Текущие локальные данные будут заменены.`,
        [
          { text: "Отмена", style: "cancel" },
          {
            text: "Восстановить",
            style: "destructive",
            onPress: () => void applyBackup(backup),
          },
        ],
      );
    } catch (error) {
      Alert.alert(
        "Файл не подходит",
        error instanceof Error
          ? error.message
          : "Выберите ZIP-файл резервной копии IronRise.",
      );
    } finally {
      setBackupBusy(false);
    }
  };

  const photoProgress = bulkState.total
    ? Math.min(100, Math.round((bulkState.completed / bulkState.total) * 100))
    : 0;
  const appSharePercent = storageUsage
    ? getUsagePercent(storageUsage.appDataBytes, storageUsage.totalBytes)
    : 0;
  const deviceUsedBytes =
    storageUsage?.totalBytes && storageUsage.freeBytes !== null
      ? Math.max(0, storageUsage.totalBytes - storageUsage.freeBytes)
      : null;
  const deviceUsedPercent = storageUsage
    ? getUsagePercent(deviceUsedBytes ?? 0, storageUsage.totalBytes)
    : 0;
  const appBarWidth = storageUsage?.appDataBytes
    ? Math.max(2, appSharePercent)
    : 0;
  const saveMacroGoals = () => {
    const goals = {
      protein: Number(macroGoalDrafts.protein),
      fat: Number(macroGoalDrafts.fat),
      carbs: Number(macroGoalDrafts.carbs),
    };
    if (
      [goals.protein, goals.fat, goals.carbs].every(
        (value) => Number.isFinite(value) && value >= 0,
      )
    )
      setDailyMacroGoals(goals);
    else
      setMacroGoalDrafts({
        protein: String(dailyMacroGoals.protein),
        fat: String(dailyMacroGoals.fat),
        carbs: String(dailyMacroGoals.carbs),
      });
  };
  const saveBodyDetails = () =>
    setProfileDetails({
      heightCm: Number(heightDraft.replace(",", ".")),
      ageYears: Number(ageDraft),
    });
  const saveBodyGoals = () => {
    const pairs = BODY_METRICS.map((metric): [string, number] => [
      metric.id,
      Number(bodyGoalDrafts[metric.id]?.replace(",", ".")),
    ]).filter(([, value]) => Number.isFinite(value) && value > 0);
    setBodyGoals(Object.fromEntries(pairs));
  };
  const latestMeasuredWeight = bodyMeasurements[0]?.weightKg;
  const calorieGuide = calculateDailyCalorieGuide(
    bodyProfile,
    latestMeasuredWeight,
    heightCm,
    ageYears,
  );
  const applyCalorieGuide = () => {
    if (calorieGuide === undefined) return;
    setDailyCalorieGoal(calorieGuide);
    setCalorieGoalDraft(String(calorieGuide));
  };
  const normalizedSettingsQuery = settingsQuery
    .trim()
    .toLocaleLowerCase("ru-RU");
  const matchingCategories = useMemo(
    () =>
      SETTINGS_CATEGORIES.filter(
        (category) =>
          !normalizedSettingsQuery ||
          [category.title, ...category.keywords].some((term) =>
            term.toLocaleLowerCase("ru-RU").includes(normalizedSettingsQuery),
          ),
      ),
    [normalizedSettingsQuery],
  );
  const isSectionVisible = useCallback(
    (category: SettingsCategoryId) =>
      normalizedSettingsQuery
        ? matchingCategories.some((item) => item.id === category)
        : settingsCategory === category,
    [matchingCategories, normalizedSettingsQuery, settingsCategory],
  );

  return (
    <ScreenContainer
      edges={["top", "left", "right", "bottom"]}
      className="px-5"
      containerClassName="bg-background"
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <IconSymbol
              name="chevron.left"
              size={27}
              color={colors.foreground}
            />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Настройки
          </Text>
          <View style={{ width: 27 }} />
        </View>

        <View
          style={[
            styles.settingsSearch,
            { borderColor: colors.border, backgroundColor: colors.surface },
          ]}
        >
          <SafeMaterialIcon name="search" size={20} color={colors.muted} />
          <TextInput
            value={settingsQuery}
            onChangeText={setSettingsQuery}
            placeholder="Поиск настроек"
            placeholderTextColor={colors.muted}
            returnKeyType="done"
            style={[styles.settingsSearchInput, { color: colors.foreground }]}
          />
          {settingsQuery.length > 0 && (
            <Pressable
              onPress={() => setSettingsQuery("")}
              accessibilityLabel="Очистить поиск настроек"
              style={({ pressed }) => [
                styles.searchClear,
                { opacity: pressed ? 0.62 : 1 },
              ]}
            >
              <SafeMaterialIcon name="close" size={18} color={colors.muted} />
            </Pressable>
          )}
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryTabs}
        >
          {SETTINGS_CATEGORIES.map((category) => {
            const active =
              !normalizedSettingsQuery && settingsCategory === category.id;
            const matched = matchingCategories.some(
              (item) => item.id === category.id,
            );
            return (
              <Pressable
                key={category.id}
                onPress={() => {
                  setSettingsCategory(category.id);
                  setSettingsQuery("");
                }}
                style={({ pressed }) => [
                  styles.categoryTab,
                  {
                    borderColor: active ? colors.primary : colors.border,
                    backgroundColor: active ? colors.primary : colors.surface,
                    opacity:
                      normalizedSettingsQuery && !matched
                        ? 0.42
                        : pressed
                          ? 0.72
                          : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.categoryTabText,
                    { color: active ? "#101412" : colors.foreground },
                  ]}
                >
                  {category.title}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
        {normalizedSettingsQuery.length > 0 && (
          <Text style={[styles.searchResultHint, { color: colors.muted }]}>
            {matchingCategories.length
              ? `Подходящие категории: ${matchingCategories.map((category) => category.title).join(" · ")}`
              : "Ничего не найдено. Попробуйте другой запрос."}
          </Text>
        )}

        <View style={!isSectionVisible("training") && styles.hiddenSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Расчёт силы
          </Text>
          <View
            style={[
              styles.densityCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.iconThemeTitle, { color: colors.foreground }]}>
              Формула 1RM
            </Text>
            <Text style={[styles.iconThemeHint, { color: colors.muted }]}>
              Выбор применяется к зонам нагрузки, истории и личным рекордам.
            </Text>
            <View style={styles.options}>
              {formulas.map((option) => {
                const selected = option.id === oneRmFormula;
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => setOneRmFormula(option.id)}
                    style={[
                      styles.option,
                      {
                        backgroundColor: colors.background,
                        borderColor: selected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.radio,
                        {
                          borderColor: selected ? colors.primary : colors.muted,
                        },
                      ]}
                    >
                      {selected && (
                        <View
                          style={[
                            styles.radioDot,
                            { backgroundColor: colors.primary },
                          ]}
                        />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.optionTitle,
                          { color: colors.foreground },
                        ]}
                      >
                        {option.title}
                      </Text>
                      <Text
                        style={[
                          styles.optionFormula,
                          { color: colors.primary },
                        ]}
                      >
                        {option.formula}
                      </Text>
                      <Text
                        style={[
                          styles.optionDescription,
                          { color: colors.muted },
                        ]}
                      >
                        {option.description}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
            <Text
              style={[
                styles.fieldLabel,
                styles.strengthStepLabel,
                { color: colors.muted },
              ]}
            >
              ШАГ ВЕСА
            </Text>
            <View style={styles.stepRow}>
              {[1.25, 2.5, 5].map((step) => (
                <Pressable
                  key={step}
                  onPress={() => setPlateStepKg(step)}
                  style={[
                    styles.step,
                    {
                      backgroundColor:
                        plateStepKg === step
                          ? colors.primary
                          : colors.background,
                      borderColor:
                        plateStepKg === step ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color:
                        plateStepKg === step ? "#101412" : colors.foreground,
                      fontWeight: "900",
                    }}
                  >
                    {step} кг
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        <View style={!isSectionVisible("appearance") && styles.hiddenSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Стиль интерфейса
          </Text>
          <View
            style={[
              styles.appThemeCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.iconThemeTitle, { color: colors.foreground }]}>
              Editorial или Orchid Voltage
            </Text>
            <Text style={[styles.iconThemeHint, { color: colors.muted }]}>
              Переключайте основной визуальный характер приложения одним
              нажатием. Выбор сохранится на устройстве.
            </Text>
            <View style={styles.appThemeGrid}>
              {primaryThemeChoices.map((theme) => {
                const selected = theme.id === appThemeId;
                return (
                  <Pressable
                    key={theme.id}
                    onPress={() => setAppThemeId(theme.id)}
                    style={({ pressed }) => [
                      styles.appThemeOption,
                      {
                        backgroundColor: selected
                          ? theme.swatch
                          : colors.background,
                        borderColor: selected ? theme.swatch : colors.border,
                        opacity: pressed ? 0.72 : 1,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.appThemeSwatch,
                        {
                          backgroundColor: selected
                            ? colors.surface
                            : theme.swatch,
                        },
                      ]}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.appThemeName,
                          {
                            color: selected
                              ? colors.surface
                              : colors.foreground,
                          },
                        ]}
                      >
                        {theme.id === "editorial"
                          ? "EDITORIAL"
                          : "ORCHID VOLTAGE"}
                      </Text>
                      <Text
                        style={[
                          styles.appThemeHint,
                          {
                            color: selected
                              ? `${colors.surface}CC`
                              : colors.muted,
                          },
                        ]}
                      >
                        {theme.id === "editorial"
                          ? "Строгая редакционная сетка"
                          : "Мягкие фиолетовые поверхности"}
                      </Text>
                    </View>
                    {selected && (
                      <IconSymbol
                        name="checkmark"
                        size={17}
                        color={colors.surface}
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Плотность интерфейса
          </Text>
          <View
            style={[
              styles.densityCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.iconThemeTitle, { color: colors.foreground }]}>
              Размер текста и расстояние между блоками
            </Text>
            <Text style={[styles.iconThemeHint, { color: colors.muted }]}>
              Выберите представление, которое комфортнее для тренировок и чтения
              статистики.
            </Text>
            <View style={styles.densityOptions}>
              {INTERFACE_DENSITY_PRESETS.map((option) => {
                const selected = density === option.id;
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => setDensity(option.id)}
                    style={({ pressed }) => [
                      styles.densityOption,
                      {
                        backgroundColor: selected
                          ? colors.primary
                          : colors.background,
                        borderColor: selected ? colors.primary : colors.border,
                        opacity: pressed ? 0.72 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.densitySample,
                        {
                          color: selected ? colors.surface : colors.foreground,
                          fontSize: option.id === "large" ? 24 : 18,
                        },
                      ]}
                    >
                      Aa
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.appThemeName,
                          {
                            color: selected
                              ? colors.surface
                              : colors.foreground,
                          },
                        ]}
                      >
                        {option.title}
                      </Text>
                      <Text
                        style={[
                          styles.appThemeHint,
                          {
                            color: selected
                              ? `${colors.surface}CC`
                              : colors.muted,
                          },
                        ]}
                      >
                        {option.hint}
                      </Text>
                    </View>
                    {selected && (
                      <IconSymbol
                        name="checkmark"
                        size={17}
                        color={colors.surface}
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        <View style={!isSectionVisible("body") && styles.hiddenSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Питание
          </Text>
          <View
            style={[
              styles.densityCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.iconThemeTitle, { color: colors.foreground }]}>
              Повседневная активность
            </Text>
            <Text style={[styles.iconThemeHint, { color: colors.muted }]}>
              Выбор влияет на строку «Движение» в суммарном расходе калорий на
              главном экране. Тренировка учитывается отдельно.
            </Text>
            <View style={styles.options}>
              {DAILY_ACTIVITY_LEVELS.map((option) => {
                const selected = option.id === activityLevel;
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => setActivityLevel(option.id)}
                    style={({ pressed }) => [
                      styles.option,
                      {
                        backgroundColor: colors.background,
                        borderColor: selected ? colors.primary : colors.border,
                        opacity: pressed ? 0.72 : 1,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.radio,
                        {
                          borderColor: selected ? colors.primary : colors.muted,
                        },
                      ]}
                    >
                      {selected && (
                        <View
                          style={[
                            styles.radioDot,
                            { backgroundColor: colors.primary },
                          ]}
                        />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.optionTitle,
                          { color: colors.foreground },
                        ]}
                      >
                        {option.title}
                      </Text>
                      <Text
                        style={[
                          styles.optionDescription,
                          { color: colors.muted },
                        ]}
                      >
                        {option.description}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
            <Text style={[styles.iconThemeTitle, { color: colors.foreground }]}>
              Дневные цели калорий и БЖУ
            </Text>
            <Text style={[styles.iconThemeHint, { color: colors.muted }]}>
              Плановый калораж за сутки и цели БЖУ сохраняются на устройстве и
              используются в визуальном прогрессе дневника питания.
            </Text>
            <View
              style={[
                styles.calorieGuide,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { color: colors.primary }]}>
                  АВТОМАТИЧЕСКИЙ ОРИЕНТИР
                </Text>
                <Text
                  style={[
                    styles.calorieGuideValue,
                    { color: colors.foreground },
                  ]}
                >
                  {calorieGuide === undefined
                    ? "Нужны профиль, возраст, рост и вес"
                    : `${calorieGuide} ккал / день`}
                </Text>
                <Text
                  style={[styles.calorieGuideHint, { color: colors.muted }]}
                >
                  {calorieGuide === undefined
                    ? "Вес берётся из последнего замера на вкладке «Тело»."
                    : "Mifflin–St Jeor × 1,4 · ориентир поддержки, не медицинское назначение."}
                </Text>
              </View>
              {calorieGuide !== undefined && (
                <Pressable
                  onPress={applyCalorieGuide}
                  style={({ pressed }) => [
                    styles.applyGuide,
                    {
                      backgroundColor: colors.primary,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Text style={styles.applyGuideText}>ПРИМЕНИТЬ</Text>
                </Pressable>
              )}
            </View>
            <Text style={[styles.fieldLabel, { color: colors.muted }]}>
              Цель, ккал
            </Text>
            <TextInput
              value={calorieGoalDraft}
              onChangeText={setCalorieGoalDraft}
              onEndEditing={() => {
                const value = Number(calorieGoalDraft);
                if (Number.isFinite(value) && value > 0)
                  setDailyCalorieGoal(value);
                else setCalorieGoalDraft(String(dailyCalorieGoal));
              }}
              keyboardType="number-pad"
              placeholder="2200"
              placeholderTextColor={colors.muted}
              style={[
                styles.field,
                {
                  color: colors.foreground,
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                },
              ]}
            />
            <View style={styles.macroGoalRow}>
              {(
                [
                  ["protein", "Белки, г", "150"],
                  ["fat", "Жиры, г", "70"],
                  ["carbs", "Углеводы, г", "250"],
                ] as const
              ).map(([key, label, placeholder]) => (
                <View key={key} style={styles.macroGoalField}>
                  <Text style={[styles.fieldLabel, { color: colors.muted }]}>
                    {label}
                  </Text>
                  <TextInput
                    value={macroGoalDrafts[key]}
                    onChangeText={(value) =>
                      setMacroGoalDrafts((current) => ({
                        ...current,
                        [key]: value,
                      }))
                    }
                    onEndEditing={saveMacroGoals}
                    keyboardType="number-pad"
                    placeholder={placeholder}
                    placeholderTextColor={colors.muted}
                    style={[
                      styles.field,
                      {
                        color: colors.foreground,
                        borderColor: colors.border,
                        backgroundColor: colors.background,
                      },
                    ]}
                  />
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={!isSectionVisible("home") && styles.hiddenSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Главный экран
          </Text>
          <View
            style={[
              styles.densityCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.iconThemeTitle, { color: colors.foreground }]}>
              Виджеты на экране «Сегодня»
            </Text>
            <Text style={[styles.iconThemeHint, { color: colors.muted }]}>
              Тяните маркер ⠿, чтобы изменить порядок. Основной блок с планом
              дня остаётся всегда.
            </Text>
            <View
              style={[
                styles.widgetFeedbackRow,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.widgetTitle, { color: colors.foreground }]}
                >
                  Виброотклик при переносе
                </Text>
                <Text style={[styles.widgetHint, { color: colors.muted }]}>
                  {dragHapticsEnabled
                    ? "Лёгкое подтверждение при захвате виджета."
                    : "Захват виджета проходит без вибрации."}
                </Text>
              </View>
              <Switch
                value={dragHapticsEnabled}
                onValueChange={setWidgetDragHapticsEnabled}
                trackColor={{
                  false: colors.border,
                  true: `${colors.primary}88`,
                }}
                thumbColor={dragHapticsEnabled ? colors.primary : colors.muted}
              />
            </View>
            <View style={styles.widgetOptions}>
              {homeWidgetOrder.map((id, index) => (
                <WidgetSettingsRow
                  key={id}
                  widget={HOME_WIDGETS.find((item) => item.id === id)!}
                  index={index}
                  total={homeWidgetOrder.length}
                  visible={homeWidgets[id]}
                  compact={compactWidgets[id]}
                  colors={colors}
                  onVisible={setWidgetVisible}
                  onCompact={setWidgetCompact}
                  onMove={moveWidget}
                />
              ))}
            </View>
            <Pressable
              onPress={() =>
                Alert.alert(
                  "Сбросить виджеты?",
                  "Вернутся исходный порядок, обычный размер и видимость всех блоков.",
                  [
                    { text: "Отмена", style: "cancel" },
                    {
                      text: "Сбросить",
                      style: "destructive",
                      onPress: resetWidgets,
                    },
                  ],
                )
              }
              style={({ pressed }) => [
                widgetControlStyles.resetButton,
                { borderColor: colors.border, opacity: pressed ? 0.65 : 1 },
              ]}
            >
              <Text
                style={[
                  widgetControlStyles.resetText,
                  { color: colors.foreground },
                ]}
              >
                СБРОСИТЬ НАСТРОЙКИ ВИДЖЕТОВ
              </Text>
            </Pressable>
          </View>
          <View
            style={[
              styles.densityCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.iconThemeTitle, { color: colors.foreground }]}>
              Вкладки в нижней панели
            </Text>
            <Text style={[styles.iconThemeHint, { color: colors.muted }]}>
              Тяните маркер ⠿, чтобы менять порядок. Скрытые разделы исчезают из
              нижней навигации и свайпов. «Главное», «План» и «Настройки»
              остаются доступными всегда.
            </Text>
            <View
              style={[
                styles.widgetFeedbackRow,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.widgetTitle, { color: colors.foreground }]}
                >
                  Компактный режим
                </Text>
                <Text style={[styles.widgetHint, { color: colors.muted }]}>
                  {tabCompact
                    ? "Только иконки — больше места для экранов."
                    : "Иконки и короткие названия вкладок."}
                </Text>
              </View>
              <Switch
                value={tabCompact}
                onValueChange={setTabCompact}
                trackColor={{
                  false: colors.border,
                  true: `${colors.primary}88`,
                }}
                thumbColor={tabCompact ? colors.primary : colors.muted}
              />
            </View>
            <View style={styles.widgetOptions}>
              {tabOrder.map((id, index) => (
                <TabVisibilityRow
                  key={id}
                  tab={MAIN_TABS.find((tab) => tab.id === id)!}
                  index={index}
                  total={tabOrder.length}
                  visible={tabVisibility[id]}
                  colors={colors}
                  onVisible={setTabVisible}
                  onMove={moveTab}
                />
              ))}
            </View>
            <Pressable
              onPress={() =>
                Alert.alert(
                  "Вернуть все вкладки?",
                  "Вернутся исходный порядок, подписи, а все необязательные разделы снова появятся в нижней панели.",
                  [
                    { text: "Отмена", style: "cancel" },
                    { text: "Вернуть", onPress: resetTabs },
                  ],
                )
              }
              style={({ pressed }) => [
                widgetControlStyles.resetButton,
                { borderColor: colors.border, opacity: pressed ? 0.65 : 1 },
              ]}
            >
              <Text
                style={[
                  widgetControlStyles.resetText,
                  { color: colors.foreground },
                ]}
              >
                ПОКАЗАТЬ ВСЕ ВКЛАДКИ
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={!isSectionVisible("appearance") && styles.hiddenSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            SVG-иконки
          </Text>
          <View
            style={[
              styles.iconThemeCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.iconThemeTitle, { color: colors.foreground }]}>
              Цвет интерфейсных иконок
            </Text>
            <Text style={[styles.iconThemeHint, { color: colors.muted }]}>
              Меняет акцентные SVG-иконки в web-версии без повторной загрузки
              шрифтов.
            </Text>
            <View style={styles.iconThemeOptions}>
              {SVG_ICON_THEMES.map((theme) => {
                const selected = theme.id === svgIconTheme.id;
                return (
                  <Pressable
                    key={theme.id}
                    onPress={() => setThemeId(theme.id)}
                    style={({ pressed }) => [
                      styles.iconThemeOption,
                      {
                        borderColor: selected ? theme.color : colors.border,
                        backgroundColor: selected
                          ? `${theme.color}16`
                          : colors.background,
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.iconThemeSwatch,
                        { backgroundColor: theme.color },
                      ]}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.iconThemeOptionTitle,
                          { color: colors.foreground },
                        ]}
                      >
                        {theme.title}
                      </Text>
                      <Text
                        style={[
                          styles.iconThemeOptionHint,
                          { color: colors.muted },
                        ]}
                      >
                        {theme.description}
                      </Text>
                    </View>
                    {selected && (
                      <IconSymbol
                        name="checkmark"
                        size={18}
                        color={theme.color}
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        <View style={!isSectionVisible("appearance") && styles.hiddenSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Стартовый экран
          </Text>
          <View
            style={[
              styles.vibrationCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.vibrationTitle, { color: colors.foreground }]}>
              Длительность заставки
            </Text>
            <Text style={[styles.vibrationHint, { color: colors.muted }]}>
              Настройте время показа фирменного экрана IronRise после короткой
              нативной заставки Android.
            </Text>
            <View style={styles.vibrationOptions}>
              {LAUNCH_SPLASH_DURATION_OPTIONS.map((option) => {
                const selected = option.value === launchSplashDuration;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => selectLaunchSplashDuration(option.value)}
                    style={({ pressed }) => [
                      styles.vibrationOption,
                      {
                        backgroundColor: selected
                          ? `${colors.primary}18`
                          : colors.background,
                        borderColor: selected ? colors.primary : colors.border,
                        opacity: pressed ? 0.72 : 1,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.vibrationRadio,
                        {
                          borderColor: selected ? colors.primary : colors.muted,
                        },
                      ]}
                    >
                      {selected && (
                        <View
                          style={[
                            styles.vibrationRadioDot,
                            { backgroundColor: colors.primary },
                          ]}
                        />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.vibrationOptionTitle,
                          { color: colors.foreground },
                        ]}
                      >
                        {option.title}
                      </Text>
                      <Text
                        style={[
                          styles.vibrationOptionHint,
                          { color: colors.muted },
                        ]}
                      >
                        {option.description}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        <View style={!isSectionVisible("training") && styles.hiddenSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Таймер отдыха
          </Text>
          <View
            style={[
              styles.restSoundCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={[styles.vibrationTitle, { color: colors.foreground }]}
              >
                Звук окончания отдыха
              </Text>
              <Text style={[styles.vibrationHint, { color: colors.muted }]}>
                {restTimerSoundEnabled
                  ? "Выберите сигнал для Android-уведомления по завершении отдыха."
                  : "Окончание отдыха будет без звукового сигнала."}
              </Text>
            </View>
            <Switch
              value={restTimerSoundEnabled}
              onValueChange={setRestTimerSoundEnabled}
              trackColor={{ false: colors.border, true: `${colors.primary}88` }}
              thumbColor={restTimerSoundEnabled ? colors.primary : colors.muted}
            />
          </View>
          {restTimerSoundEnabled && (
            <View
              style={[
                styles.vibrationCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text
                style={[styles.vibrationTitle, { color: colors.foreground }]}
              >
                Сигнал завершения
              </Text>
              <View style={styles.vibrationOptions}>
                {restCompletionSoundOptions.map((option) => {
                  const selected = option.id === restTimerCompletionSound;
                  return (
                    <Pressable
                      key={option.id}
                      onPress={() => setRestTimerCompletionSound(option.id)}
                      style={({ pressed }) => [
                        styles.vibrationOption,
                        {
                          backgroundColor: selected
                            ? `${colors.primary}18`
                            : colors.background,
                          borderColor: selected
                            ? colors.primary
                            : colors.border,
                          opacity: pressed ? 0.72 : 1,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.vibrationRadio,
                          {
                            borderColor: selected
                              ? colors.primary
                              : colors.muted,
                          },
                        ]}
                      >
                        {selected && (
                          <View
                            style={[
                              styles.vibrationRadioDot,
                              { backgroundColor: colors.primary },
                            ]}
                          />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.vibrationOptionTitle,
                            { color: colors.foreground },
                          ]}
                        >
                          {option.title}
                        </Text>
                        <Text
                          style={[
                            styles.vibrationOptionHint,
                            { color: colors.muted },
                          ]}
                        >
                          {option.description}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
              <CompletionVolumeSlider
                value={restTimerCompletionVolume}
                onChange={setRestTimerCompletionVolume}
                colors={colors}
              />
              <Pressable
                onPress={() => void previewRestCompletionSound()}
                style={({ pressed }) => [
                  styles.soundPreviewButton,
                  {
                    backgroundColor: colors.primary,
                    opacity: pressed ? 0.76 : 1,
                  },
                ]}
              >
                <Text style={styles.soundPreviewButtonText}>
                  Предпрослушать сигнал
                </Text>
              </Pressable>
            </View>
          )}
          <View
            style={[
              styles.restSoundCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={[styles.vibrationTitle, { color: colors.foreground }]}
              >
                Вибрация вместе со звуком
              </Text>
              <Text style={[styles.vibrationHint, { color: colors.muted }]}>
                {restTimerSoundEnabled
                  ? restTimerVibrationEnabled
                    ? "Короткий тактильный сигнал дополнит звук окончания отдыха."
                    : "Окончание отдыха пройдёт только со звуком."
                  : "Сначала включите звуковой сигнал завершения отдыха."}
              </Text>
            </View>
            <Switch
              value={restTimerVibrationEnabled}
              disabled={!restTimerSoundEnabled}
              onValueChange={setRestTimerVibrationEnabled}
              trackColor={{ false: colors.border, true: `${colors.primary}88` }}
              thumbColor={
                restTimerVibrationEnabled && restTimerSoundEnabled
                  ? colors.primary
                  : colors.muted
              }
            />
          </View>
          {restTimerSoundEnabled && restTimerVibrationEnabled && (
            <View
              style={[
                styles.vibrationCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text
                style={[styles.vibrationTitle, { color: colors.foreground }]}
              >
                Паттерн вибрации
              </Text>
              <View style={styles.vibrationOptions}>
                {restCompletionVibrationOptions.map((option) => {
                  const selected = option.id === restTimerVibrationPattern;
                  return (
                    <Pressable
                      key={option.id}
                      onPress={() => setRestTimerVibrationPattern(option.id)}
                      style={({ pressed }) => [
                        styles.vibrationOption,
                        {
                          backgroundColor: selected
                            ? `${colors.primary}18`
                            : colors.background,
                          borderColor: selected
                            ? colors.primary
                            : colors.border,
                          opacity: pressed ? 0.72 : 1,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.vibrationRadio,
                          {
                            borderColor: selected
                              ? colors.primary
                              : colors.muted,
                          },
                        ]}
                      >
                        {selected && (
                          <View
                            style={[
                              styles.vibrationRadioDot,
                              { backgroundColor: colors.primary },
                            ]}
                          />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.vibrationOptionTitle,
                            { color: colors.foreground },
                          ]}
                        >
                          {option.title}
                        </Text>
                        <Text
                          style={[
                            styles.vibrationOptionHint,
                            { color: colors.muted },
                          ]}
                        >
                          {option.description}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
          <View
            style={[
              styles.vibrationCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.vibrationTitle, { color: colors.foreground }]}>
              Вибрация при завершении подхода
            </Text>
            <Text style={[styles.vibrationHint, { color: colors.muted }]}>
              Интенсивность сохраняется на этом устройстве. В веб-просмотре
              вибрация не запускается.
            </Text>
            <View style={styles.vibrationOptions}>
              {hapticIntensityOptions.map((option) => {
                const selected = option.id === hapticIntensity;
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => setHapticIntensity(option.id)}
                    style={({ pressed }) => [
                      styles.vibrationOption,
                      {
                        backgroundColor: selected
                          ? `${colors.primary}18`
                          : colors.background,
                        borderColor: selected ? colors.primary : colors.border,
                        opacity: pressed ? 0.72 : 1,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.vibrationRadio,
                        {
                          borderColor: selected ? colors.primary : colors.muted,
                        },
                      ]}
                    >
                      {selected && (
                        <View
                          style={[
                            styles.vibrationRadioDot,
                            { backgroundColor: colors.primary },
                          ]}
                        />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.vibrationOptionTitle,
                          { color: colors.foreground },
                        ]}
                      >
                        {option.title}
                      </Text>
                      <Text
                        style={[
                          styles.vibrationOptionHint,
                          { color: colors.muted },
                        ]}
                      >
                        {option.description}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        <View style={!isSectionVisible("reminders") && styles.hiddenSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Напоминания о тренировках
          </Text>
          <View
            style={[
              styles.notificationCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.notificationHeader}>
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.vibrationTitle, { color: colors.foreground }]}
                >
                  Локальные уведомления
                </Text>
                <Text style={[styles.vibrationHint, { color: colors.muted }]}>
                  {notificationsEnabled
                    ? "Новые планы в календаре получат напоминание по этим настройкам."
                    : "Новые планы сохраняются без системного напоминания."}
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={(enabled) =>
                  setNotificationPreferences({
                    notificationsEnabled: enabled,
                    defaultWorkoutTime,
                    defaultReminderMinutes,
                  })
                }
                trackColor={{
                  false: colors.border,
                  true: `${colors.primary}88`,
                }}
                thumbColor={
                  notificationsEnabled ? colors.primary : colors.muted
                }
              />
            </View>
            <View style={styles.notificationFields}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { color: colors.muted }]}>
                  Время по умолчанию
                </Text>
                <TextInput
                  value={notificationTime}
                  onChangeText={setNotificationTime}
                  onEndEditing={() =>
                    setNotificationPreferences({
                      notificationsEnabled,
                      defaultWorkoutTime: notificationTime,
                      defaultReminderMinutes,
                    })
                  }
                  placeholder="18:30"
                  placeholderTextColor={colors.muted}
                  style={[
                    styles.field,
                    {
                      color: colors.foreground,
                      borderColor: colors.border,
                      backgroundColor: colors.background,
                    },
                  ]}
                />
              </View>
              <View style={{ flex: 1.35 }}>
                <Text style={[styles.fieldLabel, { color: colors.muted }]}>
                  Напомнить за
                </Text>
                <View style={styles.notificationMinutes}>
                  {[15, 30, 60, 120].map((minutes) => (
                    <Pressable
                      key={minutes}
                      onPress={() =>
                        setNotificationPreferences({
                          notificationsEnabled,
                          defaultWorkoutTime:
                            notificationTime || defaultWorkoutTime,
                          defaultReminderMinutes: minutes,
                        })
                      }
                      style={[
                        styles.notificationMinute,
                        {
                          backgroundColor:
                            defaultReminderMinutes === minutes
                              ? colors.primary
                              : colors.background,
                          borderColor:
                            defaultReminderMinutes === minutes
                              ? colors.primary
                              : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color:
                            defaultReminderMinutes === minutes
                              ? "#101412"
                              : colors.foreground,
                          fontSize: 10,
                          fontWeight: "900",
                        }}
                      >
                        {minutes}м
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={!isSectionVisible("training") && styles.hiddenSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Упражнения с весом тела
          </Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Для тоннажа приложение использует заданную долю массы тела:
            например, приседания или отжимания.
          </Text>
          <View style={styles.bodyFields}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldLabel, { color: colors.muted }]}>
                Вес тела, кг
              </Text>
              <TextInput
                value={bodyWeight}
                onChangeText={setBodyWeight}
                keyboardType="decimal-pad"
                onEndEditing={() =>
                  setBodyweightVolumeSettings(
                    Number(bodyWeight) || bodyWeightKg,
                    Number(bodyPercent) || bodyweightVolumePercent,
                  )
                }
                style={[
                  styles.field,
                  {
                    color: colors.foreground,
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                  },
                ]}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldLabel, { color: colors.muted }]}>
                Учитывать, %
              </Text>
              <TextInput
                value={bodyPercent}
                onChangeText={setBodyPercent}
                keyboardType="number-pad"
                onEndEditing={() =>
                  setBodyweightVolumeSettings(
                    Number(bodyWeight) || bodyWeightKg,
                    Number(bodyPercent) || bodyweightVolumePercent,
                  )
                }
                style={[
                  styles.field,
                  {
                    color: colors.foreground,
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                  },
                ]}
              />
            </View>
          </View>
        </View>

        <View style={!isSectionVisible("body") && styles.hiddenSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Профиль тела
          </Text>
          <View
            style={[
              styles.densityCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.iconThemeTitle, { color: colors.foreground }]}>
              Силуэт и расчёты
            </Text>
            <Text style={[styles.iconThemeHint, { color: colors.muted }]}>
              Профиль, рост и возраст используются только в локальных расчётах
              ИМТ и калорийного ориентира.
            </Text>
            <View style={styles.bodyProfileChoices}>
              {(
                [
                  {
                    id: "male",
                    title: "Мужчина",
                    hint: "Широкие плечи · узкая талия",
                  },
                  {
                    id: "female",
                    title: "Женщина",
                    hint: "Мягкая линия плеч · акцент на бёдра",
                  },
                ] as const
              ).map((option) => {
                const active = bodyProfile === option.id;
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => setBodyProfile(option.id)}
                    style={({ pressed }) => [
                      styles.bodyProfileChoice,
                      {
                        borderColor: active ? colors.primary : colors.border,
                        backgroundColor: active
                          ? `${colors.primary}13`
                          : colors.background,
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.bodyProfileMark,
                        {
                          backgroundColor: active
                            ? colors.primary
                            : colors.border,
                        },
                      ]}
                    >
                      {active && <Text style={styles.bodyProfileCheck}>✓</Text>}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.bodyProfileTitle,
                          { color: colors.foreground },
                        ]}
                      >
                        {option.title}
                      </Text>
                      <Text
                        style={[
                          styles.bodyProfileHint,
                          { color: colors.muted },
                        ]}
                      >
                        {option.hint}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.bodyFields}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { color: colors.muted }]}>
                  Рост, см
                </Text>
                <TextInput
                  value={heightDraft}
                  onChangeText={setHeightDraft}
                  onEndEditing={saveBodyDetails}
                  keyboardType="number-pad"
                  placeholder="175"
                  placeholderTextColor={colors.muted}
                  style={[
                    styles.field,
                    {
                      color: colors.foreground,
                      borderColor: colors.border,
                      backgroundColor: colors.background,
                    },
                  ]}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { color: colors.muted }]}>
                  Возраст, лет
                </Text>
                <TextInput
                  value={ageDraft}
                  onChangeText={setAgeDraft}
                  onEndEditing={saveBodyDetails}
                  keyboardType="number-pad"
                  placeholder="30"
                  placeholderTextColor={colors.muted}
                  style={[
                    styles.field,
                    {
                      color: colors.foreground,
                      borderColor: colors.border,
                      backgroundColor: colors.background,
                    },
                  ]}
                />
              </View>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Цели параметров тела
          </Text>
          <View
            style={[
              styles.densityCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.iconThemeTitle, { color: colors.foreground }]}>
              Вес и обхваты
            </Text>
            <Text style={[styles.iconThemeHint, { color: colors.muted }]}>
              Целевые линии появятся в графиках на вкладке «Тело». Оставьте поле
              пустым, чтобы скрыть ориентир.
            </Text>
            <View style={styles.goalFields}>
              {BODY_METRICS.filter((metric) => metric.id !== "bodyFatPct").map(
                (metric) => (
                  <View key={metric.id} style={styles.goalField}>
                    <Text style={[styles.fieldLabel, { color: colors.muted }]}>
                      {metric.label}, {metric.unit}
                    </Text>
                    <TextInput
                      value={bodyGoalDrafts[metric.id] ?? ""}
                      onChangeText={(value) =>
                        setBodyGoalDrafts((current) => ({
                          ...current,
                          [metric.id]: value,
                        }))
                      }
                      onEndEditing={saveBodyGoals}
                      keyboardType="decimal-pad"
                      placeholder="—"
                      placeholderTextColor={colors.muted}
                      style={[
                        styles.field,
                        {
                          color: colors.foreground,
                          borderColor: colors.border,
                          backgroundColor: colors.background,
                        },
                      ]}
                    />
                  </View>
                ),
              )}
            </View>
          </View>
        </View>

        <View style={!isSectionVisible("data") && styles.hiddenSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Groq AI
          </Text>
          <View
            style={[
              styles.groqCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.groqHeader}>
              <View
                style={[
                  styles.groqIcon,
                  { backgroundColor: `${colors.primary}17` },
                ]}
              >
                <SafeMaterialIcon
                  name="auto-awesome"
                  size={20}
                  color={colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.groqTitle, { color: colors.foreground }]}>
                  Личный API-ключ Groq
                </Text>
                <Text style={[styles.groqSubtitle, { color: colors.muted }]}>
                  {hasGroqKey
                    ? "Ключ сохранён на этом устройстве. Можно заменить его в любой момент."
                    : "Добавь ключ, чтобы создавать программы через Groq AI."}
                </Text>
              </View>
              <Text
                style={[
                  styles.groqStatus,
                  {
                    color: hasGroqKey ? colors.success : colors.muted,
                    backgroundColor: hasGroqKey
                      ? `${colors.success}18`
                      : colors.border,
                  },
                ]}
              >
                {hasGroqKey ? "ГОТОВО" : "НЕТ КЛЮЧА"}
              </Text>
            </View>
            <View style={styles.groqActions}>
              <Pressable
                onPress={openGroqKeySheet}
                style={[
                  styles.groqPrimary,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Text style={styles.groqPrimaryText}>
                  {hasGroqKey ? "Обновить ключ" : "Добавить ключ"}
                </Text>
              </Pressable>
              {hasGroqKey && (
                <Pressable
                  onPress={deleteGroqKey}
                  style={[styles.groqDelete, { borderColor: colors.error }]}
                >
                  <Text
                    style={[styles.groqDeleteText, { color: colors.error }]}
                  >
                    Удалить
                  </Text>
                </Pressable>
              )}
            </View>
            <Text style={[styles.groqPrivacy, { color: colors.muted }]}>
              {Platform.OS === "web"
                ? "Не вводи рабочий ключ в веб-просмотре."
                : "Ключ хранится в защищённом системном хранилище Android и не добавляется в APK."}
            </Text>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Health Connect
          </Text>
          <View
            style={[
              styles.groqCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.groqHeader}>
              <View
                style={[
                  styles.groqIcon,
                  { backgroundColor: `${colors.primary}17` },
                ]}
              >
                <SafeMaterialIcon
                  name="monitor-heart"
                  size={20}
                  color={colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.groqTitle, { color: colors.foreground }]}>
                  Пульс со смарт-часов
                </Text>
                <Text style={[styles.groqSubtitle, { color: colors.muted }]}>
                  {healthConnectStatus.message}
                </Text>
              </View>
              <Text
                style={[
                  styles.groqStatus,
                  {
                    color: healthConnectStatus.heartRateGranted
                      ? colors.success
                      : colors.muted,
                    backgroundColor: healthConnectStatus.heartRateGranted
                      ? `${colors.success}18`
                      : colors.border,
                  },
                ]}
              >
                {healthConnectStatus.heartRateGranted
                  ? "ГОТОВО"
                  : "НЕТ ДОСТУПА"}
              </Text>
            </View>
            <View style={styles.groqActions}>
              <Pressable
                onPress={connectHealthConnect}
                style={[
                  styles.groqPrimary,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Text style={styles.groqPrimaryText}>
                  {healthConnectStatus.state === "permission-required"
                    ? "Подключить пульс"
                    : "Проверить Health Connect"}
                </Text>
              </Pressable>
            </View>
            <View
              style={[
                styles.widgetFeedbackRow,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.widgetTitle, { color: colors.foreground }]}
                >
                  Пульс на экране блокировки
                </Text>
                <Text style={[styles.widgetHint, { color: colors.muted }]}>
                  {lockScreenHeartRateVisible
                    ? "Текущая ЧСС видна рядом с целью во время отдыха."
                    : "ЧСС скрыта из уведомления таймера отдыха."}
                </Text>
              </View>
              <Switch
                value={lockScreenHeartRateVisible}
                onValueChange={(value) => {
                  setLockScreenHeartRateVisible(value);
                  void saveLockScreenHeartRateVisible(value);
                }}
                trackColor={{
                  false: colors.border,
                  true: `${colors.primary}88`,
                }}
                thumbColor={
                  lockScreenHeartRateVisible ? colors.primary : colors.muted
                }
              />
            </View>
            <Text style={[styles.groqPrivacy, { color: colors.muted }]}>
              IronRise читает только данные пульса за время тренировки и
              сохраняет среднее и пиковое значение локально.
            </Text>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Локальное хранилище
          </Text>
          <View
            style={[
              styles.storageCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.storageHeader}>
              <View
                style={[
                  styles.storageIcon,
                  { backgroundColor: `${colors.primary}17` },
                ]}
              >
                <SafeMaterialIcon
                  name="storage"
                  size={22}
                  color={colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.storageTitle, { color: colors.foreground }]}
                >
                  Данные на этом устройстве
                </Text>
                <Text style={[styles.storageSubtitle, { color: colors.muted }]}>
                  {storageLoading
                    ? "Считаем размер тренировок, фото и кэша…"
                    : storageError
                      ? "Не удалось прочитать объём. Попробуйте обновить."
                      : "Тренировки, настройки и офлайн-файлы хранятся только локально."}
                </Text>
              </View>
              <Pressable
                onPress={refreshStorageUsage}
                accessibilityLabel="Обновить объём хранилища"
                style={({ pressed }) => [
                  styles.refreshStorage,
                  { borderColor: colors.border, opacity: pressed ? 0.65 : 1 },
                ]}
              >
                <SafeMaterialIcon
                  name="refresh"
                  size={19}
                  color={colors.primary}
                />
              </Pressable>
            </View>

            {storageUsage && !storageLoading && !storageError && (
              <>
                <View style={styles.storageNumbers}>
                  <View>
                    <Text
                      style={[
                        styles.storageNumberLabel,
                        { color: colors.muted },
                      ]}
                    >
                      ЗАНЯТО ПРИЛОЖЕНИЕМ
                    </Text>
                    <Text
                      style={[
                        styles.storageNumber,
                        { color: colors.foreground },
                      ]}
                    >
                      {formatStorageBytes(storageUsage.appDataBytes)}
                    </Text>
                  </View>
                  <View style={styles.storageNumberRight}>
                    <Text
                      style={[
                        styles.storageNumberLabel,
                        { color: colors.muted },
                      ]}
                    >
                      СВОБОДНО НА УСТРОЙСТВЕ
                    </Text>
                    <Text
                      style={[styles.storageFree, { color: colors.primary }]}
                    >
                      {formatStorageBytes(storageUsage.freeBytes)}
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.storageTrack,
                    { backgroundColor: colors.border },
                  ]}
                >
                  <View
                    style={[
                      styles.storageDeviceFill,
                      {
                        width: `${deviceUsedPercent}%`,
                        backgroundColor: `${colors.muted}55`,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.storageAppFill,
                      {
                        width: `${appBarWidth}%`,
                        backgroundColor: colors.primary,
                      },
                    ]}
                  />
                </View>
                <View style={styles.storageLegend}>
                  <View style={styles.legendItem}>
                    <View
                      style={[
                        styles.legendMark,
                        { backgroundColor: colors.primary },
                      ]}
                    />
                    <Text style={[styles.legendText, { color: colors.muted }]}>
                      Приложение:{" "}
                      {appSharePercent < 0.1 && storageUsage.appDataBytes
                        ? "<0,1"
                        : appSharePercent.toFixed(1)}
                      %
                    </Text>
                  </View>
                  <Text style={[styles.legendText, { color: colors.muted }]}>
                    Устройство: {formatStorageBytes(deviceUsedBytes)} /{" "}
                    {formatStorageBytes(storageUsage.totalBytes)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.storageBreakdown,
                    { borderTopColor: colors.border },
                  ]}
                >
                  <Text style={[styles.breakdownText, { color: colors.muted }]}>
                    Данные тренировок:{" "}
                    {formatStorageBytes(storageUsage.asyncStorageBytes)}
                  </Text>
                  <Text style={[styles.breakdownText, { color: colors.muted }]}>
                    Файлы и офлайн-фото:{" "}
                    {formatStorageBytes(storageUsage.filesBytes)}
                  </Text>
                </View>
              </>
            )}
          </View>

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Резервная копия
          </Text>
          <View
            style={[
              styles.backupCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.storageHeader}>
              <View
                style={[
                  styles.storageIcon,
                  { backgroundColor: `${colors.primary}17` },
                ]}
              >
                <SafeMaterialIcon
                  name="backup"
                  size={22}
                  color={colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.storageTitle, { color: colors.foreground }]}
                >
                  Файл для переноса данных
                </Text>
                <Text style={[styles.storageSubtitle, { color: colors.muted }]}>
                  Сохраните ZIP через системное меню в «Загрузки» или другую
                  папку телефона. Файл не удаляется вместе с приложением.
                </Text>
              </View>
            </View>
            {lastBackupPreview && (
              <Text style={[styles.backupMeta, { color: colors.muted }]}>
                Последняя выбранная копия: {lastBackupPreview.storageEntryCount}{" "}
                записей · {lastBackupPreview.mediaFileCount} фото
              </Text>
            )}
            <Text style={[styles.backupMeta, { color: colors.muted }]}>
              {lastBackupRecord
                ? `Последняя успешная копия: ${new Date(lastBackupRecord.createdAt).toLocaleString("ru-RU")}`
                : "Резервная копия ещё не создавалась."}
            </Text>
            <Text style={[styles.backupHint, { color: colors.muted }]}>
              {backupReminderPreferences.enabled
                ? backupReminderPreferences.frequency === "weekly"
                  ? "IronRise напомнит о новой копии раз в неделю системным уведомлением."
                  : "IronRise напомнит о новой копии раз в месяц системным уведомлением."
                : "Системные напоминания о резервной копии отключены."}
            </Text>
            <View
              style={[
                styles.backupReminderRow,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.backupReminderTitle,
                    { color: colors.foreground },
                  ]}
                >
                  Напоминать о копии
                </Text>
                <Text
                  style={[styles.backupReminderText, { color: colors.muted }]}
                >
                  Системное уведомление в 10:00 по местному времени.
                </Text>
              </View>
              <Switch
                value={backupReminderPreferences.enabled}
                onValueChange={(enabled) =>
                  void updateBackupReminderPreferences({ enabled })
                }
                trackColor={{
                  false: colors.border,
                  true: `${colors.primary}88`,
                }}
                thumbColor={
                  backupReminderPreferences.enabled
                    ? colors.primary
                    : colors.muted
                }
              />
            </View>
            {backupReminderPreferences.enabled && (
              <View style={styles.backupFrequencyRow}>
                {(
                  [
                    ["weekly", "Раз в неделю"],
                    ["monthly", "Раз в месяц"],
                  ] as const
                ).map(([frequency, title]) => {
                  const selected =
                    backupReminderPreferences.frequency === frequency;
                  return (
                    <Pressable
                      key={frequency}
                      onPress={() =>
                        void updateBackupReminderPreferences({
                          frequency: frequency as BackupReminderFrequency,
                        })
                      }
                      style={({ pressed }) => [
                        styles.backupFrequencyOption,
                        {
                          backgroundColor: selected
                            ? colors.primary
                            : colors.background,
                          borderColor: selected
                            ? colors.primary
                            : colors.border,
                          opacity: pressed ? 0.72 : 1,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.backupFrequencyText,
                          { color: selected ? "#FFFDF8" : colors.foreground },
                        ]}
                      >
                        {title}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
            <View style={styles.backupActions}>
              <Pressable
                disabled={backupBusy}
                onPress={() => void createBackup()}
                style={({ pressed }) => [
                  styles.backupPrimary,
                  {
                    backgroundColor: colors.primary,
                    opacity: backupBusy || pressed ? 0.68 : 1,
                  },
                ]}
              >
                <SafeMaterialIcon name="save-alt" size={18} color="#FFFDF8" />
                <Text style={styles.backupPrimaryText}>
                  {backupBusy ? "ПОДГОТОВКА…" : "СОЗДАТЬ КОПИЮ"}
                </Text>
              </Pressable>
              <Pressable
                disabled={backupBusy}
                onPress={() => void chooseBackup()}
                style={({ pressed }) => [
                  styles.backupSecondary,
                  {
                    borderColor: colors.border,
                    opacity: backupBusy || pressed ? 0.68 : 1,
                  },
                ]}
              >
                <SafeMaterialIcon
                  name="restore"
                  size={18}
                  color={colors.foreground}
                />
                <Text
                  style={[
                    styles.backupSecondaryText,
                    { color: colors.foreground },
                  ]}
                >
                  ВОССТАНОВИТЬ ИЗ ФАЙЛА
                </Text>
              </Pressable>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Офлайн-фотографии
          </Text>
          <View
            style={[
              styles.offlineCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.offlineHeader}>
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.offlineTitle, { color: colors.foreground }]}
                >
                  Скачать все ракурсы по Wi‑Fi
                </Text>
                <Text style={[styles.offlineSubtitle, { color: colors.muted }]}>
                  {bulkState.message}
                </Text>
              </View>
              <Text style={[styles.offlinePercent, { color: colors.primary }]}>
                {bulkState.loading || bulkState.total
                  ? `${photoProgress}%`
                  : "Wi‑Fi"}
              </Text>
            </View>
            <View
              style={[styles.progressTrack, { backgroundColor: colors.border }]}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${photoProgress}%`,
                    backgroundColor: colors.primary,
                  },
                ]}
              />
            </View>
            <Pressable
              onPress={downloadPhotos}
              disabled={bulkState.loading}
              style={[
                styles.downloadButton,
                {
                  backgroundColor: colors.primary,
                  opacity: bulkState.loading ? 0.6 : 1,
                },
              ]}
            >
              <Text style={styles.downloadText}>
                {bulkState.loading
                  ? "Загружаем фотографии…"
                  : "Скачать для офлайн-режима"}
              </Text>
            </Pressable>
            <Text style={[styles.wifiHint, { color: colors.muted }]}>
              Загрузка запускается только через Wi‑Fi с доступом в интернет.
              Мобильные данные не используются.
            </Text>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Данные и инструменты
          </Text>
          {links.map((link) => (
            <Pressable
              key={link.route}
              onPress={() => router.push(link.route as never)}
              style={[
                styles.link,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.linkTitle, { color: colors.foreground }]}>
                  {link.title}
                </Text>
                <Text style={[styles.linkSubtitle, { color: colors.muted }]}>
                  {link.subtitle}
                </Text>
              </View>
              <IconSymbol name="chevron.right" size={20} color={colors.muted} />
            </Pressable>
          ))}
          <View
            style={[
              styles.note,
              {
                backgroundColor: colors.surface,
                borderLeftColor: colors.primary,
              },
            ]}
          >
            <IconSymbol
              name="checkmark.circle"
              size={20}
              color={colors.primary}
            />
            <Text style={[styles.noteText, { color: colors.muted }]}>
              Тренировки, настройки, рекорды и экспортируемые файлы сохраняются
              на этом устройстве. Для переноса используйте экспорт в CSV или
              ZIP.
            </Text>
          </View>
        </View>
        {normalizedSettingsQuery.length > 0 && !matchingCategories.length && (
          <View
            style={[
              styles.searchEmpty,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.iconThemeTitle, { color: colors.foreground }]}>
              Ничего не найдено
            </Text>
            <Text style={[styles.iconThemeHint, { color: colors.muted }]}>
              Попробуйте «вибрация», «калории», «уведомления» или «экспорт».
            </Text>
            <Pressable
              onPress={() => setSettingsQuery("")}
              style={({ pressed }) => [
                styles.searchEmptyAction,
                { borderColor: colors.primary, opacity: pressed ? 0.68 : 1 },
              ]}
            >
              <Text
                style={[
                  widgetControlStyles.resetText,
                  { color: colors.primary },
                ]}
              >
                ОЧИСТИТЬ ПОИСК
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
      <Modal
        visible={keySheetVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setKeySheetVisible(false)}
      >
        <View style={styles.backdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.sheetKeyboard}
          >
            <View
              style={[styles.sheet, { backgroundColor: colors.background }]}
            >
              <View style={styles.sheetHeader}>
                <View>
                  <Text
                    style={[styles.sheetTitle, { color: colors.foreground }]}
                  >
                    {hasGroqKey ? "Обновить ключ Groq" : "Добавить ключ Groq"}
                  </Text>
                  <Text style={[styles.sheetHint, { color: colors.muted }]}>
                    Новый ключ заменит предыдущий на этом устройстве.
                  </Text>
                </View>
                <Pressable
                  onPress={() => setKeySheetVisible(false)}
                  style={[styles.close, { backgroundColor: colors.surface }]}
                >
                  <Text
                    style={[styles.closeText, { color: colors.foreground }]}
                  >
                    ×
                  </Text>
                </Pressable>
              </View>
              <TextInput
                value={keyDraft}
                onChangeText={setKeyDraft}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="gsk_…"
                placeholderTextColor={colors.muted}
                style={[
                  styles.keyInput,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.foreground,
                  },
                ]}
              />
              <Pressable
                disabled={savingGroqKey}
                onPress={saveGroqKey}
                style={[
                  styles.saveKey,
                  {
                    backgroundColor: colors.primary,
                    opacity: savingGroqKey ? 0.6 : 1,
                  },
                ]}
              >
                <Text style={styles.saveKeyText}>
                  {savingGroqKey ? "Сохраняем…" : "Сохранить на устройстве"}
                </Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

function WidgetSettingsRow({
  widget,
  index,
  total,
  visible,
  compact,
  colors,
  onVisible,
  onCompact,
  onMove,
}: {
  widget: (typeof HOME_WIDGETS)[number];
  index: number;
  total: number;
  visible: boolean;
  compact: boolean;
  colors: any;
  onVisible: (id: HomeWidgetId, value: boolean) => void;
  onCompact: (id: HomeWidgetId, value: boolean) => void;
  onMove: (id: HomeWidgetId, position: number) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const pan = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 4,
    onPanResponderGrant: () => setDragging(true),
    onPanResponderRelease: (_, gesture) => {
      setDragging(false);
      onMove(
        widget.id,
        Math.max(0, Math.min(total - 1, index + Math.round(gesture.dy / 68))),
      );
    },
    onPanResponderTerminate: () => setDragging(false),
  });
  return (
    <View
      style={[
        styles.widgetOption,
        widgetControlStyles.widgetRow,
        {
          borderColor: dragging ? colors.primary : colors.border,
          backgroundColor: colors.background,
        },
      ]}
    >
      <View
        {...pan.panHandlers}
        style={[
          widgetControlStyles.dragHandle,
          {
            borderColor: colors.border,
            backgroundColor: dragging ? `${colors.primary}14` : colors.surface,
          },
        ]}
      >
        <Text style={[widgetControlStyles.dragMark, { color: colors.primary }]}>
          ⠿
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.widgetTitle, { color: colors.foreground }]}>
          {widget.title}
        </Text>
        <Text style={[styles.widgetHint, { color: colors.muted }]}>
          {widget.description}
        </Text>
        <Text style={[widgetControlStyles.modeHint, { color: colors.muted }]}>
          {compact ? "Компактный режим" : "Обычный размер"}
        </Text>
      </View>
      <View style={widgetControlStyles.switches}>
        <Switch
          value={compact}
          onValueChange={(value) => onCompact(widget.id, value)}
          trackColor={{ false: colors.border, true: `${colors.primary}88` }}
          thumbColor={compact ? colors.primary : colors.muted}
        />
        <Switch
          value={visible}
          onValueChange={(value) => onVisible(widget.id, value)}
          trackColor={{ false: colors.border, true: `${colors.primary}88` }}
          thumbColor={visible ? colors.primary : colors.muted}
        />
      </View>
    </View>
  );
}

function TabVisibilityRow({
  tab,
  index,
  total,
  visible,
  colors,
  onVisible,
  onMove,
}: {
  tab: (typeof MAIN_TABS)[number];
  index: number;
  total: number;
  visible: boolean;
  colors: any;
  onVisible: (id: MainTabId, value: boolean) => void;
  onMove: (id: MainTabId, position: number) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const pan = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 4,
    onPanResponderGrant: () => {
      setDragging(true);
      triggerTabDragHaptic("start");
    },
    onPanResponderRelease: (_, gesture) => {
      setDragging(false);
      const destination = Math.max(
        0,
        Math.min(total - 1, index + Math.round(gesture.dy / 68)),
      );
      if (destination === index) return;
      if (Platform.OS === "android")
        UIManager.setLayoutAnimationEnabledExperimental?.(true);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      onMove(tab.id, destination);
      triggerTabDragHaptic("move");
    },
    onPanResponderTerminate: () => setDragging(false),
  });
  return (
    <View
      style={[
        styles.widgetOption,
        {
          borderColor: dragging ? colors.primary : colors.border,
          backgroundColor: colors.background,
        },
      ]}
    >
      <View
        {...pan.panHandlers}
        style={[
          widgetControlStyles.dragHandle,
          {
            borderColor: colors.border,
            backgroundColor: dragging ? `${colors.primary}14` : colors.surface,
          },
        ]}
      >
        <Text style={[widgetControlStyles.dragMark, { color: colors.primary }]}>
          ⠿
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.widgetTitle, { color: colors.foreground }]}>
          {tab.settingsTitle}
        </Text>
        <Text style={[styles.widgetHint, { color: colors.muted }]}>
          {tab.description}
        </Text>
        {tab.required && (
          <Text
            style={[widgetControlStyles.modeHint, { color: colors.primary }]}
          >
            Всегда доступна
          </Text>
        )}
      </View>
      <Switch
        value={visible}
        disabled={tab.required}
        onValueChange={(value) => onVisible(tab.id, value)}
        trackColor={{ false: colors.border, true: `${colors.primary}88` }}
        thumbColor={visible ? colors.primary : colors.muted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 16, paddingBottom: 34, gap: 14 },
  header: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { fontSize: 16, fontWeight: "800" },
  settingsSearch: {
    minHeight: 48,
    borderWidth: 1,
    borderLeftWidth: 5,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  settingsSearchInput: {
    flex: 1,
    minHeight: 46,
    fontSize: 14,
    fontWeight: "800",
  },
  searchClear: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryTabs: { gap: 7, paddingRight: 10 },
  categoryTab: {
    minHeight: 36,
    borderWidth: 1,
    paddingHorizontal: 11,
    justifyContent: "center",
  },
  categoryTabText: { fontSize: 10, fontWeight: "900", letterSpacing: 0.25 },
  searchResultHint: { fontSize: 10, lineHeight: 15, marginTop: -4 },
  hiddenSection: { display: "none" },
  searchEmpty: { borderWidth: 1, borderLeftWidth: 5, padding: 14, gap: 8 },
  searchEmptyAction: {
    alignSelf: "flex-start",
    minHeight: 36,
    borderWidth: 1,
    paddingHorizontal: 10,
    justifyContent: "center",
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginTop: 10,
  },
  title: { fontSize: 28, fontWeight: "800", marginTop: 5 },
  subtitle: { fontSize: 12, lineHeight: 18, marginTop: 4 },
  options: { gap: 10, marginTop: 10 },
  option: {
    borderWidth: 1,
    borderRadius: 0,
    borderLeftWidth: 5,
    padding: 14,
    flexDirection: "row",
    gap: 12,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  radioDot: { width: 11, height: 11, borderRadius: 6 },
  optionTitle: { fontSize: 14, fontWeight: "900" },
  optionFormula: { fontSize: 11, fontWeight: "900", marginTop: 5 },
  optionDescription: { fontSize: 11, lineHeight: 16, marginTop: 7 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.35,
    marginTop: 12,
  },
  stepRow: { flexDirection: "row", gap: 9 },
  step: {
    flex: 1,
    minHeight: 44,
    borderRadius: 0,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconThemeCard: {
    borderWidth: 1,
    borderRadius: 0,
    borderLeftWidth: 5,
    padding: 14,
    gap: 10,
  },
  iconThemeTitle: { fontSize: 14, fontWeight: "900" },
  iconThemeHint: { fontSize: 11, lineHeight: 16 },
  iconThemeOptions: { gap: 8 },
  iconThemeOption: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 0,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  iconThemeSwatch: { width: 18, height: 18, borderRadius: 9 },
  iconThemeOptionTitle: { fontSize: 12, fontWeight: "900" },
  iconThemeOptionHint: { fontSize: 10, marginTop: 2 },
  appThemeCard: {
    borderWidth: 1,
    borderRadius: 0,
    borderLeftWidth: 5,
    padding: 14,
    gap: 10,
  },
  appThemeGrid: { gap: 8 },
  appThemeOption: {
    minHeight: 58,
    borderWidth: 1,
    borderRadius: 0,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  appThemeSwatch: { width: 20, height: 20, borderRadius: 0 },
  appThemeName: { fontSize: 12, fontWeight: "900" },
  appThemeHint: { fontSize: 10, marginTop: 2 },
  densityCard: {
    borderWidth: 1,
    borderRadius: 0,
    borderLeftWidth: 5,
    padding: 14,
    gap: 10,
  },
  densityOptions: { flexDirection: "row", gap: 8 },
  densityOption: {
    flex: 1,
    minHeight: 72,
    borderWidth: 1,
    borderRadius: 0,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  densitySample: { fontWeight: "900", letterSpacing: -1 },
  vibrationCard: {
    borderWidth: 1,
    borderRadius: 0,
    borderLeftWidth: 5,
    padding: 14,
    gap: 10,
  },
  restSoundCard: {
    borderWidth: 1,
    borderRadius: 0,
    borderLeftWidth: 5,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  vibrationTitle: { fontSize: 14, fontWeight: "900" },
  vibrationHint: { fontSize: 11, lineHeight: 16 },
  soundPreviewButton: {
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
  },
  soundPreviewButtonText: { color: "#101412", fontSize: 12, fontWeight: "900" },
  volumeWrap: { gap: 8, marginTop: 14 },
  volumeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  volumeValue: { fontSize: 13, fontWeight: "900", letterSpacing: 0.2 },
  volumeTrack: {
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    overflow: "visible",
  },
  volumeFill: { position: "absolute", left: 0, height: 4, borderRadius: 2 },
  volumeThumb: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    marginLeft: -10,
  },
  vibrationOptions: { gap: 8 },
  vibrationOption: {
    minHeight: 54,
    borderWidth: 1,
    borderRadius: 0,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  vibrationRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  vibrationRadioDot: { width: 9, height: 9, borderRadius: 5 },
  vibrationOptionTitle: { fontSize: 12, fontWeight: "900" },
  vibrationOptionHint: { fontSize: 10, marginTop: 2 },
  notificationCard: {
    borderWidth: 1,
    borderRadius: 0,
    borderLeftWidth: 5,
    padding: 14,
    gap: 11,
  },
  notificationHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  notificationFields: { flexDirection: "row", gap: 9 },
  notificationMinutes: { flexDirection: "row", gap: 4 },
  notificationMinute: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  bodyFields: { flexDirection: "row", gap: 9 },
  goalFields: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  goalField: { width: "47.7%" },
  bodyProfileChoices: { flexDirection: "row", gap: 8 },
  bodyProfileChoice: {
    flex: 1,
    minHeight: 74,
    borderWidth: 1,
    borderRadius: 0,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bodyProfileMark: {
    width: 19,
    height: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  bodyProfileCheck: { color: "#FFFDF8", fontSize: 13, fontWeight: "900" },
  bodyProfileTitle: { fontSize: 12, fontWeight: "900" },
  bodyProfileHint: { fontSize: 9, lineHeight: 13, marginTop: 3 },
  fieldLabel: { fontSize: 10, fontWeight: "800", marginBottom: 5 },
  strengthStepLabel: { marginTop: 4 },
  field: {
    height: 48,
    borderWidth: 1,
    borderRadius: 0,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: "900",
  },
  macroGoalRow: { flexDirection: "row", gap: 8 },
  macroGoalField: { flex: 1 },
  calorieGuide: {
    borderWidth: 1,
    padding: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  calorieGuideValue: { fontSize: 17, fontWeight: "900", letterSpacing: -0.4 },
  calorieGuideHint: { fontSize: 9, lineHeight: 13, marginTop: 3 },
  applyGuide: {
    minHeight: 36,
    paddingHorizontal: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  applyGuideText: {
    color: "#FFFDF8",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.45,
  },
  widgetOptions: { gap: 8 },
  widgetOption: {
    minHeight: 58,
    borderWidth: 1,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  widgetFeedbackRow: {
    minHeight: 62,
    borderWidth: 1,
    borderLeftWidth: 5,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  widgetTitle: { fontSize: 12, fontWeight: "900" },
  widgetHint: { fontSize: 10, lineHeight: 14, marginTop: 3 },
  groqCard: {
    borderWidth: 1,
    borderRadius: 0,
    borderLeftWidth: 5,
    padding: 14,
    gap: 11,
  },
  groqHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  groqIcon: {
    width: 40,
    height: 40,
    borderRadius: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  groqTitle: { fontSize: 14, fontWeight: "900" },
  groqSubtitle: { fontSize: 11, lineHeight: 16, marginTop: 3 },
  groqStatus: {
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 7,
    overflow: "hidden",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  groqActions: { flexDirection: "row", gap: 8 },
  groqPrimary: {
    flex: 1,
    minHeight: 43,
    borderRadius: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  groqPrimaryText: { color: "#101412", fontSize: 12, fontWeight: "900" },
  groqDelete: {
    minHeight: 43,
    borderWidth: 1,
    borderRadius: 0,
    paddingHorizontal: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  groqDeleteText: { fontSize: 12, fontWeight: "900" },
  groqPrivacy: { fontSize: 10, lineHeight: 14 },
  storageCard: {
    borderWidth: 1,
    borderRadius: 0,
    borderLeftWidth: 5,
    padding: 14,
    gap: 11,
  },
  storageHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  storageIcon: {
    width: 42,
    height: 42,
    borderRadius: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  storageTitle: { fontSize: 14, fontWeight: "900" },
  storageSubtitle: { fontSize: 11, lineHeight: 16, marginTop: 3 },
  refreshStorage: {
    width: 35,
    height: 35,
    borderRadius: 0,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  storageNumbers: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  storageNumberRight: { alignItems: "flex-end" },
  storageNumberLabel: { fontSize: 9, fontWeight: "900", letterSpacing: 0.65 },
  storageNumber: { fontSize: 22, fontWeight: "900", marginTop: 4 },
  storageFree: { fontSize: 15, fontWeight: "900", marginTop: 6 },
  storageTrack: {
    height: 10,
    borderRadius: 5,
    overflow: "hidden",
    position: "relative",
  },
  storageDeviceFill: { ...StyleSheet.absoluteFillObject, borderRadius: 5 },
  storageAppFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 5,
  },
  storageLegend: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    alignItems: "center",
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5, flex: 1 },
  legendMark: { width: 7, height: 7, borderRadius: 4 },
  legendText: { fontSize: 10, lineHeight: 14, textAlign: "right" },
  storageBreakdown: { borderTopWidth: 1, paddingTop: 9, gap: 3 },
  breakdownText: { fontSize: 10, lineHeight: 15 },
  backupCard: {
    borderWidth: 1,
    borderRadius: 0,
    borderLeftWidth: 5,
    padding: 14,
    gap: 12,
  },
  backupMeta: { fontSize: 10, lineHeight: 15 },
  backupHint: { fontSize: 10, lineHeight: 15, marginTop: -5 },
  backupReminderRow: {
    minHeight: 64,
    borderWidth: 1,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  backupReminderTitle: { fontSize: 12, fontWeight: "900" },
  backupReminderText: { fontSize: 10, lineHeight: 14, marginTop: 3 },
  backupFrequencyRow: { flexDirection: "row", gap: 8 },
  backupFrequencyOption: {
    flex: 1,
    minHeight: 38,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  backupFrequencyText: { fontSize: 10, fontWeight: "900" },
  backupActions: { gap: 8 },
  backupPrimary: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  backupPrimaryText: {
    color: "#FFFDF8",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  backupSecondary: {
    minHeight: 46,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  backupSecondaryText: { fontSize: 11, fontWeight: "900", letterSpacing: 0.5 },
  offlineCard: {
    borderWidth: 1,
    borderRadius: 0,
    borderLeftWidth: 5,
    padding: 14,
    gap: 11,
  },
  offlineHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  offlineTitle: { fontSize: 14, fontWeight: "900" },
  offlineSubtitle: { fontSize: 11, lineHeight: 16, marginTop: 4 },
  offlinePercent: { fontSize: 15, fontWeight: "900" },
  progressTrack: { height: 7, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4, minWidth: 0 },
  downloadButton: {
    minHeight: 46,
    borderRadius: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  downloadText: { color: "#101412", fontSize: 13, fontWeight: "900" },
  wifiHint: { fontSize: 10, lineHeight: 15 },
  link: {
    minHeight: 67,
    borderRadius: 0,
    borderWidth: 1,
    borderLeftWidth: 5,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  linkTitle: { fontSize: 14, fontWeight: "900" },
  linkSubtitle: { fontSize: 11, lineHeight: 16, marginTop: 4 },
  note: {
    borderRadius: 0,
    borderLeftWidth: 5,
    padding: 14,
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },
  noteText: { flex: 1, fontSize: 11, lineHeight: 16 },
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "#090611B8",
  },
  sheetKeyboard: { width: "100%" },
  sheet: {
    padding: 20,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    gap: 12,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  sheetTitle: { fontSize: 19, fontWeight: "900" },
  sheetHint: { fontSize: 11, marginTop: 3 },
  close: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: { fontSize: 23, lineHeight: 25 },
  keyInput: {
    height: 52,
    borderWidth: 1,
    borderRadius: 0,
    paddingHorizontal: 13,
    fontSize: 14,
    fontWeight: "900",
  },
  saveKey: {
    minHeight: 52,
    borderRadius: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  saveKeyText: { color: "#101412", fontSize: 13, fontWeight: "900" },
});

const widgetControlStyles = StyleSheet.create({
  widgetRow: { minHeight: 72, paddingHorizontal: 8, gap: 8 },
  dragHandle: {
    width: 34,
    height: 42,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dragMark: { fontSize: 19, lineHeight: 20, fontWeight: "900" },
  modeHint: {
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.45,
    marginTop: 4,
  },
  switches: { gap: 4, alignItems: "center" },
  resetButton: {
    minHeight: 42,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  resetText: { fontSize: 10, fontWeight: "900", letterSpacing: 0.6 },
});
