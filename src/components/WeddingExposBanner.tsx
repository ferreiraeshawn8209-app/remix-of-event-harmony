import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, MapPin, Ticket, ExternalLink, Sparkles } from "lucide-react";
import { useWeddingExpos } from "@/hooks/useWeddingExpos";

function fmtDate(s: string | null) {
  if (!s) return "";
  try {
    return new Date(s).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
  } catch { return s; }
}

export function WeddingExposBanner({ compact = false }: { compact?: boolean }) {
  const { expos, loading } = useWeddingExpos(true);

  if (loading || expos.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold">Upcoming Wedding Expos</h3>
        <Badge variant="secondary" className="text-[10px]">Live updates</Badge>
      </div>
      <p className="text-xs text-muted-foreground">
        Come meet us in person — get planning help, tastings, ideas & exclusive show specials.
      </p>
      <div className={compact ? "flex gap-3 overflow-x-auto pb-2 snap-x" : "grid gap-3 sm:grid-cols-2 lg:grid-cols-3"}>
        {expos.map((e) => (
          <Card key={e.id} variant="glass" className={compact ? "min-w-[260px] snap-start" : ""}>
            {e.image_url && (
              <div className="h-32 w-full overflow-hidden rounded-t-lg">
                <img src={e.image_url} alt={e.name} className="w-full h-full object-cover" loading="lazy" />
              </div>
            )}
            <CardContent className="p-3 space-y-2">
              <div>
                <p className="font-semibold text-sm leading-tight">{e.name}</p>
                {e.tagline && <p className="text-[11px] text-primary/80 mt-0.5">{e.tagline}</p>}
              </div>
              {(e.start_date || e.end_date) && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <CalendarDays className="w-3 h-3" />
                  {fmtDate(e.start_date)}{e.end_date && e.end_date !== e.start_date ? ` — ${fmtDate(e.end_date)}` : ""}
                  {e.start_time ? ` · ${e.start_time}` : ""}
                </p>
              )}
              {(e.venue || e.city) && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {[e.venue, e.city, e.province].filter(Boolean).join(", ")}
                </p>
              )}
              {e.description && <p className="text-xs text-foreground/80 line-clamp-2">{e.description}</p>}
              <div className="flex gap-2 pt-1">
                {e.ticket_url && (
                  <Button asChild size="sm" variant="hero" className="h-7 text-[11px]">
                    <a href={e.ticket_url} target="_blank" rel="noopener noreferrer">
                      <Ticket className="w-3 h-3 mr-1" /> Tickets
                    </a>
                  </Button>
                )}
                {e.website_url && (
                  <Button asChild size="sm" variant="outline" className="h-7 text-[11px]">
                    <a href={e.website_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3 h-3 mr-1" /> Info
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default WeddingExposBanner;
