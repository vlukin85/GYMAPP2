import { type BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
} from "react-native";

import { useColors } from "@/hooks/use-colors";
import { type MainTabId } from "@/lib/main-tab-preferences";

const ROUTE_TO_TAB_ID: Record<string, MainTabId> = {
  index: "today",
  calendar: "calendar",
  exercises: "exercises",
  programs: "programs",
  nutrition: "nutrition",
  stats: "stats",
  body: "body",
  settings: "settings",
};

export function OrderedMainTabBar({
  state,
  descriptors,
  navigation,
  insets,
  visibleTabs,
  compact,
}: BottomTabBarProps & {
  visibleTabs: readonly MainTabId[];
  compact: boolean;
}) {
  const colors = useColors();
  const contentHeight = compact ? 42 : 54;
  const bottomInset = Platform.OS === "web" ? 10 : Math.max(insets.bottom, 8);
  const height = useRef(
    new Animated.Value(contentHeight + bottomInset),
  ).current;
  const orderKey = visibleTabs.join("|");

  const orderedRoutes = useMemo(
    () =>
      visibleTabs
        .map((tabId) =>
          state.routes.find((route) => ROUTE_TO_TAB_ID[route.name] === tabId),
        )
        .filter((route): route is (typeof state.routes)[number] =>
          Boolean(route),
        ),
    [state.routes, visibleTabs],
  );

  useEffect(() => {
    if (Platform.OS === "android") {
      UIManager.setLayoutAnimationEnabledExperimental?.(true);
    }
  }, []);

  useEffect(() => {
    LayoutAnimation.configureNext({
      duration: 220,
      create: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
      update: { type: LayoutAnimation.Types.easeInEaseOut },
      delete: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
    });
  }, [orderKey]);

  useEffect(() => {
    Animated.timing(height, {
      toValue: contentHeight + bottomInset,
      duration: 190,
      useNativeDriver: false,
    }).start();
  }, [bottomInset, contentHeight, height]);

  return (
    <Animated.View
      style={[
        styles.bar,
        {
          height,
          paddingTop: compact ? 4 : 6,
          paddingBottom: bottomInset,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      ]}
    >
      <View style={styles.row}>
        {orderedRoutes.map((route, index) => {
          const routeIndex = state.routes.indexOf(route);
          const focused = state.index === routeIndex;
          const options = descriptors[route.key].options;
          const color = focused ? colors.primary : colors.foreground;
          const label =
            typeof options.tabBarLabel === "string"
              ? options.tabBarLabel
              : (options.title ?? route.name);
          const icon = options.tabBarIcon?.({
            focused,
            color,
            size: compact ? 17 : 18,
          });

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={focused ? { selected: true } : {}}
              onPress={() => {
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented)
                  navigation.navigate(route.name);
              }}
              onLongPress={() =>
                navigation.emit({ type: "tabLongPress", target: route.key })
              }
              style={({ pressed }) => [
                styles.item,
                {
                  borderRightColor: colors.border,
                  opacity: pressed ? 0.64 : 1,
                },
                index === orderedRoutes.length - 1 && styles.lastItem,
              ]}
            >
              <View style={styles.iconWrap}>{icon}</View>
              {!compact && (
                <Text numberOfLines={1} style={[styles.label, { color }]}>
                  {label}
                </Text>
              )}
              {focused && (
                <View
                  style={[
                    styles.activeLine,
                    { backgroundColor: colors.primary },
                  ]}
                />
              )}
            </Pressable>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: { borderTopWidth: 1, overflow: "hidden" },
  row: { flex: 1, flexDirection: "row", alignItems: "stretch" },
  item: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
    gap: 1,
  },
  lastItem: { borderRightWidth: 0 },
  iconWrap: { minHeight: 18, justifyContent: "center" },
  label: {
    maxWidth: "100%",
    fontSize: 8,
    lineHeight: 10,
    fontWeight: "900",
    letterSpacing: 0.15,
    textAlign: "center",
  },
  activeLine: {
    position: "absolute",
    left: "20%",
    right: "20%",
    bottom: 0,
    height: 2,
  },
});
