import { useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { useColors } from "@/hooks/use-colors";
import { cropAndPersistUserImage, type CropPreset, type PickedUserImage } from "@/lib/user-media";

type ImageCropSheetProps = { source: PickedUserImage | null; scope: "exercise" | "program"; ownerId: string; onSave: (uri: string) => void; onClose: () => void };
const presets: { id: CropPreset; label: string; hint: string }[] = [{ id: "square", label: "1:1", hint: "Карточка" }, { id: "landscape", label: "4:3", hint: "Обложка" }, { id: "original", label: "Полный", hint: "Без обрезки" }];

export function ImageCropSheet({ source, scope, ownerId, onSave, onClose }: ImageCropSheetProps) {
  const colors = useColors();
  const [preset, setPreset] = useState<CropPreset>(scope === "program" ? "landscape" : "square");
  const [isSaving, setSaving] = useState(false);
  const saveCrop = async () => {
    if (!source) return;
    try { setSaving(true); const uri = await cropAndPersistUserImage(source, scope, ownerId, preset); onSave(uri); onClose(); }
    catch { Alert.alert("Не удалось обработать изображение", "Попробуйте другой файл или выберите полный кадр."); }
    finally { setSaving(false); }
  };
  return <Modal visible={Boolean(source)} transparent animationType="slide" onRequestClose={onClose}><View style={styles.backdrop}><View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.eyebrow, { color: colors.primary }]}>КАДРИРОВАНИЕ</Text><Text style={[styles.title, { color: colors.foreground }]}>Подготовьте изображение</Text>{source && <Image source={source.uri} contentFit="cover" style={[styles.preview, preset === "square" && styles.previewSquare]} />}<Text style={[styles.hint, { color: colors.muted }]}>Выберите формат. Обрезка выполняется по центру, исходный файл не изменяется.</Text><View style={styles.presetRow}>{presets.map((item) => <Pressable key={item.id} onPress={() => setPreset(item.id)} style={[styles.preset, { borderColor: preset === item.id ? colors.primary : colors.border, backgroundColor: preset === item.id ? colors.primary + "18" : colors.background }]}><Text style={{ color: preset === item.id ? colors.primary : colors.foreground, fontSize: 13, fontWeight: "900" }}>{item.label}</Text><Text style={{ color: colors.muted, fontSize: 9, fontWeight: "700", marginTop: 2 }}>{item.hint}</Text></Pressable>)}</View><View style={styles.actions}><Pressable onPress={onClose} disabled={isSaving} style={[styles.cancel, { borderColor: colors.border }]}><Text style={[styles.cancelText, { color: colors.foreground }]}>Отмена</Text></Pressable><Pressable onPress={saveCrop} disabled={isSaving} style={[styles.save, { backgroundColor: colors.primary, opacity: isSaving ? 0.55 : 1 }]}><Text style={styles.saveText}>{isSaving ? "Сохраняем…" : "Сохранить кадр"}</Text></Pressable></View></View></View></Modal>;
}

const styles = StyleSheet.create({ backdrop: { flex: 1, backgroundColor: "#1E1230AA", justifyContent: "flex-end", padding: 16 }, sheet: { borderWidth: 1, borderRadius: 23, padding: 18, gap: 11 }, eyebrow: { fontSize: 10, fontWeight: "900", letterSpacing: 1 }, title: { fontSize: 22, fontWeight: "900" }, preview: { width: "100%", height: 205, borderRadius: 16 }, previewSquare: { alignSelf: "center", width: 205 }, hint: { fontSize: 11, lineHeight: 16 }, presetRow: { flexDirection: "row", gap: 8 }, preset: { flex: 1, minHeight: 54, borderWidth: 1, borderRadius: 13, alignItems: "center", justifyContent: "center" }, actions: { flexDirection: "row", gap: 10, marginTop: 3 }, cancel: { flex: 1, minHeight: 48, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" }, cancelText: { fontSize: 13, fontWeight: "900" }, save: { flex: 1.3, minHeight: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" }, saveText: { color: "#101412", fontSize: 13, fontWeight: "900" } });
