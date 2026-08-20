import { describe, expect, it } from "vitest";
import { getHeartRateTargetStatus, targetZoneLabel } from "../lib/heart-rate-target-zone";

describe("целевая зона пульса", () => {
  it("определяет положение пульса в расчётной аэробной зоне", () => {
    expect(getHeartRateTargetStatus(126, 40, "aerobic")).toMatchObject({ state: "within", fromBpm: 126, toBpm: 144 });
    expect(getHeartRateTargetStatus(120, 40, "aerobic").state).toBe("below");
    expect(getHeartRateTargetStatus(150, 40, "aerobic").state).toBe("above");
  });

  it("не создаёт ложное предупреждение без возраста или пульса", () => {
    expect(getHeartRateTargetStatus(undefined, 40, "aerobic").state).toBe("unavailable");
    expect(getHeartRateTargetStatus(130, undefined, "aerobic").state).toBe("unavailable");
    expect(targetZoneLabel("threshold")).toBe("Пороговая");
  });
});
