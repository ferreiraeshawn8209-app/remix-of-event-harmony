import type { EventTimeline } from "@/packages/shared-types/timeline";
import type { VisualizationStoryboard } from "@/packages/shared-types/visualization";

export interface RehearsalCue {
  id: string;
  title: string;
  atSecond: number;
  durationSeconds: number;
  transition: "fade" | "cut" | "slide";
  narration: string;
}

export interface VirtualHostLine {
  id: string;
  atSecond: number;
  text: string;
  intent: "welcome" | "timeline" | "transition" | "highlight" | "closing";
}

export interface VirtualRehearsalPlan {
  id: string;
  eventId: string;
  title: string;
  runtimeSeconds: number;
  introText: string;
  outroText: string;
  timeline: EventTimeline;
  storyboard: VisualizationStoryboard;
  cues: RehearsalCue[];
  hostLines: VirtualHostLine[];
  generatedAt: Date;
}

