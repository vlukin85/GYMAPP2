import { Tabs, usePathname } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { MainTabSwipe } from "@/components/main-tab-swipe";
import { OrderedMainTabBar } from "@/components/ordered-main-tab-bar";
import { useColors } from "@/hooks/use-colors";
import { getMainTabIdFromPathname } from "@/lib/main-tab-navigation";
import { MAIN_TABS, useMainTabPreferences } from "@/lib/main-tab-preferences";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { visibility, order, compact } = useMainTabPreferences();
  const visibleTabs = order.filter((id) => visibility[id]);
  const showTab = (id: (typeof MAIN_TABS)[number]["id"]) => visibility[id];
  return (
    <MainTabSwipe
      current={getMainTabIdFromPathname(pathname)}
      visibleTabs={visibleTabs}
    >
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.foreground,
          tabBarButton: HapticTab,
          tabBarShowLabel: true,
          tabBarLabelStyle: {
            fontSize: 8,
            fontWeight: "900",
            letterSpacing: 0.2,
            marginTop: 1,
          },
          tabBarItemStyle: {
            borderRightWidth: 1,
            borderRightColor: colors.border,
          },
          tabBarStyle: { display: "none" },
        }}
        tabBar={(props) => (
          <OrderedMainTabBar
            {...props}
            visibleTabs={visibleTabs}
            compact={compact}
          />
        )}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "ГЛАВНОЕ",
            href: showTab("today") ? undefined : null,
            tabBarIcon: ({ color }) => (
              <IconSymbol name="house.fill" size={18} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            title: "ПЛАН",
            href: showTab("calendar") ? undefined : null,
            tabBarIcon: ({ color }) => (
              <IconSymbol name="calendar" size={18} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="exercises"
          options={{
            title: "УПРАЖНЕНИЯ",
            href: showTab("exercises") ? undefined : null,
            tabBarIcon: ({ color }) => (
              <IconSymbol name="dumbbell.fill" size={18} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="programs"
          options={{
            title: "ПРОГРАММЫ",
            href: showTab("programs") ? undefined : null,
            tabBarIcon: ({ color }) => (
              <IconSymbol name="list.bullet" size={18} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="nutrition"
          options={{
            title: "ПИТАНИЕ",
            href: showTab("nutrition") ? undefined : null,
            tabBarIcon: ({ color }) => (
              <IconSymbol name="fork.knife" size={18} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="stats"
          options={{
            title: "ПРОГРЕСС",
            href: showTab("stats") ? undefined : null,
            tabBarIcon: ({ color }) => (
              <IconSymbol name="chart.bar.fill" size={18} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="body"
          options={{
            title: "ТЕЛО",
            href: showTab("body") ? undefined : null,
            tabBarIcon: ({ color }) => (
              <IconSymbol name="figure.stand" size={18} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "НАСТРОЙКИ",
            href: showTab("settings") ? undefined : null,
            tabBarIcon: ({ color }) => (
              <IconSymbol name="gearshape" size={18} color={color} />
            ),
          }}
        />
      </Tabs>
    </MainTabSwipe>
  );
}
