import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, ExternalLink, Sparkles, Phone, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

/**
 * RecommendedVenues
 * ────────────────────────────────────────────────────────────
 * "Need an event? Let us help you." — a curated list of event
 * venues BeatKulture has personally DJ'd at. Admin-managed.
 * Clients can filter by area and click through to venue links.
 */
type Venue = {
  id: string;
  name: string;
  area: string | null;
  city: string | null;
  province: string | null;
  event_type: string | null;
  description: string | null;
  link_url: string | null;
  image_url: string | null;
  contact_phone: string | null;
  sort_order: number;
};

export function RecommendedVenues() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [areaFilter, setAreaFilter] = useState<string>("all");

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("recommended_venues")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });
      if (!error) setVenues((data || []) as Venue[]);
      setLoading(false);
    })();
  }, []);

  const areas = Array.from(new Set(venues.map((v) => v.area).filter(Boolean) as string[])).sort();
  const filtered = areaFilter === "all" ? venues : venues.filter((v) => v.area === areaFilter);

  return (
    <section className="rounded-2xl border border-primary/30 bg-gradient-to-br from-purple-950/40 via-fuchsia-950/30 to-amber-950/30 p-4 sm:p-5 backdrop-blur-sm shadow-[0_0_30px_hsl(280_95%_60%/0.2)]">
      <header className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-display text-lg sm:text-xl font-bold flex items-center gap-2">
            <PartyPopper className="w-5 h-5 text-primary" />
            <span className="gradient-text">Need an Event? Let us help you.</span>
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Haven't found a venue yet? These are places we've personally DJ'd at and can vouch for. Filtered by your area.
          </p>
        </div>
        <Sparkles className="w-4 h-4 text-primary animate-pulse hidden sm:block" />
      </header>

      {/* Filter chips */}
      {areas.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          <FilterChip active={areaFilter === "all"} onClick={() => setAreaFilter("all")}>All areas</FilterChip>
          {areas.map((a) => (
            <FilterChip key={a} active={areaFilter === a} onClick={() => setAreaFilter(a)}>
              {a}
            </FilterChip>
          ))}
        </div>
      )}

      {loading ? (
        <p className="text-xs text-muted-foreground">Loading recommendations…</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-6 text-sm text-muted-foreground">
          {venues.length === 0 ? (
            <>
              Our team is curating recommendations right now — check back soon, or{" "}
              <span className="text-primary font-semibold">ask DJ AI</span> below for venue ideas.
            </>
          ) : (
            <>No venues in <span className="text-primary">{areaFilter}</span> yet.</>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((v, i) => (
            <motion.article
              key={v.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="group relative overflow-hidden rounded-xl border border-border/50 bg-card/60 hover:border-primary/60 hover:shadow-[0_0_20px_hsl(280_95%_60%/0.35)] transition"
            >
              {v.image_url && (
                <div className="h-28 w-full overflow-hidden">
                  <img
                    src={v.image_url}
                    alt={v.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                </div>
              )}
              <div className="p-3 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-sm leading-tight">{v.name}</h4>
                  {v.event_type && (
                    <span className="text-[10px] bg-primary/20 text-primary border border-primary/30 rounded px-1.5 py-0.5 whitespace-nowrap">
                      {v.event_type}
                    </span>
                  )}
                </div>
                {(v.area || v.city) && (
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    <span>{[v.area, v.city, v.province].filter(Boolean).join(", ")}</span>
                  </div>
                )}
                {v.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{v.description}</p>
                )}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {v.link_url && (
                    <Button asChild size="sm" variant="outline" className="h-7 text-xs px-2">
                      <a href={v.link_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-3 h-3 mr-1" /> Visit
                      </a>
                    </Button>
                  )}
                  {v.contact_phone && (
                    <Button asChild size="sm" variant="ghost" className="h-7 text-xs px-2">
                      <a href={`tel:${v.contact_phone}`}>
                        <Phone className="w-3 h-3 mr-1" /> Call
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      )}
    </section>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`text-[11px] px-2.5 py-1 rounded-full border transition ${
        active
          ? "bg-primary text-primary-foreground border-primary shadow-[0_0_12px_hsl(280_95%_60%/0.5)]"
          : "bg-transparent border-border/60 text-muted-foreground hover:border-primary/50 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

export default RecommendedVenues;
