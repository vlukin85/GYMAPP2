import type ViewShot from "react-native-view-shot";
import { StyleSheet, Text, View } from "react-native";
import ViewShotComponent from "react-native-view-shot";

import type { CompletedWorkout } from "@/lib/workout-data";
import type { ShareableWorkoutRecord } from "@/lib/workout-achievements";

type WorkoutShareCardProps = {
  captureRef: React.RefObject<ViewShot | null>;
  workout: CompletedWorkout;
  programName: string;
  records: ShareableWorkoutRecord[];
  theme?: "dark" | "light";
  note?: string;
};

export function WorkoutShareCard({ captureRef, workout, programName, records, theme = "dark", note = "" }: WorkoutShareCardProps) {
  const date = new Date(`${workout.date.slice(0, 10)}T12:00:00`).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
  const volume = Math.round(workout.totalVolume).toLocaleString("ru-RU").replace(/\u00a0/g, " ");
  const light = theme === "light";
  return <ViewShotComponent ref={captureRef} options={{ format: "png", quality: 1, result: "tmpfile" }} style={[styles.frame, light && styles.lightFrame]}>
    <View style={[styles.haloOne, light && styles.lightHaloOne]} /><View style={[styles.haloTwo, light && styles.lightHaloTwo]} />
    <Text style={[styles.brand, light && styles.lightBrand]}>IRONRISE · ДОСТИЖЕНИЕ</Text>
    <Text numberOfLines={2} style={[styles.title, light && styles.lightTitle]}>{programName}</Text>
    <Text style={[styles.date, light && styles.lightDate]}>{date}</Text>
    <View style={[styles.rule, light && styles.lightRule]} />
    <View style={styles.metrics}><View><Text style={[styles.metricValue, light && styles.lightMetricValue]}>{workout.durationMinutes}</Text><Text style={[styles.metricUnit, light && styles.lightMetricUnit]}>МИНУТ</Text></View><View><Text style={[styles.metricValue, light && styles.lightMetricValue]}>{volume}</Text><Text style={[styles.metricUnit, light && styles.lightMetricUnit]}>КГ ОБЪЁМ</Text></View><View><Text style={[styles.metricValue, light && styles.lightMetricValue]}>{workout.sets?.length ?? 0}</Text><Text style={[styles.metricUnit, light && styles.lightMetricUnit]}>ПОДХОДОВ</Text></View></View>
    <View style={[styles.recordPanel, light && styles.lightRecordPanel]}><Text style={[styles.recordEyebrow, light && styles.lightRecordEyebrow]}>{records.length ? `НОВЫЕ ЛИЧНЫЕ РЕКОРДЫ · ${records.length}` : "ТРЕНИРОВКА ЗАВЕРШЕНА"}</Text>{records.length ? records.slice(0, 3).map((record) => <View key={record.exerciseId} style={styles.recordRow}><View style={{ flex: 1 }}><Text numberOfLines={1} style={[styles.recordName, light && styles.lightRecordName]}>{record.name}</Text><Text style={[styles.recordMeta, light && styles.lightRecordMeta]}>{record.weight} кг × {record.reps}</Text></View><Text style={styles.oneRm}>1RM {record.estimatedOneRepMax.toFixed(1)} кг</Text></View>) : <Text style={[styles.noRecords, light && styles.lightRecordMeta]}>Фиксируй фактические подходы — рекорды появятся здесь.</Text>}</View>
    {note.trim() ? <View style={[styles.notePanel, light && styles.lightNotePanel]}><Text style={[styles.noteLabel, light && styles.lightNoteLabel]}>МОЯ ЗАМЕТКА</Text><Text numberOfLines={3} style={[styles.noteText, light && styles.lightRecordName]}>{note.trim()}</Text></View> : null}
    <View style={styles.footer}><View style={styles.footerMark}><Text style={styles.footerMarkText}>IR</Text></View><Text style={[styles.footerText, light && styles.lightFooterText]}>Сильнее, чем вчера</Text></View>
  </ViewShotComponent>;
}

const styles = StyleSheet.create({
  frame: { width: 360, height: 560, overflow: "hidden", borderRadius: 30, padding: 26, backgroundColor: "#160E24", justifyContent: "space-between" },
  lightFrame: { backgroundColor: "#FBF8FF" },
  haloOne: { position: "absolute", width: 290, height: 290, borderRadius: 145, right: -90, top: -105, backgroundColor: "#9B4DFF" },
  lightHaloOne: { backgroundColor: "#DBC3FF" },
  haloTwo: { position: "absolute", width: 195, height: 195, borderRadius: 98, left: -62, bottom: 50, backgroundColor: "#E11D72" },
  lightHaloTwo: { backgroundColor: "#FFC3DE" },
  brand: { color: "#D9C4FF", fontSize: 10, fontWeight: "900", letterSpacing: 1.5 }, title: { color: "#FFFFFF", fontSize: 30, fontWeight: "900", lineHeight: 35, marginTop: 18, maxWidth: "92%" }, date: { color: "#E8DFFF", fontSize: 12, fontWeight: "700", marginTop: 9 }, rule: { height: 1, backgroundColor: "#FFFFFF36", marginVertical: 20 },
  lightBrand: { color: "#6333A5" }, lightTitle: { color: "#211335" }, lightDate: { color: "#5F5470" }, lightRule: { backgroundColor: "#21133524" },
  metrics: { flexDirection: "row", justifyContent: "space-between" }, metricValue: { color: "#FFFFFF", fontSize: 22, fontWeight: "900" }, metricUnit: { color: "#D9C4FF", fontSize: 8, fontWeight: "900", letterSpacing: 0.6, marginTop: 4 },
  lightMetricValue: { color: "#211335" }, lightMetricUnit: { color: "#665979" },
  recordPanel: { backgroundColor: "#FFFFFF15", borderColor: "#FFFFFF28", borderWidth: 1, borderRadius: 18, padding: 14, gap: 10 }, recordEyebrow: { color: "#C8F169", fontSize: 9, fontWeight: "900", letterSpacing: 0.8 }, recordRow: { flexDirection: "row", alignItems: "center", gap: 9 }, recordName: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" }, recordMeta: { color: "#E8DFFF", fontSize: 10, marginTop: 3 }, oneRm: { color: "#C8F169", fontSize: 10, fontWeight: "900" }, noRecords: { color: "#E8DFFF", fontSize: 12, lineHeight: 17 },
  lightRecordPanel: { backgroundColor: "#FFFFFFB8", borderColor: "#6D3EAD35" }, lightRecordEyebrow: { color: "#3F8129" }, lightRecordName: { color: "#211335" }, lightRecordMeta: { color: "#5F5470" },
  notePanel: { borderLeftWidth: 2, borderLeftColor: "#C8F169", paddingLeft: 10, marginTop: -6 }, lightNotePanel: { borderLeftColor: "#7A42C7" }, noteLabel: { color: "#C8F169", fontSize: 8, fontWeight: "900", letterSpacing: 0.7 }, lightNoteLabel: { color: "#6333A5" }, noteText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700", lineHeight: 17, marginTop: 4 },
  footer: { flexDirection: "row", alignItems: "center", gap: 10 }, footerMark: { width: 28, height: 28, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: "#C8F169" }, footerMarkText: { color: "#160E24", fontSize: 10, fontWeight: "900" }, footerText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
  lightFooterText: { color: "#211335" },
});
