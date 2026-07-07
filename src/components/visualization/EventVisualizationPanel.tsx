import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { VisualizationStoryboard } from "@/packages/shared-types/visualization";

interface EventVisualizationPanelProps {
  storyboard: VisualizationStoryboard | null;
  isLoading?: boolean;
}

export function EventVisualizationPanel({ storyboard, isLoading }: EventVisualizationPanelProps) {
  if (!storyboard && !isLoading) {
    return (
      <Card variant="glass">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Generate visualization scenes to preview your event flow</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card variant="glass">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Generating cinematic scenes...</p>
        </CardContent>
      </Card>
    );
  }

  if (!storyboard) return null;

  return (
    <div className="space-y-4">
      <Card variant="glass">
        <CardHeader>
          <CardTitle>Event Visualization Storyboard</CardTitle>
          <CardDescription>
            {storyboard.scenes.length} scenes • Estimated runtime {storyboard.estimatedRuntimeSeconds} seconds
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="space-y-3">
        {storyboard.scenes.map((scene, index) => (
          <Card key={scene.id} variant="glass">
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Scene {index + 1}</p>
                  <h3 className="font-semibold text-sm">{scene.title}</h3>
                </div>
                <Badge variant="outline">{scene.durationSeconds}s</Badge>
              </div>

              <p className="text-xs text-muted-foreground">{scene.narration}</p>
              <p className="text-xs">{scene.prompt}</p>

              <div className="flex flex-wrap gap-2">
                {scene.colorPalette.map((color) => (
                  <span
                    key={`${scene.id}-${color}`}
                    className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded border border-border/50"
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    {color}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
