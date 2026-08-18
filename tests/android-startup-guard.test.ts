import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = resolve(__dirname, "..");
const readProjectFile = (relativePath: string) => readFileSync(resolve(projectRoot, relativePath), "utf8");

describe("Android cold-start guard", () => {
  it("does not include remote diagnostics in the client bundle", () => {
    const reporting = readProjectFile("lib/error-reporting.ts");
    expect(reporting).not.toContain("@sentry/react-native");
    expect(reporting).toContain("local-diagnostics");
  });

  it("does not initialize remote diagnostics in the root layout", () => {
    const layout = readProjectFile("app/_layout.tsx");
    expect(layout).not.toContain("initializeErrorReporting");
    expect(layout).not.toContain("@sentry/react-native");
  });
});
