import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

type GroqProgramSkeletonProps = {
  accentColor: string;
  mutedColor: string;
  surfaceColor: string;
  borderColor: string;
};

export function GroqProgramSkeleton({ accentColor, mutedColor, surfaceColor, borderColor }: GroqProgramSkeletonProps) {
  const shimmer = useRef(new Animated.Value(0.42)).current;

  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(shimmer, { toValue: 0.9, duration: 620, useNativeDriver: true }),
      Animated.timing(shimmer, { toValue: 0.42, duration: 620, useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [shimmer]);

  const shimmerStyle = { opacity: shimmer };
  return (
    <View accessibilityLiveRegion="polite" accessibilityLabel="Groq формирует программу" style={[styles.card, { backgroundColor: surfaceColor, borderColor }]}> 
      <View style={styles.header}><View style={[styles.dot, { backgroundColor: accentColor }]} /><View><Text style={[styles.title, { color: mutedColor }]}>Groq формирует черновик</Text><Text style={[styles.subtitle, { color: mutedColor }]}>Подбираем упражнения и нагрузку</Text></View></View>
      <Animated.View style={[styles.titleLine, { backgroundColor: borderColor }, shimmerStyle]} />
      {[0, 1, 2].map((index) => <Animated.View key={index} style={[styles.exerciseCard, { backgroundColor: borderColor }, shimmerStyle]}><View style={styles.exerciseRow}><View style={[styles.exerciseIndex, { backgroundColor: `${accentColor}30` }]} /><View style={styles.exerciseLines}><View style={[styles.exerciseName, { backgroundColor: surfaceColor }]} /><View style={[styles.exerciseMeta, { backgroundColor: surfaceColor }]} /></View></View><View style={styles.metrics}><View style={[styles.metric, { backgroundColor: surfaceColor }]} /><View style={[styles.metric, { backgroundColor: surfaceColor }]} /><View style={[styles.metric, { backgroundColor: surfaceColor }]} /></View></Animated.View>)}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 18, padding: 14, gap: 10 },
  header: { flexDirection: "row", alignItems: "center", gap: 9 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  title: { fontSize: 13, fontWeight: "900" },
  subtitle: { fontSize: 10, marginTop: 3 },
  titleLine: { width: "68%", height: 15, borderRadius: 6, marginTop: 3 },
  exerciseCard: { borderRadius: 13, padding: 10, gap: 10 },
  exerciseRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  exerciseIndex: { width: 28, height: 28, borderRadius: 9 },
  exerciseLines: { flex: 1, gap: 5 },
  exerciseName: { width: "75%", height: 10, borderRadius: 5 },
  exerciseMeta: { width: "48%", height: 8, borderRadius: 4 },
  metrics: { flexDirection: "row", gap: 6 },
  metric: { width: 52, height: 22, borderRadius: 7 },
});
