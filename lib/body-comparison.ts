import { BODY_METRICS, type BodyMeasurement } from "./body-store";

export type BodyComparisonRow = { metricId: typeof BODY_METRICS[number]["id"]; label: string; unit: string; from?: number; to?: number; difference?: number };

/** Compare actual values only; missing entries deliberately remain undefined rather than becoming zeros. */
export function compareBodyMeasurements(from: BodyMeasurement, to: BodyMeasurement): BodyComparisonRow[] {
  return BODY_METRICS.map((metric) => {
    const before = from[metric.id];
    const after = to[metric.id];
    return { metricId: metric.id, label: metric.label, unit: metric.unit, from: before, to: after, difference: before !== undefined && after !== undefined ? Number((after - before).toFixed(1)) : undefined };
  });
}

export function formatBodyDifference(value: number | undefined, unit: string) {
  if (value === undefined) return "—";
  return `${value > 0 ? "+" : ""}${value} ${unit}`;
}
