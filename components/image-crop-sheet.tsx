import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Image as NativeImage, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useColors } from "@/hooks/use-colors";
import { cropAndPersistUserImage, DEFAULT_CROP_ADJUSTMENT, getCropRect, type CropAdjustment, type CropPreset, type PickedUserImage } from "@/lib/user-media";

type ImageCropSheetProps = { source: PickedUserImage | null; scope: "exercise" | "program"; ownerId: string; onSave: (uri: string) => void; onClose: () => void };
const PREVIEW_WIDTH = 320;
const PREVIEW_HEIGHT = 220;
const presets: { id: CropPreset; label: string; hint: string }[] = [{ id: "square", label: "1:1", hint: "Карточка" }, { id: "landscape", label: "4:3", hint: "Обложка" }, { id: "original", label: "Полный", hint: "Без обрезки" }];
const clamp = (value: number, minimum: number, maximum: number) => Math.min(maximum, Math.max(minimum, value));

export function ImageCropSheet({ source, scope, ownerId, onSave, onClose }: ImageCropSheetProps) {
  const colors = useColors();
  const [preset, setPreset] = useState<CropPreset>(scope === "program" ? "landscape" : "square");
  const [adjustment, setAdjustment] = useState<CropAdjustment>(DEFAULT_CROP_ADJUSTMENT);
  const [sourceSize, setSourceSize] = useState({ width: 1600, height: 900 });
  const [isSaving, setSaving] = useState(false);
  const adjustmentRef = useRef(adjustment);
  const panStart = useRef(adjustment);
  const pinchStart = useRef(1);
  useEffect(() => { adjustmentRef.current = adjustment; }, [adjustment]);
  useEffect(() => {
    setPreset(scope === "program" ? "landscape" : "square"); setAdjustment(DEFAULT_CROP_ADJUSTMENT);
    if (!source) return;
    NativeImage.getSize(source.uri, (width, height) => setSourceSize({ width, height }), () => setSourceSize({ width: 1600, height: 900 }));
  }, [scope, source?.uri]);
  const preview = useMemo(() => {
    const scale = Math.min(PREVIEW_WIDTH / sourceSize.width, PREVIEW_HEIGHT / sourceSize.height);
    const width = sourceSize.width * scale;
    const height = sourceSize.height * scale;
    const left = (PREVIEW_WIDTH - width) / 2;
    const top = (PREVIEW_HEIGHT - height) / 2;
    const crop = preset === "original" ? null : getCropRect(sourceSize.width, sourceSize.height, preset, adjustment);
    return { scale, width, height, left, top, crop };
  }, [adjustment, preset, sourceSize]);
  const pan = Gesture.Pan().runOnJS(true).onBegin(() => { panStart.current = adjustmentRef.current; }).onUpdate((event) => {
    if (preset === "original") return;
    setAdjustment({ ...panStart.current, focusX: clamp(panStart.current.focusX + event.translationX / preview.width, 0, 1), focusY: clamp(panStart.current.focusY + event.translationY / preview.height, 0, 1) });
  });
  const pinch = Gesture.Pinch().runOnJS(true).onBegin(() => { pinchStart.current = adjustmentRef.current.zoom; }).onUpdate((event) => {
    if (preset === "original") return;
    setAdjustment((current) => ({ ...current, zoom: clamp(pinchStart.current * event.scale, 1, 3) }));
  });
  const cropGesture = Gesture.Simultaneous(pan, pinch);
  const choosePreset = (next: CropPreset) => { setPreset(next); setAdjustment(DEFAULT_CROP_ADJUSTMENT); };
  const saveCrop = async () => {
    if (!source) return;
    try { setSaving(true); const uri = await cropAndPersistUserImage(source, scope, ownerId, preset, adjustment); onSave(uri); onClose(); }
    catch { Alert.alert("Не удалось обработать изображение", "Попробуйте другой файл или выберите полный кадр."); }
    finally { setSaving(false); }
  };
  const frameStyle = preview.crop ? { left: preview.left + preview.crop.originX * preview.scale, top: preview.top + preview.crop.originY * preview.scale, width: preview.crop.width * preview.scale, height: preview.crop.height * preview.scale } : { left: preview.left, top: preview.top, width: preview.width, height: preview.height };
  return <Modal visible={Boolean(source)} transparent animationType="slide" onRequestClose={onClose}><View style={styles.backdrop}><View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.eyebrow, { color: colors.primary }]}>КАДРИРОВАНИЕ</Text><Text style={[styles.title, { color: colors.foreground }]}>Подготовьте изображение</Text>{source && <GestureDetector gesture={cropGesture}><View style={styles.previewShell}><Image source={source.uri} contentFit="contain" style={styles.preview} /><View pointerEvents="none" style={[styles.cropFrame, { borderColor: colors.primary }, frameStyle]}><View style={[styles.frameBadge, { backgroundColor: colors.primary }]}><Text style={styles.frameBadgeText}>{preset === "original" ? "Исходный кадр" : `${Math.round(adjustment.zoom * 100)}%`}</Text></View></View></View></GestureDetector>}<Text style={[styles.hint, { color: colors.muted }]}>{preset === "original" ? "Изображение сохранится без обрезки." : "Перемещайте рамку одним пальцем и масштабируйте её двумя пальцами. Исходный файл не изменяется."}</Text><View style={styles.presetRow}>{presets.map((item) => <Pressable key={item.id} onPress={() => choosePreset(item.id)} style={[styles.preset, { borderColor: preset === item.id ? colors.primary : colors.border, backgroundColor: preset === item.id ? colors.primary + "18" : colors.background }]}><Text style={{ color: preset === item.id ? colors.primary : colors.foreground, fontSize: 13, fontWeight: "900" }}>{item.label}</Text><Text style={{ color: colors.muted, fontSize: 9, fontWeight: "700", marginTop: 2 }}>{item.hint}</Text></Pressable>)}</View>{preset !== "original" && <Pressable onPress={() => setAdjustment(DEFAULT_CROP_ADJUSTMENT)} style={[styles.reset, { borderColor: colors.border }]}><Text style={[styles.resetText, { color: colors.foreground }]}>Сбросить положение и масштаб</Text></Pressable>}<View style={styles.actions}><Pressable onPress={onClose} disabled={isSaving} style={[styles.cancel, { borderColor: colors.border }]}><Text style={[styles.cancelText, { color: colors.foreground }]}>Отмена</Text></Pressable><Pressable onPress={saveCrop} disabled={isSaving} style={[styles.save, { backgroundColor: colors.primary, opacity: isSaving ? 0.55 : 1 }]}><Text style={styles.saveText}>{isSaving ? "Сохраняем…" : "Сохранить кадр"}</Text></Pressable></View></View></View></Modal>;
}

const styles = StyleSheet.create({ backdrop: { flex: 1, backgroundColor: "#1E1230AA", justifyContent: "flex-end", padding: 16 }, sheet: { borderWidth: 1, borderRadius: 23, padding: 18, gap: 11 }, eyebrow: { fontSize: 10, fontWeight: "900", letterSpacing: 1 }, title: { fontSize: 22, fontWeight: "900" }, previewShell: { width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT, alignSelf: "center", backgroundColor: "#0D0915", borderRadius: 16, overflow: "hidden" }, preview: { width: "100%", height: "100%" }, cropFrame: { position: "absolute", borderWidth: 2, borderRadius: 4, backgroundColor: "#FFFFFF08" }, frameBadge: { position: "absolute", right: 5, bottom: 5, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 3 }, frameBadgeText: { color: "#101412", fontSize: 9, fontWeight: "900" }, hint: { fontSize: 11, lineHeight: 16 }, presetRow: { flexDirection: "row", gap: 8 }, preset: { flex: 1, minHeight: 54, borderWidth: 1, borderRadius: 13, alignItems: "center", justifyContent: "center" }, reset: { minHeight: 39, borderWidth: 1, borderRadius: 12, alignItems: "center", justifyContent: "center" }, resetText: { fontSize: 11, fontWeight: "900" }, actions: { flexDirection: "row", gap: 10, marginTop: 3 }, cancel: { flex: 1, minHeight: 48, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" }, cancelText: { fontSize: 13, fontWeight: "900" }, save: { flex: 1.3, minHeight: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" }, saveText: { color: "#101412", fontSize: 13, fontWeight: "900" } });
