import { useEffect, useMemo, useState } from "react";
import { humorEngine } from "../../services/humor-assistant/humor-engine";
import type {
  HumorCategory,
  HumorContext,
  HumorStyle,
  HumorSuggestion,
  SpeechDraft,
  SpeechRequest,
} from "@/packages/shared-types/humor";
import type { CompanionPersonality } from "@/lib/aiPersonality";

const WIDGET_ENABLED_KEY = "bk-humor-widget-enabled";
const WIDGET_MINIMIZED_KEY = "bk-humor-widget-minimized";

export function useHumorAssistant(context: HumorContext, personality?: CompanionPersonality) {
  const [suggestions, setSuggestions] = useState<HumorSuggestion[]>([]);
  const [speechDraft, setSpeechDraft] = useState<SpeechDraft | null>(null);
  const [moment, setMoment] = useState<HumorSuggestion | null>(null);
  const [widgetEnabled, setWidgetEnabled] = useState(() => localStorage.getItem(WIDGET_ENABLED_KEY) !== "false");
  const [widgetMinimized, setWidgetMinimized] = useState(() => localStorage.getItem(WIDGET_MINIMIZED_KEY) === "true");

  const safeContext = useMemo(() => context, [context]);

  useEffect(() => {
    if (!widgetEnabled) return;
    setMoment(humorEngine.generateEntertainmentMoment(safeContext));
    const interval = window.setInterval(() => {
      setMoment(humorEngine.generateEntertainmentMoment(safeContext));
    }, 70000);
    return () => window.clearInterval(interval);
  }, [widgetEnabled, safeContext]);

  const generateHumor = (category: HumorCategory, style: HumorStyle, count = 3) => {
    setSuggestions(humorEngine.generateHumor(category, style, safeContext, count, personality));
  };

  const generateSpeech = (request: SpeechRequest) => {
    setSpeechDraft(humorEngine.generateSpeech(request, safeContext));
  };

  const refreshMoment = () => {
    setMoment(humorEngine.generateEntertainmentMoment(safeContext));
  };

  const toggleWidgetEnabled = () => {
    setWidgetEnabled((value) => {
      const next = !value;
      localStorage.setItem(WIDGET_ENABLED_KEY, String(next));
      return next;
    });
  };

  const toggleWidgetMinimized = () => {
    setWidgetMinimized((value) => {
      const next = !value;
      localStorage.setItem(WIDGET_MINIMIZED_KEY, String(next));
      return next;
    });
  };

  return {
    suggestions,
    speechDraft,
    moment,
    widgetEnabled,
    widgetMinimized,
    generateHumor,
    generateSpeech,
    refreshMoment,
    toggleWidgetEnabled,
    toggleWidgetMinimized,
  };
}
