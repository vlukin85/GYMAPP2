import { type BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { type ReactNode, useEffect, useMemo, useRef } from "react";
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
import {
  minTouchTarget,
  pressedOpacity,
  radius,
  spacing,
  type as typeScale,
} from "@/lib/design-tokens";
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

/** Высота контента панели по гайдам: компакт — только иконка-пилюля, обычный — иконка + подпись. */
const CONTENT_HEIGHT = { compact: 46, regular: 62 } as const;

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
  const contentHeight = compact
    ? CONTENT_HEIGHT.compact
    : CONTENT_HEIGHT.regular;
  // Безопасные отступы: Android-жесты приходят через insets, на web — фиксированный зазор.
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
          paddingTop: compact ? 3 : 5,
          paddingBottom: bottomInset,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      ]}
    >
      <View style={styles.row}>
        {orderedRoutes.map((route) => {
          const routeIndex = state.routes.indexOf(route);
          const focused = state.index === routeIndex;
          const options = descriptors[route.key].options;
          const color = focused ? colors.primary : colors.muted;
          const label =
            typeof options.tabBarLabel === "string"
              ? options.tabBarLabel
              : (options.title ?? route.name);
          const icon = options.tabBarIcon?.({
            focused,
            color,
            size: compact ? 17 : 19,
          });

          return (
            <TabItem
              key={route.key}
              label={label}
              icon={icon}
              focused={focused}
              compact={compact}
              colors={colors}
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
            />
          );
        })}
      </View>
    </Animated.View>
  );
}

type TabItemProps = {
  label: string;
  icon: ReactNode;
  focused: boolean;
  compact: boolean;
  colors: ReturnType<typeof useColors>;
  onPress: () => void;
  onLongPress: () => void;
};

/** Один таб: скруглённый контейнер иконки, мягкое свечение и плавный переход состояний. */
function TabItem({
  label,
  icon,
  focused,
  compact,
  colors,
  onPress,
  onLongPress,
}: TabItemProps) {
  // 0 — неактивен, 1 — активен: анимируются масштаб пилюли и её свечение.
  const active = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(active, {
      toValue: focused ? 1 : 0,
      speed: 22,
      bounciness: 4,
      useNativeDriver: true,
    }).start();
  }, [active, focused]);

  const glowOpacity = active.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.18],
  });
  const iconScale = active.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.06],
  });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={focused ? { selected: true } : {}}
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.item,
        { opacity: pressed ? pressedOpacity : 1 },
      ]}
    >
      <Animated.View
        style={[
          styles.iconWrap,
          compact ? styles.iconWrapCompact : styles.iconWrapRegular,
          { transform: [{ scale: iconScale }] },
        ]}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.iconGlow,
            compact ? styles.iconGlowCompact : styles.iconGlowRegular,
            {
              backgroundColor: colors.primary,
              opacity: glowOpacity,
              shadowColor: colors.primary,
            },
          ]}
        />
        <View style={styles.iconHolder}>{icon}</View>
      </Animated.View>
      {!compact && (
        <Text numberOfLines={1} style={[styles.label, { color: focused ? colors.primary : colors.muted }]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderTopWidth: 1,
    overflow: "hidden",
  },
  row: {
    flex: 1,
    flexDirection: "row",
    alignItems: "stretch",
    paddingHorizontal: spacing().sm,
  },
  item: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    borderRadius: radius.button,
    minHeight: minTouchTarget,
  },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  iconWrapRegular: {
    width: 38,
    height: 34,
    borderRadius: radius.tile,
  },
  iconWrapCompact: {
    width: 32,
    height: 32,
    borderRadius: radius.tile,
  },
  iconGlow: {
    ...StyleSheet.absoluteFillObject,
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 3 },
  },
  iconGlowRegular: { borderRadius: radius.tile },
  iconGlowCompact: { borderRadius: radius.tile },
  iconHolder: {
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    ...typeScale.meta,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.2,
    maxWidth: "100%",
    textAlign: "center",
  },
});
