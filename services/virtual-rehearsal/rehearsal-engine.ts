import type { EventTimeline } from "@/packages/shared-types/timeline";
import type { VisualizationStoryboard } from "@/packages/shared-types/visualization";
import type { RehearsalCue, VirtualHostLine, VirtualRehearsalPlan } from "@/packages/shared-types/rehearsal";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export class RehearsalEngine {
  generateRehearsalPlan(eventId: string, timeline: EventTimeline, storyboard: VisualizationStoryboard): VirtualRehearsalPlan {
    const runtimeSeconds = clamp(Math.round(storyboard.estimatedRuntimeSeconds), 30, 90);
    const scale = runtimeSeconds / Math.max(1, timeline.totalDuration * 60);

    let currentSecond = 0;
    const cues: RehearsalCue[] = timeline.events.map((event, index) => {
      const cueDuration = clamp(Math.round(event.duration * 60 * scale), 3, 14);
      const cue: RehearsalCue = {
        id: `${eventId}-cue-${index + 1}`,
        title: event.title,
        atSecond: currentSecond,
        durationSeconds: cueDuration,
        transition: index === 0 ? "fade" : index % 2 === 0 ? "slide" : "cut",
        narration: storyboard.scenes[index]?.narration || `Now entering ${event.title}.`,
      };
      currentSecond += cueDuration;
      return cue;
    });

    const normalizedCues = this.normalizeRuntime(cues, runtimeSeconds);
    const hostLines = this.buildHostLines(normalizedCues, runtimeSeconds, timeline);

    return {
      id: `rehearsal-${eventId}`,
      eventId,
      title: "Virtual Event Rehearsal",
      runtimeSeconds,
      introText: "Welcome to your virtual event rehearsal. Let’s experience your special day together.",
      outroText: "Beatkulture Entertainment thanks you. Your perfect day awaits.",
      timeline,
      storyboard,
      cues: normalizedCues,
      hostLines,
      generatedAt: new Date(),
    };
  }

  private normalizeRuntime(cues: RehearsalCue[], runtimeSeconds: number): RehearsalCue[] {
    const total = cues.reduce((sum, cue) => sum + cue.durationSeconds, 0) || 1;
    const ratio = runtimeSeconds / total;
    let at = 0;
    return cues.map((cue, index) => {
      const scaled = clamp(Math.round(cue.durationSeconds * ratio), 3, 14);
      const normalized: RehearsalCue = {
        ...cue,
        atSecond: at,
        durationSeconds: index === cues.length - 1 ? Math.max(3, runtimeSeconds - at) : scaled,
      };
      at += normalized.durationSeconds;
      return normalized;
    });
  }

  private buildHostLines(cues: RehearsalCue[], runtimeSeconds: number, timeline: EventTimeline): VirtualHostLine[] {
    const lines: VirtualHostLine[] = [];
    lines.push({
      id: `host-welcome-${Date.now()}`,
      atSecond: 0,
      text: "Welcome to your virtual event rehearsal.",
      intent: "welcome",
    });

    cues.forEach((cue, index) => {
      const related = timeline.events[index];
      lines.push({
        id: `host-phase-${index + 1}`,
        atSecond: cue.atSecond,
        text: `Next, ${related?.title || cue.title}.`,
        intent: "timeline",
      });
      if (index > 0) {
        lines.push({
          id: `host-transition-${index + 1}`,
          atSecond: Math.max(1, cue.atSecond - 1),
          text: `Transitioning into ${related?.title || cue.title}.`,
          intent: "transition",
        });
      }
    });

    lines.push({
      id: `host-closing-${Date.now()}`,
      atSecond: Math.max(1, runtimeSeconds - 4),
      text: "Your perfect day awaits.",
      intent: "closing",
    });
    return lines;
  }
}

export const rehearsalEngine = new RehearsalEngine();

