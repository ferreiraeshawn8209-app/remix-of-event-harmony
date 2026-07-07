import { useState } from "react";

interface VoicePreferences {
  enabled: boolean;
  voiceName: string;
  speakingRate: number;
}

const DEFAULT_PREFERENCES: VoicePreferences = {
  enabled: true,
  voiceName: "default",
  speakingRate: 1,
};

function getStorageKey(userScope: string) {
  return `bk-voice-preferences:${userScope}`;
}

function readPreferences(userScope: string): VoicePreferences {
  try {
    const raw = localStorage.getItem(getStorageKey(userScope));
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<VoicePreferences>;
    return {
      enabled: typeof parsed.enabled === "boolean" ? parsed.enabled : DEFAULT_PREFERENCES.enabled,
      voiceName: parsed.voiceName || DEFAULT_PREFERENCES.voiceName,
      speakingRate:
        typeof parsed.speakingRate === "number" && Number.isFinite(parsed.speakingRate)
          ? Math.min(1.5, Math.max(0.75, parsed.speakingRate))
          : DEFAULT_PREFERENCES.speakingRate,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function useVoicePreferences(userScope: string) {
  const [preferences, setPreferencesState] = useState<VoicePreferences>(() => readPreferences(userScope));

  const setPreferences = (next: VoicePreferences | ((prev: VoicePreferences) => VoicePreferences)) => {
    setPreferencesState((prev) => {
      const value = typeof next === "function" ? next(prev) : next;
      localStorage.setItem(getStorageKey(userScope), JSON.stringify(value));
      return value;
    });
  };

  return {
    preferences,
    setPreferences,
    setEnabled: (enabled: boolean) => setPreferences((prev) => ({ ...prev, enabled })),
    setSpeakingRate: (speakingRate: number) => setPreferences((prev) => ({ ...prev, speakingRate })),
    setVoiceName: (voiceName: string) => setPreferences((prev) => ({ ...prev, voiceName })),
  };
}
