import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (relativePath: string) =>
  readFileSync(resolve(process.cwd(), relativePath), "utf8");

const helper = read("lib/use-bottom-inset.ts");
const workout = read("app/workout.tsx");
const exercises = read("app/(tabs)/exercises.tsx");
const settings = read("app/settings.tsx");
const nutrition = read("app/(tabs)/nutrition.tsx");
const body = read("app/(tabs)/body.tsx");
const stats = read("app/(tabs)/stats.tsx");
const programs = read("app/(tabs)/programs.tsx");
const programAi = read("app/program/ai.tsx");
const workoutSummary = read("app/workout-summary.tsx");
const mediaPickerSheet = read("components/media-picker-sheet.tsx");
const imageCropSheet = read("components/image-crop-sheet.tsx");
const replacementOverlay = read("components/workout-replacement-overlay.tsx");

describe("dialog safe-area insets", () => {
  it("provides a shared bottom action inset helper over the safe area", () => {
    expect(helper).toContain("useSafeAreaInsets");
    expect(helper).toContain(
      "Math.max(insets.bottom, 12) + extra",
    );
    expect(helper).toContain("export function useBottomActionInset");
  });

  it("lifts the workout set editor and catalog sheets above the nav bar", () => {
    expect(workout).toContain('from "@/lib/use-bottom-inset"');
    expect(workout).toContain("useBottomActionInset");
    expect(workout).toContain("paddingBottom: setEditorBottomInset");
    expect(workout).toContain("paddingBottom: catalogCreateBottomInset");
    expect(workout).toContain(
      "paddingBottom: catalogListBottomInset",
    );
    expect(workout).toContain("paddingBottom: restBottomInset");
  });

  it("lifts the exercises program picker and manual form sheets", () => {
    expect(exercises).toContain('from "@/lib/use-bottom-inset"');
    expect(
      exercises.match(/paddingBottom: sheetBottomInset/g)?.length,
    ).toBeGreaterThanOrEqual(2);
  });

  it("lifts the settings Groq key sheet", () => {
    expect(settings).toContain('from "@/lib/use-bottom-inset"');
    expect(settings).toContain("paddingBottom: keySheetBottomInset");
  });

  it("lifts nutrition product and template sheets", () => {
    expect(nutrition).toContain('from "@/lib/use-bottom-inset"');
    expect(nutrition).toContain("paddingBottom: sheetBottomInset");
    expect(nutrition).toContain("paddingBottom: templateBottomInset");
  });

  it("lifts body measurement editor sheet", () => {
    expect(body).toContain('from "@/lib/use-bottom-inset"');
    expect(body).toContain("paddingBottom: sheetBottomInset");
  });

  it("lifts stats exercise picker and calendar sheets", () => {
    expect(stats).toContain('from "@/lib/use-bottom-inset"');
    expect(stats).toContain("paddingBottom: sheetBottomInset");
  });

  it("lifts the program rename sheet", () => {
    expect(programs).toContain('from "@/lib/use-bottom-inset"');
    expect(programs).toContain("paddingBottom: renameSheetBottomInset");
  });

  it("lifts the AI program key and exercise picker sheets", () => {
    expect(programAi).toContain('from "@/lib/use-bottom-inset"');
    expect(programAi).toContain("paddingBottom: keySheetBottomInset");
    expect(programAi).toContain("paddingBottom: pickerSheetBottomInset");
  });

  it("lifts the workout summary share sheet content", () => {
    expect(workoutSummary).toContain('from "@/lib/use-bottom-inset"');
    expect(workoutSummary).toContain(
      "paddingBottom: shareContentBottomInset",
    );
  });

  it("lifts media picker and image crop sheets", () => {
    expect(mediaPickerSheet).toContain('from "@/lib/use-bottom-inset"');
    expect(mediaPickerSheet).toContain("paddingBottom: sheetBottomInset");
    expect(imageCropSheet).toContain('from "@/lib/use-bottom-inset"');
    expect(imageCropSheet).toContain("paddingBottom: sheetBottomInset");
  });

  it("lifts the workout replacement overlay sheet", () => {
    expect(replacementOverlay).toContain('from "@/lib/use-bottom-inset"');
    expect(replacementOverlay).toContain("paddingBottom: sheetBottomInset");
  });

  it("keeps the already-safe calendar sheets pattern untouched", () => {
    const calendar = read("app/(tabs)/calendar.tsx");
    expect(calendar).toContain(
      "paddingBottom: Math.max(20, insets.bottom + 12)",
    );
  });

  it("keeps the tab bar safe-area handling untouched", () => {
    const tabBar = read("components/ordered-main-tab-bar.tsx");
    expect(tabBar).toContain("insets.bottom");
    const tabsLayout = read("app/(tabs)/_layout.tsx");
    expect(tabsLayout).toContain("useSafeAreaInsets");
  });
});
