import { Link } from "react-router-dom";
import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, CheckCircle2, Calculator, PartyPopper } from "lucide-react";
import { usePackages, DbPackage } from "@/hooks/usePackages";
import { useActiveDiscount, applyDiscount } from "@/lib/activeDiscount";
import { formatCurrency } from "@/lib/pricing";
import { motion } from "framer-motion";

export function PackagesShowcase() {
  const { packages, isLoading } = usePackages();
  const { percent, title } = useActiveDiscount();

  // Group by category — same shape as ClientPortal dashboard
  const packagesByCategory = useMemo(() => {
    const map: Record<string, DbPackage[]> = {};
    packages
      .filter((p) => p.is_active)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      .forEach((p) => {
        const k = p.category || "other";
        if (!map[k]) map[k] = [];
        map[k].push(p);
      });
    return map;
  }, [packages]);

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h2 className="font-display text-3xl sm:text-5xl font-bold mb-3">
          <span className="gradient-text">Find your fit</span>
        </h2>
        <p className="text-muted-foreground">
          Start with a fully customised quote or pick a curated package. Every booking includes professional DJs, premium sound and lighting, and a planning consultation.
        </p>
        {percent > 0 && (
          <Badge className="mt-4 bg-gradient-to-r from-primary to-accent text-primary-foreground text-sm px-3 py-1">
            🎉 {title || "Limited-time special"}: {percent}% off all packages
          </Badge>
        )}
      </div>

      {/* Customized Quote — featured */}
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-8">
        <Card variant="glow" className="border-primary/50 overflow-hidden">
          <CardContent className="p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="flex-1">
              <Badge className="mb-2">Most flexible · Start here</Badge>
              <h3 className="font-display text-2xl sm:text-3xl font-bold mb-2 flex items-center gap-2">
                <Calculator className="w-6 h-6 text-primary" /> Build a Custom Quote
              </h3>
              <p className="text-muted-foreground">
                Tell us your venue, hours, guest count and the equipment you want — our calculator builds a transparent, itemised quote in seconds.
              </p>
            </div>
            <Button variant="hero" size="lg" asChild>
              <Link to="/auth?tab=signup"><Sparkles className="w-4 h-4" /> Start my quote</Link>
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {isLoading && <p className="text-center text-sm text-muted-foreground">Loading packages…</p>}

      {/* Packages — same layout as ClientPortal dashboard */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <PartyPopper className="w-4 h-4 text-primary" /> Our Packages
        </h2>
        {Object.keys(packagesByCategory).length === 0 && !isLoading ? (
          <p className="text-xs text-muted-foreground">No packages available right now.</p>
        ) : (
          (["corporate", "wedding", "party", "other"] as const)
            .filter((cat) => packagesByCategory[cat])
            .map((cat) => (
              <div key={cat} className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                  {cat === "party" ? "Private Party" : cat.charAt(0).toUpperCase() + cat.slice(1)} Packages
                </p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {packagesByCategory[cat].map((pkg) => {
                    const discounted = applyDiscount(pkg.price, percent);
                    return (
                      <Card
                        key={pkg.id}
                        variant="glass"
                        className={pkg.popular ? "border-primary/30 overflow-hidden" : "overflow-hidden"}
                      >
                        {pkg.image_url && (
                          <div className="w-full aspect-[16/9] bg-muted/40 flex items-center justify-center">
                            <img
                              src={pkg.image_url}
                              alt={pkg.name}
                              className="w-full h-full object-contain"
                              loading="lazy"
                            />
                          </div>
                        )}
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-base">{pkg.name}</CardTitle>
                            {pkg.popular && (
                              <Badge className="bg-primary text-primary-foreground text-[10px]">Popular</Badge>
                            )}
                          </div>
                          <CardDescription className="text-xs">{pkg.description}</CardDescription>
                          {percent > 0 ? (
                            <div className="flex items-baseline gap-2 flex-wrap pt-1">
                              <span className="text-muted-foreground line-through text-xs">
                                {formatCurrency(pkg.price)}
                              </span>
                              <span className="text-primary font-bold text-sm">{formatCurrency(discounted)}</span>
                              <Badge variant="secondary" className="text-[10px]">−{percent}%</Badge>
                            </div>
                          ) : (
                            <p className="text-primary font-bold text-sm pt-1">{formatCurrency(pkg.price)}</p>
                          )}
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <ul className="text-xs text-muted-foreground space-y-1">
                            {(pkg.includes || []).slice(0, 5).map((it, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <CheckCircle2 className="w-3 h-3 text-primary mt-0.5 shrink-0" /> {it}
                              </li>
                            ))}
                          </ul>
                          <Button variant="hero" size="sm" className="w-full" asChild>
                            <Link to="/auth?tab=signup">Select &amp; Confirm</Link>
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))
        )}
      </section>
    </section>
  );
}
