import { Image, StyleSheet, Text, View } from "react-native";

const IRONRISE_SPLASH_ART = require("@/assets/images/splash-icon.png");

export function IronRiseLaunchSplash({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <View
      pointerEvents="none"
      style={styles.root}
      accessibilityLabel="Загрузка IronRise"
    >
      <Image
        source={IRONRISE_SPLASH_ART}
        resizeMode="contain"
        style={styles.image}
      />
      <View style={styles.scrim} />
      <View style={styles.wordmark}>
        <Text style={styles.name}>
          IRON<Text style={styles.rise}>RISE</Text>
        </Text>
        <Text style={styles.tagline}>СТАНЬ СИЛЬНЕЕ СЕБЯ ВЧЕРАШНЕГО.</Text>
      </View>
      <View style={styles.loaderRow}>
        <View style={styles.loader} />
        <Text style={styles.loaderText}>ГОТОВИМ ТРЕНИРОВКУ</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10000,
    backgroundColor: "#160E24",
    justifyContent: "space-between",
    paddingHorizontal: 26,
    paddingVertical: 58,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    opacity: 0.96,
  },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: "#160E2478" },
  wordmark: { alignItems: "center", marginTop: 4 },
  name: {
    color: "#FBF8FF",
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "900",
    letterSpacing: -1.4,
  },
  rise: { color: "#E83928" },
  tagline: {
    color: "#FBF8FF",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.25,
    marginTop: 4,
  },
  loaderRow: { alignItems: "center", gap: 9 },
  loader: { width: 38, height: 3, backgroundColor: "#E83928" },
  loaderText: {
    color: "#FBF8FF",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.1,
  },
});
