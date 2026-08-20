export type HeartRateSampleInput = { time: string; beatsPerMinute: number };
export type HeartRateRecordInput = { samples: HeartRateSampleInput[] };
export type HeartRateSummary = { currentBpm?: number; averageBpm?: number; peakBpm?: number; sampleCount: number; latestSampleAt?: string };

/** Produces a stable, bounded summary from Health Connect HeartRate records. */
export function summarizeHeartRate(records: HeartRateRecordInput[]): HeartRateSummary {
  const samples = records
    .flatMap((record) => record.samples)
    .filter((sample) => Number.isFinite(sample.beatsPerMinute) && sample.beatsPerMinute >= 1 && sample.beatsPerMinute <= 300 && !Number.isNaN(Date.parse(sample.time)));
  if (!samples.length) return { sampleCount: 0 };
  const total = samples.reduce((sum, sample) => sum + sample.beatsPerMinute, 0);
  const latest = samples.reduce((mostRecent, sample) => Date.parse(sample.time) > Date.parse(mostRecent.time) ? sample : mostRecent, samples[0]);
  return {
    currentBpm: Math.round(latest.beatsPerMinute),
    averageBpm: Math.round(total / samples.length),
    peakBpm: Math.round(Math.max(...samples.map((sample) => sample.beatsPerMinute))),
    sampleCount: samples.length,
    latestSampleAt: latest.time,
  };
}
