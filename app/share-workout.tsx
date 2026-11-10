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
import { useLanguage } from "@/lib/i18n";

export default function ShareWorkoutScreen() {
  const colors = useColors();
  const { t, lang } = useLanguage();
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
  const records = useMemo(() => workout ? getWorkoutRecordAchievements(workout, personalRecords).map((record) => ({ ...record, name: (lang === "en" ? (getExercise(record.exerciseId)?.nameEn ?? getExercise(record.exerciseId)?.name) : getExercise(record.exerciseId)?.name) ?? record.exerciseId })) : [], [personalRecords, workout]);
  const programName = (lang === "en" ? (program?.nameEn ?? program?.name) : program?.name) ?? t("workout.share.workoutFallback");
  const vkText = useMemo(() => workout ? formatWorkoutSocialTemplate("vk", { workout, programName: programName, records, lang }) : "", [lang, program?.name, records, workout]);

  useEffect(() => {
    void getVkSession().then(setSession).catch(() => undefined);
  }, []);

  const choosePhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [4, 5], quality: 0.86 });
      if (!result.canceled) setPhotoUri(result.assets[0]?.uri);
    } catch {
      Alert.alert(t("workout.share.photoPickErrorTitle"), t("workout.share.photoPickErrorMessage"));
    }
  };

  const signIn = async () => {
    if (!isVkConfigured()) {
      Alert.alert(t("workout.share.vkSetupTitle"), t("workout.share.vkSetupMessage"));
      return;
    }
    try {
      setSigningIn(true);
      const nextSession = await signInWithVk();
      if (nextSession) setSession(nextSession);
    } catch (error) {
      Alert.alert(t("workout.share.vkSignInErrorTitle"), error instanceof Error ? error.message : t("workout.share.vkRetryLater"));
    } finally {
      setSigningIn(false);
    }
  };

  const publishToVk = () => {
    if (!workout || !session) return;
    Alert.alert(t("workout.share.vkPublishConfirmTitle"), t("workout.share.vkPublishConfirmMessage"), [
      { text: t("workout.share.cancel"), style: "cancel" },
      { text: t("workout.share.publishAction"), onPress: () => void confirmVkPublish() },
    ]);
  };

  const confirmVkPublish = async () => {
    if (!workout || !session) return;
    try {
      setPublishing(true);
      const imageUri = cardRef.current ? await cardRef.current.capture() : undefined;
      await publishWorkoutToVk({ message: vkText, imageUri });
      Alert.alert(t("workout.share.publishedTitle"), t("workout.share.publishedMessage"));
    } catch (error) {
      Alert.alert(t("workout.share.publishErrorTitle"), error instanceof Error ? error.message : t("workout.share.publishErrorMessage"));
    } finally {
      setPublishing(false);
    }
  };

  const sharePng = async () => {
    try {
      if (!cardRef.current || !(await Sharing.isAvailableAsync())) return Alert.alert(t("workout.share.shareUnavailableTitle"), t("workout.share.shareUnavailableMessage"));
      const uri = await cardRef.current.capture();
      await Sharing.shareAsync(uri, { dialogTitle: t("workout.share.shareCardDialog"), mimeType: "image/png" });
    } catch {
      Alert.alert(t("workout.share.cardErrorTitle"), t("workout.share.cardErrorMessage"));
    }
  };

  if (!workout) return <ScreenContainer className="px-5"><View style={styles.empty}><Text style={[styles.emptyTitle, { color: colors.foreground }]}>{t("workout.share.notFound")}</Text><Pressable onPress={() => router.back()}><Text style={[styles.backLink, { color: colors.primary }]}>{t("workout.share.back")}</Text></Pressable></View></ScreenContainer>;

  return <ScreenContainer edges={["top", "left", "right", "bottom"]} className="px-5"><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"><View style={styles.header}><Pressable onPress={() => router.back()}><IconSymbol name="chevron.left" size={27} color={colors.foreground} /></Pressable><Text style={[styles.headerTitle, { color: colors.foreground }]}>{t("workout.share.headerTitle")}</Text><View style={{ width: 27 }} /></View><Text style={[styles.eyebrow, { color: colors.primary }]}>{t("workout.share.eyebrow")}</Text><Text style={[styles.title, { color: colors.foreground }]}>{t("workout.share.title")}</Text><Text style={[styles.subtitle, { color: colors.muted }]}>{t("workout.share.subtitle")}</Text><View style={styles.themeRow}>{(["dark", "light"] as const).map((item) => <Pressable key={item} onPress={() => setTheme(item)} style={[styles.themeOption, { backgroundColor: theme === item ? colors.primary : colors.surface, borderColor: theme === item ? colors.primary : colors.border }]}><Text style={[styles.themeText, { color: theme === item ? "#FFFDF8" : colors.foreground }]}>{item === "dark" ? t("workout.share.themeDark") : t("workout.share.themeLight")}</Text></Pressable>)}</View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardScroll}><WorkoutShareCard captureRef={cardRef} workout={workout} programName={programName} records={records} theme={theme} note={note} photoUri={photoUri} lang={lang} /></ScrollView><View style={[styles.photoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={{ flex: 1 }}><Text style={[styles.blockLabel, { color: colors.primary }]}>{t("workout.share.photoLabel")}</Text><Text style={[styles.blockText, { color: colors.muted }]}>{photoUri ? t("workout.share.photoAdded") : t("workout.share.photoHint")}</Text></View>{photoUri && <Image source={{ uri: photoUri }} style={styles.photoThumbnail} />}<View style={styles.photoActions}><Pressable onPress={() => void choosePhoto()} style={[styles.secondaryButton, { borderColor: colors.primary }]}><Text style={[styles.secondaryButtonText, { color: colors.primary }]}>{photoUri ? t("workout.share.changePhoto") : t("workout.share.addPhoto")}</Text></Pressable>{photoUri && <Pressable onPress={() => setPhotoUri(undefined)} style={styles.removePhoto}><Text style={[styles.removePhotoText, { color: colors.error }]}>{t("workout.share.removePhoto")}</Text></Pressable>}</View></View><View style={[styles.noteCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.blockLabel, { color: colors.muted }]}>{t("workout.share.noteLabel")}</Text><TextInput value={note} onChangeText={setNote} maxLength={120} multiline placeholder={t("workout.share.notePlaceholder")} placeholderTextColor={colors.muted} style={[styles.noteInput, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]} /><Text style={[styles.noteLimit, { color: colors.muted }]}>{note.length}/120</Text></View><View style={[styles.vkCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={styles.vkHeader}><View><Text style={[styles.blockLabel, { color: "#2787F5" }]}>{t("workout.share.vkSection")}</Text><Text style={[styles.vkTitle, { color: colors.foreground }]}>{session ? t("workout.share.vkConnected", { userId: session.userId }) : t("workout.share.vkConnect")}</Text><Text style={[styles.blockText, { color: colors.muted }]}>{session ? t("workout.share.vkConfirmHint") : t("workout.share.vkOauthHint")}</Text></View><View style={[styles.vkBadge, { backgroundColor: "#2787F5" }]}><Text style={styles.vkBadgeText}>VK</Text></View></View>{session ? <Pressable disabled={publishing} onPress={publishToVk} style={({ pressed }) => [styles.vkButton, { backgroundColor: "#2787F5", opacity: pressed || publishing ? 0.72 : 1 }]}><Text style={styles.vkButtonText}>{publishing ? t("workout.share.vkPublishing") : t("workout.share.vkPublish")}</Text></Pressable> : <Pressable disabled={signingIn} onPress={() => void signIn()} style={({ pressed }) => [styles.vkButton, { backgroundColor: "#2787F5", opacity: pressed || signingIn ? 0.72 : 1 }]}><Text style={styles.vkButtonText}>{signingIn ? t("workout.share.vkSigningIn") : t("workout.share.vkSignIn")}</Text></Pressable>}</View><View style={[styles.preview, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.blockLabel, { color: colors.muted }]}>{t("workout.share.vkTextLabel")}</Text><Text style={[styles.previewText, { color: colors.foreground }]}>{vkText}</Text></View><Pressable onPress={() => void sharePng()} style={({ pressed }) => [styles.systemShare, { borderColor: colors.border, opacity: pressed ? 0.72 : 1 }]}><Text style={[styles.systemShareText, { color: colors.foreground }]}>{t("workout.share.openSystemShare")}</Text></Pressable></ScrollView></ScreenContainer>;
}

const styles = StyleSheet.create({ content: { paddingTop: 16, paddingBottom: 34, gap: 13 }, header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, headerTitle: { fontSize: 16, fontWeight: "900" }, eyebrow: { fontSize: 10, fontWeight: "900", letterSpacing: 0.8, marginTop: 4 }, title: { fontSize: 31, letterSpacing: -1, fontWeight: "900" }, subtitle: { fontSize: 12, lineHeight: 18, marginTop: -4 }, themeRow: { flexDirection: "row", gap: 8 }, themeOption: { flex: 1, minHeight: 41, borderWidth: 1, alignItems: "center", justifyContent: "center" }, themeText: { fontSize: 11, fontWeight: "900" }, cardScroll: { paddingVertical: 3, paddingHorizontal: 2 }, photoCard: { borderWidth: 1, padding: 13, gap: 10 }, blockLabel: { fontSize: 9, fontWeight: "900", letterSpacing: 0.7 }, blockText: { fontSize: 11, lineHeight: 16, marginTop: 4 }, photoThumbnail: { width: "100%", height: 160, resizeMode: "cover" }, photoActions: { flexDirection: "row", gap: 12, alignItems: "center" }, secondaryButton: { minHeight: 39, borderWidth: 1, paddingHorizontal: 12, justifyContent: "center", alignItems: "center" }, secondaryButtonText: { fontSize: 11, fontWeight: "900" }, removePhoto: { minHeight: 39, justifyContent: "center" }, removePhotoText: { fontSize: 11, fontWeight: "900" }, noteCard: { borderWidth: 1, padding: 13, gap: 7 }, noteInput: { minHeight: 70, borderWidth: 1, padding: 10, textAlignVertical: "top", fontSize: 12, lineHeight: 17 }, noteLimit: { fontSize: 10, fontWeight: "800", alignSelf: "flex-end" }, vkCard: { borderWidth: 1, padding: 14, gap: 12 }, vkHeader: { flexDirection: "row", gap: 10 }, vkTitle: { fontSize: 17, fontWeight: "900", marginTop: 3 }, vkBadge: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 12 }, vkBadgeText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" }, vkButton: { minHeight: 50, alignItems: "center", justifyContent: "center" }, vkButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" }, preview: { borderWidth: 1, padding: 13, gap: 7 }, previewText: { fontSize: 12, lineHeight: 18 }, systemShare: { minHeight: 48, borderWidth: 1, justifyContent: "center", alignItems: "center" }, systemShareText: { fontSize: 12, fontWeight: "900" }, empty: { flex: 1, justifyContent: "center", alignItems: "center", gap: 10 }, emptyTitle: { fontSize: 18, fontWeight: "900" }, backLink: { fontSize: 13, fontWeight: "900" } });
