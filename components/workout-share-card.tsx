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
};

export function WorkoutShareCard({ captureRef, workout, programName, records }: WorkoutShareCardProps) {
  const date = new Date(`${workout.date.slice(0, 10)}T12:00:00`).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
  const volume = Math.round(workout.totalVolume).toLocaleString("ru-RU").replace(/\u00a0/g, " ");
  return <ViewShotComponent ref={captureRef} options={{ format: "png", quality: 1, result: "tmpfile" }} style={styles.frame}>
    <View style={styles.haloOne} /><View style={styles.haloTwo} />
    <Text style={styles.brand}>IRONRISE · ДОСТИЖЕНИЕ</Text>
    <Text numberOfLines={2} style={styles.title}>{programName}</Text>
    <Text style={styles.date}>{date}</Text>
    <View style={styles.rule} />
    <View style={styles.metrics}><View><Text style={styles.metricValue}>{workout.durationMinutes}</Text><Text style={styles.metricUnit}>МИНУТ</Text></View><View><Text style={styles.metricValue}>{volume}</Text><Text style={styles.metricUnit}>КГ ОБЪЁМ</Text></View><View><Text style={styles.metricValue}>{workout.sets?.length ?? 0}</Text><Text style={styles.metricUnit}>ПОДХОДОВ</Text></View></View>
    <View style={styles.recordPanel}><Text style={styles.recordEyebrow}>{records.length ? `НОВЫЕ ЛИЧНЫЕ РЕКОРДЫ · ${records.length}` : "ТРЕНИРОВКА ЗАВЕРШЕНА"}</Text>{records.length ? records.slice(0, 3).map((record) => <View key={record.exerciseId} style={styles.recordRow}><View style={{ flex: 1 }}><Text numberOfLines={1} style={styles.recordName}>{record.name}</Text><Text style={styles.recordMeta}>{record.weight} кг × {record.reps}</Text></View><Text style={styles.oneRm}>1RM {record.estimatedOneRepMax.toFixed(1)} кг</Text></View>) : <Text style={styles.noRecords}>Фиксируй фактические подходы — рекорды появятся здесь.</Text>}</View>
    <View style={styles.footer}><View style={styles.footerMark}><Text style={styles.footerMarkText}>IR</Text></View><Text style={styles.footerText}>Сильнее, чем вчера</Text></View>
  </ViewShotComponent>;
}

const styles = StyleSheet.create({
  frame: { width: 360, height: 560, overflow: "hidden", borderRadius: 30, padding: 26, backgroundColor: "#160E24", justifyContent: "space-between" },
  haloOne: { position: "absolute", width: 290, height: 290, borderRadius: 145, right: -90, top: -105, backgroundColor: "#9B4DFF" },
  haloTwo: { position: "absolute", width: 195, height: 195, borderRadius: 98, left: -62, bottom: 50, backgroundColor: "#E11D72" },
  brand: { color: "#D9C4FF", fontSize: 10, fontWeight: "900", letterSpacing: 1.5 }, title: { color: "#FFFFFF", fontSize: 30, fontWeight: "900", lineHeight: 35, marginTop: 18, maxWidth: "92%" }, date: { color: "#E8DFFF", fontSize: 12, fontWeight: "700", marginTop: 9 }, rule: { height: 1, backgroundColor: "#FFFFFF36", marginVertical: 20 },
  metrics: { flexDirection: "row", justifyContent: "space-between" }, metricValue: { color: "#FFFFFF", fontSize: 22, fontWeight: "900" }, metricUnit: { color: "#D9C4FF", fontSize: 8, fontWeight: "900", letterSpacing: 0.6, marginTop: 4 },
  recordPanel: { backgroundColor: "#FFFFFF15", borderColor: "#FFFFFF28", borderWidth: 1, borderRadius: 18, padding: 14, gap: 10 }, recordEyebrow: { color: "#C8F169", fontSize: 9, fontWeight: "900", letterSpacing: 0.8 }, recordRow: { flexDirection: "row", alignItems: "center", gap: 9 }, recordName: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" }, recordMeta: { color: "#E8DFFF", fontSize: 10, marginTop: 3 }, oneRm: { color: "#C8F169", fontSize: 10, fontWeight: "900" }, noRecords: { color: "#E8DFFF", fontSize: 12, lineHeight: 17 },
  footer: { flexDirection: "row", alignItems: "center", gap: 10 }, footerMark: { width: 28, height: 28, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: "#C8F169" }, footerMarkText: { color: "#160E24", fontSize: 10, fontWeight: "900" }, footerText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
});
