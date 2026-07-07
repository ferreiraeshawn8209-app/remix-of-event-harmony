import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, MapPin } from "lucide-react";

export function UpcomingEventsTicker() {
  const { data = [] } = useQuery({
    queryKey: ["public_upcoming_events"],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("events")
        .select("id,name,event_date,venue")
        .eq("is_active", true)
        .gte("event_date", today)
        .order("event_date", { ascending: true })
        .limit(20);
      if (error) return [] as any[];
      return data || [];
    },
  });

  if (!data.length) return null;

  const items = [...data, ...data]; // duplicate for seamless marquee

  return (
    <div className="relative overflow-hidden border-y border-primary/20 bg-card/30 backdrop-blur-sm">
      <div className="flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-wider text-primary font-semibold">
        <Calendar className="w-3.5 h-3.5" /> Upcoming BeatKulture Events
      </div>
      <div className="relative">
        <div className="flex gap-8 whitespace-nowrap animate-[marquee_40s_linear_infinite] py-2 px-4">
          {items.map((e: any, i) => (
            <div key={`${e.id}-${i}`} className="flex items-center gap-2 text-sm">
              <span className="text-primary font-semibold">
                {new Date(e.event_date).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}
              </span>
              <span className="text-foreground">{e.name}</span>
              {e.venue && (
                <span className="text-muted-foreground inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {e.venue}
                </span>
              )}
              <span className="text-border">•</span>
            </div>
          ))}
        </div>
      </div>
      <style>{`@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
    </div>
  );
}
