import type { EventPhase } from "@/packages/shared-types/timeline";

export type SceneMood = "romantic" | "elegant" | "energetic" | "intimate" | "dramatic";

export interface VisualizationScene {
  id: string;
  phase: EventPhase;
  title: string;
  prompt: string;
  durationSeconds: number;
  cameraDirection: string;
  lightingStyle: string;
  colorPalette: string[];
  narration?: string;
  musicCue?: string;
}

export interface VisualizationStoryboard {
  id: string;
  eventId: string;
  scenes: VisualizationScene[];
  generatedAt: Date;
  estimatedRuntimeSeconds: number;
}
