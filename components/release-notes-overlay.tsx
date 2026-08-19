import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { CURRENT_RELEASE, releaseNotesTitle, shouldShowReleaseNotes } from "@/lib/release-notes";

const RELEASE_NOTES_STORAGE_KEY = "gym-diary-last-seen-release-notes";

export function ReleaseNotesOverlay() {
  const colors = useColors();
  const [visible, setVisible] = useState(false);
  const version = Constants.expoConfig?.version ?? CURRENT_RELEASE.version;
  useEffect(() => { let active = true; void AsyncStorage.getItem(RELEASE_NOTES_STORAGE_KEY).then((seen) => { if (active && shouldShowReleaseNotes(seen, version)) setVisible(true); }).catch(() => undefined); return () => { active = false; }; }, [version]);
  const close = () => { setVisible(false); void AsyncStorage.setItem(RELEASE_NOTES_STORAGE_KEY, version); };
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={close}><View style={styles.backdrop}><View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.primary }]}><Text style={[styles.eyebrow, { color: colors.primary }]}>ОБНОВЛЕНИЕ ПРИЛОЖЕНИЯ</Text><Text style={[styles.title, { color: colors.foreground }]}>{releaseNotesTitle(version)}</Text><Text style={[styles.versionContext, { color: colors.muted }]}>Изменения относительно версии {CURRENT_RELEASE.previousVersion}</Text><View style={styles.list}>{CURRENT_RELEASE.entries.map((entry) => <View key={entry} style={styles.item}><View style={[styles.bullet, { backgroundColor: colors.primary }]} /><Text style={[styles.itemText, { color: colors.foreground }]}>{entry}</Text></View>)}</View><Pressable onPress={close} style={[styles.button, { backgroundColor: colors.primary }]}><Text style={styles.buttonText}>Понятно</Text></Pressable><Text style={[styles.once, { color: colors.muted }]}>Это сообщение показывается один раз после обновления.</Text></View></View></Modal>;
}

const styles = StyleSheet.create({ backdrop: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "#120923B8" }, card: { width: "100%", maxWidth: 420, borderWidth: 1, borderRadius: 25, padding: 20, gap: 12 }, eyebrow: { fontSize: 10, fontWeight: "900", letterSpacing: 1 }, title: { fontSize: 24, fontWeight: "900" }, versionContext: { fontSize: 11, fontWeight: "800", marginTop: -7 }, list: { gap: 12, marginTop: 3 }, item: { flexDirection: "row", gap: 9, alignItems: "flex-start" }, bullet: { width: 7, height: 7, borderRadius: 4, marginTop: 6 }, itemText: { flex: 1, fontSize: 13, lineHeight: 19, fontWeight: "700" }, button: { minHeight: 51, borderRadius: 15, alignItems: "center", justifyContent: "center", marginTop: 5 }, buttonText: { color: "#101412", fontSize: 14, fontWeight: "900" }, once: { fontSize: 10, textAlign: "center" } });
