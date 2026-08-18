import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import Svg, { Circle, Line, Polyline, Text as SvgText } from "react-native-svg";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { getExercise, getMonthCalendarDays, shiftCalendarMonth } from "@/lib/workout-data";
import { filterWorkoutsByStatsFilter, getLatestPersonalRecordsByFilter, type StatsFilterMode } from "@/lib/stats-period";
import { loadStatsPreferences, saveStatsPreferences } from "@/lib/stats-filter-storage";
import { useWorkoutStore } from "@/lib/workout-store";
import { ProgressOverview } from "@/components/progress-overview";
import { getExercisePersonalRecordHistory, type PersonalRecordHistoryPoint } from "@/lib/record-history";
import { getPercentageChange, getStatsMetrics, getStatsPeriodComparison } from "@/lib/stats-comparison";

const periodOptions: { id: StatsFilterMode; label: string }[] = [
  { id: "week", label: "Неделя" },
  { id: "month", label: "Месяц" },
  { id: "year", label: "Год" },
  { id: "date", label: "Дата" },
  { id: "custom", label: "Диапазон" },
  { id: "last30", label: "30 дней" },
  { id: "last90", label: "90 дней" },
];
const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const formatPickerDate = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });

export default function StatsScreen() {
  const colors = useColors();
  const { completed, personalRecords, oneRmFormula } = useWorkoutStore();
  const today = new Date().toISOString().slice(0, 10);
  const [period, setPeriod] = useState<StatsFilterMode>("month");
  const [selectedDate, setSelectedDate] = useState(today);
  const [rangeStart, setRangeStart] = useState(today);
  const [rangeEnd, setRangeEnd] = useState(today);
  const [filterLoaded, setFilterLoaded] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [exercisePickerOpen, setExercisePickerOpen] = useState(false);
  const [exerciseQuery, setExerciseQuery] = useState("");
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [pickerTarget, setPickerTarget] = useState<"date" | "start" | "end">("date");
  const [calendarCursor, setCalendarCursor] = useState(new Date());
  const filter = useMemo(() => ({ mode: period, date: selectedDate, start: rangeStart, end: rangeEnd }), [period, rangeEnd, rangeStart, selectedDate]);
  const periodWorkouts = useMemo(() => filterWorkoutsByStatsFilter(completed, filter), [completed, filter]);
  const exerciseOptions = useMemo(() => Array.from(new Set(completed.flatMap((workout) => (workout.sets ?? []).map((set) => set.exerciseId)))).map((id) => ({ id, name: getExercise(id)?.name ?? id })).sort((a, b) => a.name.localeCompare(b.name, "ru")), [completed]);
  const visibleExerciseOptions = useMemo(() => { const query = exerciseQuery.trim().toLocaleLowerCase("ru"); return query ? exerciseOptions.filter((exercise) => exercise.name.toLocaleLowerCase("ru").includes(query)) : exerciseOptions; }, [exerciseOptions, exerciseQuery]);
  const selectedExercise = selectedExerciseId ? exerciseOptions.find((exercise) => exercise.id === selectedExerciseId) : undefined;
  const filteredWorkouts = useMemo(() => selectedExerciseId ? periodWorkouts.filter((workout) => (workout.sets ?? []).some((set) => set.exerciseId === selectedExerciseId)) : periodWorkouts, [periodWorkouts, selectedExerciseId]);
  const recentRecords = useMemo(() => getLatestPersonalRecordsByFilter(personalRecords, filter).filter((record) => !selectedExerciseId || record.exerciseId === selectedExerciseId), [filter, personalRecords, selectedExerciseId]);
  const metrics = useMemo(() => getStatsMetrics(completed, filter, selectedExerciseId), [completed, filter, selectedExerciseId]);
  const periodComparison = useMemo(() => getStatsPeriodComparison(completed, filter, selectedExerciseId), [completed, filter, selectedExerciseId]);
  const oneRmHistory = useMemo(() => selectedExerciseId ? getExercisePersonalRecordHistory(completed, selectedExerciseId, oneRmFormula) : [], [completed, oneRmFormula, selectedExerciseId]);
  const periodLabel = period === "date" ? selectedDate : period === "custom" ? `${rangeStart} — ${rangeEnd}` : periodOptions.find((option) => option.id === period)?.label.toLocaleLowerCase("ru") ?? "месяц";
  const calendarDays = useMemo(() => getMonthCalendarDays(calendarCursor.getFullYear(), calendarCursor.getMonth()), [calendarCursor]);
  useEffect(() => { let mounted = true; loadStatsPreferences({ filter, exerciseId: null }).then((saved) => { if (!mounted) return; setPeriod(saved.filter.mode); setSelectedDate(saved.filter.date ?? today); setRangeStart(saved.filter.start ?? today); setRangeEnd(saved.filter.end ?? today); setSelectedExerciseId(saved.exerciseId); setFilterLoaded(true); }); return () => { mounted = false; }; }, []);
  useEffect(() => { if (filterLoaded) void saveStatsPreferences({ filter, exerciseId: selectedExerciseId }); }, [filter, filterLoaded, selectedExerciseId]);
  const openCalendar = (target: "date" | "start" | "end") => { const value = target === "date" ? selectedDate : target === "start" ? rangeStart : rangeEnd; setPickerTarget(target); setCalendarCursor(new Date(`${value}T12:00:00`)); setCalendarOpen(true); };
  const selectCalendarDate = (value: string) => { if (pickerTarget === "date") setSelectedDate(value); if (pickerTarget === "start") setRangeStart(value); if (pickerTarget === "end") setRangeEnd(value); setCalendarOpen(false); };

  return <ScreenContainer className="px-5" containerClassName="bg-background"><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
    <View style={styles.topRow}><View><Text style={[styles.eyebrow, { color: colors.primary }]}>АНАЛИЗ ПРОГРЕССА</Text><Text style={[styles.title, { color: colors.foreground }]}>Статистика</Text></View><Pressable onPress={() => router.push("/(tabs)/settings")} style={[styles.settingsButton, { backgroundColor: colors.surface }]}><IconSymbol name="gearshape" size={21} color={colors.foreground} /></Pressable></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.filters, { backgroundColor: colors.surface, borderColor: colors.border }]}>{periodOptions.map((option) => <Pressable key={option.id} onPress={() => setPeriod(option.id)} style={[styles.filter, { minWidth: option.id === "custom" ? 92 : option.id.startsWith("last") ? 86 : 73, backgroundColor: period === option.id ? colors.primary : "transparent" }]}><Text style={[styles.filterText, { color: period === option.id ? "#101412" : colors.muted }]}>{option.label}</Text></Pressable>)}</ScrollView>
    <View style={[styles.exerciseFilterCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={{ flex: 1 }}><Text style={[styles.exerciseFilterLabel, { color: colors.muted }]}>УПРАЖНЕНИЕ</Text><Text style={[styles.exerciseFilterValue, { color: colors.foreground }]}>{selectedExercise?.name ?? "Все упражнения"}</Text></View><Pressable onPress={() => { setExerciseQuery(""); setExercisePickerOpen(true); }} style={[styles.exerciseFilterButton, { borderColor: colors.primary }]}><Text style={[styles.exerciseFilterButtonText, { color: colors.primary }]}>Выбрать</Text></Pressable>{selectedExerciseId && <Pressable onPress={() => setSelectedExerciseId(null)} style={styles.clearExercise}><Text style={[styles.clearExerciseText, { color: colors.error }]}>Сбросить</Text></Pressable>}</View>
    {period === "date" && <View style={[styles.dateForm, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.dateLabel, { color: colors.muted }]}>КОНКРЕТНАЯ ДАТА</Text><Pressable onPress={() => openCalendar("date")} style={[styles.calendarField, { backgroundColor: colors.background, borderColor: colors.border }]}><IconSymbol name="calendar" size={17} color={colors.primary} /><Text style={[styles.calendarFieldText, { color: colors.foreground }]}>{formatPickerDate(selectedDate)}</Text><IconSymbol name="chevron.right" size={16} color={colors.muted} /></Pressable></View>}
    {period === "custom" && <View style={[styles.dateForm, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.dateLabel, { color: colors.muted }]}>ПОЛЬЗОВАТЕЛЬСКИЙ ДИАПАЗОН</Text><View style={styles.rangeCalendarFields}><Pressable onPress={() => openCalendar("start")} style={[styles.rangeCalendarField, { backgroundColor: colors.background, borderColor: colors.border }]}><Text style={[styles.rangeFieldCaption, { color: colors.muted }]}>ОТ</Text><Text style={[styles.rangeFieldValue, { color: colors.foreground }]}>{formatPickerDate(rangeStart)}</Text></Pressable><Pressable onPress={() => openCalendar("end")} style={[styles.rangeCalendarField, { backgroundColor: colors.background, borderColor: colors.border }]}><Text style={[styles.rangeFieldCaption, { color: colors.muted }]}>ДО</Text><Text style={[styles.rangeFieldValue, { color: colors.foreground }]}>{formatPickerDate(rangeEnd)}</Text></Pressable></View><Text style={[styles.rangeHint, { color: colors.muted }]}>Нажмите дату, чтобы выбрать её в календаре.</Text></View>}
    <View style={styles.bigStats}><Metric icon="dumbbell.fill" iconColor={colors.primary} value={String(metrics.workoutCount)} label={selectedExerciseId ? "сессий" : "тренировок"} colors={colors} /><Metric icon="chart.bar.fill" iconColor="#FF9F43" value={`${(metrics.volume / 1000).toFixed(1)}т`} label={selectedExerciseId ? "объём упражнения" : "общий объём"} colors={colors} /><Metric icon="timer" iconColor="#7BE495" value={String(metrics.minutes)} label="минут" colors={colors} /></View>
    {periodComparison && <PeriodComparison comparison={periodComparison} period={period} colors={colors} />}
    {selectedExerciseId && selectedExercise && <OneRmHistoryChart exerciseName={selectedExercise.name} points={oneRmHistory} colors={colors} />}
    <ProgressOverview completed={completed} />
    <View style={styles.sectionRow}><View><Text style={[styles.section, { color: colors.foreground }]}>Личные рекорды</Text><Text style={[styles.hint, { color: colors.muted }]}>Последние зафиксированные или обновлённые за {periodLabel}.</Text></View><Text style={[styles.count, { color: colors.muted }]}>{recentRecords.length}</Text></View>
    {recentRecords.length ? recentRecords.map((record) => {
      const exercise = getExercise(record.exerciseId);
      const date = new Date(record.achievedAt).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
      return <View key={record.exerciseId} style={[styles.record, { backgroundColor: colors.surface, borderColor: colors.primary + "66" }]}><View style={[styles.recordIcon, { backgroundColor: colors.primary + "20" }]}><IconSymbol name="trophy" size={19} color={colors.primary} /></View><View style={{ flex: 1 }}><Text style={[styles.recordName, { color: colors.foreground }]}>{exercise?.name ?? record.exerciseId}</Text><Text style={[styles.recordGroup, { color: colors.muted }]}>{exercise?.group ?? "Упражнение"} · обновлён {date}</Text></View><View style={styles.recordValueWrap}><Text style={[styles.recordValue, { color: colors.foreground }]}>{record.weight} кг × {record.reps}</Text><Text style={[styles.oneRm, { color: colors.primary }]}>1RM {record.estimatedOneRepMax.toFixed(1)} кг</Text></View></View>;
    }) : <View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}><IconSymbol name="trophy" size={22} color={colors.muted} /><Text style={[styles.emptyTitle, { color: colors.foreground }]}>Нет обновлений за этот период</Text><Text style={[styles.emptyText, { color: colors.muted }]}>Завершите тренировку с новым результатом, и он появится здесь.</Text></View>}
  <Modal visible={exercisePickerOpen} transparent animationType="slide" onRequestClose={() => setExercisePickerOpen(false)}><View style={styles.backdrop}><View style={[styles.exerciseSheet, { backgroundColor: colors.background }]}><View style={styles.pickerHeader}><View><Text style={[styles.pickerTitle, { color: colors.foreground }]}>Фильтр упражнения</Text><Text style={[styles.pickerSubtitle, { color: colors.muted }]}>Показывает объём и рекорды выбранного движения.</Text></View><Pressable onPress={() => setExercisePickerOpen(false)} style={[styles.pickerClose, { backgroundColor: colors.surface }]}><Text style={[styles.pickerCloseText, { color: colors.foreground }]}>×</Text></Pressable></View><View style={[styles.exerciseSearch, { backgroundColor: colors.surface, borderColor: colors.border }]}><IconSymbol name="magnifyingglass" size={18} color={colors.muted} /><TextInput value={exerciseQuery} onChangeText={setExerciseQuery} placeholder="Поиск упражнения" placeholderTextColor={colors.muted} autoFocus style={[styles.exerciseSearchInput, { color: colors.foreground }]} /></View><ScrollView contentContainerStyle={styles.exerciseOptions}>{visibleExerciseOptions.map((exercise) => { const selected = exercise.id === selectedExerciseId; return <Pressable key={exercise.id} onPress={() => { setSelectedExerciseId(exercise.id); setExercisePickerOpen(false); }} style={[styles.exerciseOption, { backgroundColor: selected ? `${colors.primary}18` : colors.surface, borderColor: selected ? colors.primary : colors.border }]}><Text style={[styles.exerciseOptionText, { color: colors.foreground }]}>{exercise.name}</Text>{selected && <IconSymbol name="checkmark" size={18} color={colors.primary} />}</Pressable>; })}</ScrollView><Pressable onPress={() => { setSelectedExerciseId(null); setExercisePickerOpen(false); }} style={[styles.clearAllExercises, { borderColor: colors.border }]}><Text style={[styles.clearAllExercisesText, { color: colors.foreground }]}>Показать все упражнения</Text></Pressable></View></View></Modal>
  <Modal visible={calendarOpen} transparent animationType="slide" onRequestClose={() => setCalendarOpen(false)}><View style={styles.backdrop}><View style={[styles.calendarSheet, { backgroundColor: colors.background }]}><View style={styles.pickerHeader}><View><Text style={[styles.pickerTitle, { color: colors.foreground }]}>{pickerTarget === "date" ? "Выберите дату" : pickerTarget === "start" ? "Начало диапазона" : "Конец диапазона"}</Text><Text style={[styles.pickerSubtitle, { color: colors.muted }]}>Статистика будет пересчитана автоматически</Text></View><Pressable onPress={() => setCalendarOpen(false)} style={[styles.pickerClose, { backgroundColor: colors.surface }]}><Text style={[styles.pickerCloseText, { color: colors.foreground }]}>×</Text></Pressable></View><View style={styles.pickerMonth}><Pressable onPress={() => setCalendarCursor((current) => shiftCalendarMonth(current, -1))}><IconSymbol name="chevron.left" size={22} color={colors.foreground} /></Pressable><Text style={[styles.pickerMonthText, { color: colors.foreground }]}>{calendarCursor.toLocaleDateString("ru-RU", { month: "long", year: "numeric" })}</Text><Pressable onPress={() => setCalendarCursor((current) => shiftCalendarMonth(current, 1))}><IconSymbol name="chevron.right" size={22} color={colors.foreground} /></Pressable></View><View style={styles.weekdays}>{weekDays.map((day) => <Text key={day} style={[styles.weekday, { color: colors.muted }]}>{day}</Text>)}</View><View style={styles.calendarGrid}>{calendarDays.map((day) => { const key = dateKey(day); const active = pickerTarget === "date" ? key === selectedDate : pickerTarget === "start" ? key === rangeStart : key === rangeEnd; const inMonth = day.getMonth() === calendarCursor.getMonth(); return <Pressable key={key} onPress={() => selectCalendarDate(key)} style={[styles.calendarDay, active && { backgroundColor: colors.primary }]}><Text style={{ color: active ? "#101412" : inMonth ? colors.foreground : colors.muted, fontWeight: active ? "900" : "700" }}>{day.getDate()}</Text></Pressable>; })}</View></View></View></Modal>
  </ScrollView></ScreenContainer>;
}

function Metric({ icon, iconColor, value, label, colors }: { icon: any; iconColor: string; value: string; label: string; colors: any }) { return <View style={[styles.bigCard, { backgroundColor: colors.surface }]}><IconSymbol name={icon} size={20} color={iconColor} /><Text style={[styles.bigValue, { color: colors.foreground }]}>{value}</Text><Text style={[styles.bigLabel, { color: colors.muted }]}>{label}</Text></View>; }

function PeriodComparison({ comparison, period, colors }: { comparison: NonNullable<ReturnType<typeof getStatsPeriodComparison>>; period: StatsFilterMode; colors: any }) {
  const periodName = period === "week" ? "прошлой неделей" : "прошлым месяцем";
  return <View style={[styles.comparisonCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={styles.comparisonHeader}><View><Text style={[styles.comparisonTitle, { color: colors.foreground }]}>Сравнение с {periodName}</Text><Text style={[styles.comparisonHint, { color: colors.muted }]}>Текущий период и предыдущий на одном экране</Text></View><View style={[styles.comparisonBadge, { backgroundColor: `${colors.primary}18` }]}><Text style={[styles.comparisonBadgeText, { color: colors.primary }]}>{period === "week" ? "НЕДЕЛЯ" : "МЕСЯЦ"}</Text></View></View><View style={styles.comparisonMetrics}><ComparisonMetric label={"Тренировки"} current={comparison.current.workoutCount} previous={comparison.previous.workoutCount} colors={colors} /><ComparisonMetric label={"Объём"} current={comparison.current.volume / 1000} previous={comparison.previous.volume / 1000} suffix=" т" decimals={1} colors={colors} /><ComparisonMetric label={"Время"} current={comparison.current.minutes} previous={comparison.previous.minutes} suffix=" мин" colors={colors} /></View></View>;
}

function ComparisonMetric({ label, current, previous, suffix = "", decimals = 0, colors }: { label: string; current: number; previous: number; suffix?: string; decimals?: number; colors: any }) {
  const change = getPercentageChange(current, previous);
  const trend = change === null ? "new" : change > 0 ? "up" : change < 0 ? "down" : "same";
  const trendColor = trend === "up" ? colors.success : trend === "down" ? colors.error : colors.muted;
  const trendText = change === null ? "Новые" : change === 0 ? "Без изменений" : `${change > 0 ? "↑" : "↓"} ${Math.abs(change).toFixed(0)}%`;
  const format = (value: number) => `${value.toFixed(decimals)}${suffix}`;
  return <View style={[styles.comparisonMetric, { backgroundColor: colors.background, borderColor: colors.border }]}><Text style={[styles.comparisonMetricLabel, { color: colors.muted }]}>{label}</Text><Text style={[styles.comparisonCurrent, { color: colors.foreground }]}>{format(current)}</Text><Text style={[styles.comparisonPrevious, { color: colors.muted }]}>было {format(previous)}</Text><Text style={[styles.comparisonTrend, { color: trendColor }]}>{trendText}</Text></View>;
}

function OneRmHistoryChart({ exerciseName, points, colors }: { exerciseName: string; points: PersonalRecordHistoryPoint[]; colors: any }) {
  const width = 328; const height = 168; const paddingLeft = 37; const paddingRight = 15; const paddingTop = 24; const baseline = 126;
  const values = points.map((point) => point.estimatedOneRepMax); const minValue = values.length ? Math.min(...values) : 0; const maxValue = values.length ? Math.max(...values) : 0; const paddedMin = Math.max(0, minValue - Math.max(1, (maxValue - minValue) * 0.14)); const paddedMax = maxValue + Math.max(1, (maxValue - minValue) * 0.14); const range = Math.max(1, paddedMax - paddedMin);
  const chartWidth = width - paddingLeft - paddingRight;
  const coordinates = points.map((point, index) => ({ x: points.length === 1 ? paddingLeft + chartWidth / 2 : paddingLeft + (index / (points.length - 1)) * chartWidth, y: baseline - ((point.estimatedOneRepMax - paddedMin) / range) * (baseline - paddingTop), point }));
  const pointString = coordinates.map((point) => `${point.x},${point.y}`).join(" ");
  const formatDate = (value: string) => new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  const latest = points.at(-1);
  return <View style={[styles.oneRmChartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={styles.oneRmChartHeader}><View style={{ flex: 1 }}><Text style={[styles.oneRmChartTitle, { color: colors.foreground }]}>Динамика 1RM</Text><Text style={[styles.oneRmChartHint, { color: colors.muted }]}>{exerciseName} · точки — новые личные рекорды</Text></View>{latest && <View style={[styles.oneRmLatest, { backgroundColor: `${colors.primary}18` }]}><Text style={[styles.oneRmLatestLabel, { color: colors.primary }]}>ТЕКУЩИЙ</Text><Text style={[styles.oneRmLatestValue, { color: colors.foreground }]}>{latest.estimatedOneRepMax.toFixed(1)} кг</Text></View>}</View>{points.length ? <><Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}><Line x1={paddingLeft} x2={width - paddingRight} y1={paddingTop} y2={paddingTop} stroke={colors.border} strokeWidth="1" strokeDasharray="4 4" /><Line x1={paddingLeft} x2={width - paddingRight} y1={baseline} y2={baseline} stroke={colors.border} strokeWidth="1" /><SvgText x="2" y={paddingTop + 4} fill={colors.muted} fontSize="9" fontWeight="800">{paddedMax.toFixed(1)}</SvgText><SvgText x="2" y={baseline + 3} fill={colors.muted} fontSize="9" fontWeight="800">{paddedMin.toFixed(1)}</SvgText><Polyline points={pointString} fill="none" stroke={colors.primary} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />{coordinates.map(({ x, y, point }) => <Circle key={point.workoutId} cx={x} cy={y} r="6" fill={colors.background} stroke={colors.primary} strokeWidth="3" onPress={() => router.push({ pathname: "/workout-history/[id]", params: { id: point.workoutId } })} />)}</Svg><View style={styles.oneRmAxis}><Text style={[styles.oneRmAxisLabel, { color: colors.muted }]}>{formatDate(points[0].date)}</Text><Text style={[styles.oneRmAxisLabel, { color: colors.muted }]}>Нажмите точку</Text><Text style={[styles.oneRmAxisLabel, { color: colors.muted }]}>{formatDate(points[points.length - 1].date)}</Text></View></> : <View style={styles.oneRmEmpty}><IconSymbol name="chart.line.uptrend.xyaxis" size={24} color={colors.muted} /><Text style={[styles.oneRmEmptyTitle, { color: colors.foreground }]}>Пока нет личного рекорда</Text><Text style={[styles.oneRmEmptyText, { color: colors.muted }]}>Завершите подход с улучшением 1RM — точка появится на графике.</Text></View>}</View>;
}

const styles = StyleSheet.create({
  content: { paddingTop: 18, paddingBottom: 32, gap: 13 }, topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }, settingsButton: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" }, eyebrow: { fontSize: 11, fontWeight: "800", letterSpacing: 1.2 }, title: { fontSize: 30, fontWeight: "800", marginTop: 5 }, filters: { flexDirection: "row", borderRadius: 16, borderWidth: 1, padding: 4, gap: 3 }, filter: { minHeight: 35, borderRadius: 11, paddingHorizontal: 11, alignItems: "center", justifyContent: "center" }, filterText: { fontSize: 12, fontWeight: "800" }, dateForm: { borderWidth: 1, borderRadius: 16, padding: 12, gap: 8 }, dateLabel: { fontSize: 9, fontWeight: "900", letterSpacing: 0.7 }, calendarField: { minHeight: 45, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 9 }, calendarFieldText: { flex: 1, fontSize: 14, fontWeight: "800" }, rangeCalendarFields: { flexDirection: "row", gap: 8 }, rangeCalendarField: { flex: 1, minHeight: 52, borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, justifyContent: "center" }, rangeFieldCaption: { fontSize: 8, fontWeight: "900", letterSpacing: 0.6 }, rangeFieldValue: { fontSize: 11, fontWeight: "800", marginTop: 4 }, rangeHint: { fontSize: 10, lineHeight: 15 }, bigStats: { flexDirection: "row", gap: 8, marginTop: 4 }, bigCard: { flex: 1, minHeight: 109, borderRadius: 17, padding: 13, justifyContent: "space-between" }, bigValue: { fontSize: 23, fontWeight: "800" }, bigLabel: { fontSize: 11 }, sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginTop: 7 }, section: { fontSize: 19, fontWeight: "800" }, hint: { fontSize: 12, lineHeight: 18, marginTop: 3, maxWidth: 270 }, count: { fontSize: 16, fontWeight: "800", marginTop: 4 }, record: { minHeight: 69, borderRadius: 16, borderWidth: 1, padding: 11, flexDirection: "row", alignItems: "center", gap: 11 }, recordIcon: { width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center" }, recordName: { fontSize: 13, fontWeight: "800" }, recordGroup: { fontSize: 11, marginTop: 4 }, recordValueWrap: { alignItems: "flex-end", maxWidth: 104 }, recordValue: { textAlign: "right", fontSize: 12, fontWeight: "800" }, oneRm: { fontSize: 10, fontWeight: "800", marginTop: 4 }, empty: { borderWidth: 1, borderRadius: 18, padding: 20, alignItems: "center", gap: 8 }, emptyTitle: { fontSize: 14, fontWeight: "800", marginTop: 2 }, emptyText: { fontSize: 12, lineHeight: 17, textAlign: "center" }, backdrop: { flex: 1, backgroundColor: "#090611A8", justifyContent: "flex-end" }, calendarSheet: { borderTopLeftRadius: 27, borderTopRightRadius: 27, padding: 20, gap: 13 }, pickerHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }, pickerTitle: { fontSize: 20, fontWeight: "900" }, pickerSubtitle: { fontSize: 11, marginTop: 4 }, pickerClose: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" }, pickerCloseText: { fontSize: 25, lineHeight: 28 }, pickerMonth: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 2 }, pickerMonthText: { fontSize: 16, fontWeight: "900", textTransform: "capitalize" }, weekdays: { flexDirection: "row" }, weekday: { width: "14.285%", textAlign: "center", fontSize: 10, fontWeight: "900" }, calendarGrid: { flexDirection: "row", flexWrap: "wrap" }, calendarDay: { width: "14.285%", height: 43, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  exerciseFilterCard: { minHeight: 61, borderWidth: 1, borderRadius: 16, padding: 11, flexDirection: "row", alignItems: "center", gap: 8 },
  exerciseFilterLabel: { fontSize: 9, fontWeight: "900", letterSpacing: 0.65 },
  exerciseFilterValue: { fontSize: 13, fontWeight: "900", marginTop: 3 },
  exerciseFilterButton: { borderWidth: 1, borderRadius: 10, minHeight: 34, paddingHorizontal: 10, justifyContent: "center" },
  exerciseFilterButtonText: { fontSize: 11, fontWeight: "900" },
  clearExercise: { paddingHorizontal: 4, paddingVertical: 7 },
  clearExerciseText: { fontSize: 10, fontWeight: "900" },
  exerciseSheet: { maxHeight: "84%", borderTopLeftRadius: 27, borderTopRightRadius: 27, padding: 20, gap: 12 },
  exerciseSearch: { minHeight: 46, borderWidth: 1, borderRadius: 13, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 8 },
  exerciseSearchInput: { flex: 1, minHeight: 40, fontSize: 13, fontWeight: "700" },
  exerciseOptions: { gap: 8, paddingBottom: 4 },
  exerciseOption: { minHeight: 52, borderWidth: 1, borderRadius: 14, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  exerciseOptionText: { fontSize: 13, fontWeight: "800", flex: 1 },
  clearAllExercises: { minHeight: 46, borderWidth: 1, borderRadius: 13, justifyContent: "center", alignItems: "center" },
  clearAllExercisesText: { fontSize: 12, fontWeight: "900" },
  comparisonCard: { borderWidth: 1, borderRadius: 18, padding: 13, gap: 11 },
  comparisonHeader: { flexDirection: "row", justifyContent: "space-between", gap: 8, alignItems: "flex-start" },
  comparisonTitle: { fontSize: 14, fontWeight: "900" },
  comparisonHint: { fontSize: 10, marginTop: 3 },
  comparisonBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5 },
  comparisonBadgeText: { fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
  comparisonMetrics: { flexDirection: "row", gap: 7 },
  comparisonMetric: { flex: 1, minHeight: 92, borderWidth: 1, borderRadius: 13, padding: 9, justifyContent: "space-between" },
  comparisonMetricLabel: { fontSize: 9, fontWeight: "800" },
  comparisonCurrent: { fontSize: 15, fontWeight: "900", marginTop: 3 },
  comparisonPrevious: { fontSize: 9, marginTop: 1 },
  comparisonTrend: { fontSize: 10, fontWeight: "900", marginTop: 5 },
  oneRmChartCard: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 7 },
  oneRmChartHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  oneRmChartTitle: { fontSize: 15, fontWeight: "900" },
  oneRmChartHint: { fontSize: 10, marginTop: 4, lineHeight: 14 },
  oneRmLatest: { borderRadius: 11, minWidth: 80, paddingHorizontal: 8, paddingVertical: 7, alignItems: "flex-end" },
  oneRmLatestLabel: { fontSize: 8, fontWeight: "900", letterSpacing: 0.5 },
  oneRmLatestValue: { fontSize: 12, fontWeight: "900", marginTop: 2 },
  oneRmAxis: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 4 },
  oneRmAxisLabel: { fontSize: 9, fontWeight: "700", maxWidth: 95, textAlign: "center" },
  oneRmEmpty: { minHeight: 112, alignItems: "center", justifyContent: "center", paddingHorizontal: 20, gap: 6 },
  oneRmEmptyTitle: { fontSize: 13, fontWeight: "900", marginTop: 2 },
  oneRmEmptyText: { fontSize: 11, lineHeight: 16, textAlign: "center" },
});
