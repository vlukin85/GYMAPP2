import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) =>
  readFileSync(resolve(process.cwd(), path), "utf8");

const tabBar = read("components/ordered-main-tab-bar.tsx");
const screenContainer = read("components/screen-container.tsx");
const parallax = read("components/parallax-scroll-view.tsx");
const collapsible = read("components/ui/collapsible.tsx");
const progressOverview = read("components/progress-overview.tsx");
const hapticTab = read("components/haptic-tab.tsx");
const mainTabSwipe = read("components/main-tab-swipe.tsx");
const tokens = read("lib/design-tokens.ts");
const tailwindConfig = read("tailwind.config.js");
const globalCss = read("global.css");

describe("общие компоненты редизайна «Тёмный атлет»", () => {
  it("использует дизайн-токены, а не локальные дубли значений", () => {
    expect(tokens).toContain('card: 20');
    expect(tokens).toContain('button: 16');
    expect(tokens).toContain('chip: 999');
    expect(tokens).toContain("pressedOpacity = 0.82");
    expect(tokens).toContain("minTouchTarget = 44");
    expect(tokens).toContain('"tabular-nums"');

    expect(tabBar).toContain('from "@/lib/design-tokens"');
    expect(collapsible).toContain('from "@/lib/design-tokens"');
    expect(progressOverview).toContain('from "@/lib/design-tokens"');
  });

  it("нижняя панель: скруглённые иконки-контейнеры со свечением активного таба", () => {
    expect(tabBar).toContain("iconWrap");
    expect(tabBar).toContain("iconGlow");
    expect(tabBar).toContain("borderRadius: radius.tile");
    expect(tabBar).toContain("shadowColor: colors.primary");
    // Плавный переход состояний — пружина на масштабе и свечении.
    expect(tabBar).toContain("Animated.spring");
    expect(tabBar).toContain("interpolate");
  });

  it("нижняя панель: сохраняет поведение — анимация высоты, компактный режим, safe-area", () => {
    expect(tabBar).toContain("LayoutAnimation.configureNext");
    expect(tabBar).toContain("Animated.timing(height");
    expect(tabBar).toContain("!compact &&");
    expect(tabBar).toContain("Math.max(insets.bottom, 8)");
    // Минимальная зона нажатия и единая реакция нажатия.
    expect(tabBar).toContain("minHeight: minTouchTarget");
    expect(tabBar).toContain("pressed ? pressedOpacity : 1");
  });

  it("нижняя панель: неактивные табы приглушены, активные подсвечены акцентом темы", () => {
    expect(tabBar).toContain("focused ? colors.primary : colors.muted");
    expect(tabBar).not.toContain("borderRightWidth: 1");
    expect(tabBar).not.toContain("activeLine");
  });

  it("ScreenContainer задаёт единые горизонтальные поля 20 и фон по теме", () => {
    expect(screenContainer).toContain("bg-background");
    expect(screenContainer).toContain('cn("flex-1 px-5", className)');
    expect(parallax).toContain("px-5 py-4");
  });

  it("общие примитивы: радиусы карточек 20, кнопок 16, минимальная зона нажатия 44", () => {
    expect(progressOverview).toContain("borderRadius: radius.card");
    expect(progressOverview).toContain("borderRadius: radius.tile");
    expect(collapsible).toContain("minHeight: minTouchTarget");
    expect(collapsible).toContain("activeOpacity={pressedOpacity}");
    expect(tailwindConfig).toContain("card: 20");
    expect(tailwindConfig).toContain("button: 16");
    expect(tailwindConfig).toContain("chip: 999");
  });

  it("типографика и числа: tabular-nums для метрик", () => {
    expect(progressOverview).toContain("typeScale.metric");
    expect(progressOverview).toContain('"tabular-nums"');
  });

  it("fallback-цвета global.css совпадают с тёмной темой dark-energy", () => {
    expect(globalCss).toContain("--color-primary: #c8f169");
    expect(globalCss).toContain("--color-background: #0b0f0d");
    expect(globalCss).toContain("--color-surface: #161c18");
    expect(globalCss).toContain("--color-foreground: #f4f7f2");
    expect(globalCss).toContain("--color-warning: #ff9f43");
  });

  it("навигация и жесты не сломаны: свайпы и хаптика на месте", () => {
    expect(mainTabSwipe).toContain("Gesture.Pan()");
    expect(mainTabSwipe).toContain("getAdjacentMainTab");
    expect(hapticTab).toContain("Haptics.impactAsync");
  });
});
