import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type {
  HumorCategory,
  HumorStyle,
  HumorSuggestion,
  SpeechDraft,
  SpeechRequest,
} from "@/packages/shared-types/humor";

interface HumorAssistantPanelProps {
  suggestions: HumorSuggestion[];
  speechDraft: SpeechDraft | null;
  onGenerateHumor: (category: HumorCategory, style: HumorStyle, count?: number) => void;
  onGenerateSpeech: (request: SpeechRequest) => void;
  onSpeak?: (line: string) => Promise<void>;
}

const categories: HumorCategory[] = [
  "wedding",
  "best-man",
  "maid-of-honor",
  "father-of-bride",
  "groom",
  "bride",
  "couple",
  "anniversary",
  "corporate",
  "mc-icebreaker",
  "crowd-warmup",
  "dance-floor",
  "mc-transition",
  "filler-material",
  "trivia",
  "personalized",
];

const styles: HumorStyle[] = [
  "lighthearted",
  "family-friendly",
  "witty",
  "self-deprecating",
  "story-based",
  "observational",
  "romantic-comedy",
  "professional-mc",
];

export function HumorAssistantPanel({
  suggestions,
  speechDraft,
  onGenerateHumor,
  onGenerateSpeech,
  onSpeak,
}: HumorAssistantPanelProps) {
  const [category, setCategory] = useState<HumorCategory>("wedding");
  const [style, setStyle] = useState<HumorStyle>("family-friendly");
  const [speechRole, setSpeechRole] = useState<SpeechRequest["role"]>("mc");
  const [speechTone, setSpeechTone] = useState<SpeechRequest["tone"]>("balanced");
  const [speechLength, setSpeechLength] = useState<SpeechRequest["length"]>("medium");

  return (
    <div className="space-y-4">
      <Card variant="glass">
        <CardHeader>
          <CardTitle>Humor Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as HumorCategory)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              {categories.map((item) => (
                <option key={item} value={item}>
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
          <Button className="w-full" variant="hero" onClick={() => onGenerateHumor(category, style, 4)}>
            Generate jokes and lines
          </Button>
        </CardContent>
      </Card>

      <Card variant="glass">
        <CardHeader>
          <CardTitle>Event Day Quick Tools</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid gap-2 sm:grid-cols-2">
            <Button variant="outline" size="sm" onClick={() => onGenerateHumor("mc-icebreaker", "professional-mc", 3)}>
              Emergency icebreakers
            </Button>
            <Button variant="outline" size="sm" onClick={() => onGenerateHumor("crowd-warmup", "family-friendly", 3)}>
              Crowd engagement
            </Button>
            <Button variant="outline" size="sm" onClick={() => onGenerateHumor("dance-floor", "professional-mc", 3)}>
              Dance floor hype lines
            </Button>
            <Button variant="outline" size="sm" onClick={() => onGenerateHumor("mc-transition", "professional-mc", 3)}>
              MC transitions
            </Button>
            <Button variant="outline" size="sm" onClick={() => onGenerateHumor("trivia", "witty", 3)}>
              Wedding trivia
            </Button>
            <Button variant="outline" size="sm" onClick={() => onGenerateHumor("filler-material", "family-friendly", 3)}>
              Family-safe filler material
            </Button>
          </div>
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

      {suggestions.length > 0 && (
        <Card variant="glass">
          <CardHeader>
            <CardTitle>Crowd-tested options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {suggestions.map((suggestion) => (
              <div key={suggestion.id} className="rounded-md border border-border/60 p-3 text-sm space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline">{suggestion.category}</Badge>
                  <Badge variant="outline">{suggestion.style}</Badge>
                </div>
                <p>{suggestion.line}</p>
                {onSpeak && (
                  <Button size="sm" variant="ghost" onClick={() => void onSpeak(suggestion.line)}>
                    Tell with avatar voice
                  </Button>
                )}
              </div>
            ))}
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
