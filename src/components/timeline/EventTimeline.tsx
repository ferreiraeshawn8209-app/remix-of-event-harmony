// EventTimeline Component - Visual timeline display and management
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Music, Zap, AlertCircle, CheckCircle2 } from "lucide-react";
import type { EventTimeline, DjScheduleEntry } from "@/packages/shared-types/timeline";

interface EventTimelineProps {
  timeline: EventTimeline | null;
  djSchedule: DjScheduleEntry[];
  isLoading?: boolean;
  onEditEvent?: (eventId: string) => void;
}

/**
 * Visual timeline component showing event schedule
 */
export function EventTimelineComponent({ timeline, djSchedule, isLoading, onEditEvent }: EventTimelineProps) {
  if (!timeline) {
    return (
      <Card variant="glass">
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Generate a timeline to get started</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Timeline Summary */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-4 h-4" /> Event Timeline
          </CardTitle>
          <CardDescription>
            Total duration: {timeline.totalDuration} minutes | {timeline.events.length} phases
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Timeline Events */}
      <div className="space-y-2">
        {timeline.events.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card variant="glass" className="overflow-hidden hover:border-primary/50 transition cursor-pointer">
              <div className="flex">
                {/* Time Bar */}
                <div className="w-24 bg-gradient-to-r from-purple-500/20 to-orange-500/20 p-3 flex flex-col justify-center">
                  <p className="text-xs font-semibold text-primary">
                    {event.startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {event.duration} min
                  </p>
                </div>

                {/* Event Content */}
                <CardContent className="flex-1 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm mb-1">{event.title}</h3>
                      <p className="text-xs text-muted-foreground mb-2">{event.description}</p>

                      {/* Badges */}
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant="outline" className="text-[10px]">
                          <Zap className="w-2 h-2 mr-1" />
                          {event.djActivity}
                        </Badge>

                        {event.musicGenre && (
                          <Badge variant="outline" className="text-[10px]">
                            <Music className="w-2 h-2 mr-1" />
                            {event.musicGenre}
                          </Badge>
                        )}

                        {event.phase === "dancing" && (
                          <Badge variant="outline" className="text-[10px] bg-green-500/20">
                            🎉 Main event
                          </Badge>
                        )}
                      </div>

                      {/* Notes */}
                      {event.notes && (
                        <p className="text-[11px] text-muted-foreground mt-2 italic">{event.notes}</p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="ml-4 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEditEvent?.(event.id)}
                        className="text-[10px] h-6 px-2"
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* DJ Schedule Summary */}
      {djSchedule.length > 0 && (
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Music className="w-4 h-4" /> DJ Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {djSchedule.map((entry, i) => (
                <div key={i} className="flex items-start gap-3 pb-2 border-b border-border/30 last:border-0">
                  <div className="w-16 flex-shrink-0">
                    <p className="text-xs font-semibold text-primary">
                      {entry.time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{entry.activity.replace(/_/g, " ")}</p>
                    {entry.notes && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">{entry.notes}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="text-[10px] flex-shrink-0">
                    {entry.phase.replace(/_/g, " ")}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline Statistics */}
      <div className="grid grid-cols-2 gap-3">
        <Card variant="glass">
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{timeline.totalDuration}</p>
              <p className="text-xs text-muted-foreground">Total minutes</p>
            </div>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardContent className="pt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{timeline.events.length}</p>
              <p className="text-xs text-muted-foreground">Event phases</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
