import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type {
  HumorCategory,
  HumorStyle,
  HumorSuggestion,
  SpeechDraft,
  SpeechRequest,
} from "@/packages/shared-types/humor";
import type { CompanionPersonality } from "@/lib/aiPersonality";

interface HumorAssistantPanelProps {
  suggestions: HumorSuggestion[];
  speechDraft: SpeechDraft | null;
  personality: CompanionPersonality;
  onUpdatePersonality: (update: Partial<CompanionPersonality>) => void;
  onGenerateHumor: (category: HumorCategory, style: HumorStyle, count?: number) => void;
  onGenerateSpeech: (request: SpeechRequest) => void;
  onSpeak?: (line: string) => Promise<void>;
}

const categories: HumorCategory[] = [
  "wedding",
  "crowd",
  "reception",
  "ice-breaker",
  "family",
  "entertainment",
  "adult-humour",
];

const styles: HumorStyle[] = [
  "family-friendly",
  "professional-mc",
  "witty",
  "lighthearted",
  "romantic-comedy",
  "observational",
  "story-based",
];

export function HumorAssistantPanel({
  suggestions,
  speechDraft,
  personality,
  onUpdatePersonality,
  onGenerateHumor,
  onGenerateSpeech,
  onSpeak,
}: HumorAssistantPanelProps) {
  const [category, setCategory] = useState<HumorCategory>("wedding");
  const [style, setStyle] = useState<HumorStyle>("family-friendly");
  const [speechRole, setSpeechRole] = useState<SpeechRequest["role"]>("mc");
  const [speechTone, setSpeechTone] = useState<SpeechRequest["tone"]>("balanced");
  const [speechLength, setSpeechLength] = useState<SpeechRequest["length"]>("medium");
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);

  useEffect(() => {
    if (suggestions.length <= 1) return;
    const interval = window.setInterval(() => {
      setActiveSuggestionIndex((prev) => (prev + 1) % suggestions.length);
    }, 5000);
    return () => window.clearInterval(interval);
  }, [suggestions]);

  useEffect(() => {
    if (category === "adult-humour" && !personality.allowAdultHumor) {
      setCategory("family");
    }
  }, [category, personality.allowAdultHumor]);

  const activeSuggestion = useMemo(() => {
    if (suggestions.length === 0) return null;
    return suggestions[activeSuggestionIndex % suggestions.length];
  }, [activeSuggestionIndex, suggestions]);

  return (
    <div className="space-y-4">
      <Card variant="glass" className="border-secondary/40">
        <CardHeader>
          <CardTitle>Professional MC Joke Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as HumorCategory)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              {categories.map((item) => (
                <option key={item} value={item} disabled={item === "adult-humour" && !personality.allowAdultHumor}>
                  {item}
                </option>
              ))}
            </select>
            <select
              value={style}
              onChange={(event) => setStyle(event.target.value as HumorStyle)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              {styles.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="adult-humor-switch" className="text-xs text-muted-foreground">
                Allow adult humor where appropriate
              </Label>
              <Switch
                id="adult-humor-switch"
                checked={personality.allowAdultHumor}
                onCheckedChange={(checked) => onUpdatePersonality({ allowAdultHumor: checked })}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Adult humor is only available when audience mode is set to adults-only.
            </p>
          </div>

          <Button className="w-full" variant="hero" onClick={() => onGenerateHumor(category, style, 5)}>
            Generate premium joke set
          </Button>
        </CardContent>
      </Card>

      <Card variant="glass">
        <CardHeader>
          <CardTitle>Speech Assistant</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-3">
            <select
              value={speechRole}
              onChange={(event) => setSpeechRole(event.target.value as SpeechRequest["role"])}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              {["best-man", "maid-of-honor", "father", "mother", "groom", "bride", "mc", "thank-you", "welcome", "anniversary"].map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select
              value={speechTone}
              onChange={(event) => setSpeechTone(event.target.value as SpeechRequest["tone"])}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              {["funny", "emotional", "balanced", "professional"].map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select
              value={speechLength}
              onChange={(event) => setSpeechLength(event.target.value as SpeechRequest["length"])}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              {["short", "medium", "long"].map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <Button
            className="w-full"
            variant="outline"
            onClick={() =>
              onGenerateSpeech({
                role: speechRole,
                tone: speechTone,
                length: speechLength,
                includeHumor: speechTone !== "professional",
              })
            }
          >
            Generate speech draft
          </Button>
        </CardContent>
      </Card>

      {suggestions.length > 0 && activeSuggestion && (
        <Card variant="glass" className="overflow-hidden">
          <CardHeader>
            <CardTitle>Animated joke cards</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSuggestion.id}
                initial={{ opacity: 0, x: 24, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -24, scale: 0.98 }}
                transition={{ duration: 0.25 }}
                className="rounded-md border border-border/60 p-3 text-sm space-y-2 bg-gradient-to-br from-secondary/10 to-accent/10"
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline">{activeSuggestion.category}</Badge>
                  <Badge variant="outline">{activeSuggestion.style}</Badge>
                </div>
                <p>{activeSuggestion.line}</p>
                {onSpeak && (
                  <Button size="sm" variant="ghost" onClick={() => void onSpeak(activeSuggestion.line)}>
                    Voice playback
                  </Button>
                )}
              </motion.div>
            </AnimatePresence>
            <div className="flex flex-wrap gap-1">
              {suggestions.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSuggestionIndex(index)}
                  className={`h-1.5 w-8 rounded-full transition ${index === activeSuggestionIndex % suggestions.length ? "bg-primary" : "bg-muted"}`}
                  aria-label={`Show suggestion ${index + 1}`}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {speechDraft && (
        <Card variant="glass">
          <CardHeader>
            <CardTitle>{speechDraft.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>{speechDraft.opening}</p>
            {speechDraft.body.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
            <p>{speechDraft.closing}</p>
            <Badge variant="outline">Estimated {speechDraft.estimatedMinutes} min</Badge>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
