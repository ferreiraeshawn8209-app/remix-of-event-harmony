import { useState } from "react";
import { rehearsalEngine } from "../../services/virtual-rehearsal/rehearsal-engine";
import type { EventTimeline } from "@/packages/shared-types/timeline";
import type { VisualizationStoryboard } from "@/packages/shared-types/visualization";
import type { VirtualRehearsalPlan } from "@/packages/shared-types/rehearsal";

export function useRehearsal() {
  const [rehearsal, setRehearsal] = useState<VirtualRehearsalPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateRehearsal = async (eventId: string, timeline: EventTimeline, storyboard: VisualizationStoryboard) => {
    try {
      setIsLoading(true);
      setError(null);
      const plan = rehearsalEngine.generateRehearsalPlan(eventId, timeline, storyboard);
      setRehearsal(plan);
      return plan;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate rehearsal";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    rehearsal,
    isLoading,
    error,
    generateRehearsal,
  };
}

