// useTimeline hook - React integration for event timeline
import { useEffect, useState } from "react";
import { timelineEngine } from "../../services/timeline-engine/timeline-engine";
import type { EventTimeline, TimelineConfig, TimelineOptimization, DjScheduleEntry } from "@/packages/shared-types/timeline";

/**
 * Hook to generate and manage event timelines
 */
export function useTimeline(config?: TimelineConfig) {
  const [timeline, setTimeline] = useState<EventTimeline | null>(null);
  const [optimization, setOptimization] = useState<TimelineOptimization | null>(null);
  const [djSchedule, setDjSchedule] = useState<DjScheduleEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Generate timeline from config
   */
  const generateTimeline = async (eventConfig: TimelineConfig, eventId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Generate timeline
      const generatedTimeline = timelineEngine.generateTimeline(eventConfig, eventId);
      setTimeline(generatedTimeline);

      // Optimize timeline
      const optimized = timelineEngine.optimizeTimeline(generatedTimeline, {});
      setOptimization(optimized);

      // Generate DJ schedule
      const schedule = timelineEngine.generateDjSchedule(generatedTimeline);
      setDjSchedule(schedule);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate timeline";
      setError(message);
      console.error("Timeline generation error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Update timeline
   */
  const updateTimeline = (updatedTimeline: EventTimeline) => {
    setTimeline(updatedTimeline);
    
    // Re-optimize
    const optimized = timelineEngine.optimizeTimeline(updatedTimeline, {});
    setOptimization(optimized);

    // Update DJ schedule
    const schedule = timelineEngine.generateDjSchedule(updatedTimeline);
    setDjSchedule(schedule);
  };

  /**
   * Get formatted timeline for display
   */
  const getFormattedTimeline = () => {
    if (!timeline) return null;
    return timeline.events.map((event) => ({
      ...event,
      startTimeFormatted: event.startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      endTimeFormatted: event.endTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }));
  };

  /**
   * Get timeline summary
   */
  const getTimelineSummary = () => {
    if (!timeline) return "";
    return timelineEngine.getTimelineSummary(timeline);
  };

  /**
   * Get setup time estimate
   */
  const getSetupTime = () => {
    if (!timeline) return 0;
    return timelineEngine.calculateSetupTime(timeline);
  };

  return {
    timeline,
    optimization,
    djSchedule,
    isLoading,
    error,
    generateTimeline,
    updateTimeline,
    getFormattedTimeline,
    getTimelineSummary,
    getSetupTime,
  };
}
