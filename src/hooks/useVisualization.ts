import { useState } from "react";
import { visualizationEngine } from "../../services/event-visualization/visualization-engine";
import type { EventTimeline } from "@/packages/shared-types/timeline";
import type { VisualizationStoryboard } from "@/packages/shared-types/visualization";

export function useVisualization() {
  const [storyboard, setStoryboard] = useState<VisualizationStoryboard | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateStoryboard = async (timeline: EventTimeline) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = visualizationEngine.generateStoryboard(timeline);
      setStoryboard(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate storyboard";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    storyboard,
    isLoading,
    error,
    generateStoryboard,
  };
}
