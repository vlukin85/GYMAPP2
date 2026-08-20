import { describe, expect, it } from "vitest";
import { summarizeHeartRate } from "../lib/health-connect-heart-rate";

describe("сводка пульса Health Connect", () => {
  it("считает актуальный, средний и пиковый пульс из валидных образцов", () => {
    const summary = summarizeHeartRate([{ samples: [
      { time: "2026-08-20T10:00:00.000Z", beatsPerMinute: 120 },
      { time: "2026-08-20T10:02:00.000Z", beatsPerMinute: 150 },
      { time: "2026-08-20T10:01:00.000Z", beatsPerMinute: 130 },
      { time: "invalid", beatsPerMinute: 200 },
    ] }]);

    expect(summary).toEqual({ currentBpm: 150, averageBpm: 133, peakBpm: 150, sampleCount: 3, latestSampleAt: "2026-08-20T10:02:00.000Z" });
  });

  it("не подменяет отсутствующие данные нулевым пульсом", () => {
    expect(summarizeHeartRate([{ samples: [{ time: "2026-08-20T10:00:00.000Z", beatsPerMinute: 0 }] }])).toEqual({ sampleCount: 0 });
  });
});
