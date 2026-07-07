import { describe, expect, it } from "vitest";
import { humorEngine } from "../../services/humor-assistant/humor-engine";
import type { HumorContext } from "@/packages/shared-types/humor";
import type { CompanionPersonality } from "@/lib/aiPersonality";

const context: HumorContext = {
  eventType: "wedding",
  coupleNames: ["Alex", "Sam"],
};

const familyPersonality: CompanionPersonality = {
  mode: "mc",
  tone: "funny",
  humorAudience: "family",
  allowAdultHumor: true,
};

const adultsOnlyPersonality: CompanionPersonality = {
  mode: "mc",
  tone: "funny",
  humorAudience: "adults-only",
  allowAdultHumor: true,
};

describe("humor engine safety gates", () => {
  it("falls back to family-safe jokes when adult humour is not context-allowed", () => {
    const jokes = humorEngine.generateHumor("adult-humour", "professional-mc", context, 2, familyPersonality);
    expect(jokes.every((joke) => joke.category !== "adult-humour")).toBe(true);
    expect(jokes.every((joke) => joke.ageRating === "general")).toBe(true);
  });

  it("keeps adult humour category when policy allows it", () => {
    const jokes = humorEngine.generateHumor("adult-humour", "professional-mc", context, 2, adultsOnlyPersonality);
    expect(jokes.length).toBeGreaterThan(0);
    expect(jokes[0].category).toBe("adult-humour");
    expect(jokes[0].ageRating).toBe("18+");
  });

  it("supports all required MC joke categories", () => {
    const categories = ["wedding", "crowd", "reception", "ice-breaker", "family", "entertainment"] as const;
    for (const category of categories) {
      const jokes = humorEngine.generateHumor(category, "professional-mc", context, 1, familyPersonality);
      expect(jokes.length).toBeGreaterThan(0);
      expect(jokes[0].category).toBe(category);
    }
  });
});
