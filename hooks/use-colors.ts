import type { ColorScheme } from "@/constants/theme";
import type { AppThemePalette } from "@/lib/app-color-themes";
import { useThemeContext } from "@/lib/theme-provider";

/**
 * Returns the current theme's color palette.
 * Usage: const colors = useColors(); then colors.text, colors.background, etc.
 */
export function useColors(_colorSchemeOverride?: ColorScheme): AppThemePalette {
  return useThemeContext().palette;
}
