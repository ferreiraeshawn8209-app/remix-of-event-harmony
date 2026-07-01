import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useExtraFeatures } from "@/hooks/useExtraFeatures";
import { DEFAULT_EXTRA_FEATURES } from "@/lib/extraFeaturesDefaults";
import { formatCurrency } from "@/lib/pricing";
import { Sparkles } from "lucide-react";

export function ExtraFeaturesScroller() {
  const { activeFeatures } = useExtraFeatures();
  const features = activeFeatures.length > 0 ? activeFeatures : DEFAULT_EXTRA_FEATURES;
  const scrollerItems = [...features, ...features];

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" /> Extra Features
      </h2>
      <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-background/40">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent z-10" />
        <div className="flex gap-3 py-3 px-2 w-max animate-feature-scroll">
          {scrollerItems.map((feature, index) => (
            <Card key={`${feature.id}-${index}`} variant="glass" className="w-[290px] shrink-0 overflow-hidden border-primary/25">
              <div className="flex h-full">
                <div className="w-24 h-24 bg-muted/30 shrink-0">
                  {feature.image_url ? (
                    <img src={feature.image_url} alt={feature.title} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-primary/70" />
                    </div>
                  )}
                </div>
                <div className="p-2.5 flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{feature.title}</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{feature.description}</p>
                  <Badge variant="outline" className="mt-2 text-[10px] border-primary/40 text-primary">
                    From {formatCurrency(Number(feature.price || 0))}
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
