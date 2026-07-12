import { useState } from "react";
import { useLocation } from "react-router-dom";
import { CalendarDays, X, MapPin, Ticket, ExternalLink } from "lucide-react";
import { useWeddingExpos } from "@/hooks/useWeddingExpos";
import { Button } from "@/components/ui/button";

const HIDDEN_PREFIXES = ["/admin", "/dj-queue", "/event-day"];

function fmtDate(s: string | null) {
  if (!s) return "";
  try { return new Date(s).toLocaleDateString("en-ZA", { day: "numeric", month: "short" }); }
  catch { return s; }
}

export function WeddingExpoTicker() {
  const { expos } = useWeddingExpos(true);
  const { pathname } = useLocation();
  const [dismissed, setDismissed] = useState(false);
  const [open, setOpen] = useState(false);

  if (dismissed || expos.length === 0) return null;
  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  const next = expos[0];

  return (
    <div className="fixed left-2 right-2 sm:left-auto sm:right-4 bottom-20 sm:bottom-24 z-40 max-w-sm sm:w-80 mx-auto sm:mx-0">
      <div className="rounded-xl border border-primary/40 bg-background/90 backdrop-blur-md shadow-xl overflow-hidden">
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-primary/10 transition"
        >
          <div className="p-1.5 rounded-md bg-primary/20 text-primary shrink-0">
            <CalendarDays className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-primary/80">Meet us at</p>
            <p className="text-xs font-semibold truncate">{next.name}</p>
          </div>
          <span className="text-[10px] text-muted-foreground shrink-0">
            {fmtDate(next.start_date)}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); setDismissed(true); }}
            className="p-1 text-muted-foreground hover:text-foreground shrink-0"
            aria-label="Dismiss"
          >
            <X className="w-3 h-3" />
          </button>
        </button>

        {open && (
          <div className="px-3 pb-3 pt-1 space-y-2 border-t border-border/40">
            {expos.slice(0, 3).map((e) => (
              <div key={e.id} className="text-xs space-y-1 pb-2 border-b border-border/30 last:border-0 last:pb-0">
                <p className="font-semibold">{e.name}</p>
                {(e.start_date || e.venue || e.city) && (
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1 flex-wrap">
                    {e.start_date && <><CalendarDays className="w-3 h-3" />{fmtDate(e.start_date)}{e.end_date && e.end_date !== e.start_date ? `–${fmtDate(e.end_date)}` : ""}</>}
                    {(e.venue || e.city) && <><MapPin className="w-3 h-3 ml-1" />{[e.venue, e.city].filter(Boolean).join(", ")}</>}
                  </p>
                )}
                <div className="flex gap-1 pt-0.5">
                  {e.ticket_url && (
                    <Button asChild size="sm" variant="hero" className="h-6 text-[10px] px-2">
                      <a href={e.ticket_url} target="_blank" rel="noopener noreferrer"><Ticket className="w-3 h-3 mr-1" />Tickets</a>
                    </Button>
                  )}
                  {e.website_url && (
                    <Button asChild size="sm" variant="outline" className="h-6 text-[10px] px-2">
                      <a href={e.website_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-3 h-3 mr-1" />Info</a>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default WeddingExpoTicker;
