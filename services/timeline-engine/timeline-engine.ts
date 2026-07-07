// Timeline Engine - Intelligent event scheduling with AI optimization
import type {
  TimelineConfig,
  EventTimeline,
  TimelineEvent,
  PhaseDurationEstimate,
  EventPhase,
  TimelineOptimization,
  DjScheduleEntry,
} from "@/packages/shared-types/timeline";

/**
 * Timeline generation engine for Beatkulture events
 */
export class TimelineEngine {
  /**
   * Phase duration defaults by event type (in minutes)
   */
  private phaseDurations: Record<string, PhaseDurationEstimate[]> = {
    wedding: [
      { phase: "ceremony", duration: 45, bufferAfter: 15, priority: 10 },
      { phase: "cocktail", duration: 60, bufferAfter: 10, priority: 8 },
      { phase: "grand_entrance", duration: 15, bufferAfter: 5, priority: 9 },
      { phase: "speeches", duration: 30, bufferAfter: 10, priority: 7 },
      { phase: "dinner", duration: 60, bufferAfter: 5, priority: 6 },
      { phase: "first_dance", duration: 5, bufferAfter: 5, priority: 9 },
      { phase: "dancing", duration: 180, bufferAfter: 15, priority: 8 },
      { phase: "special_performances", duration: 30, bufferAfter: 10, priority: 5 },
      { phase: "final_moments", duration: 20, bufferAfter: 0, priority: 7 },
    ],
    corporate: [
      { phase: "ceremony", duration: 30, bufferAfter: 10, priority: 9 },
      { phase: "cocktail", duration: 45, bufferAfter: 5, priority: 7 },
      { phase: "grand_entrance", duration: 10, bufferAfter: 5, priority: 8 },
      { phase: "speeches", duration: 40, bufferAfter: 10, priority: 8 },
      { phase: "dinner", duration: 75, bufferAfter: 5, priority: 7 },
      { phase: "dancing", duration: 120, bufferAfter: 10, priority: 6 },
      { phase: "special_performances", duration: 20, bufferAfter: 5, priority: 4 },
      { phase: "final_moments", duration: 15, bufferAfter: 0, priority: 6 },
    ],
    birthday: [
      { phase: "ceremony", duration: 20, bufferAfter: 10, priority: 7 },
      { phase: "grand_entrance", duration: 10, bufferAfter: 5, priority: 8 },
      { phase: "special_performances", duration: 30, bufferAfter: 10, priority: 9 },
      { phase: "dinner", duration: 60, bufferAfter: 5, priority: 6 },
      { phase: "dancing", duration: 150, bufferAfter: 10, priority: 9 },
      { phase: "final_moments", duration: 15, bufferAfter: 0, priority: 7 },
    ],
  };

  /**
   * Generate timeline from event config
   */
  generateTimeline(config: TimelineConfig, eventId: string): EventTimeline {
    const phases = this.phaseDurations[config.eventType] || this.phaseDurations.wedding;
    const events: TimelineEvent[] = [];

    let currentTime = new Date(config.startTime);
    let phaseId = 0;

    // Generate timeline events
    for (const phaseDef of phases) {
      const eventDuration = this.adjustDurationForGuestCount(phaseDef.duration, config.guestCount);

      if (this.timeRemaining(currentTime, config.endTime) >= eventDuration) {
        const timelineEvent: TimelineEvent = {
          id: `${config.eventType}-${phaseId}`,
          phase: phaseDef.phase,
          startTime: new Date(currentTime),
          endTime: new Date(currentTime.getTime() + eventDuration * 60000),
          title: this.getPhaseName(phaseDef.phase),
          description: this.getPhaseDescription(phaseDef.phase, config),
          duration: eventDuration,
          djActivity: this.getDjActivityForPhase(phaseDef.phase),
          musicGenre: config.musicGenre,
          notes: this.getPhaseNotes(phaseDef.phase, config),
        };

        events.push(timelineEvent);

        // Add buffer time
        const bufferMinutes = phaseDef.bufferAfter;
        currentTime = new Date(currentTime.getTime() + (eventDuration + bufferMinutes) * 60000);
        phaseId++;
      }
    }

    const totalDuration = this.timeRemaining(config.startTime, currentTime);

    return {
      id: `timeline-${eventId}`,
      eventId,
      events,
      music: [],
      equipment: [],
      totalDuration,
      bufferTime: config.eventDuration * 0.1, // 10% buffer
      createdAt: new Date(),
      updatedAt: new Date(),
      aiOptimized: false,
    };
  }

  /**
   * Optimize timeline based on constraints
   */
  optimizeTimeline(timeline: EventTimeline, constraints: Record<string, any>): TimelineOptimization {
    const suggestions: string[] = [];
    const conflicts: string[] = [];
    let score = 100;

    // Check for time gaps
    for (let i = 0; i < timeline.events.length - 1; i++) {
      const gap = this.timeRemaining(timeline.events[i].endTime, timeline.events[i + 1].startTime);
      if (gap > 15) {
        suggestions.push(`Add music or activity during ${gap}min gap between ${timeline.events[i].phase} and ${timeline.events[i + 1].phase}`);
        score -= 5;
      }
    }

    // Check for back-to-back high-energy phases
    for (let i = 0; i < timeline.events.length - 1; i++) {
      if (this.isHighEnergy(timeline.events[i].phase) && this.isHighEnergy(timeline.events[i + 1].phase)) {
        suggestions.push(`Consider adding a lower-energy phase between ${timeline.events[i].phase} and ${timeline.events[i + 1].phase}`);
        score -= 3;
      }
    }

    // Check if dancing time is sufficient
    const dancingPhase = timeline.events.find((e) => e.phase === "dancing");
    if (!dancingPhase || dancingPhase.duration < 90) {
      suggestions.push("Consider extending dancing duration to at least 90 minutes for full engagement");
      score -= 10;
    }

    // Check balance of phases
    const ceremonyTime = timeline.events.find((e) => e.phase === "ceremony")?.duration || 0;
    const diningTime = timeline.events.find((e) => e.phase === "dinner")?.duration || 0;
    if (ceremonyTime < 30 && diningTime > 90) {
      suggestions.push("Consider more time for ceremony - it sets the tone for the event");
      score -= 5;
    }

    return {
      timeline: { ...timeline, aiOptimized: true },
      score: Math.max(0, score),
      suggestions,
      conflicts,
    };
  }

  /**
   * Generate DJ schedule from timeline
   */
  generateDjSchedule(timeline: EventTimeline): DjScheduleEntry[] {
    const schedule: DjScheduleEntry[] = [];

    // Pre-event setup
    const firstEvent = timeline.events[0];
    if (firstEvent) {
      schedule.push({
        time: new Date(firstEvent.startTime.getTime() - 30 * 60000),
        activity: "setup",
        phase: "ceremony",
        notes: "Sound check, microphone test, equipment verification",
      });
    }

    // Schedule DJ activities for each phase
    for (const event of timeline.events) {
      schedule.push({
        time: event.startTime,
        activity: event.djActivity || "dancing",
        phase: event.phase,
        notes: event.notes,
      });
    }

    // Post-event breakdown
    const lastEvent = timeline.events[timeline.events.length - 1];
    if (lastEvent) {
      schedule.push({
        time: new Date(lastEvent.endTime.getTime() + 5 * 60000),
        activity: "breakdown",
        phase: lastEvent.phase,
        notes: "Pack equipment, remove cables, final venue check",
      });
    }

    return schedule;
  }

  /**
   * Adjust duration based on guest count
   */
  private adjustDurationForGuestCount(baseDuration: number, guestCount: number): number {
    if (guestCount < 50) return baseDuration * 0.8;
    if (guestCount > 300) return baseDuration * 1.2;
    return baseDuration;
  }

  /**
   * Calculate remaining time between two dates (in minutes)
   */
  private timeRemaining(from: Date, to: Date): number {
    return Math.floor((to.getTime() - from.getTime()) / 60000);
  }

  /**
   * Get human-readable phase name
   */
  private getPhaseName(phase: EventPhase): string {
    const names: Record<EventPhase, string> = {
      ceremony: "Ceremony",
      cocktail: "Cocktail Hour",
      grand_entrance: "Grand Entrance",
      reception: "Reception",
      speeches: "Speeches & Toasts",
      first_dance: "First Dance",
      dinner: "Dinner",
      dancing: "Open Dance Floor",
      special_performances: "Special Performances",
      final_moments: "Final Moments",
    };
    return names[phase];
  }

  /**
   * Get phase description
   */
  private getPhaseDescription(phase: EventPhase, config: TimelineConfig): string {
    const descriptions: Record<EventPhase, string> = {
      ceremony: "Formal ceremony with vows and exchange",
      cocktail: "Guest mingling with light music",
      grand_entrance: "Dramatic entrance of couple",
      reception: "Welcome and formal beginning",
      speeches: "Toasts and speeches from loved ones",
      first_dance: "First dance as married couple",
      dinner: "Seated meal service",
      dancing: "Open dance floor with DJ entertainment",
      special_performances: "Entertainment and performances",
      final_moments: "Last songs and farewell",
    };
    return descriptions[phase];
  }

  /**
   * Get DJ activity for phase
   */
  private getDjActivityForPhase(phase: EventPhase): string {
    const activities: Record<EventPhase, string> = {
      ceremony: "ceremony_music",
      cocktail: "cocktail_mix",
      grand_entrance: "mc_announcements",
      reception: "mc_announcements",
      speeches: "mc_announcements",
      first_dance: "special_effects",
      dinner: "cocktail_mix",
      dancing: "dancing",
      special_performances: "special_effects",
      final_moments: "dancing",
    };
    return activities[phase];
  }

  /**
   * Get notes for phase
   */
  private getPhaseNotes(phase: EventPhase, config: TimelineConfig): string {
    switch (phase) {
      case "ceremony":
        return "Classical music, intimate lighting, focus on couple";
      case "cocktail":
        return "Background music, upbeat tempo 80-100 BPM";
      case "grand_entrance":
        return "Dramatic music, announcements, spotlight";
      case "speeches":
        return "Microphone setup, music for transitions";
      case "first_dance":
        return "Couple's chosen song, spotlight, optional dance floor opening";
      case "dancing":
        return "High energy mix, requests encouraged, build intensity gradually";
      case "special_performances":
        return `Coordinated entertainment, ${config.eventType} themed if possible`;
      case "final_moments":
        return "Romantic or upbeat finale, last dance, farewell song";
      default:
        return "";
    }
  }

  /**
   * Determine if phase is high energy
   */
  private isHighEnergy(phase: EventPhase): boolean {
    return ["grand_entrance", "first_dance", "dancing", "special_performances"].includes(phase);
  }

  /**
   * Calculate equipment setup time
   */
  calculateSetupTime(timeline: EventTimeline): number {
    const equipment = new Set(timeline.equipment.map((e) => e.name));
    let setupTime = 30; // base 30 minutes

    if (equipment.has("lighting")) setupTime += 45;
    if (equipment.has("laser_effects")) setupTime += 30;
    if (equipment.has("smoke_machine")) setupTime += 15;
    if (equipment.has("video_projection")) setupTime += 45;

    return setupTime;
  }

  /**
   * Get timeline summary for display
   */
  getTimelineSummary(timeline: EventTimeline): string {
    const events = timeline.events.map((e) => `${e.startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ${e.title}`);
    return events.join("\n");
  }
}

/**
 * Global timeline engine instance
 */
export const timelineEngine = new TimelineEngine();
