import { describe, expect, it } from "vitest";
import { buildVkAuthorizeUrl, getVkRedirectUri } from "../lib/vk-oauth-url";

describe("VK integration configuration", () => {
  it("builds the Android redirect URI required by VK ID", () => {
    expect(getVkRedirectUri("12345")).toBe("vk12345://vk.ru/blank.html");
  });

  it("builds an OAuth 2.1 PKCE authorization request with wall and photos scopes", () => {
    const { url } = buildVkAuthorizeUrl({ appId: "12345", verifier: "verifier", challenge: "challenge", state: "state" });
    expect(url).toContain("https://id.vk.ru/authorize?");
    expect(url).toContain("client_id=12345");
    expect(url).toContain("code_challenge=challenge");
    expect(url).toContain("code_challenge_method=S256");
    expect(url).toContain("scope=wall+photos");
  });
});
