export type InterfaceDensity = "compact" | "large";

export type InterfaceDensityPreset = {
  id: InterfaceDensity;
  title: string;
  hint: string;
  fontScale: number;
  spacingScale: number;
};

export const INTERFACE_DENSITY_PRESETS: readonly InterfaceDensityPreset[] = [
  { id: "compact", title: "Компактно", hint: "Больше данных на экране", fontScale: 0.92, spacingScale: 0.9 },
  { id: "large", title: "Крупно", hint: "Увеличенный текст и отступы", fontScale: 1.1, spacingScale: 1.12 },
] as const;

export const DEFAULT_INTERFACE_DENSITY: InterfaceDensity = "compact";

export const getInterfaceDensityPreset = (id: InterfaceDensity) =>
  INTERFACE_DENSITY_PRESETS.find((preset) => preset.id === id) ?? INTERFACE_DENSITY_PRESETS[0];

export const isInterfaceDensity = (value: unknown): value is InterfaceDensity =>
  typeof value === "string" && INTERFACE_DENSITY_PRESETS.some((preset) => preset.id === value);
