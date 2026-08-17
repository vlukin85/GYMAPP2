import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = resolve(__dirname, "..");
const readProjectFile = (relativePath: string) => readFileSync(resolve(projectRoot, relativePath), "utf8");

describe("Android cold-start guard", () => {
  it("does not statically load Sentry before the first render", () => {
    const reporting = readProjectFile("lib/error-reporting.ts");
    expect(reporting).not.toMatch(/^import\s+\*\s+as\s+Sentry\s+from/m);
    expect(reporting).toContain('require("@sentry/react-native")');
  });

  it("delays Sentry initialization until after the root layout renders", () => {
    const layout = readProjectFile("app/_layout.tsx");
    expect(layout).not.toMatch(/^initializeErrorReporting\(\);/m);
    expect(layout).toContain("setTimeout(() => { if (!cancelled) initializeErrorReporting(); }, 800)");
  });
});
