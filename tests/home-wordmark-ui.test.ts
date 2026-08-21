import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const screen = readFileSync(
  resolve(process.cwd(), "app/(tabs)/index.tsx"),
  "utf8",
);

describe("home wordmark layout", () => {
  it("keeps the IronRise wordmark on one adaptive line", () => {
    expect(screen).toMatch(
      /numberOfLines=\{1\}\s+adjustsFontSizeToFit\s+minimumFontScale=\{0\.76\}/,
    );
    expect(screen).toMatch(
      /wordmark:\s*\{\s*alignSelf:\s*"stretch",\s*flexShrink:\s*1,\s*fontSize:\s*34/,
    );
  });
});
