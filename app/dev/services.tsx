import { useEffect, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

type PreviewState = "checking" | "online" | "offline";

export default function ServiceStatusScreen() {
  const colors = useColors();
  const healthQuery = trpc.devStatus.health.useQuery(undefined, { refetchInterval: 20_000, retry: 0 });
  const [preview, setPreview] = useState<PreviewState>("checking");
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);

  const checkPreview = async () => {
    setPreview("checking");
    try {
      if (Platform.OS === "web") {
        const response = await fetch(window.location.href, { cache: "no-store" });
        setPreview(response.ok ? "online" : "offline");
      } else {
        setPreview("online");
      }
    } catch {
      setPreview("offline");
    } finally {
      setCheckedAt(new Date());
    }
  };
  useEffect(() => { checkPreview(); }, []);
  const refresh = async () => { await Promise.all([healthQuery.refetch(), checkPreview()]); };
  const apiState: PreviewState = healthQuery.isFetching ? "checking" : healthQuery.data ? "online" : "offline";
  const reloadPreview = () => {
    if (Platform.OS === "web") window.location.reload();
    else router.replace("/dev/services");
  };
  const restartServices = () => {
    Alert.alert("Перезапуск сервера", "Полный перезапуск фоновых процессов выполняется через кнопку перезапуска в панели управления проекта. Здесь можно обновить статусы и перезагрузить предпросмотр без остановки сервисов.");
  };
  const statusText = (state: PreviewState) => state === "online" ? "Работает" : state === "checking" ? "Проверяем…" : "Недоступен";
  const statusColor = (state: PreviewState) => state === "online" ? colors.success : state === "checking" ? colors.warning : colors.error;

  return <ScreenContainer edges={["top", "left", "right", "bottom"]} className="px-5" containerClassName="bg-background"><ScrollView contentContainerStyle={styles.content}><View style={styles.header}><Pressable onPress={() => router.back()}><IconSymbol name="chevron.left" size={27} color={colors.foreground} /></Pressable><Text style={[styles.headerTitle, { color: colors.foreground }]}>Панель сервисов</Text><View style={{ width: 27 }} /></View><View style={[styles.hero, { backgroundColor: colors.primary }]}><Text style={styles.heroEyebrow}>ДИАГНОСТИКА</Text><Text style={styles.heroTitle}>Статус среды разработки</Text><Text style={styles.heroText}>Проверь API и предпросмотр, затем обнови экран при временном сбое.</Text></View><Text style={[styles.section, { color: colors.foreground }]}>Текущее состояние</Text><View style={styles.cards}><StatusCard title="API сервера" description={healthQuery.data ? `Работает ${Math.floor(healthQuery.data.uptimeSeconds / 60)} мин.` : "Проверяем доступность API"} state={apiState} color={statusColor(apiState)} text={statusText(apiState)} foreground={colors.foreground} muted={colors.muted} surface={colors.surface} border={colors.border} /><StatusCard title="Предпросмотр" description={Platform.OS === "web" ? "Открывается в текущем окне" : "Проверяется в браузерном предпросмотре"} state={preview} color={statusColor(preview)} text={statusText(preview)} foreground={colors.foreground} muted={colors.muted} surface={colors.surface} border={colors.border} /></View><Text style={[styles.updated, { color: colors.muted }]}>{checkedAt ? `Последняя проверка: ${checkedAt.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}` : "Статусы обновляются автоматически"}</Text><Pressable onPress={refresh} style={({ pressed }) => [styles.primary, { backgroundColor: colors.primary }, pressed && { opacity: 0.82 }]}><Text style={styles.primaryText}>Обновить статусы</Text></Pressable><Text style={[styles.section, { color: colors.foreground }]}>Быстрое восстановление</Text><View style={[styles.recovery, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.recoveryTitle, { color: colors.foreground }]}>Перезагрузить предпросмотр</Text><Text style={[styles.recoveryText, { color: colors.muted }]}>Перезагружает текущий экран без потери данных тренировки.</Text><Pressable onPress={reloadPreview} style={({ pressed }) => [styles.outline, { borderColor: colors.primary }, pressed && { opacity: 0.75 }]}><Text style={[styles.outlineText, { color: colors.primary }]}>Перезагрузить экран</Text></Pressable><View style={[styles.restartDivider, { backgroundColor: colors.border }]} /><Text style={[styles.recoveryTitle, { color: colors.foreground }]}>Перезапустить сервер</Text><Text style={[styles.recoveryText, { color: colors.muted }]}>Открывает инструкцию по безопасному перезапуску сервисов из панели управления проекта.</Text><Pressable onPress={restartServices} style={({ pressed }) => [styles.restartButton, { backgroundColor: colors.error, opacity: pressed ? 0.8 : 1 }]}><Text style={styles.restartText}>Как перезапустить сервер</Text></Pressable></View><View style={[styles.note, { backgroundColor: colors.warning + "12", borderColor: colors.warning + "45" }]}><Text style={[styles.noteTitle, { color: colors.foreground }]}>Что произойдёт</Text><Text style={[styles.noteText, { color: colors.muted }]}>Перезагрузка экрана не удаляет данные тренировки. Полный перезапуск доступен только в панели управления среды разработки.</Text></View></ScrollView></ScreenContainer>;
}

function StatusCard({ title, description, color, text, foreground, muted, surface, border }: { title: string; description: string; state: PreviewState; color: string; text: string; foreground: string; muted: string; surface: string; border: string }) {
  return <View style={[styles.statusCard, { backgroundColor: surface, borderColor: border }]}><View style={styles.statusTop}><View style={[styles.dot, { backgroundColor: color }]} /><Text style={[styles.statusLabel, { color: muted }]}>{title.toUpperCase()}</Text><Text style={[styles.statusValue, { color }]}>{text}</Text></View><Text style={[styles.statusDescription, { color: foreground }]}>{description}</Text></View>;
}

const styles = StyleSheet.create({ content: { paddingTop: 16, paddingBottom: 32, gap: 13 }, header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, headerTitle: { fontSize: 16, fontWeight: "900" }, hero: { borderRadius: 21, padding: 18, gap: 6 }, heroEyebrow: { color: "#101412AA", fontSize: 10, fontWeight: "900", letterSpacing: 1 }, heroTitle: { color: "#101412", fontSize: 22, fontWeight: "900" }, heroText: { color: "#101412CC", fontSize: 12, lineHeight: 18 }, section: { fontSize: 19, fontWeight: "900", marginTop: 3 }, cards: { gap: 9 }, statusCard: { borderWidth: 1, borderRadius: 17, padding: 14, gap: 8 }, statusTop: { flexDirection: "row", alignItems: "center", gap: 7 }, dot: { width: 9, height: 9, borderRadius: 5 }, statusLabel: { flex: 1, fontSize: 10, fontWeight: "900", letterSpacing: 0.8 }, statusValue: { fontSize: 11, fontWeight: "900" }, statusDescription: { fontSize: 13, fontWeight: "800" }, updated: { fontSize: 11, marginTop: -4 }, primary: { minHeight: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" }, primaryText: { color: "#101412", fontSize: 14, fontWeight: "900" }, recovery: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 8 }, recoveryTitle: { fontSize: 14, fontWeight: "900" }, recoveryText: { fontSize: 11, lineHeight: 17 }, outline: { minHeight: 42, borderWidth: 1, borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 3 }, outlineText: { fontSize: 12, fontWeight: "900" }, restartDivider: { height: 1, marginVertical: 3 }, restartButton: { minHeight: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 3 }, restartText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" }, note: { borderWidth: 1, borderRadius: 15, padding: 13, gap: 4 }, noteTitle: { fontSize: 12, fontWeight: "900" }, noteText: { fontSize: 11, lineHeight: 16 } });
