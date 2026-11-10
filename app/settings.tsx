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
  Image,
} from "react-native";
import { setAudioModeAsync, useAudioPlayer } from "expo-audio";
import Constants from "expo-constants";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { SafeMaterialIcon } from "@/components/ui/safe-material-icon";
import { useColors } from "@/hooks/use-colors";
import { useBottomActionInset } from "@/lib/use-bottom-inset";
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
  chooseLocalBackupFolder,
  createLocalBackup,
  listAvailableLocalBackups,
  pickLocalBackup,
  restoreLocalBackup,
  shareLocalBackupFile,
  type AvailableLocalBackup,
  type LocalBackupFile,
  type LocalBackupProgress,
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
  connectHealthConnectActivity,
  getHealthConnectStatus,
  type HealthConnectStatus,
} from "@/lib/health-connect";
import {
  loadLockScreenHeartRateVisible,
  saveLockScreenHeartRateVisible,
} from "@/lib/lock-screen-heart-rate-privacy";
import {
  connectBodyScale,
  getBodyScaleStatus,
  loadBodySyncState,
  saveBodyScaleAutoSync,
  syncBodyWeighIns,
  type BodyScaleStatus,
} from "@/lib/health-connect-body-sync";
import { authorizeGoogleFit, getGoogleFitStatus, type GoogleFitStatus } from "@/lib/google-fit";
import { HEALTH_SOURCE_OPTIONS, useHealthSource } from "@/lib/health-source";
import { useLanguage } from "@/lib/i18n";
import type { DictKey, Lang } from "@/lib/i18n";

// Подписи опций живут в словаре домена settings: в массивах — только ключи,
// текст подставляется через t() в момент отрисовки.
const formulas: {
  id: OneRepMaxFormula;
  titleKey: DictKey;
  formulaKey: DictKey;
  descriptionKey: DictKey;
}[] = [
  {
    id: "epley",
    titleKey: "settings.strength.formula.epley.title",
    formulaKey: "settings.strength.formula.epley.formula",
    descriptionKey: "settings.strength.formula.epley.description",
  },
  {
    id: "brzycki",
    titleKey: "settings.strength.formula.brzycki.title",
    formulaKey: "settings.strength.formula.brzycki.formula",
    descriptionKey: "settings.strength.formula.brzycki.description",
  },
];

const hapticIntensityOptions: {
  id: SetHapticIntensity;
  titleKey: DictKey;
  descriptionKey: DictKey;
}[] = [
  {
    id: "light",
    titleKey: "settings.hapticOption.light.title",
    descriptionKey: "settings.hapticOption.light.description",
  },
  {
    id: "medium",
    titleKey: "settings.hapticOption.medium.title",
    descriptionKey: "settings.hapticOption.medium.description",
  },
  {
    id: "heavy",
    titleKey: "settings.hapticOption.heavy.title",
    descriptionKey: "settings.hapticOption.heavy.description",
  },
];
const restCompletionSoundOptions: {
  id: RestCompletionSound;
  titleKey: DictKey;
  descriptionKey: DictKey;
}[] = [
  {
    id: "female",
    titleKey: "settings.restTimer.soundOption.female.title",
    descriptionKey: "settings.restTimer.soundOption.female.description",
  },
  {
    id: "male",
    titleKey: "settings.restTimer.soundOption.male.title",
    descriptionKey: "settings.restTimer.soundOption.male.description",
  },
  {
    id: "siren",
    titleKey: "settings.restTimer.soundOption.siren.title",
    descriptionKey: "settings.restTimer.soundOption.siren.description",
  },
];
const restCompletionVibrationOptions: {
  id: RestCompletionVibrationPattern;
  titleKey: DictKey;
  descriptionKey: DictKey;
}[] = [
  {
    id: "short",
    titleKey: "settings.restTimer.vibrationOption.short.title",
    descriptionKey: "settings.restTimer.vibrationOption.short.description",
  },
  {
    id: "long",
    titleKey: "settings.restTimer.vibrationOption.long.title",
    descriptionKey: "settings.restTimer.vibrationOption.long.description",
  },
  {
    id: "pulse",
    titleKey: "settings.restTimer.vibrationOption.pulse.title",
    descriptionKey: "settings.restTimer.vibrationOption.pulse.description",
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
  const { t } = useLanguage();
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
          {t("settings.restTimer.volumeTitle")}
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
        accessibilityLabel={t("settings.restTimer.volumeA11y", {
          percent: Math.round(value * 100),
        })}
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
        {t("settings.restTimer.volumeHint")}
      </Text>
    </View>
  );
}
const themeModeChoices = APP_COLOR_THEMES.filter(
  (theme) => theme.id === "editorial" || theme.id === "midnight",
);
const designVariantChoices = APP_COLOR_THEMES.filter(
  (theme) =>
    theme.id === "dark-energy" ||
    theme.id === "light-minimal" ||
    theme.id === "bold-neon",
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
  titleKey: DictKey;
  // Ключевые слова поиска не показываются в интерфейсе: здесь и русские,
  // и английские синонимы, чтобы поиск настроек работал на обоих языках.
  keywords: string[];
}[] = [
  {
    id: "training",
    titleKey: "settings.category.training",
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
      "training",
      "set",
      "weight",
      "plates",
      "timer",
      "rest",
      "sound",
      "vibration",
    ],
  },
  {
    id: "home",
    titleKey: "settings.category.home",
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
      "home",
      "today",
      "widget",
      "tab",
      "bottom bar",
      "navigation",
      "drag",
      "quote",
      "vibration",
    ],
  },
  {
    id: "appearance",
    titleKey: "settings.category.appearance",
    keywords: [
      "внешний",
      "стиль",
      "тема",
      "цвет",
      "иконки",
      "плотность",
      "текст",
      "appearance",
      "style",
      "theme",
      "color",
      "icons",
      "density",
      "text",
    ],
  },
  {
    id: "body",
    titleKey: "settings.category.body",
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
      "nutrition",
      "calories",
      "activity",
      "movement",
      "macros",
      "protein",
      "fat",
      "carbs",
      "body",
      "height",
      "age",
      "goal",
      "girth",
    ],
  },
  {
    id: "reminders",
    titleKey: "settings.category.reminders",
    keywords: [
      "напоминание",
      "уведомление",
      "время",
      "календарь",
      "reminder",
      "notification",
      "time",
      "calendar",
    ],
  },
  {
    id: "data",
    titleKey: "settings.category.data",
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
      "весы",
      "okok",
      "состав тела",
      "инструменты",
      "приватность",
      "экран блокировки",
      "язык",
      "data",
      "storage",
      "photos",
      "offline",
      "export",
      "import",
      "pulse",
      "heart rate",
      "watch",
      "scale",
      "body composition",
      "tools",
      "privacy",
      "lock screen",
      "language",
    ],
  },
];

// Переключатель языка: подписи языков показываются на самих языках,
// поэтому их ключи ведут на одно и то же значение в обоих словарях.
const LANGUAGE_OPTIONS: { id: Lang; labelKey: DictKey }[] = [
  { id: "ru", labelKey: "settings.language.optionRu" },
  { id: "en", labelKey: "settings.language.optionEn" },
];

export default function SettingsScreen() {
  const colors = useColors();
  const { lang, setLang, t } = useLanguage();
  // Даты и поиск форматируются по выбранному языку, а не жёстко по ru-RU.
  const locale = lang === "en" ? "en-US" : "ru-RU";
  const keySheetBottomInset = useBottomActionInset(20);
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
    addMeasurement: addBodyMeasurement,
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
    message: t("settings.offline.initialMessage"),
  });
  const [storageUsage, setStorageUsage] = useState<LocalStorageUsage | null>(
    null,
  );
  const [storageLoading, setStorageLoading] = useState(true);
  const [storageError, setStorageError] = useState(false);
  const [backupBusy, setBackupBusy] = useState(false);
  const [backupProgress, setBackupProgress] =
    useState<LocalBackupProgress | null>(null);
  const [lastBackupPreview, setLastBackupPreview] =
    useState<LocalBackupPreview | null>(null);
  const [lastCreatedBackup, setLastCreatedBackup] =
    useState<LocalBackupFile | null>(null);
  const [availableBackups, setAvailableBackups] = useState<
    AvailableLocalBackup[]
  >([]);
  const [backupListBusy, setBackupListBusy] = useState(false);
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
      activityGranted: false,
      message: t("settings.health.checking"),
    });
  const [lockScreenHeartRateVisible, setLockScreenHeartRateVisible] =
    useState(true);
  const [bodyScaleStatus, setBodyScaleStatus] = useState<BodyScaleStatus>({
    state: "unsupported",
    granted: false,
    message: t("settings.bodyScale.checking"),
  });
  const [bodyScaleSyncing, setBodyScaleSyncing] = useState(false);
  const [bodyScaleSyncMessage, setBodyScaleSyncMessage] = useState<
    string | null
  >(null);
  const [bodyScaleAutoSync, setBodyScaleAutoSync] = useState(true);
  // Источник данных о здоровье: Google Fit — основной, Health Connect — резерв.
  const { source: healthSource, setSource: setHealthSource } = useHealthSource();
  const [googleFitStatus, setGoogleFitStatus] = useState<GoogleFitStatus>({
    state: "unavailable",
    message: t("settings.googleFit.checking"),
  });
  const [googleFitConnecting, setGoogleFitConnecting] = useState(false);
  const [settingsCategory, setSettingsCategory] =
    useState<SettingsCategoryId>("training");
  const [settingsQuery, setSettingsQuery] = useState("");
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
      title: t("settings.links.barbell.title"),
      subtitle: t("settings.links.barbell.subtitle"),
      route: "/barbell" as const,
    },
    {
      title: t("settings.links.recommendations.title"),
      subtitle: t("settings.links.recommendations.subtitle"),
      route: "/recommendations" as const,
    },
    {
      title: t("settings.links.progress.title"),
      subtitle: t("settings.links.progress.subtitle"),
      route: "/progress" as const,
    },
    {
      title: t("settings.links.export.title"),
      subtitle: t("settings.links.export.subtitle"),
      route: "/export" as const,
    },
    {
      title: t("settings.links.import.title"),
      subtitle: t("settings.links.import.subtitle"),
      route: "/import" as const,
    },
    {
      title: t("settings.links.compare.title"),
      subtitle: t("settings.links.compare.subtitle"),
      route: "/compare" as const,
    },
    {
      title: t("settings.links.report.title"),
      subtitle: t("settings.links.report.subtitle"),
      route: "/report" as const,
    },
  ];

  const previewRestCompletionSound = useCallback(async () => {
    // Предпрослушивание всегда через expo-audio: нативный RingtoneManager
    // на части устройств (в т.ч. Huawei) молча не проигрывает raw-ресурсы,
    // а expo-audio — тот же проверенный путь, что и сигнал завершения в
    // приложении, плюс он учитывает ползунок громкости.
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
    void listAvailableLocalBackups().then(setAvailableBackups);
    void getGroqApiKey()
      .then((key) => setHasGroqKey(Boolean(key)))
      .catch(() => setHasGroqKey(false));
    void getGoogleFitStatus().then(setGoogleFitStatus);
    void loadLockScreenHeartRateVisible().then(setLockScreenHeartRateVisible);
    void getBodyScaleStatus().then(setBodyScaleStatus);
    void loadBodySyncState().then((state) =>
      setBodyScaleAutoSync(state.autoSyncEnabled),
    );
  }, [refreshStorageUsage]);
  // Статус Health Connect приходит вместе с текстом сообщения, поэтому
  // запрашивается отдельно от остальных данных — при смене языка он
  // перечитывается, а загрузка бэкапов и ключей повторно не запускается.
  useEffect(() => {
    void getHealthConnectStatus(lang).then(setHealthConnectStatus);
  }, [lang]);
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
        t("settings.groq.saveErrorTitle"),
        error instanceof Error ? error.message : t("settings.common.retry"),
      );
    } finally {
      setSavingGroqKey(false);
    }
  };
  const deleteGroqKey = () =>
    Alert.alert(
      t("settings.groq.deleteConfirmTitle"),
      t("settings.groq.deleteConfirmMessage"),
      [
        { text: t("settings.common.cancel"), style: "cancel" },
        {
          text: t("settings.common.delete"),
          style: "destructive",
          onPress: () => {
            void clearGroqApiKey()
              .then(() => setHasGroqKey(false))
              .catch(() =>
                Alert.alert(t("settings.groq.deleteErrorTitle"), t("settings.common.retry")),
              );
          },
        },
      ],
    );
  const connectHealthConnect = () =>
    void connectHealthConnectActivity(lang).then(setHealthConnectStatus);
  const connectGoogleFit = () => {
    setGoogleFitConnecting(true);
    void authorizeGoogleFit()
      .then(setGoogleFitStatus)
      .catch(() =>
        setGoogleFitStatus({
          state: "error",
          message: t("settings.googleFit.authError"),
        }),
      )
      .finally(() => setGoogleFitConnecting(false));
  };
  const runBodyScaleSync = (force: boolean) => {
    setBodyScaleSyncing(true);
    void syncBodyWeighIns({ force, addMeasurement: addBodyMeasurement })
      .then((result) => {
        setBodyScaleStatus((current) =>
          result.granted === false
            ? {
                ...current,
                granted: false,
                message:
                  healthSource === "google-fit"
                    ? t("settings.bodyScale.googleFitRequired")
                    : t("settings.bodyScale.permissionRequired"),
              }
            : current,
        );
        setBodyScaleSyncMessage(
          result.granted === false
            ? healthSource === "google-fit"
              ? t("settings.bodyScale.syncNeedsFit")
              : t("settings.bodyScale.syncNeedsScale")
            : result.created > 0
              ? t("settings.bodyScale.syncCreated", { count: result.created })
              : t("settings.bodyScale.syncNoNew"),
        );
      })
      .catch(() =>
        setBodyScaleSyncMessage(
          t("settings.bodyScale.syncError"),
        ),
      )
      .finally(() => setBodyScaleSyncing(false));
  };
  const connectBodyScalePermissions = () =>
    void connectBodyScale().then((status) => {
      setBodyScaleStatus(status);
      if (status.granted) runBodyScaleSync(true);
    });
  const toggleBodyScaleAutoSync = (value: boolean) => {
    setBodyScaleAutoSync(value);
    void saveBodyScaleAutoSync(value).catch(() => setBodyScaleAutoSync(!value));
  };
  const healthConnectFullyGranted =
    healthConnectStatus.heartRateGranted && healthConnectStatus.activityGranted;
  const healthConnectBadgeText = healthConnectFullyGranted
    ? t("settings.health.badgeReady")
    : healthConnectStatus.heartRateGranted
      ? t("settings.health.badgeHeartRate")
      : healthConnectStatus.activityGranted
        ? t("settings.health.badgeActivity")
        : t("settings.health.badgeNoAccess");
  const healthConnectGrantedAny =
    healthConnectStatus.heartRateGranted || healthConnectStatus.activityGranted;

  const downloadPhotos = async () => {
    setBulkState((state) => ({
      ...state,
      loading: true,
      completed: 0,
      total: 0,
      message: t("settings.offline.checkingWifi"),
    }));
    const result = await cacheAllExercisePhotosOnWifi((completed, total) =>
      setBulkState((state) => ({
        ...state,
        completed,
        total,
        message: t("settings.offline.progress", { completed, total }),
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
    setBackupProgress({ value: 4, label: t("settings.backup.progressCreating") });
    try {
      const backup = await createLocalBackup(setBackupProgress);
      const result = await recordSuccessfulLocalBackup({
        createdAt: backup.exportedAt,
        storageEntryCount: backup.storageEntryCount,
        mediaFileCount: backup.mediaFileCount,
      });
      setLastBackupPreview(backup);
      setLastCreatedBackup(backup);
      setLastBackupRecord(result.record);
      setAvailableBackups(await listAvailableLocalBackups());
      Alert.alert(
        t("settings.backup.savedTitle"),
        t("settings.backup.savedMessage", {
          purged: backup.deletedOldBackups
            ? t("settings.backup.purgedSuffix", {
                count: backup.deletedOldBackups,
              })
            : "",
        }),
      );
    } catch (error) {
      Alert.alert(
        t("settings.backup.createErrorTitle"),
        error instanceof Error ? error.message : t("settings.common.retryFormal"),
      );
    } finally {
      setBackupBusy(false);
      setBackupProgress(null);
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
        t("settings.backup.reminderUpdateErrorTitle"),
        t("settings.backup.reminderUpdateErrorMessage"),
      );
    }
  };
  const applyBackup = async (backup: LocalBackupPayload) => {
    setBackupBusy(true);
    setBackupProgress({ value: 4, label: t("settings.backup.progressRestoring") });
    try {
      await restoreLocalBackup(backup, setBackupProgress);
      setLastBackupPreview({
        exportedAt: backup.exportedAt,
        storageEntryCount: backup.storageEntryCount,
        mediaFileCount: backup.mediaFileCount,
      });
      Alert.alert(
        t("settings.backup.restoredTitle"),
        t("settings.backup.restoredMessage"),
      );
    } catch (error) {
      Alert.alert(
        t("settings.backup.restoreErrorTitle"),
        error instanceof Error
          ? error.message
          : t("settings.backup.restoreErrorMessage"),
      );
    } finally {
      setBackupBusy(false);
      setBackupProgress(null);
    }
  };
  const chooseBackup = async () => {
    setBackupBusy(true);
    try {
      const backup = await pickLocalBackup();
      if (!backup) return;
      Alert.alert(
        t("settings.backup.confirmTitle"),
        t("settings.backup.confirmMessage", {
          date: new Date(backup.exportedAt).toLocaleString(locale),
          entries: backup.storageEntryCount,
          photos: backup.mediaFileCount,
        }),
        [
          { text: t("settings.common.cancel"), style: "cancel" },
          {
            text: t("settings.backup.confirmRestore"),
            style: "destructive",
            onPress: () => void applyBackup(backup),
          },
        ],
      );
    } catch (error) {
      Alert.alert(
        t("settings.backup.badFileTitle"),
        error instanceof Error
          ? error.message
          : t("settings.backup.badFileMessage"),
      );
    } finally {
      setBackupBusy(false);
    }
  };
  const confirmBackupRestore = (backup: LocalBackupPayload) => {
    Alert.alert(
      t("settings.backup.confirmTitle"),
      t("settings.backup.confirmMessage", {
          date: new Date(backup.exportedAt).toLocaleString(locale),
          entries: backup.storageEntryCount,
          photos: backup.mediaFileCount,
        }),
      [
        { text: t("settings.common.cancel"), style: "cancel" },
        {
          text: t("settings.backup.confirmRestore"),
          style: "destructive",
          onPress: () => void applyBackup(backup),
        },
      ],
    );
  };
  const chooseBackupFolder = async () => {
    setBackupListBusy(true);
    try {
      setAvailableBackups(await chooseLocalBackupFolder());
    } catch {
      Alert.alert(
        t("settings.backup.folderErrorTitle"),
        t("settings.backup.folderErrorMessage"),
      );
    } finally {
      setBackupListBusy(false);
    }
  };
  const refreshBackupList = async () => {
    setBackupListBusy(true);
    try {
      setAvailableBackups(await listAvailableLocalBackups());
    } finally {
      setBackupListBusy(false);
    }
  };
  const shareLatestBackup = async () => {
    const backup =
      lastCreatedBackup ??
      availableBackups.find((item) => item.source === "app");
    if (!backup) {
      Alert.alert(
        t("settings.backup.noCopyTitle"),
        t("settings.backup.noCopyMessage"),
      );
      return;
    }
    try {
      await shareLocalBackupFile(backup);
    } catch (error) {
      Alert.alert(
        t("settings.backup.shareErrorTitle"),
        error instanceof Error ? error.message : t("settings.common.retryFormalShort"),
      );
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
    .toLocaleLowerCase(locale);
  const matchingCategories = useMemo(
    () =>
      SETTINGS_CATEGORIES.filter(
        (category) =>
          !normalizedSettingsQuery ||
          [t(category.titleKey), ...category.keywords].some((term) =>
            term.toLocaleLowerCase(locale).includes(normalizedSettingsQuery),
          ),
      ),
    [locale, normalizedSettingsQuery, t],
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
            {t("settings.header.title")}
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
            placeholder={t("settings.search.placeholder")}
            placeholderTextColor={colors.muted}
            returnKeyType="done"
            style={[styles.settingsSearchInput, { color: colors.foreground }]}
          />
          {settingsQuery.length > 0 && (
            <Pressable
              onPress={() => setSettingsQuery("")}
              accessibilityLabel={t("settings.search.clearA11y")}
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
                  {t(category.titleKey)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View
          style={[
            styles.languageCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.iconThemeTitle, { color: colors.foreground }]}>
            {t("settings.language.sectionTitle")}
          </Text>
          <View style={styles.languageOptions}>
            {LANGUAGE_OPTIONS.map((option) => {
              const selected = option.id === lang;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => setLang(option.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={t("settings.language.selectedA11y", {
                    language: t(option.labelKey),
                  })}
                  style={({ pressed }) => [
                    styles.languageOption,
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
                  <Text
                    style={[
                      styles.languageOptionText,
                      { color: colors.foreground },
                    ]}
                  >
                    {t(option.labelKey)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={[styles.iconThemeHint, { color: colors.muted }]}>
            {t("settings.language.hint")}
          </Text>
        </View>

        {normalizedSettingsQuery.length > 0 && (
          <Text style={[styles.searchResultHint, { color: colors.muted }]}>
            {matchingCategories.length
              ? t("settings.search.resultHint", {
                categories: matchingCategories
                  .map((category) => t(category.titleKey))
                  .join(" · "),
              })
              : t("settings.search.emptyHint")}
          </Text>
        )}

        <View style={!isSectionVisible("training") && styles.hiddenSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {t("settings.strength.sectionTitle")}
          </Text>
          <View
            style={[
              styles.densityCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.iconThemeTitle, { color: colors.foreground }]}>
              {t("settings.strength.formulaTitle")}
            </Text>
            <Text style={[styles.iconThemeHint, { color: colors.muted }]}>
              {t("settings.strength.formulaHint")}
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
                        {t(option.titleKey)}
                      </Text>
                      <Text
                        style={[
                          styles.optionFormula,
                          { color: colors.primary },
                        ]}
                      >
                        {t(option.formulaKey)}
                      </Text>
                      <Text
                        style={[
                          styles.optionDescription,
                          { color: colors.muted },
                        ]}
                      >
                        {t(option.descriptionKey)}
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
              {t("settings.strength.stepWeightLabel")}
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
                    {t("settings.strength.stepKg", { step })}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        <View style={!isSectionVisible("appearance") && styles.hiddenSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {t("settings.appearance.themeTitle")}
          </Text>
          <View
            style={[
              styles.appThemeCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.iconThemeTitle, { color: colors.foreground }]}>
              {t("settings.appearance.themeSubtitle")}
            </Text>
            <Text style={[styles.iconThemeHint, { color: colors.muted }]}>
              {t("settings.appearance.themeHint")}
            </Text>
            <View style={styles.appThemeGrid}>
              {themeModeChoices.map((theme) => {
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
                        {theme.id === "editorial" ? t("settings.appearance.themeLightBadge") : t("settings.appearance.themeDarkBadge")}
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
                          ? t("settings.appearance.themeLightHint")
                          : t("settings.appearance.themeDarkHint")}
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

          <View
            style={[
              styles.appThemeCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.iconThemeTitle, { color: colors.foreground }]}>
              {t("settings.appearance.variantsTitle")}
            </Text>
            <Text style={[styles.iconThemeHint, { color: colors.muted }]}>
              {t("settings.appearance.variantsHint")}
            </Text>
            <View style={styles.appThemeGrid}>
              {designVariantChoices.map((theme) => {
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
                        {theme.title}
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
                        {theme.hint}
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
            {t("settings.appearance.densityTitle")}
          </Text>
          <View
            style={[
              styles.densityCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.iconThemeTitle, { color: colors.foreground }]}>
              {t("settings.appearance.densitySubtitle")}
            </Text>
            <Text style={[styles.iconThemeHint, { color: colors.muted }]}>
              {t("settings.appearance.densityHint")}
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
            {t("settings.nutrition.sectionTitle")}
          </Text>
          <View
            style={[
              styles.densityCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.iconThemeTitle, { color: colors.foreground }]}>
              {t("settings.nutrition.activityTitle")}
            </Text>
            <Text style={[styles.iconThemeHint, { color: colors.muted }]}>
              {t("settings.nutrition.activityHint")}
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
              {t("settings.nutrition.goalsTitle")}
            </Text>
            <Text style={[styles.iconThemeHint, { color: colors.muted }]}>
              {t("settings.nutrition.goalsHint")}
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
                  {t("settings.nutrition.autoGuideBadge")}
                </Text>
                <Text
                  style={[
                    styles.calorieGuideValue,
                    { color: colors.foreground },
                  ]}
                >
                  {calorieGuide === undefined
                    ? t("settings.nutrition.autoGuideMissing")
                    : t("settings.nutrition.autoGuideValue", { calories: calorieGuide })}
                </Text>
                <Text
                  style={[styles.calorieGuideHint, { color: colors.muted }]}
                >
                  {calorieGuide === undefined
                    ? t("settings.nutrition.autoGuideWeightSource")
                    : t("settings.nutrition.autoGuideFormula")}
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
                  <Text style={styles.applyGuideText}>
                    {t("settings.nutrition.applyGuide")}
                  </Text>
                </Pressable>
              )}
            </View>
            <Text style={[styles.fieldLabel, { color: colors.muted }]}>
              {t("settings.nutrition.calorieGoalLabel")}
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
                  ["protein", t("settings.nutrition.proteinLabel"), "150"],
                  ["fat", t("settings.nutrition.fatLabel"), "70"],
                  ["carbs", t("settings.nutrition.carbsLabel"), "250"],
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
            {t("settings.home.sectionTitle")}
          </Text>
          <View
            style={[
              styles.densityCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.iconThemeTitle, { color: colors.foreground }]}>
              {t("settings.home.widgetsTitle")}
            </Text>
            <Text style={[styles.iconThemeHint, { color: colors.muted }]}>
              {t("settings.home.widgetsHint")}
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
                  {t("settings.home.dragHapticsTitle")}
                </Text>
                <Text style={[styles.widgetHint, { color: colors.muted }]}>
                  {dragHapticsEnabled
                    ? t("settings.home.dragHapticsHintOn")
                    : t("settings.home.dragHapticsHintOff")}
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
                  t("settings.home.resetWidgetsConfirmTitle"),
                  t("settings.home.resetWidgetsConfirmMessage"),
                  [
                    { text: t("settings.common.cancel"), style: "cancel" },
                    {
                      text: t("settings.home.resetWidgetsConfirmAction"),
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
                {t("settings.home.resetWidgetsCta")}
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
              {t("settings.home.tabsTitle")}
            </Text>
            <Text style={[styles.iconThemeHint, { color: colors.muted }]}>
              {t("settings.home.tabsHint")}
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
                  {t("settings.home.compactMode")}
                </Text>
                <Text style={[styles.widgetHint, { color: colors.muted }]}>
                  {tabCompact
                    ? t("settings.home.compactHintOn")
                    : t("settings.home.compactHintOff")}
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
                  t("settings.home.resetTabsConfirmTitle"),
                  t("settings.home.resetTabsConfirmMessage"),
                  [
                    { text: t("settings.common.cancel"), style: "cancel" },
                    { text: t("settings.home.resetTabsConfirmAction"), onPress: resetTabs },
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
                {t("settings.home.showAllTabsCta")}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={!isSectionVisible("appearance") && styles.hiddenSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {t("settings.appearance.svgTitle")}
          </Text>
          <View
            style={[
              styles.iconThemeCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.iconThemeTitle, { color: colors.foreground }]}>
              {t("settings.appearance.svgColorTitle")}
            </Text>
            <Text style={[styles.iconThemeHint, { color: colors.muted }]}>
              {t("settings.appearance.svgColorHint")}
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

        <View style={!isSectionVisible("training") && styles.hiddenSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {t("settings.restTimer.sectionTitle")}
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
                {t("settings.restTimer.soundTitle")}
              </Text>
              <Text style={[styles.vibrationHint, { color: colors.muted }]}>
                {restTimerSoundEnabled
                  ? t("settings.restTimer.soundHintOn")
                  : t("settings.restTimer.soundHintOff")}
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
                {t("settings.restTimer.signalTitle")}
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
                          {t(option.titleKey)}
                        </Text>
                        <Text
                          style={[
                            styles.vibrationOptionHint,
                            { color: colors.muted },
                          ]}
                        >
                          {t(option.descriptionKey)}
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
                  {t("settings.restTimer.previewCta")}
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
                {t("settings.restTimer.vibrationTitle")}
              </Text>
              <Text style={[styles.vibrationHint, { color: colors.muted }]}>
                {restTimerSoundEnabled
                  ? restTimerVibrationEnabled
                    ? t("settings.restTimer.vibrationHintOn")
                    : t("settings.restTimer.vibrationHintOff")
                  : t("settings.restTimer.vibrationHintDisabled")}
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
                {t("settings.restTimer.vibrationPatternTitle")}
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
                          {t(option.titleKey)}
                        </Text>
                        <Text
                          style={[
                            styles.vibrationOptionHint,
                            { color: colors.muted },
                          ]}
                        >
                          {t(option.descriptionKey)}
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
              {t("settings.restTimer.setHapticTitle")}
            </Text>
            <Text style={[styles.vibrationHint, { color: colors.muted }]}>
              {t("settings.restTimer.setHapticHint")}
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
                        {t(option.titleKey)}
                      </Text>
                      <Text
                        style={[
                          styles.vibrationOptionHint,
                          { color: colors.muted },
                        ]}
                      >
                        {t(option.descriptionKey)}
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
            {t("settings.reminders.sectionTitle")}
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
                  {t("settings.reminders.localTitle")}
                </Text>
                <Text style={[styles.vibrationHint, { color: colors.muted }]}>
                  {notificationsEnabled
                    ? t("settings.reminders.localHintOn")
                    : t("settings.reminders.localHintOff")}
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
                  {t("settings.reminders.defaultTime")}
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
                  {t("settings.reminders.remindBefore")}
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
                        {t("settings.reminders.minutesShort", { minutes })}
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
            {t("settings.bodyweight.sectionTitle")}
          </Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            {t("settings.bodyweight.hint")}
          </Text>
          <View style={styles.bodyFields}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldLabel, { color: colors.muted }]}>
                {t("settings.bodyweight.weightLabel")}
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
                {t("settings.bodyweight.percentLabel")}
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
            {t("settings.bodyProfile.sectionTitle")}
          </Text>
          <View
            style={[
              styles.densityCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.iconThemeTitle, { color: colors.foreground }]}>
              {t("settings.bodyProfile.cardTitle")}
            </Text>
            <Text style={[styles.iconThemeHint, { color: colors.muted }]}>
              {t("settings.bodyProfile.cardHint")}
            </Text>
            <View style={styles.bodyProfileChoices}>
              {(
                [
                  {
                    id: "male",
                    title: t("settings.bodyProfile.male"),
                    hint: t("settings.bodyProfile.maleHint"),
                  },
                  {
                    id: "female",
                    title: t("settings.bodyProfile.female"),
                    hint: t("settings.bodyProfile.femaleHint"),
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
                  {t("settings.bodyProfile.height")}
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
                  {t("settings.bodyProfile.age")}
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
            {t("settings.bodyGoals.sectionTitle")}
          </Text>
          <View
            style={[
              styles.densityCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.iconThemeTitle, { color: colors.foreground }]}>
              {t("settings.bodyGoals.cardTitle")}
            </Text>
            <Text style={[styles.iconThemeHint, { color: colors.muted }]}>
              {t("settings.bodyGoals.hint")}
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
                  {t("settings.groq.sectionTitle")}
                </Text>
                <Text style={[styles.groqSubtitle, { color: colors.muted }]}>
                  {hasGroqKey
                    ? t("settings.groq.keySavedHint")
                    : t("settings.groq.keyMissingHint")}
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
                {hasGroqKey
                  ? t("settings.groq.badgeReady")
                  : t("settings.groq.badgeMissing")}
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
                  {hasGroqKey ? t("settings.groq.updateCta") : t("settings.groq.addCta")}
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
                    {t("settings.common.delete")}
                  </Text>
                </Pressable>
              )}
            </View>
            <Text style={[styles.groqPrivacy, { color: colors.muted }]}>
              {Platform.OS === "web"
                ? t("settings.groq.webHint")
                : t("settings.groq.storageHint")}
            </Text>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Google Fit
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
                  name="directions-run"
                  size={20}
                  color={colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.groqTitle, { color: colors.foreground }]}>
                  {t("settings.googleFit.sectionTitle")}
                </Text>
                <Text style={[styles.groqSubtitle, { color: colors.muted }]}>
                  {googleFitStatus.message}
                </Text>
              </View>
              <Text
                style={[
                  styles.groqStatus,
                  {
                    color:
                      googleFitStatus.state === "ready"
                        ? colors.success
                        : colors.muted,
                    backgroundColor:
                      googleFitStatus.state === "ready"
                        ? `${colors.success}18`
                        : colors.border,
                  },
                ]}
              >
                {googleFitStatus.state === "ready"
                  ? t("settings.googleFit.badgeReady")
                  : googleFitStatus.state === "unauthorized"
                    ? t("settings.googleFit.badgeUnauthorized")
                    : t("settings.googleFit.badgeNotConfigured")}
              </Text>
            </View>
            <View style={styles.groqActions}>
              <Pressable
                onPress={connectGoogleFit}
                disabled={googleFitConnecting}
                style={[
                  styles.groqPrimary,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Text style={styles.groqPrimaryText}>
                  {googleFitConnecting
                    ? t("settings.googleFit.connecting")
                    : googleFitStatus.state === "ready"
                      ? t("settings.googleFit.checkCta")
                      : t("settings.googleFit.connectCta")}
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
                <Text style={[styles.widgetTitle, { color: colors.foreground }]}>
                  {t("settings.healthSource.title")}
                </Text>
                <Text style={[styles.widgetHint, { color: colors.muted }]}>
                  {healthSource === "google-fit"
                    ? t("settings.googleFit.sourcePrimaryHint")
                    : t("settings.googleFit.sourceBackupHint")}
                </Text>
              </View>
            </View>
            {HEALTH_SOURCE_OPTIONS.map((option) => {
              const selected = healthSource === option.id;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => setHealthSource(option.id)}
                  accessibilityRole="button"
                  accessibilityLabel={t("settings.healthSource.a11y", { title: option.title })}
                  style={[
                    styles.healthSourceOption,
                    {
                      borderColor: selected ? colors.primary : colors.border,
                      backgroundColor: selected
                        ? `${colors.primary}14`
                        : colors.background,
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.healthSourceTitle, { color: colors.foreground }]}
                    >
                      {option.title}
                    </Text>
                    <Text
                      style={[
                        styles.healthSourceDescription,
                        { color: colors.muted },
                      ]}
                    >
                      {option.description}
                    </Text>
                  </View>
                  {selected && (
                    <SafeMaterialIcon
                      name="check-circle"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </Pressable>
              );
            })}
            <Text style={[styles.groqPrivacy, { color: colors.muted }]}>
              {t("settings.googleFit.oauthHint")}
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
                  {t("settings.health.sectionTitle")}
                </Text>
                <Text style={[styles.groqSubtitle, { color: colors.muted }]}>
                  {healthConnectStatus.message}
                </Text>
              </View>
              <Text
                style={[
                  styles.groqStatus,
                  {
                    color: healthConnectGrantedAny
                      ? colors.success
                      : colors.muted,
                    backgroundColor: healthConnectGrantedAny
                      ? `${colors.success}18`
                      : colors.border,
                  },
                ]}
              >
                {healthConnectBadgeText}
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
                    ? t("settings.health.connectCta")
                    : t("settings.health.checkCta")}
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
                  {t("settings.health.lockScreenTitle")}
                </Text>
                <Text style={[styles.widgetHint, { color: colors.muted }]}>
                  {lockScreenHeartRateVisible
                    ? t("settings.health.lockScreenHintOn")
                    : t("settings.health.lockScreenHintOff")}
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
              {t("settings.health.hint")}
            </Text>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {t("settings.bodyScale.sectionTitle")}
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
                  name="scale"
                  size={20}
                  color={colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.groqTitle, { color: colors.foreground }]}>
                  {t("settings.bodyScale.cardTitle")}
                </Text>
                <Text style={[styles.groqSubtitle, { color: colors.muted }]}>
                  {bodyScaleStatus.message}
                </Text>
              </View>              <Text
                style={[
                  styles.groqStatus,
                  {
                    color: bodyScaleStatus.granted
                      ? colors.success
                      : colors.muted,
                    backgroundColor: bodyScaleStatus.granted
                      ? `${colors.success}18`
                      : colors.border,
                  },
                ]}
              >
                {bodyScaleStatus.granted ? t("settings.bodyScale.badgeGranted") : t("settings.bodyScale.badgeNeedsPermission")}
              </Text>
            </View>
            <Text style={[styles.groqPrivacy, { color: colors.muted }]}>
              {t("settings.bodyScale.chainHint")}
            </Text>
            <View style={styles.groqActions}>
              <Pressable
                onPress={connectBodyScalePermissions}
                style={[
                  styles.groqPrimary,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Text style={styles.groqPrimaryText}>
                  {bodyScaleStatus.granted
                    ? t("settings.bodyScale.checkCta")
                    : t("settings.bodyScale.connectCta")}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => runBodyScaleSync(true)}
                disabled={bodyScaleSyncing}
                style={({ pressed }) => [
                  styles.groqDelete,
                  {
                    borderColor: colors.border,
                    opacity: bodyScaleSyncing || pressed ? 0.65 : 1,
                  },
                ]}
              >
                <Text
                  style={[styles.groqDeleteText, { color: colors.foreground }]}
                >
                  {bodyScaleSyncing
                    ? t("settings.bodyScale.syncing")
                    : t("settings.bodyScale.syncNowCta")}
                </Text>
              </Pressable>
            </View>
            {bodyScaleSyncMessage && (
              <Text style={[styles.groqPrivacy, { color: colors.muted }]}>
                {bodyScaleSyncMessage}
              </Text>
            )}
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
                  {t("settings.bodyScale.autoSyncTitle")}
                </Text>
                <Text style={[styles.widgetHint, { color: colors.muted }]}>
                  {bodyScaleAutoSync
                    ? t("settings.bodyScale.autoSyncHintOn")
                    : t("settings.bodyScale.autoSyncHintOff")}
                </Text>
              </View>
              <Switch
                value={bodyScaleAutoSync}
                onValueChange={toggleBodyScaleAutoSync}
                trackColor={{
                  false: colors.border,
                  true: `${colors.primary}88`,
                }}
                thumbColor={
                  bodyScaleAutoSync ? colors.primary : colors.muted
                }
              />
            </View>
            <Text style={[styles.groqPrivacy, { color: colors.muted }]}>
              {t("settings.bodyScale.appHint")}
            </Text>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {t("settings.storage.sectionTitle")}
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
                  {t("settings.storage.cardTitle")}
                </Text>
                <Text style={[styles.storageSubtitle, { color: colors.muted }]}>
                  {storageLoading
                    ? t("settings.storage.calculating")
                    : storageError
                      ? t("settings.storage.error")
                      : t("settings.storage.hint")}
                </Text>
              </View>
              <Pressable
                onPress={refreshStorageUsage}
                accessibilityLabel={t("settings.storage.refreshA11y")}
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
                      {t("settings.storage.appUsed")}
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
                      {t("settings.storage.deviceFree")}
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
                      {t("settings.storage.appLine", {
                        percent:
                          appSharePercent < 0.1 && storageUsage.appDataBytes
                            ? "<0,1"
                            : appSharePercent.toFixed(1),
                      })}
                    </Text>
                  </View>
                  <Text style={[styles.legendText, { color: colors.muted }]}>
                    {t("settings.storage.deviceLine", {
                      used: formatStorageBytes(deviceUsedBytes),
                      total: formatStorageBytes(storageUsage.totalBytes),
                    })}
                  </Text>
                </View>
                <View
                  style={[
                    styles.storageBreakdown,
                    { borderTopColor: colors.border },
                  ]}
                >
                  <Text style={[styles.breakdownText, { color: colors.muted }]}>
                    {t("settings.storage.workoutsLine", {
                      size: formatStorageBytes(storageUsage.asyncStorageBytes),
                    })}
                  </Text>
                  <Text style={[styles.breakdownText, { color: colors.muted }]}>
                    {t("settings.storage.filesLine", {
                      size: formatStorageBytes(storageUsage.filesBytes),
                    })}
                  </Text>
                </View>
              </>
            )}
          </View>

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {t("settings.backup.sectionTitle")}
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
                  {t("settings.backup.cardTitle")}
                </Text>
                <Text style={[styles.storageSubtitle, { color: colors.muted }]}>
                  {t("settings.backup.cardHint")}
                </Text>
              </View>
            </View>
            {lastBackupPreview && (
              <Text style={[styles.backupMeta, { color: colors.muted }]}>
                {t("settings.backup.lastPreview", {
                  entries: lastBackupPreview.storageEntryCount,
                  photos: lastBackupPreview.mediaFileCount,
                })}
              </Text>
            )}
            <Text style={[styles.backupMeta, { color: colors.muted }]}>
              {lastBackupRecord
                ? t("settings.backup.lastSuccess", {
                  date: new Date(lastBackupRecord.createdAt).toLocaleString(
                    locale,
                  ),
                })
                : t("settings.backup.never")}
            </Text>
            <Text style={[styles.backupHint, { color: colors.muted }]}>
              {backupReminderPreferences.enabled
                ? backupReminderPreferences.frequency === "weekly"
                  ? t("settings.backup.reminderHintWeekly")
                  : t("settings.backup.reminderHintMonthly")
                : t("settings.backup.reminderHintOff")}
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
                  {t("settings.backup.reminderTitle")}
                </Text>
                <Text
                  style={[styles.backupReminderText, { color: colors.muted }]}
                >
                  {t("settings.backup.reminderTime")}
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
                    ["weekly", t("settings.backup.frequencyWeekly")],
                    ["monthly", t("settings.backup.frequencyMonthly")],
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
            {backupBusy && backupProgress && (
              <View
                style={[
                  styles.backupProgressCard,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                  },
                ]}
              >
                <View style={styles.backupProgressHeading}>
                  <Text
                    style={[
                      styles.backupProgressLabel,
                      { color: colors.foreground },
                    ]}
                  >
                    {backupProgress.label}
                  </Text>
                  <Text
                    style={[
                      styles.backupProgressPercent,
                      { color: colors.primary },
                    ]}
                  >
                    {Math.round(backupProgress.value)}%
                  </Text>
                </View>
                <View
                  style={[
                    styles.backupProgressTrack,
                    { backgroundColor: colors.border },
                  ]}
                >
                  <View
                    style={[
                      styles.backupProgressFill,
                      {
                        width: `${Math.max(3, backupProgress.value)}%`,
                        backgroundColor: colors.primary,
                      },
                    ]}
                  />
                </View>
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
                  {backupBusy ? t("settings.backup.busyCreating") : t("settings.backup.createCta")}
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
                  {t("settings.backup.restoreFromFileCta")}
                </Text>
              </Pressable>
              <Pressable
                disabled={backupBusy}
                onPress={() => void shareLatestBackup()}
                style={({ pressed }) => [
                  styles.backupSecondary,
                  {
                    borderColor: colors.border,
                    opacity: backupBusy || pressed ? 0.68 : 1,
                  },
                ]}
              >
                <SafeMaterialIcon
                  name="share"
                  size={18}
                  color={colors.foreground}
                />
                <Text
                  style={[
                    styles.backupSecondaryText,
                    { color: colors.foreground },
                  ]}
                >
                  {t("settings.backup.shareLatestCta")}
                </Text>
              </Pressable>
            </View>
            <View
              style={[
                styles.backupFilesHeader,
                { borderTopColor: colors.border },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.backupFilesTitle,
                    { color: colors.foreground },
                  ]}
                >
                  {t("settings.backup.recentTitle")}
                </Text>
                <Text style={[styles.backupFilesHint, { color: colors.muted }]}>
                  {t("settings.backup.recentHint")}
                </Text>
              </View>
              <Pressable
                disabled={backupListBusy}
                onPress={() => void refreshBackupList()}
                style={({ pressed }) => [
                  styles.backupRefreshButton,
                  {
                    borderColor: colors.border,
                    opacity: backupListBusy || pressed ? 0.66 : 1,
                  },
                ]}
              >
                <SafeMaterialIcon
                  name="refresh"
                  size={18}
                  color={colors.foreground}
                />
              </Pressable>
            </View>
            <Pressable
              disabled={backupListBusy}
              onPress={() => void chooseBackupFolder()}
              style={({ pressed }) => [
                styles.backupFolderButton,
                {
                  borderColor: colors.border,
                  opacity: backupListBusy || pressed ? 0.66 : 1,
                },
              ]}
            >
              <SafeMaterialIcon
                name="folder-open"
                size={18}
                color={colors.foreground}
              />
              <Text
                style={[
                  styles.backupSecondaryText,
                  { color: colors.foreground },
                ]}
              >
                {backupListBusy
                  ? t("settings.backup.chooseFolderBusy")
                  : t("settings.backup.chooseFolderCta")}
              </Text>
            </Pressable>
            {availableBackups.length === 0 ? (
              <Text style={[styles.backupFilesEmpty, { color: colors.muted }]}>
                {t("settings.backup.emptyList")}
              </Text>
            ) : (
              <View style={styles.backupFilesList}>
                {availableBackups.map((backup) => (
                  <Pressable
                    key={backup.uri}
                    disabled={backupBusy}
                    onPress={() => confirmBackupRestore(backup.payload)}
                    style={({ pressed }) => [
                      styles.backupFileRow,
                      {
                        borderColor: colors.border,
                        backgroundColor: colors.background,
                        opacity: backupBusy || pressed ? 0.68 : 1,
                      },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.backupFileName,
                          { color: colors.foreground },
                        ]}
                      >
                        {new Date(backup.exportedAt).toLocaleString(locale)}
                      </Text>
                      <Text
                        style={[styles.backupFileMeta, { color: colors.muted }]}
                      >
                        {t("settings.backup.itemMeta", {
                          entries: backup.storageEntryCount,
                          photos: backup.mediaFileCount,
                          size: formatStorageBytes(backup.sizeBytes),
                        })}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.backupFileSource,
                        { color: colors.primary },
                      ]}
                    >
                      {backup.source === "folder" ? t("settings.backup.sourceFolder") : t("settings.backup.sourceApp")}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {t("settings.offline.sectionTitle")}
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
                  {t("settings.offline.downloadAll")}
                </Text>
                <Text style={[styles.offlineSubtitle, { color: colors.muted }]}>
                  {bulkState.message}
                </Text>
              </View>
              <Text style={[styles.offlinePercent, { color: colors.primary }]}>
                {bulkState.loading || bulkState.total
                  ? `${photoProgress}%`
                  : t("settings.offline.wifiBadge")}
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
                  ? t("settings.offline.loading")
                  : t("settings.offline.downloadCta")}
              </Text>
            </Pressable>
            <Text style={[styles.wifiHint, { color: colors.muted }]}>
              {t("settings.offline.hint")}
            </Text>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {t("settings.tools.sectionTitle")}
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
              {t("settings.tools.note")}
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          {t("settings.about.sectionTitle")}
        </Text>
        <View
          style={[
            styles.aboutCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Image
            source={require("@/assets/images/ironrise-shield-badge.png")}
            style={styles.aboutLogo}
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.aboutName, { color: colors.foreground }]}>
              IronRise
            </Text>
            <Text style={[styles.aboutVersion, { color: colors.muted }]}>
              {t("settings.about.version", {
                version: Constants.expoConfig?.version ?? "1.0.4",
              })}
            </Text>
            <Text style={[styles.aboutTagline, { color: colors.primary }]}>
              {t("settings.about.tagline")}
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
              {t("settings.search.emptyTitle")}
            </Text>
            <Text style={[styles.iconThemeHint, { color: colors.muted }]}>
              {t("settings.search.emptyExamples")}
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
                {t("settings.search.clearCta")}
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
              style={[
                styles.sheet,
                {
                  backgroundColor: colors.background,
                  paddingBottom: keySheetBottomInset,
                },
              ]}
            >
              <View style={styles.sheetHeader}>
                <View>
                  <Text
                    style={[styles.sheetTitle, { color: colors.foreground }]}
                  >
                    {hasGroqKey ? t("settings.groq.sheetTitleUpdate") : t("settings.groq.sheetTitleAdd")}
                  </Text>
                  <Text style={[styles.sheetHint, { color: colors.muted }]}>
                    {t("settings.groq.sheetHint")}
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
                  {savingGroqKey ? t("settings.groq.saving") : t("settings.groq.saveCta")}
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
  const { t } = useLanguage();
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
          {compact ? t("settings.home.compactBadge") : t("settings.home.normalSizeBadge")}
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
  const { t } = useLanguage();
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
            {t("settings.home.alwaysAvailable")}
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
  aboutCard: {
    borderWidth: 1,
    borderRadius: 0,
    borderLeftWidth: 5,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  aboutLogo: { width: 60, height: 60 },
  aboutName: { fontSize: 15, fontWeight: "900", letterSpacing: 0.4 },
  aboutVersion: { fontSize: 11, fontWeight: "800", marginTop: 3 },
  aboutTagline: { fontSize: 10, fontWeight: "800", marginTop: 5, letterSpacing: 0.3 },
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
  languageCard: {
    borderWidth: 1,
    borderRadius: 0,
    borderLeftWidth: 5,
    padding: 14,
    gap: 10,
  },
  languageOptions: { flexDirection: "row", gap: 8 },
  languageOption: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 0,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  languageOptionText: { fontSize: 13, fontWeight: "900" },
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
  healthSourceOption: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  healthSourceTitle: { fontSize: 13, fontWeight: "800" },
  healthSourceDescription: { fontSize: 11, lineHeight: 15, marginTop: 3 },
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
  backupProgressCard: { borderWidth: 1, padding: 10, gap: 8 },
  backupProgressHeading: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  backupProgressLabel: { flex: 1, fontSize: 11, fontWeight: "800" },
  backupProgressPercent: { fontSize: 12, fontWeight: "900" },
  backupProgressTrack: { height: 6, overflow: "hidden" },
  backupProgressFill: { height: "100%" },
  backupActions: { gap: 8 },
  backupFilesHeader: {
    borderTopWidth: 1,
    paddingTop: 12,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  backupFilesTitle: { fontSize: 12, fontWeight: "900" },
  backupFilesHint: { fontSize: 10, lineHeight: 14, marginTop: 3 },
  backupRefreshButton: {
    width: 38,
    height: 38,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  backupFolderButton: {
    minHeight: 42,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  backupFilesEmpty: { fontSize: 10, lineHeight: 15, textAlign: "center" },
  backupFilesList: { gap: 7 },
  backupFileRow: {
    minHeight: 60,
    borderWidth: 1,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  backupFileName: { fontSize: 11, fontWeight: "900" },
  backupFileMeta: { fontSize: 9, marginTop: 4 },
  backupFileSource: {
    fontSize: 8,
    fontWeight: "900",
    maxWidth: 58,
    textAlign: "right",
  },
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
