import { describe, expect, it } from "vitest";
import { buildMixcloudEmbedSrc } from "@/lib/mixcloud";

describe("buildMixcloudEmbedSrc", () => {
  it("uses Mixcloud autoplay widget URL with encoded feed and nonce", () => {
    const src = buildMixcloudEmbedSrc("/Beatkulture/", 12345);

    expect(src).toContain("https://player-widget.mixcloud.com/widget/iframe/");
    expect(src).toContain("hide_cover=1");
    expect(src).toContain("autoplay=1");
    expect(src).toContain("feed=%2FBeatkulture%2F");
    expect(src).toContain("_autoplay_nonce=12345");
  });
});
