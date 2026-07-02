import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCcw, Minimize2, Maximize2, X } from "lucide-react";
import type { HumorSuggestion } from "@/packages/shared-types/humor";

interface EntertainmentMomentWidgetProps {
  suggestion: HumorSuggestion | null;
  minimized: boolean;
  enabled: boolean;
  onRefresh: () => void;
  onToggleMinimized: () => void;
  onToggleEnabled: () => void;
}

export function EntertainmentMomentWidget({
  suggestion,
  minimized,
  enabled,
  onRefresh,
  onToggleMinimized,
  onToggleEnabled,
}: EntertainmentMomentWidgetProps) {
  if (!enabled) {
    return (
      <div className="fixed bottom-6 right-6 z-40">
        <Button size="sm" variant="outline" onClick={onToggleEnabled}>
          Entertainment Moment
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      className="fixed bottom-6 right-6 z-40 w-80"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <Card variant="glass" className="border-primary/40">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-sm">Entertainment Moment</CardTitle>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" className="w-7 h-7" onClick={onToggleMinimized}>
                {minimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
              </Button>
              <Button size="icon" variant="ghost" className="w-7 h-7" onClick={onToggleEnabled}>
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        {!minimized && (
          <CardContent className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline">Wedding fact of the moment</Badge>
              <Badge variant="outline">MC joke of the day</Badge>
            </div>
            <p className="text-sm">{suggestion?.line || "Today’s dance floor icebreaker is loading..."}</p>
            <Button size="sm" variant="outline" className="w-full" onClick={onRefresh}>
              <RefreshCcw className="w-3 h-3 mr-2" />
              Refresh
            </Button>
          </CardContent>
        )}
      </Card>
    </motion.div>
  );
}

