import { StyleSheet, Text, View, type TextStyle } from "react-native";
import { getCurrentTrainingPeriodStats, getMonthComparisonStats, type CompletedWorkout } from "@/lib/workout-data";
import { useColors } from "@/hooks/use-colors";
import { radius, type as typeScale } from "@/lib/design-tokens";

// Токены заморожены as const: снимаем readonly для совместимости с TextStyle.
const metricStyle = typeScale.metric as unknown as TextStyle;

const volumeLabel = (volume: number) => volume >= 1000 ? `${(volume / 1000).toFixed(1)} т` : `${Math.round(volume)} кг`;
const fill = (value: number, max: number): `${number}%` => (max > 0 ? `${Math.max(6, Math.round((value / max) * 100))}%` : "6%") as `${number}%`;

export function ProgressOverview({ completed }: { completed: CompletedWorkout[] }) {
  const colors = useColors();
  const periods = getCurrentTrainingPeriodStats(completed);
  const comparison = getMonthComparisonStats(completed);
  const rows = [
    { label: "Тренировки", current: comparison.current.workoutCount, previous: comparison.previous.workoutCount, currentLabel: String(comparison.current.workoutCount), previousLabel: String(comparison.previous.workoutCount) },
    { label: "Объём", current: comparison.current.totalVolume, previous: comparison.previous.totalVolume, currentLabel: volumeLabel(comparison.current.totalVolume), previousLabel: volumeLabel(comparison.previous.totalVolume) },
    { label: "Время", current: comparison.current.durationMinutes, previous: comparison.previous.durationMinutes, currentLabel: `${comparison.current.durationMinutes} мин`, previousLabel: `${comparison.previous.durationMinutes} мин` },
  ];
  return (
    <View style={styles.wrap}>
      <View style={styles.heading}>
        <Text style={[typeScale.title, { color: colors.foreground }]}>Ваш прогресс</Text>
        <Text style={[typeScale.meta, styles.hint, { color: colors.muted }]}>Сводка обновляется после каждой завершённой тренировки.</Text>
      </View>
      <View style={styles.periods}>
        <Period title="Неделя" value={String(periods.week.workoutCount)} label="тренировок" detail={volumeLabel(periods.week.totalVolume)} color={colors.primary} />
        <Period title="Месяц" value={String(periods.month.workoutCount)} label="тренировок" detail={volumeLabel(periods.month.totalVolume)} color={colors.warning} />
      </View>
      <View style={[styles.compare, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[typeScale.heading, { color: colors.foreground }]}>Месяц к месяцу</Text>
        {rows.map((row) => {
          const max = Math.max(row.current, row.previous);
          return (
            <View key={row.label} style={styles.row}>
              <View style={styles.rowHeader}>
                <Text style={[styles.rowLabel, { color: colors.foreground }]}>{row.label}</Text>
                <Text style={[typeScale.meta, styles.rowValue, { color: colors.muted }]}>{row.currentLabel} / {row.previousLabel}</Text>
              </View>
              <View style={[styles.track, { backgroundColor: `${colors.primary}12` }]}>
                <View style={[styles.bar, { width: fill(row.current, max), backgroundColor: colors.primary }]} />
              </View>
              <View style={[styles.track, { backgroundColor: `${colors.warning}18` }]}>
                <View style={[styles.bar, { width: fill(row.previous, max), backgroundColor: colors.warning }]} />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function Period({ title, value, label, detail, color }: { title: string; value: string; label: string; detail: string; color: string }) {
  const colors = useColors();
  return (
    <View style={[styles.period, { backgroundColor: `${color}12`, borderColor: `${color}45`, borderLeftColor: color }]}>
      <Text style={[typeScale.eyebrow, { color }]}>{title}</Text>
      <Text style={[metricStyle, styles.periodValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[typeScale.meta, styles.periodLabel, { color: colors.muted }]}>{label} · {detail}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10, marginTop: 2 },
  heading: { marginTop: 3, gap: 3 },
  hint: { fontWeight: "500" },
  periods: { flexDirection: "row", gap: 8 },
  period: {
    flex: 1,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderRadius: radius.tile,
    padding: 12,
    gap: 4,
  },
  periodValue: { marginTop: 2 },
  periodLabel: { fontWeight: "500" },
  compare: {
    borderWidth: 1,
    borderRadius: radius.card,
    padding: 16,
    gap: 10,
  },
  row: { gap: 4 },
  rowHeader: { flexDirection: "row", justifyContent: "space-between" },
  rowLabel: { fontSize: 12, fontWeight: "800" },
  rowValue: { fontVariant: ["tabular-nums"] as const, fontWeight: "600" },
  track: { height: 6, borderRadius: 3, overflow: "hidden" },
  bar: { height: "100%", borderRadius: 3 },
});
