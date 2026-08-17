import { useState } from "react";
import { Alert, FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { ImageCropSheet } from "@/components/image-crop-sheet";
import { useColors } from "@/hooks/use-colors";
import { pickUserImage, type PickedUserImage } from "@/lib/user-media";

export type MediaLibraryItem = { id: string; label: string; url: string };

type MediaPickerSheetProps = {
  visible: boolean;
  title: string;
  ownerId: string;
  scope: "exercise" | "program";
  currentImage?: string;
  library: MediaLibraryItem[];
  onSelect: (uri: string) => void;
  onClose: () => void;
};

export function MediaPickerSheet({ visible, title, ownerId, scope, currentImage, library, onSelect, onClose }: MediaPickerSheetProps) {
  const colors = useColors();
  const [isPicking, setPicking] = useState(false);
  const [cropSource, setCropSource] = useState<PickedUserImage | null>(null);
  const chooseUpload = async () => {
    try {
      setPicking(true);
      const source = await pickUserImage();
      if (source) setCropSource(source);
    } catch (error) { Alert.alert("Не удалось загрузить изображение", error instanceof Error ? error.message : "Попробуйте выбрать другой файл."); }
    finally { setPicking(false); }
  };
  return <><Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}><View style={styles.backdrop}><View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={styles.header}><View><Text style={[styles.eyebrow, { color: colors.primary }]}>ИЗОБРАЖЕНИЕ</Text><Text style={[styles.title, { color: colors.foreground }]}>{title}</Text></View><Pressable onPress={onClose} style={[styles.close, { backgroundColor: colors.background }]}><Text style={[styles.closeText, { color: colors.foreground }]}>×</Text></Pressable></View><Text style={[styles.hint, { color: colors.muted }]}>Выберите готовую иллюстрацию или загрузите JPG, PNG, WEBP либо HEIC до 8 МБ. Перед сохранением можно обрезать изображение.</Text>{currentImage && <View style={[styles.current, { borderColor: colors.primary }]}><Image source={currentImage} contentFit="cover" style={styles.currentImage} /><Text style={[styles.currentText, { color: colors.primary }]}>Текущее изображение</Text></View>}<Pressable onPress={chooseUpload} disabled={isPicking} style={[styles.upload, { backgroundColor: colors.primary, opacity: isPicking ? 0.55 : 1 }]}><Text style={styles.uploadText}>{isPicking ? "Открываем файлы…" : "Загрузить из устройства"}</Text></Pressable><Text style={[styles.libraryTitle, { color: colors.foreground }]}>Готовые иллюстрации</Text><FlatList data={library} keyExtractor={(item) => item.id} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.library} renderItem={({ item }) => <Pressable onPress={() => { onSelect(item.url); onClose(); }} style={({ pressed }) => [styles.libraryItem, { borderColor: currentImage === item.url ? colors.primary : colors.border, backgroundColor: colors.background }, pressed && { opacity: 0.74 }]}><Image source={item.url} contentFit="cover" style={styles.libraryImage} /><Text numberOfLines={1} style={[styles.libraryLabel, { color: colors.foreground }]}>{item.label}</Text></Pressable>} /><Pressable onPress={onClose} style={[styles.cancel, { borderColor: colors.border }]}><Text style={[styles.cancelText, { color: colors.foreground }]}>Готово</Text></Pressable></View></View></Modal><ImageCropSheet source={cropSource} scope={scope} ownerId={ownerId} onSave={(uri) => { setCropSource(null); onSelect(uri); onClose(); }} onClose={() => setCropSource(null)} /></>;
}

const styles = StyleSheet.create({ backdrop: { flex: 1, backgroundColor: "#1E1230AA", justifyContent: "flex-end", padding: 16 }, sheet: { borderWidth: 1, borderRadius: 23, padding: 18, gap: 12 }, header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, eyebrow: { fontSize: 10, fontWeight: "900", letterSpacing: 1 }, title: { fontSize: 22, fontWeight: "900", marginTop: 3 }, close: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" }, closeText: { fontSize: 24, lineHeight: 26 }, hint: { fontSize: 11, lineHeight: 16 }, current: { minHeight: 52, borderWidth: 1, borderRadius: 13, flexDirection: "row", alignItems: "center", overflow: "hidden" }, currentImage: { width: 52, height: 52 }, currentText: { fontSize: 11, fontWeight: "900", paddingHorizontal: 11 }, upload: { minHeight: 50, borderRadius: 14, alignItems: "center", justifyContent: "center" }, uploadText: { color: "#101412", fontSize: 13, fontWeight: "900" }, libraryTitle: { fontSize: 14, fontWeight: "900", marginTop: 2 }, library: { gap: 9 }, libraryItem: { width: 116, borderWidth: 1, borderRadius: 14, overflow: "hidden" }, libraryImage: { width: 114, height: 88 }, libraryLabel: { fontSize: 10, fontWeight: "800", padding: 8 }, cancel: { minHeight: 46, borderWidth: 1, borderRadius: 14, alignItems: "center", justifyContent: "center" }, cancelText: { fontSize: 13, fontWeight: "900" } });
