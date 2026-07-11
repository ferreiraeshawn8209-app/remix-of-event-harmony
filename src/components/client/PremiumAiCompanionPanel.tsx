import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { BeatkultureMascot } from "@/components/BeatkultureMascot";
import { useHumorAssistant } from "@/hooks/useHumorAssistant";
import { useAiPersonality } from "@/hooks/useAiPersonality";
import { useVoiceAi } from "@/hooks/useVoiceAi";
import { useVoicePreferences } from "@/hooks/useVoicePreferences";
import { isAdultHumorAllowed, type CompanionMode } from "@/lib/aiPersonality";
import type { HumorCategory, HumorSuggestion } from "@/packages/shared-types/humor";
import { Sparkles, Volume2, Bot, Zap, Mic, PartyPopper, Lightbulb } from "lucide-react";

const showcaseFeatures = [
  "Build wedding timelines",
  "Create invitations",
  "Suggest music",
  "Generate MC jokes",
  "Organize seating plans",
  "Create event schedules",
  "Assist with speeches",
  "Track bookings",
  "Generate reminders",
];

const jokeCategories: Array<{ label: string; value: HumorCategory }> = [
  { label: "Wedding jokes", value: "wedding" },
  { label: "Crowd jokes", value: "crowd" },
  { label: "Reception jokes", value: "reception" },
  { label: "Ice breakers", value: "ice-breaker" },
  { label: "Family jokes", value: "family" },
  { label: "Entertainment jokes", value: "entertainment" },
  { label: "Adult humour", value: "adult-humour" },
];

interface PremiumAiCompanionPanelProps {
  userScope: string;
  userName: string;
  quoteCount: number;
  requestCount: number;
  latestQuoteStatus?: string | null;
  eventType?: string | null;
}

async function fetchCompanionSuggestion(prompt: string, context: Record<string, unknown>, personalityPrompt: string) {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/event-assistant`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      messages: [{ role: "user", content: prompt }],
      personality: {
        prompt: personalityPrompt,
      },
      context,
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error("Unable to fetch companion suggestion.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let output = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let lineBreak: number;
    while ((lineBreak = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, lineBreak).trim();
      buffer = buffer.slice(lineBreak + 1);
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (payload === "[DONE]") continue;
      try {
        const parsed = JSON.parse(payload);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) output += delta;
      } catch {
        continue;
      }
    }
  }
  return output.trim();
}

export function PremiumAiCompanionPanel({
  userScope,
  userName,
  quoteCount,
  requestCount,
  latestQuoteStatus,
  eventType,
}: PremiumAiCompanionPanelProps) {
  const [avatarMood, setAvatarMood] = useState<"idle" | "speaking" | "celebrating" | "listening" | "thinking">("idle");
  const [avatarEnergy, setAvatarEnergy] = useState(0);
  const [avatarViseme, setAvatarViseme] = useState("rest");
  const [suggestion, setSuggestion] = useState("");
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [showcaseIndex, setShowcaseIndex] = useState(0);
  const [jokeIndex, setJokeIndex] = useState(0);
  const [selectedJokeCategory, setSelectedJokeCategory] = useState<HumorCategory>("wedding");

  const previousCountsRef = useRef({ quoteCount, requestCount, latestQuoteStatus });
  const { personality, personalityPrompt, setPersonality } = useAiPersonality(userScope);
  const { preferences, setEnabled } = useVoicePreferences(userScope);
  const humorContext = useMemo(
    () => ({
      eventType: eventType || "wedding",
      audienceAgeGroup: personality.humorAudience === "adults-only" ? "adults" : "mixed",
      eventFormality: "semi-formal" as const,
      coupleNames: [userName],
      eventTheme: eventType || "event celebration",
    }),
    [eventType, personality.humorAudience, userName],
  );
  const { suggestions, generateHumor } = useHumorAssistant(humorContext, personality);
  const { isSpeaking, speak, error: voiceError, sessionStatus } = useVoiceAi(`companion-${userScope}`, {
    voiceEnabled: preferences.enabled,
    speakingRate: preferences.speakingRate,
    voiceName: preferences.voiceName,
    onSpeechProgress: ({ energy, viseme }) => {
      setAvatarEnergy(energy);
      setAvatarViseme(viseme);
    },
  });

  useEffect(() => {
    setAvatarMood(isSpeaking ? "speaking" : "idle");
    if (!isSpeaking) {
      setAvatarEnergy(0);
      setAvatarViseme("rest");
    }
  }, [isSpeaking]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setShowcaseIndex((prev) => (prev + 1) % showcaseFeatures.length);
    }, 3200);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (suggestions.length <= 1) return;
    const id = window.setInterval(() => {
      setJokeIndex((prev) => (prev + 1) % suggestions.length);
    }, 5200);
    return () => window.clearInterval(id);
  }, [suggestions]);

  useEffect(() => {
    const greeting = `Welcome back ${userName}. Your premium AI companion is live and ready to plan.`;
    setSuggestion(greeting);
    if (preferences.enabled) {
      void speak(greeting);
    }
  }, [userName]);

  useEffect(() => {
    const previous = previousCountsRef.current;
    if (requestCount > previous.requestCount) {
      const message = "You've got a new quote request. Want me to draft your next planning steps?";
      setAvatarMood("celebrating");
      setSuggestion(message);
      if (preferences.enabled) void speak(message);
    } else if (quoteCount > previous.quoteCount) {
      const message = "A new quote landed. I'll help you turn it into a flawless event flow.";
      setAvatarMood("celebrating");
      setSuggestion(message);
      if (preferences.enabled) void speak(message);
    } else if (latestQuoteStatus && latestQuoteStatus !== previous.latestQuoteStatus) {
      const message =
        latestQuoteStatus === "accepted"
          ? "Your event timeline looks fantastic. Let's prepare your reception show flow next."
          : "Status updated. I can help you adapt your plan instantly.";
      setAvatarMood("celebrating");
      setSuggestion(message);
      if (preferences.enabled) void speak(message);
    }
    previousCountsRef.current = { quoteCount, requestCount, latestQuoteStatus };
  }, [latestQuoteStatus, preferences.enabled, quoteCount, requestCount, speak]);

  const activeJoke = suggestions.length > 0 ? suggestions[jokeIndex % suggestions.length] : null;

  const loadSuggestion = async (mode?: CompanionMode) => {
    setSuggestionLoading(true);
    setSuggestionError(null);
    setAvatarMood("thinking");
    try {
      if (mode) setPersonality((prev) => ({ ...prev, mode }));
      const text = await fetchCompanionSuggestion(
        "Give one concise premium planning recommendation and one playful line for this customer right now.",
        { event_type: eventType, quote_count: quoteCount, request_count: requestCount, latest_quote_status: latestQuoteStatus },
        personalityPrompt,
      );
      if (!text) throw new Error("No suggestion returned.");
      setSuggestion(text);
      setAvatarMood("idle");
      if (preferences.enabled) {
        await speak(text);
      }
    } catch (error) {
      setSuggestionError(error instanceof Error ? error.message : "Unable to load suggestion.");
      setAvatarMood("idle");
    } finally {
      setSuggestionLoading(false);
    }
  };

  return (
    <section className="space-y-4">
      <Card variant="glass" className="relative overflow-hidden border-primary/50 shadow-[0_0_42px_hsl(var(--secondary)/0.35)] ai-companion-panel">
        <div className="absolute inset-0 ai-particle-field pointer-events-none" />
        <CardHeader className="relative z-10">
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            Premium AI Companion
          </CardTitle>
          <CardDescription>
            Intelligent assistant + planner + MC + wedding expert + friend in one live experience.
          </CardDescription>
        </CardHeader>
        <CardContent className="relative z-10 grid gap-4 lg:grid-cols-[280px,1fr]">
          <div className="rounded-xl border border-secondary/40 bg-black/45 p-3 space-y-3">
            <div className="flex items-center justify-center rounded-lg bg-gradient-to-br from-secondary/20 via-primary/10 to-accent/20">
              <BeatkultureMascot mood={avatarMood} speechEnergy={avatarEnergy} viseme={avatarViseme} />
            </div>
            <div className="text-xs text-muted-foreground text-center">
              {suggestionLoading ? "Thinking..." : suggestion || `Welcome back ${userName}.`}
            </div>
            <div className="flex items-center justify-between rounded-md border border-border/60 bg-background/40 px-2 py-1.5">
              <Label htmlFor="voice-enable" className="text-xs">Voice enabled</Label>
              <Switch id="voice-enable" checked={preferences.enabled} onCheckedChange={setEnabled} />
            </div>
            {voiceError && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
                {voiceError}
              </div>
            )}
            <div className="flex gap-2">
              <Button size="sm" className="flex-1" variant="hero" onClick={() => void loadSuggestion()}>
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                Suggest
              </Button>
              <Button size="sm" variant="outline" onClick={() => suggestion && void speak(suggestion)} disabled={!preferences.enabled || !suggestion}>
                <Volume2 className="w-3.5 h-3.5 mr-1" />
                Speak
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <Card variant="glass" className="border-secondary/35">
                <CardContent className="p-3 space-y-2">
                  <p className="text-xs text-muted-foreground">Personality mode</p>
                  <Select value={personality.mode} onValueChange={(value) => setPersonality((prev) => ({ ...prev, mode: value as CompanionMode }))}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="assistant">Personal assistant</SelectItem>
                      <SelectItem value="planner">Event planner</SelectItem>
                      <SelectItem value="mc">MC</SelectItem>
                      <SelectItem value="wedding-expert">Wedding expert</SelectItem>
                      <SelectItem value="friend">Friend</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
              <Card variant="glass" className="border-primary/35">
                <CardContent className="p-3 space-y-2">
                  <p className="text-xs text-muted-foreground">Humor audience</p>
                  <Select value={personality.humorAudience} onValueChange={(value) => setPersonality((prev) => ({ ...prev, humorAudience: value as "family" | "mixed" | "adults-only" }))}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="family">Family safe</SelectItem>
                      <SelectItem value="mixed">Mixed audience</SelectItem>
                      <SelectItem value="adults-only">Adults only</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
              <Card variant="glass" className="border-accent/35">
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">Adult humor</p>
                    <Switch
                      checked={personality.allowAdultHumor}
                      onCheckedChange={(checked) => setPersonality((prev) => ({ ...prev, allowAdultHumor: checked }))}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {isAdultHumorAllowed(personality) ? "Enabled and gated." : "Disabled or blocked by audience safety."}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card variant="glass" className="border-primary/35 overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  AI showcase
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={showcaseFeatures[showcaseIndex]}
                    initial={{ opacity: 0, y: 18, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -12, scale: 0.98 }}
                    transition={{ duration: 0.3 }}
                    className="rounded-lg border border-border/60 bg-gradient-to-r from-secondary/15 via-primary/10 to-accent/15 p-3"
                  >
                    <p className="text-sm font-medium">{showcaseFeatures[showcaseIndex]}</p>
                  </motion.div>
                </AnimatePresence>
                <div className="mt-2 flex gap-1">
                  {showcaseFeatures.map((item, index) => (
                    <button
                      key={item}
                      type="button"
                      className={`h-1.5 w-6 rounded-full ${index === showcaseIndex ? "bg-primary" : "bg-muted"}`}
                      onClick={() => setShowcaseIndex(index)}
                      aria-label={`Show feature ${index + 1}`}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card variant="glass" className="border-secondary/35">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <PartyPopper className="w-4 h-4 text-secondary" />
                  MC joke generator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid sm:grid-cols-[1fr_auto_auto] gap-2">
                  <Select value={selectedJokeCategory} onValueChange={(value) => setSelectedJokeCategory(value as HumorCategory)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {jokeCategories.map((item) => (
                        <SelectItem
                          key={item.value}
                          value={item.value}
                          disabled={item.value === "adult-humour" && !isAdultHumorAllowed(personality)}
                        >
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="outline" onClick={() => generateHumor(selectedJokeCategory, "professional-mc", 4)}>
                    <Lightbulb className="w-3.5 h-3.5 mr-1" />
                    Generate
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => activeJoke && void speak(activeJoke.line)} disabled={!preferences.enabled || !activeJoke}>
                    <Mic className="w-3.5 h-3.5 mr-1" />
                    Voice
                  </Button>
                </div>

                {activeJoke ? (
                  <motion.div
                    key={activeJoke.id}
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="rounded-lg border border-border/60 bg-background/40 p-3 text-sm"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <Badge variant="outline">{activeJoke.category}</Badge>
                      <Badge variant="outline">{activeJoke.ageRating || "general"}</Badge>
                    </div>
                    <p>{activeJoke.line}</p>
                  </motion.div>
                ) : (
                  <div className="rounded-lg border border-border/60 bg-background/40 p-3 text-sm text-muted-foreground">
                    Generate a category to start rotating joke cards.
                  </div>
                )}

                <div className="flex flex-wrap gap-1">
                  {suggestions.map((item: HumorSuggestion, index: number) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`h-1.5 w-7 rounded-full ${index === jokeIndex % Math.max(1, suggestions.length) ? "bg-secondary" : "bg-muted"}`}
                      onClick={() => setJokeIndex(index)}
                      aria-label={`Show joke ${index + 1}`}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {suggestionError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
          {suggestionError}
        </div>
      )}
      <div className="text-xs text-muted-foreground">
        Companion status: <span className="font-semibold text-foreground">{sessionStatus}</span>
      </div>
    </section>
  );
}
