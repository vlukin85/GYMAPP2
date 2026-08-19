import { Tabs, usePathname } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { MainTabSwipe } from "@/components/main-tab-swipe";
import { useColors } from "@/hooks/use-colors";
import { getMainTabIdFromPathname } from "@/lib/main-tab-navigation";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const bottom = Platform.OS === "web" ? 10 : Math.max(insets.bottom, 8);
  return <MainTabSwipe current={getMainTabIdFromPathname(pathname)}><Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.foreground, tabBarButton: HapticTab, tabBarShowLabel: true, tabBarLabelStyle: { fontSize: 8, fontWeight: "900", letterSpacing: 0.2, marginTop: 1 }, tabBarItemStyle: { borderRightWidth: 1, borderRightColor: colors.border }, tabBarStyle: { height: 54 + bottom, paddingTop: 6, paddingBottom: bottom, backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: 1, elevation: 0, shadowOpacity: 0 } }}>
    <Tabs.Screen name="index" options={{ title: "СЕГОДНЯ", tabBarIcon: ({ color }) => <IconSymbol name="house.fill" size={18} color={color} /> }} />
    <Tabs.Screen name="calendar" options={{ title: "ПЛАН", tabBarIcon: ({ color }) => <IconSymbol name="calendar" size={18} color={color} /> }} />
    <Tabs.Screen name="exercises" options={{ title: "ЖИМ", tabBarIcon: ({ color }) => <IconSymbol name="dumbbell.fill" size={18} color={color} /> }} />
    <Tabs.Screen name="programs" options={{ title: "ПРОГРАММЫ", tabBarIcon: ({ color }) => <IconSymbol name="list.bullet" size={18} color={color} /> }} />
    <Tabs.Screen name="nutrition" options={{ title: "ПИТАНИЕ", tabBarIcon: ({ color }) => <IconSymbol name="fork.knife" size={18} color={color} /> }} />
    <Tabs.Screen name="stats" options={{ title: "ПРОГРЕСС", tabBarIcon: ({ color }) => <IconSymbol name="chart.bar.fill" size={18} color={color} /> }} />
    <Tabs.Screen name="settings" options={{ title: "ЕЩЁ", tabBarIcon: ({ color }) => <IconSymbol name="gearshape" size={18} color={color} /> }} />
  </Tabs></MainTabSwipe>;
}
