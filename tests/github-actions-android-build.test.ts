import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(
  resolve(process.cwd(), ".github/workflows/android-apk.yml"),
  "utf8",
);
const documentation = readFileSync(
  resolve(process.cwd(), "docs/github-actions-android-build.md"),
  "utf8",
);

describe("GitHub Android build route", () => {
  it("builds a debug APK after relevant application changes reach main", () => {
    expect(workflow).toContain("push:");
    expect(workflow).toContain("- main");
    expect(workflow).toContain('- "tests/**"');
    expect(workflow).toContain("pnpm/action-setup@v4");
    expect(workflow).toContain(
      "BUILD_VARIANT: ${{ github.event_name == 'workflow_dispatch' && inputs.build_variant || 'debug' }}",
    );
    expect(workflow).toContain(
      "ARTIFACT_TYPE: ${{ github.event_name == 'workflow_dispatch' && inputs.artifact_type || 'apk' }}",
    );
    expect(workflow).toContain("name: ironrise-${{ env.BUILD_VARIANT }}-apk");
  });

  it("keeps manual release and AAB choices while documenting the Git-first workflow", () => {
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).toContain("- aab");
    expect(workflow).toContain("Configure production signing");
    expect(documentation).toContain("push в ветку `main`");
    expect(documentation).toContain("Системная кнопка **Publish**");
  });
});
