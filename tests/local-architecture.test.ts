import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "..");
const read = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("local-only mobile architecture", () => {
  it("does not retain the server runtime or tRPC client", () => {
    expect(existsSync(resolve(root, "server"))).toBe(false);
    expect(existsSync(resolve(root, "lib/trpc.ts"))).toBe(false);
    expect(existsSync(resolve(root, "components/training-backup-sync.tsx"))).toBe(false);
  });

  it("does not declare API, database, auth, or remote reporting packages", () => {
    const manifest = JSON.parse(read("package.json")) as { dependencies: Record<string, string> };
    const names = Object.keys(manifest.dependencies);
    ["@trpc/client", "@trpc/react-query", "@trpc/server", "@tanstack/react-query", "express", "mysql2", "drizzle-orm", "@sentry/react-native"].forEach((name) => expect(names).not.toContain(name));
  });

  it("uses a local-only root provider tree", () => {
    const layout = read("app/_layout.tsx");
    expect(layout).not.toContain("trpc.Provider");
    expect(layout).not.toContain("QueryClientProvider");
    expect(layout).not.toContain("TrainingBackupSync");
  });
});
