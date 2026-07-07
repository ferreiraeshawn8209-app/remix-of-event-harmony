import { useSpecials } from "@/hooks/useSpecials";
import { Badge } from "@/components/ui/badge";

export function SpecialsBanner() {
  const { activeSpecials } = useSpecials();
  if (!activeSpecials.length) return null;

  return (
    <section className="container mx-auto px-4 py-8">
      <div className="grid sm:grid-cols-2 gap-4">
        {activeSpecials.slice(0, 4).map((s: any) => (
          <div key={s.id} className="relative rounded-2xl overflow-hidden border border-primary/30 group">
            <img src={s.image_url} alt={s.title || "Special"} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between gap-3">
              <h3 className="font-display text-lg font-bold text-foreground">{s.title || "Limited-time offer"}</h3>
              {s.discount_percent ? (
                <Badge className="bg-gradient-to-r from-primary to-accent text-primary-foreground">−{s.discount_percent}%</Badge>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
