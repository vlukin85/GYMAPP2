import { describe, expect, it } from "vitest";
import { getCenteredCrop, getCropRect, isSupportedUserImage } from "../lib/user-media-utils";

describe("user media preparation", () => {
  it("calculates a centered square crop", () => {
    expect(getCenteredCrop(1600, 900, "square")).toEqual({ originX: 350, originY: 0, width: 900, height: 900 });
  });

  it("accepts safe image formats and rejects unsupported or oversized files", () => {
    expect(isSupportedUserImage({ name: "cover.webp", mimeType: "image/webp", size: 4000 })).toBe(true);
    expect(isSupportedUserImage({ name: "cover.svg", mimeType: "image/svg+xml", size: 4000 })).toBe(false);
    expect(isSupportedUserImage({ name: "cover.jpg", mimeType: "image/jpeg", size: 9 * 1024 * 1024 })).toBe(false);
  });

  it("moves and zooms the crop rectangle while keeping it inside source bounds", () => {
    expect(getCropRect(1600, 900, "landscape", { focusX: 1, focusY: 0, zoom: 2 })).toEqual({ originX: 1000, originY: 0, width: 600, height: 450 });
  });
});
