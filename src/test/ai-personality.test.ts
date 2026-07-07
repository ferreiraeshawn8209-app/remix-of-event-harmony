import { describe, expect, it } from "vitest";
import {
  DEFAULT_PERSONALITY,
  buildPersonalityPrompt,
  inferCompanionMode,
  isAdultHumorAllowed,
} from "@/lib/aiPersonality";

describe("ai personality policy", () => {
  it("keeps adult humor disabled by default", () => {
    expect(isAdultHumorAllowed(DEFAULT_PERSONALITY)).toBe(false);
  });

  it("enables adult humor only when audience is adults-only and toggle is on", () => {
    expect(
      isAdultHumorAllowed({
        ...DEFAULT_PERSONALITY,
        humorAudience: "adults-only",
        allowAdultHumor: true,
      }),
    ).toBe(true);
  });

  it("generates a personality prompt with mode, tone, and safety rules", () => {
    const prompt = buildPersonalityPrompt({
      ...DEFAULT_PERSONALITY,
      mode: "mc",
      tone: "funny",
      humorAudience: "mixed",
    });

    expect(prompt).toContain("professional MC");
    expect(prompt).toContain("witty");
    expect(prompt).toContain("mixed audiences");
  });

  it("auto-selects MC mode for humor panel interactions", () => {
    expect(inferCompanionMode({ activePanel: "humor", wantsJokes: true })).toBe("mc");
  });
});
