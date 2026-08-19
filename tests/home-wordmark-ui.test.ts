import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const screen = readFileSync("/home/ubuntu/gym-training-diary/app/(tabs)/index.tsx", "utf8");

describe("home wordmark layout", () => {
  it("keeps the IronRise wordmark on one adaptive line", () => {
    expect(screen).toContain("numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.76}");
    expect(screen).toContain('wordmark: { alignSelf: "stretch", flexShrink: 1, fontSize: 34');
  });
});
