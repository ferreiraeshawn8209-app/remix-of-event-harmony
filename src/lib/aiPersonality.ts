export type CompanionMode = "assistant" | "planner" | "mc" | "wedding-expert" | "friend";
export type CompanionTone = "balanced" | "charismatic" | "funny" | "concise";
export type HumorAudience = "family" | "mixed" | "adults-only";

export interface CompanionPersonality {
  mode: CompanionMode;
  tone: CompanionTone;
  humorAudience: HumorAudience;
  allowAdultHumor: boolean;
}

export const DEFAULT_PERSONALITY: CompanionPersonality = {
  mode: "assistant",
  tone: "charismatic",
  humorAudience: "family",
  allowAdultHumor: false,
};

const MODE_BRIEFS: Record<CompanionMode, string> = {
  assistant: "Be a premium personal assistant: proactive, organized, practical.",
  planner: "Be an event planner: logistics-first, timeline-aware, clear about next steps.",
  mc: "Be a professional MC: energetic, stage-savvy, engaging crowd language.",
  "wedding-expert": "Be a wedding expert: detail-rich ceremony/reception guidance and etiquette.",
  friend: "Be a trusted friend: warm, encouraging, emotionally intelligent.",
};

const TONE_BRIEFS: Record<CompanionTone, string> = {
  balanced: "Keep responses balanced between warmth and brevity.",
  charismatic: "Use charm and personality while staying useful and accurate.",
  funny: "Include light humor naturally, but keep it context-safe.",
  concise: "Keep answers tight and direct with minimal fluff.",
};

const HUMOR_GUARDRAILS: Record<HumorAudience, string> = {
  family: "Humor must stay family-safe. Avoid innuendo and adult references.",
  mixed: "Humor can be witty but must remain broadly appropriate for mixed audiences.",
  "adults-only": "Humor can include mature themes when explicitly requested and contextually appropriate.",
};

export function isAdultHumorAllowed(personality: CompanionPersonality): boolean {
  return personality.allowAdultHumor && personality.humorAudience === "adults-only";
}

export function buildPersonalityPrompt(personality: CompanionPersonality): string {
  const adultHumorRule = isAdultHumorAllowed(personality)
    ? "Adult humor is allowed only on explicit request; keep it classy, non-explicit, and non-offensive."
    : "Do not produce adult humor.";

  return [
    MODE_BRIEFS[personality.mode],
    TONE_BRIEFS[personality.tone],
    HUMOR_GUARDRAILS[personality.humorAudience],
    adultHumorRule,
    "Always be intelligent, charismatic, helpful, and emotionally engaging.",
  ].join(" ");
}

export function inferCompanionMode(input: {
  requestedMode?: CompanionMode;
  activePanel?: string;
  eventType?: string | null;
  wantsJokes?: boolean;
}): CompanionMode {
  if (input.requestedMode) return input.requestedMode;
  if (input.wantsJokes || input.activePanel === "humor") return "mc";
  if (input.activePanel === "timeline" || input.activePanel === "visualization") return "planner";
  if (input.eventType?.toLowerCase().includes("wedding")) return "wedding-expert";
  return "assistant";
}
