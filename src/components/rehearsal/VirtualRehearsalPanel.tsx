import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, RotateCcw, Mic2 } from "lucide-react";
import type { VirtualRehearsalPlan } from "@/packages/shared-types/rehearsal";

interface VirtualRehearsalPanelProps {
  rehearsal: VirtualRehearsalPlan | null;
  isLoading?: boolean;
  onGenerate: () => Promise<void>;
  onSpeakHostLine?: (line: string) => Promise<void>;
}

export function VirtualRehearsalPanel({
  rehearsal,
  isLoading,
  onGenerate,
  onSpeakHostLine,
}: VirtualRehearsalPanelProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);

  const activeCue = useMemo(() => {
    if (!rehearsal) return null;
    return rehearsal.cues.find((cue) => position >= cue.atSecond && position < cue.atSecond + cue.durationSeconds) || null;
  }, [position, rehearsal]);

  useEffect(() => {
    if (!isPlaying || !rehearsal) return;
    const timer = window.setTimeout(() => {
      setPosition((value) => {
        const next = value + 1;
        if (next >= rehearsal.runtimeSeconds) {
          setIsPlaying(false);
          return rehearsal.runtimeSeconds;
        }
        return next;
      });
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [isPlaying, rehearsal, position]);

  if (!rehearsal) {
    return (
      <Card variant="glass">
        <CardContent className="pt-6">
          <Button className="w-full" variant="hero" onClick={() => void onGenerate()} disabled={isLoading}>
            Generate virtual rehearsal
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card variant="glass">
        <CardHeader>
          <CardTitle>{rehearsal.title}</CardTitle>
          <CardDescription>{rehearsal.runtimeSeconds}s runtime • {rehearsal.cues.length} cues</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-2 rounded bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${(position / Math.max(1, rehearsal.runtimeSeconds)) * 100}%` }}
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="hero"
              onClick={() => setIsPlaying((value) => !value)}
            >
              {isPlaying ? <Pause className="w-3 h-3 mr-2" /> : <Play className="w-3 h-3 mr-2" />}
              {isPlaying ? "Pause" : "Play"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setPosition(0); setIsPlaying(false); }}>
              <RotateCcw className="w-3 h-3 mr-2" />
              Reset
            </Button>
            <Button size="sm" variant="outline" onClick={() => void onSpeakHostLine?.(rehearsal.introText)}>
              <Mic2 className="w-3 h-3 mr-2" />
              Host intro
            </Button>
          </div>
          {activeCue && (
            <div className="rounded border border-border/60 p-3 text-sm">
              <p className="font-semibold">{activeCue.title}</p>
              <p className="text-muted-foreground mt-1">{activeCue.narration}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card variant="glass">
        <CardHeader>
          <CardTitle>Virtual host script</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 max-h-80 overflow-y-auto">
          {rehearsal.hostLines.map((line) => (
            <div key={line.id} className="rounded border border-border/50 p-3 text-sm space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Badge variant="outline">{line.intent}</Badge>
                <span className="text-xs text-muted-foreground">{line.atSecond}s</span>
              </div>
              <p>{line.text}</p>
              {onSpeakHostLine && (
                <Button size="sm" variant="ghost" onClick={() => void onSpeakHostLine(line.text)}>
                  Speak line
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
