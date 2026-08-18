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
  const bottom = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  return <MainTabSwipe current={getMainTabIdFromPathname(pathname)}><Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.muted, tabBarButton: HapticTab, tabBarStyle: { height: 58 + bottom, paddingTop: 7, paddingBottom: bottom, backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: 1 } }}>
    <Tabs.Screen name="index" options={{ title: "Сегодня", tabBarIcon: ({ color }) => <IconSymbol name="house.fill" size={23} color={color} /> }} />
    <Tabs.Screen name="calendar" options={{ title: "Календарь", tabBarIcon: ({ color }) => <IconSymbol name="calendar" size={23} color={color} /> }} />
    <Tabs.Screen name="exercises" options={{ title: "Упражнения", tabBarIcon: ({ color }) => <IconSymbol name="dumbbell.fill" size={23} color={color} /> }} />
    <Tabs.Screen name="programs" options={{ title: "Программы", tabBarIcon: ({ color }) => <IconSymbol name="list.bullet" size={23} color={color} /> }} />
    <Tabs.Screen name="stats" options={{ title: "Статистика", tabBarIcon: ({ color }) => <IconSymbol name="chart.bar.fill" size={23} color={color} /> }} />
    <Tabs.Screen name="settings" options={{ title: "Настройки", tabBarIcon: ({ color }) => <IconSymbol name="gearshape" size={23} color={color} /> }} />
  </Tabs></MainTabSwipe>;
}
