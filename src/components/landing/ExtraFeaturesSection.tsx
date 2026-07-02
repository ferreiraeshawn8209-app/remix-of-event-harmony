import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useExtraFeatures } from "@/hooks/useExtraFeatures";
import { DEFAULT_EXTRA_FEATURES } from "@/lib/extraFeaturesDefaults";
import { formatCurrency } from "@/lib/pricing";
import { Sparkles } from "lucide-react";

export function ExtraFeaturesSection() {
  const { activeFeatures } = useExtraFeatures();
  const features = activeFeatures.length > 0 ? activeFeatures : DEFAULT_EXTRA_FEATURES;

  return (
    <section className="container mx-auto px-4 py-14">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <h2 className="font-display text-3xl sm:text-4xl font-bold">
          <span className="gradient-text">Extra Features</span>
        </h2>
        <p className="text-sm text-muted-foreground mt-2">
          Unique add-ons that make BeatKulture events unforgettable.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map((feature) => (
          <Card key={feature.id} variant="glass" className="overflow-hidden border-primary/20">
            <div className="w-full h-44 bg-muted/30 flex items-center justify-center">
              {feature.image_url ? (
                <img src={feature.image_url} alt={feature.title} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <Sparkles className="w-8 h-8 text-primary/60" />
              )}
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{feature.title}</CardTitle>
              <CardDescription className="text-xs">{feature.description}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Badge className="bg-primary/15 text-primary border border-primary/30">
                From {formatCurrency(Number(feature.price || 0))}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
