import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alarm, useAlarms } from "@/hooks/useAlarms";
import { useQuotes } from "@/hooks/useQuotes";
import { useQuoteRequests } from "@/hooks/useQuoteRequests";
import { AlarmClock, Sparkles, Trash2, Calendar, MessageSquare, Wrench } from "lucide-react";
import { format, isPast, formatDistanceToNow } from "date-fns";

const catMeta: Record<Alarm["category"], { label: string; icon: any; color: string }> = {
  followup_quoted: { label: "Quote Follow-up", icon: MessageSquare, color: "text-blue-400" },
  followup_request: { label: "Pending Request", icon: AlarmClock, color: "text-amber-400" },
  event_prep: { label: "Event Prep", icon: Wrench, color: "text-emerald-400" },
};

export function AlarmsManager() {
  const { alarms, isLoading, toggleDone, remove, generate, isGenerating } = useAlarms();
  const { quotes } = useQuotes();
  const { requests } = useQuoteRequests();
  const [filter, setFilter] = useState<"all" | "due" | "upcoming" | "done">("all");
  const [selectedQuote, setSelectedQuote] = useState<string>("");
  const [selectedReq, setSelectedReq] = useState<string>("");

  const filtered = alarms.filter((a) => {
    if (filter === "due") return !a.is_done && isPast(new Date(a.due_at));
    if (filter === "upcoming") return !a.is_done && !isPast(new Date(a.due_at));
    if (filter === "done") return a.is_done;
    return true;
  });

  const grouped = filtered.reduce<Record<string, Alarm[]>>((acc, a) => {
    const key = (a.client_name || "Unassigned") + " · " + catMeta[a.category].label;
    (acc[key] ||= []).push(a);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> AI Alarm Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Let AI plan a follow-up cadence or event-prep stages based on proven sales & event-production playbooks.
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase">From a Quote</label>
              <select
                className="w-full bg-background border border-border rounded-md p-2 text-sm"
                value={selectedQuote}
                onChange={(e) => setSelectedQuote(e.target.value)}
              >
                <option value="">Select a quote…</option>
                {quotes.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.client_code} — {q.client_name} ({q.status})
                  </option>
                ))}
              </select>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!selectedQuote || isGenerating}
                  onClick={() => generate({ category: "followup_quoted", quote_id: selectedQuote })}
                >
                  Schedule Follow-ups
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!selectedQuote || isGenerating}
                  onClick={() => generate({ category: "event_prep", quote_id: selectedQuote })}
                >
                  Plan Event Prep
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase">From a Request (not yet quoted)</label>
              <select
                className="w-full bg-background border border-border rounded-md p-2 text-sm"
                value={selectedReq}
                onChange={(e) => setSelectedReq(e.target.value)}
              >
                <option value="">Select a request…</option>
                {requests
                  .filter((r) => r.status !== "quoted")
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.client_name} — {r.event_type} ({r.status})
                    </option>
                  ))}
              </select>
              <Button
                size="sm"
                variant="secondary"
                disabled={!selectedReq || isGenerating}
                onClick={() => generate({ category: "followup_request", quote_request_id: selectedReq })}
              >
                Schedule Lead Reminders
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlarmClock className="w-5 h-5" /> Alarms ({filtered.length})
          </CardTitle>
          <div className="flex gap-1">
            {(["all", "due", "upcoming", "done"] as const).map((f) => (
              <Button
                key={f}
                size="sm"
                variant={filter === f ? "default" : "ghost"}
                onClick={() => setFilter(f)}
              >
                {f}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No alarms in this view.</p>
          ) : (
            <div className="space-y-6">
              {Object.entries(grouped).map(([group, items]) => {
                const cat = items[0].category;
                const Icon = catMeta[cat].icon;
                return (
                  <div key={group}>
                    <div className={`flex items-center gap-2 mb-2 font-semibold text-sm ${catMeta[cat].color}`}>
                      <Icon className="w-4 h-4" /> {group}
                    </div>
                    <div className="space-y-2">
                      {items
                        .sort((a, b) => a.stage - b.stage)
                        .map((a) => {
                          const overdue = !a.is_done && isPast(new Date(a.due_at));
                          return (
                            <div
                              key={a.id}
                              className={`flex items-start gap-3 p-3 rounded-lg border ${
                                overdue ? "border-destructive/50 bg-destructive/5" : "border-border/40 bg-muted/20"
                              } ${a.is_done ? "opacity-60" : ""}`}
                            >
                              <Checkbox
                                checked={a.is_done}
                                onCheckedChange={(v) => toggleDone({ id: a.id, is_done: !!v })}
                                className="mt-1"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`font-semibold text-sm ${a.is_done ? "line-through" : ""}`}>
                                    Stage {a.stage}: {a.title}
                                  </span>
                                  {overdue && <Badge variant="destructive" className="text-[10px]">Overdue</Badge>}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">{a.description}</p>
                                <p className="text-[11px] text-muted-foreground/70 mt-1 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {format(new Date(a.due_at), "EEE dd MMM yyyy, HH:mm")} ·{" "}
                                  {formatDistanceToNow(new Date(a.due_at), { addSuffix: true })}
                                </p>
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => remove(a.id)}
                                className="text-destructive shrink-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
