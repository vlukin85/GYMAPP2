import type ViewShot from "react-native-view-shot";
import { router } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import ViewShotComponent from "react-native-view-shot";

import type { CompletedWorkout } from "@/lib/workout-data";
import type { ShareableWorkoutRecord } from "@/lib/workout-achievements";
import { heartRateZoneLabel, type HeartRateZoneId } from "@/lib/heart-rate-analysis";
import { DEFAULT_LANG, getT } from "@/lib/i18n";
import type { DictKey, Lang } from "@/lib/i18n";

type WorkoutShareCardProps = {
  captureRef: React.RefObject<ViewShot | null>;
  workout: CompletedWorkout;
  programName: string;
  records: ShareableWorkoutRecord[];
  theme?: "dark" | "light";
  note?: string;
  photoUri?: string;
  /**
   * Язык карточки. Параметр необязательный: без него карточка остаётся
   * русской, поэтому вызовы, которые ещё не переведены, работают как раньше.
   */
  lang?: Lang;
};

/** Короткие подписи зон в строке «время по зонам» — только для PNG-карточки. */
const zoneShortKeys: Record<HeartRateZoneId, DictKey> = {
  recovery: "workoutServices.card.zoneShort.recovery",
  easy: "workoutServices.card.zoneShort.easy",
  aerobic: "workoutServices.card.zoneShort.aerobic",
  threshold: "workoutServices.card.zoneShort.threshold",
  maximum: "workoutServices.card.zoneShort.maximum",
};

export function WorkoutShareCard({ captureRef, workout, programName, records, theme = "dark", note = "", photoUri, lang = DEFAULT_LANG }: WorkoutShareCardProps) {
  const tr = getT(lang);
  const locale = lang === "en" ? "en-US" : "ru-RU";
  const date = new Date(`${workout.date.slice(0, 10)}T12:00:00`).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
  const volume = Math.round(workout.totalVolume).toLocaleString(locale).replace(/\u00a0/g, " ");
  const calories = workout.caloriesBurned === undefined ? "—" : Math.max(0, Math.round(workout.caloriesBurned)).toLocaleString(locale);
  const activeZones = [...(workout.heartRateZones ?? [])].filter((zone) => zone.seconds > 0).sort((first, second) => second.seconds - first.seconds);
  const dominantZone = activeZones[0];
  const zoneLabel = dominantZone ? heartRateZoneLabel(dominantZone.id as HeartRateZoneId, lang) : undefined;
  const formatZone = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  const light = theme === "light";
  return <Pressable onPress={() => router.push({ pathname: "/share-workout" as never, params: { workoutId: workout.id } })} accessibilityRole="button" accessibilityLabel={tr("workoutServices.card.a11yOpenStudio")}><ViewShotComponent ref={captureRef} options={{ format: "png", quality: 1, result: "tmpfile" }} style={[styles.frame, light && styles.lightFrame]}>
    <View style={[styles.haloOne, light && styles.lightHaloOne]} /><View style={[styles.haloTwo, light && styles.lightHaloTwo]} />
    <Text style={[styles.brand, light && styles.lightBrand]}>{tr("workoutServices.card.brand")}</Text>
    <Text numberOfLines={2} style={[styles.title, light && styles.lightTitle]}>{programName}</Text>
    <Text style={[styles.date, light && styles.lightDate]}>{date}</Text>
    <View style={[styles.rule, light && styles.lightRule]} />
    <View style={styles.metrics}><View><Text style={[styles.metricValue, light && styles.lightMetricValue]}>{workout.durationMinutes}</Text><Text style={[styles.metricUnit, light && styles.lightMetricUnit]}>{tr("workoutServices.card.minutes")}</Text></View><View><Text style={[styles.metricValue, light && styles.lightMetricValue]}>{volume}</Text><Text style={[styles.metricUnit, light && styles.lightMetricUnit]}>{tr("workoutServices.card.volumeKg")}</Text></View><View><Text style={[styles.metricValue, light && styles.lightMetricValue]}>{workout.sets?.length ?? 0}</Text><Text style={[styles.metricUnit, light && styles.lightMetricUnit]}>{tr("workoutServices.card.sets")}</Text></View><View><Text style={[styles.metricValue, light && styles.lightMetricValue]}>{calories}</Text><Text style={[styles.metricUnit, light && styles.lightMetricUnit]}>{tr("workoutServices.card.kcal")}</Text></View></View>
    {(workout.averageHeartRateBpm || zoneLabel) && <View style={[styles.heartRatePanel, light && styles.lightHeartRatePanel]}><View><Text style={[styles.heartRateEyebrow, light && styles.lightHeartRateEyebrow]}>{tr("workoutServices.card.heartRateEyebrow")}</Text><Text style={[styles.heartRateValue, light && styles.lightHeartRateValue]}>{workout.averageHeartRateBpm ?? "—"}<Text style={[styles.heartRateUnit, light && styles.lightHeartRateUnit]}>{" "}{tr("workoutServices.card.heartRateAverageUnit")}</Text></Text></View><View style={styles.heartRateZone}><Text style={[styles.heartRateZoneLabel, light && styles.lightHeartRateUnit]}>{tr("workoutServices.card.dominantZone")}</Text><Text style={[styles.heartRateZoneValue, light && styles.lightHeartRateValue]}>{zoneLabel ?? "—"}</Text>{dominantZone && <Text style={[styles.heartRateZoneMeta, light && styles.lightHeartRateUnit]}>{tr("workoutServices.card.zoneRange", { from: dominantZone.fromBpm, to: dominantZone.toBpm })}</Text>}</View>{activeZones.length > 0 && <View style={[styles.shareZones, { borderTopColor: light ? "#21133524" : "#FFFFFF28" }]}><Text style={[styles.shareZonesLabel, light && styles.lightHeartRateUnit]}>{tr("workoutServices.card.zonesTime")}</Text><Text numberOfLines={2} style={[styles.shareZonesValue, light && styles.lightHeartRateValue]}>{activeZones.slice(0, 3).map((zone) => `${tr(zoneShortKeys[zone.id as HeartRateZoneId] ?? "workoutServices.card.zoneShort.maximum")} ${formatZone(zone.seconds)}`).join(" · ")}</Text></View>}</View>}
    <View style={[styles.recordPanel, light && styles.lightRecordPanel]}><Text style={[styles.recordEyebrow, light && styles.lightRecordEyebrow]}>{records.length ? tr("workoutServices.card.newRecords", { count: records.length }) : tr("workoutServices.card.finished")}</Text>{records.length ? records.slice(0, 3).map((record) => <View key={record.exerciseId} style={styles.recordRow}><View style={{ flex: 1 }}><Text numberOfLines={1} style={[styles.recordName, light && styles.lightRecordName]}>{record.name}</Text><Text style={[styles.recordMeta, light && styles.lightRecordMeta]}>{tr("workoutServices.card.recordMeta", { weight: record.weight, reps: record.reps })}</Text></View><Text style={styles.oneRm}>{tr("workoutServices.card.oneRm", { value: record.estimatedOneRepMax.toFixed(1) })}</Text></View>) : <Text style={[styles.noRecords, light && styles.lightRecordMeta]}>{tr("workoutServices.card.noRecords")}</Text>}</View>
    {photoUri ? <Image source={{ uri: photoUri }} style={styles.sharePhoto} /> : null}
    {note.trim() ? <View style={[styles.notePanel, light && styles.lightNotePanel]}><Text style={[styles.noteLabel, light && styles.lightNoteLabel]}>{tr("workoutServices.card.noteLabel")}</Text><Text numberOfLines={3} style={[styles.noteText, light && styles.lightRecordName]}>{note.trim()}</Text></View> : null}
    <View style={styles.footer}><View style={styles.footerMark}><Text style={styles.footerMarkText}>IR</Text></View><Text style={[styles.footerText, light && styles.lightFooterText]}>{tr("workoutServices.card.footerTagline")}</Text></View>
  </ViewShotComponent><View style={[styles.studioHint, light && styles.lightStudioHint]}><Text style={[styles.studioHintText, light && styles.lightStudioHintText]}>{tr("workoutServices.card.studioHint")}</Text></View></Pressable>;
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
  metrics: { flexDirection: "row", justifyContent: "space-between", gap: 7 }, metricValue: { color: "#FFFFFF", fontSize: 19, fontWeight: "900" }, metricUnit: { color: "#D9C4FF", fontSize: 7, fontWeight: "900", letterSpacing: 0.4, marginTop: 4 },
  lightMetricValue: { color: "#211335" }, lightMetricUnit: { color: "#665979" },
  heartRatePanel: { marginTop: 2, paddingVertical: 9, paddingHorizontal: 11, flexDirection: "row", justifyContent: "space-between", gap: 12, backgroundColor: "#FFFFFF15", borderLeftWidth: 3, borderLeftColor: "#C8F169" },
  lightHeartRatePanel: { backgroundColor: "#FFFFFFB8", borderLeftColor: "#6333A5" },
  heartRateEyebrow: { color: "#C8F169", fontSize: 8, fontWeight: "900", letterSpacing: 0.7 },
  lightHeartRateEyebrow: { color: "#6333A5" },
  heartRateValue: { color: "#FFFFFF", fontSize: 19, fontWeight: "900", marginTop: 2 },
  lightHeartRateValue: { color: "#211335" },
  heartRateUnit: { color: "#D9C4FF", fontSize: 7, fontWeight: "900", letterSpacing: 0.35 },
  lightHeartRateUnit: { color: "#665979" },
  heartRateZone: { alignItems: "flex-end", justifyContent: "center" },
  heartRateZoneLabel: { color: "#D9C4FF", fontSize: 7, fontWeight: "900", letterSpacing: 0.45 },
  heartRateZoneValue: { color: "#FFFFFF", fontSize: 11, fontWeight: "900", marginTop: 3 },
  heartRateZoneMeta: { color: "#D9C4FF", fontSize: 7, fontWeight: "900", marginTop: 2 },
  shareZones: { width: "100%", borderTopWidth: StyleSheet.hairlineWidth, marginTop: 8, paddingTop: 7 },
  shareZonesLabel: { color: "#D9C4FF", fontSize: 7, fontWeight: "900", letterSpacing: 0.45 },
  shareZonesValue: { color: "#FFFFFF", fontSize: 9, fontWeight: "900", lineHeight: 14, marginTop: 3 },
  recordPanel: { backgroundColor: "#FFFFFF15", borderColor: "#FFFFFF28", borderWidth: 1, borderRadius: 18, padding: 14, gap: 10 }, recordEyebrow: { color: "#C8F169", fontSize: 9, fontWeight: "900", letterSpacing: 0.8 }, recordRow: { flexDirection: "row", alignItems: "center", gap: 9 }, recordName: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" }, recordMeta: { color: "#E8DFFF", fontSize: 10, marginTop: 3 }, oneRm: { color: "#C8F169", fontSize: 10, fontWeight: "900" }, noRecords: { color: "#E8DFFF", fontSize: 12, lineHeight: 17 },
  lightRecordPanel: { backgroundColor: "#FFFFFFB8", borderColor: "#6D3EAD35" }, lightRecordEyebrow: { color: "#3F8129" }, lightRecordName: { color: "#211335" }, lightRecordMeta: { color: "#5F5470" },
  notePanel: { borderLeftWidth: 2, borderLeftColor: "#C8F169", paddingLeft: 10, marginTop: -6 }, lightNotePanel: { borderLeftColor: "#7A42C7" }, noteLabel: { color: "#C8F169", fontSize: 8, fontWeight: "900", letterSpacing: 0.7 }, lightNoteLabel: { color: "#6333A5" }, noteText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700", lineHeight: 17, marginTop: 4 },
  sharePhoto: { width: "100%", height: 112, resizeMode: "cover", borderRadius: 14, marginTop: -2 },
  footer: { flexDirection: "row", alignItems: "center", gap: 10 }, footerMark: { width: 28, height: 28, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: "#C8F169" }, footerMarkText: { color: "#160E24", fontSize: 10, fontWeight: "900" }, footerText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
  lightFooterText: { color: "#211335" },
  studioHint: { marginTop: 8, alignItems: "center", borderWidth: 1, borderColor: "#FFFFFF38", paddingVertical: 7, backgroundColor: "#160E24" }, lightStudioHint: { backgroundColor: "#FBF8FF", borderColor: "#21133528" }, studioHintText: { color: "#D9C4FF", fontSize: 8, fontWeight: "900", letterSpacing: 0.5 }, lightStudioHintText: { color: "#6333A5" },
});
