import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Sharing from "expo-sharing";
import { router, useLocalSearchParams } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { WorkoutShareCard } from "@/components/workout-share-card";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { formatWorkoutSocialTemplate, getWorkoutRecordAchievements } from "@/lib/workout-achievements";
import { getExercise } from "@/lib/workout-data";
import { getVkSession, isVkConfigured, publishWorkoutToVk, signInWithVk, type VkSession } from "@/lib/vk-integration";
import { useWorkoutStore } from "@/lib/workout-store";

export default function ShareWorkoutScreen() {
  const colors = useColors();
  const { workoutId } = useLocalSearchParams<{ workoutId: string }>();
  const { completed, programs, personalRecords } = useWorkoutStore();
  const workout = completed.find((item) => item.id === workoutId);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [note, setNote] = useState("");
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const [session, setSession] = useState<VkSession | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const cardRef = useRef<any>(null);
  const program = programs.find((item) => item.id === workout?.programId);
  const records = useMemo(() => workout ? getWorkoutRecordAchievements(workout, personalRecords).map((record) => ({ ...record, name: getExercise(record.exerciseId)?.name ?? record.exerciseId })) : [], [personalRecords, workout]);
  const vkText = useMemo(() => workout ? formatWorkoutSocialTemplate("vk", { workout, programName: program?.name ?? "Тренировка", records }) : "", [program?.name, records, workout]);

  useEffect(() => {
    void getVkSession().then(setSession).catch(() => undefined);
  }, []);

  const choosePhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [4, 5], quality: 0.86 });
      if (!result.canceled) setPhotoUri(result.assets[0]?.uri);
    } catch {
      Alert.alert("Не удалось выбрать фото", "Проверьте доступ к галерее и попробуйте ещё раз.");
    }
  };

  const signIn = async () => {
    if (!isVkConfigured()) {
      Alert.alert("Нужна настройка VK ID", "Для запуска входа укажите ID Android-приложения в конфигурации IronRise и добавьте redirect URI в консоли VK ID.");
      return;
    }
    try {
      setSigningIn(true);
      const nextSession = await signInWithVk();
      if (nextSession) setSession(nextSession);
    } catch (error) {
      Alert.alert("Не удалось войти через VK ID", error instanceof Error ? error.message : "Повторите попытку позже.");
    } finally {
      setSigningIn(false);
    }
  };

  const publishToVk = () => {
    if (!workout || !session) return;
    Alert.alert("Опубликовать во ВКонтакте?", "На вашей личной стене появятся карточка IronRise и текст с итогами тренировки. Продолжить?", [
      { text: "Отмена", style: "cancel" },
      { text: "Опубликовать", onPress: () => void confirmVkPublish() },
    ]);
  };

  const confirmVkPublish = async () => {
    if (!workout || !session) return;
    try {
      setPublishing(true);
      const imageUri = cardRef.current ? await cardRef.current.capture() : undefined;
      await publishWorkoutToVk({ message: vkText, imageUri });
      Alert.alert("Опубликовано", "Результат тренировки размещён на вашей стене VK.");
    } catch (error) {
      Alert.alert("Не удалось опубликовать", error instanceof Error ? error.message : "Проверьте авторизацию VK и попробуйте ещё раз.");
    } finally {
      setPublishing(false);
    }
  };

  const sharePng = async () => {
    try {
      if (!cardRef.current || !(await Sharing.isAvailableAsync())) return Alert.alert("Обмен недоступен", "На этом устройстве невозможно открыть системное меню обмена.");
      const uri = await cardRef.current.capture();
      await Sharing.shareAsync(uri, { dialogTitle: "Поделиться карточкой IronRise", mimeType: "image/png" });
    } catch {
      Alert.alert("Не удалось подготовить карточку", "Попробуйте выбрать другое фото или повторите попытку.");
    }
  };

  if (!workout) return <ScreenContainer className="px-5"><View style={styles.empty}><Text style={[styles.emptyTitle, { color: colors.foreground }]}>Результат не найден</Text><Pressable onPress={() => router.back()}><Text style={[styles.backLink, { color: colors.primary }]}>Вернуться</Text></Pressable></View></ScreenContainer>;

  return <ScreenContainer edges={["top", "left", "right", "bottom"]} className="px-5"><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"><View style={styles.header}><Pressable onPress={() => router.back()}><IconSymbol name="chevron.left" size={27} color={colors.foreground} /></Pressable><Text style={[styles.headerTitle, { color: colors.foreground }]}>Студия публикации</Text><View style={{ width: 27 }} /></View><Text style={[styles.eyebrow, { color: colors.primary }]}>IRONRISE · СОЦСЕТИ</Text><Text style={[styles.title, { color: colors.foreground }]}>Поделитесь итогом</Text><Text style={[styles.subtitle, { color: colors.muted }]}>Добавьте фото, настройте карточку и выберите безопасный способ публикации.</Text><View style={styles.themeRow}>{(["dark", "light"] as const).map((item) => <Pressable key={item} onPress={() => setTheme(item)} style={[styles.themeOption, { backgroundColor: theme === item ? colors.primary : colors.surface, borderColor: theme === item ? colors.primary : colors.border }]}><Text style={[styles.themeText, { color: theme === item ? "#FFFDF8" : colors.foreground }]}>{item === "dark" ? "Тёмная тема" : "Светлая тема"}</Text></Pressable>)}</View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardScroll}><WorkoutShareCard captureRef={cardRef} workout={workout} programName={program?.name ?? "Тренировка"} records={records} theme={theme} note={note} photoUri={photoUri} /></ScrollView><View style={[styles.photoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={{ flex: 1 }}><Text style={[styles.blockLabel, { color: colors.primary }]}>ФОТО ДЛЯ КАРТОЧКИ</Text><Text style={[styles.blockText, { color: colors.muted }]}>{photoUri ? "Фотография будет добавлена в PNG и пост VK." : "Добавьте фото с тренировки или прогресса — это необязательно."}</Text></View>{photoUri && <Image source={{ uri: photoUri }} style={styles.photoThumbnail} />}<View style={styles.photoActions}><Pressable onPress={() => void choosePhoto()} style={[styles.secondaryButton, { borderColor: colors.primary }]}><Text style={[styles.secondaryButtonText, { color: colors.primary }]}>{photoUri ? "Изменить фото" : "Добавить фото"}</Text></Pressable>{photoUri && <Pressable onPress={() => setPhotoUri(undefined)} style={styles.removePhoto}><Text style={[styles.removePhotoText, { color: colors.error }]}>Убрать</Text></Pressable>}</View></View><View style={[styles.noteCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.blockLabel, { color: colors.muted }]}>ПОДПИСЬ НА КАРТОЧКЕ</Text><TextInput value={note} onChangeText={setNote} maxLength={120} multiline placeholder="Например: новый вес дался уверенно" placeholderTextColor={colors.muted} style={[styles.noteInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]} /><Text style={[styles.noteLimit, { color: colors.muted }]}>{note.length}/120</Text></View><View style={[styles.vkCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={styles.vkHeader}><View><Text style={[styles.blockLabel, { color: "#2787F5" }]}>ВКОНТАКТЕ</Text><Text style={[styles.vkTitle, { color: colors.foreground }]}>{session ? `VK ID подключён · ${session.userId}` : "Подключите VK ID"}</Text><Text style={[styles.blockText, { color: colors.muted }]}>{session ? "Перед публикацией приложение всегда покажет отдельное подтверждение." : "Вход использует защищённый OAuth 2.1 + PKCE. Токен хранится только в защищённом хранилище устройства."}</Text></View><View style={[styles.vkBadge, { backgroundColor: "#2787F5" }]}><Text style={styles.vkBadgeText}>VK</Text></View></View>{session ? <Pressable disabled={publishing} onPress={publishToVk} style={({ pressed }) => [styles.vkButton, { backgroundColor: "#2787F5", opacity: pressed || publishing ? 0.72 : 1 }]}><Text style={styles.vkButtonText}>{publishing ? "Публикуем…" : "Опубликовать во ВКонтакте"}</Text></Pressable> : <Pressable disabled={signingIn} onPress={() => void signIn()} style={({ pressed }) => [styles.vkButton, { backgroundColor: "#2787F5", opacity: pressed || signingIn ? 0.72 : 1 }]}><Text style={styles.vkButtonText}>{signingIn ? "Открываем VK ID…" : "Войти через VK ID"}</Text></Pressable>}</View><View style={[styles.preview, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.blockLabel, { color: colors.muted }]}>ТЕКСТ ДЛЯ VK</Text><Text style={[styles.previewText, { color: colors.foreground }]}>{vkText}</Text></View><Pressable onPress={() => void sharePng()} style={({ pressed }) => [styles.systemShare, { borderColor: colors.border, opacity: pressed ? 0.72 : 1 }]}><Text style={[styles.systemShareText, { color: colors.foreground }]}>Открыть системное меню PNG</Text></Pressable></ScrollView></ScreenContainer>;
}

const styles = StyleSheet.create({ content: { paddingTop: 16, paddingBottom: 34, gap: 13 }, header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, headerTitle: { fontSize: 16, fontWeight: "900" }, eyebrow: { fontSize: 10, fontWeight: "900", letterSpacing: 0.8, marginTop: 4 }, title: { fontSize: 31, letterSpacing: -1, fontWeight: "900" }, subtitle: { fontSize: 12, lineHeight: 18, marginTop: -4 }, themeRow: { flexDirection: "row", gap: 8 }, themeOption: { flex: 1, minHeight: 41, borderWidth: 1, alignItems: "center", justifyContent: "center" }, themeText: { fontSize: 11, fontWeight: "900" }, cardScroll: { paddingVertical: 3, paddingHorizontal: 2 }, photoCard: { borderWidth: 1, padding: 13, gap: 10 }, blockLabel: { fontSize: 9, fontWeight: "900", letterSpacing: 0.7 }, blockText: { fontSize: 11, lineHeight: 16, marginTop: 4 }, photoThumbnail: { width: "100%", height: 160, resizeMode: "cover" }, photoActions: { flexDirection: "row", gap: 12, alignItems: "center" }, secondaryButton: { minHeight: 39, borderWidth: 1, paddingHorizontal: 12, justifyContent: "center", alignItems: "center" }, secondaryButtonText: { fontSize: 11, fontWeight: "900" }, removePhoto: { minHeight: 39, justifyContent: "center" }, removePhotoText: { fontSize: 11, fontWeight: "900" }, noteCard: { borderWidth: 1, padding: 13, gap: 7 }, noteInput: { minHeight: 70, borderWidth: 1, padding: 10, textAlignVertical: "top", fontSize: 12, lineHeight: 17 }, noteLimit: { fontSize: 10, fontWeight: "800", alignSelf: "flex-end" }, vkCard: { borderWidth: 1, padding: 14, gap: 12 }, vkHeader: { flexDirection: "row", gap: 10 }, vkTitle: { fontSize: 17, fontWeight: "900", marginTop: 3 }, vkBadge: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 12 }, vkBadgeText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" }, vkButton: { minHeight: 50, alignItems: "center", justifyContent: "center" }, vkButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" }, preview: { borderWidth: 1, padding: 13, gap: 7 }, previewText: { fontSize: 12, lineHeight: 18 }, systemShare: { minHeight: 48, borderWidth: 1, justifyContent: "center", alignItems: "center" }, systemShareText: { fontSize: 12, fontWeight: "900" }, empty: { flex: 1, justifyContent: "center", alignItems: "center", gap: 10 }, emptyTitle: { fontSize: 18, fontWeight: "900" }, backLink: { fontSize: 13, fontWeight: "900" } });
