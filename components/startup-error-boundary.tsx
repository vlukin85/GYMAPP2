import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { reportStartupError } from "@/lib/launch-diagnostics";

type Props = { children: React.ReactNode };
type State = { error: Error | null };

export class StartupErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State { return { error }; }

  componentDidCatch(error: Error) { reportStartupError(error, "Ошибка рендера приложения"); }

  render() {
    if (!this.state.error) return this.props.children;
    return <View style={styles.container}><View style={styles.card}><Text style={styles.eyebrow}>ДИАГНОСТИКА ЗАПУСКА</Text><Text style={styles.title}>Не удалось открыть экран</Text><Text style={styles.text}>Ошибка записана в журнал устройства. Попробуйте открыть приложение ещё раз; при повторении отправьте разработчику сведения из раздела диагностики.</Text><Pressable onPress={() => this.setState({ error: null })} style={styles.button}><Text style={styles.buttonText}>Повторить запуск</Text></Pressable></View></View>;
  }
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: "#F9F5FF", alignItems: "center", justifyContent: "center", padding: 24 }, card: { backgroundColor: "#FFFFFF", borderRadius: 24, padding: 22, width: "100%", maxWidth: 420, gap: 10, shadowColor: "#31105B", shadowOpacity: 0.12, shadowRadius: 18, elevation: 4 }, eyebrow: { color: "#7C3AED", fontSize: 11, fontWeight: "900", letterSpacing: 1.1 }, title: { color: "#20142E", fontSize: 24, fontWeight: "900" }, text: { color: "#6E6378", fontSize: 14, lineHeight: 21 }, button: { minHeight: 48, borderRadius: 14, backgroundColor: "#7C3AED", alignItems: "center", justifyContent: "center", marginTop: 4 }, buttonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" } });
