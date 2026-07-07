import type { EventTimeline } from "@/packages/shared-types/timeline";
import type { SceneMood, VisualizationScene, VisualizationStoryboard } from "@/packages/shared-types/visualization";

const phaseNarration: Record<string, string> = {
  ceremony: "The ceremony begins in a warm, elegant atmosphere.",
  cocktail: "Guests transition into cocktail hour with ambient energy.",
  grand_entrance: "A cinematic grand entrance introduces the next chapter.",
  reception: "The reception opens with polished hosting and visual flow.",
  speeches: "Spotlight moments for speeches and heartfelt toasts.",
  first_dance: "A focused scene for the first dance and emotional highlights.",
  dinner: "Dinner pacing with soft visuals and balanced lighting.",
  dancing: "High-energy dance floor visuals take over the room.",
  special_performances: "Feature performers with dramatic cues and transitions.",
  final_moments: "Final moments close the night with impact and warmth.",
};

const phaseMood: Record<string, SceneMood> = {
  ceremony: "romantic",
  cocktail: "elegant",
  grand_entrance: "dramatic",
  reception: "elegant",
  speeches: "intimate",
  first_dance: "romantic",
  dinner: "intimate",
  dancing: "energetic",
  special_performances: "dramatic",
  final_moments: "romantic",
};

const moodPalette: Record<SceneMood, string[]> = {
  romantic: ["#FFD700", "#9333EA", "#FB923C"],
  elegant: ["#EAB308", "#7E22CE", "#0EA5E9"],
  energetic: ["#F97316", "#EAB308", "#A855F7"],
  intimate: ["#F59E0B", "#6D28D9", "#334155"],
  dramatic: ["#F97316", "#7C3AED", "#111827"],
};

export class VisualizationEngine {
  generateStoryboard(timeline: EventTimeline): VisualizationStoryboard {
    const scenes = timeline.events.map<VisualizationScene>((event, index) => {
      const mood = phaseMood[event.phase] ?? "elegant";
      const palette = moodPalette[mood];
      const durationSeconds = Math.max(6, Math.min(20, Math.round(event.duration / 8)));

      return {
        id: `${timeline.eventId}-scene-${index + 1}`,
        phase: event.phase,
        title: event.title,
        prompt: this.buildPrompt(event.title, event.description || "", event.notes || "", mood, palette),
        durationSeconds,
        cameraDirection: this.cameraDirectionForMood(mood),
        lightingStyle: this.lightingForMood(mood),
        colorPalette: palette,
        narration: phaseNarration[event.phase] ?? `Scene transition for ${event.title}.`,
        musicCue: event.musicGenre ? `${event.musicGenre} instrumental bed` : "Cinematic ambient bed",
      };
    });

    return {
      id: `storyboard-${timeline.eventId}`,
      eventId: timeline.eventId,
      scenes,
      generatedAt: new Date(),
      estimatedRuntimeSeconds: scenes.reduce((sum, scene) => sum + scene.durationSeconds, 0),
    };
  }

  private buildPrompt(title: string, description: string, notes: string, mood: SceneMood, palette: string[]) {
    return [
      `Beatkulture event visualization scene for "${title}"`,
      `Mood: ${mood}`,
      `Description: ${description || "Immersive event moment"}`,
      notes ? `Notes: ${notes}` : "",
      `Color palette: ${palette.join(", ")}`,
      "Style: cinematic, polished event lighting, high-end entertainment production",
    ]
      .filter(Boolean)
      .join(". ");
  }

  private cameraDirectionForMood(mood: SceneMood) {
    switch (mood) {
      case "energetic":
        return "Dynamic orbit with quick push-ins";
      case "dramatic":
        return "Slow dolly-in with wide opening frame";
      case "romantic":
        return "Soft glide with close-up emphasis";
      case "intimate":
        return "Stable medium close framing";
      default:
        return "Balanced pan with occasional close-up";
    }
  }

  private lightingForMood(mood: SceneMood) {
    switch (mood) {
      case "energetic":
        return "Pulsing dance wash with accent strobes";
      case "dramatic":
        return "High contrast key light with cinematic rim";
      case "romantic":
        return "Warm gold key with subtle purple fill";
      case "intimate":
        return "Low-intensity warm wash";
      default:
        return "Balanced gold and purple event wash";
    }
  }
}

export const visualizationEngine = new VisualizationEngine();
