import { useMemo, useState } from "react";
import {
  DEFAULT_PERSONALITY,
  buildPersonalityPrompt,
  inferCompanionMode,
  type CompanionMode,
  type CompanionPersonality,
} from "@/lib/aiPersonality";

function getStorageKey(scopeKey: string) {
  return `bk-ai-personality:${scopeKey}`;
}

function readFromStorage(scopeKey: string): CompanionPersonality {
  try {
    const raw = localStorage.getItem(getStorageKey(scopeKey));
    if (!raw) return DEFAULT_PERSONALITY;
    const parsed = JSON.parse(raw) as Partial<CompanionPersonality>;
    return { ...DEFAULT_PERSONALITY, ...parsed };
  } catch {
    return DEFAULT_PERSONALITY;
  }
}

export function useAiPersonality(scopeKey: string) {
  const [personality, setPersonalityState] = useState<CompanionPersonality>(() => readFromStorage(scopeKey));

  const setPersonality = (next: CompanionPersonality | ((prev: CompanionPersonality) => CompanionPersonality)) => {
    setPersonalityState((prev) => {
      const value = typeof next === "function" ? next(prev) : next;
      localStorage.setItem(getStorageKey(scopeKey), JSON.stringify(value));
      return value;
    });
  };

  const setMode = (mode: CompanionMode) => setPersonality((prev) => ({ ...prev, mode }));
  const autoSwitchMode = (input: Parameters<typeof inferCompanionMode>[0]) =>
    setPersonality((prev) => ({ ...prev, mode: inferCompanionMode(input) }));

  const personalityPrompt = useMemo(() => buildPersonalityPrompt(personality), [personality]);

  return {
    personality,
    personalityPrompt,
    setPersonality,
    setMode,
    autoSwitchMode,
  };
}
