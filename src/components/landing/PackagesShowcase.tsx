import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Check, Calculator } from "lucide-react";
import { usePackages } from "@/hooks/usePackages";
import { useActiveDiscount, applyDiscount } from "@/lib/activeDiscount";
import { formatCurrency } from "@/lib/pricing";
import { motion } from "framer-motion";

const CATEGORY_ORDER: Record<string, number> = { wedding: 1, corporate: 2, party: 3 };
const SELECTED_PACKAGE_STORAGE_KEY = "bk:selected-package-id";
const CATEGORY_TITLE_MAP: Record<string, string> = {
  wedding: "Wedding Packages",
  party: "Party Packages",
  corporate: "Corporate Packages",
};

function getCategoryTitle(category: string) {
  if (CATEGORY_TITLE_MAP[category]) return CATEGORY_TITLE_MAP[category];
  return `${category.charAt(0).toUpperCase()}${category.slice(1)} Packages`;
}

function groupPackageIncludes(includes: string[]) {
  const buckets: Record<"services" | "equipment" | "extras", string[]> = {
    services: [],
    equipment: [],
    extras: [],
  };
  const equipmentPattern = /(sound|speaker|sub|woofer|monitor|mic|microphone|light|lighting|laser|fog|smoke|truss|booth|deck|controller|mixer|projector|screen)/i;
  const extrasPattern = /(extra|bonus|upgrade|add-on|addon|travel|overtime|kids|human jukebox|spark|cold|confetti|mc|host|special)/i;

  includes.forEach((item) => {
    if (equipmentPattern.test(item)) {
      buckets.equipment.push(item);
      return;
    }
    if (extrasPattern.test(item)) {
      buckets.extras.push(item);
      return;
    }
    buckets.services.push(item);
  });

  if (buckets.services.length === 0 && buckets.equipment.length > 0) {
    buckets.services.push(...buckets.equipment.splice(0, Math.min(2, buckets.equipment.length)));
  }

  return buckets;
}

export function PackagesShowcase() {
  const { packages, isLoading } = usePackages();
  const { percent, title } = useActiveDiscount();

  const active = packages.filter((p) => p.is_active).sort(
    (a, b) => (CATEGORY_ORDER[a.category] || 9) - (CATEGORY_ORDER[b.category] || 9) || a.sort_order - b.sort_order,
  );
  const categoriesInOrder = Array.from(new Set(active.map((pkg) => pkg.category))).sort(
    (a, b) => (CATEGORY_ORDER[a] || 9) - (CATEGORY_ORDER[b] || 9) || a.localeCompare(b),
  );

  return (
    <section className="container mx-auto px-4 py-16 premium-page">
      <div className="text-center max-w-3xl mx-auto mb-10">
        <h2 className="premium-section-title text-3xl sm:text-5xl font-bold mb-3">
          <span className="gradient-text">Choose your premium event package</span>
        </h2>
        <p className="text-muted-foreground text-base sm:text-lg">
          Packages are the hero of your planning journey. Every option shows full price, description, services, equipment, and extras so clients know exactly what they get before signing up.
        </p>
        {percent > 0 && (
          <Badge className="mt-4 bg-gradient-to-r from-primary via-secondary to-accent text-primary-foreground text-sm px-3 py-1 shadow-[0_0_28px_hsl(var(--primary)/0.35)]">
            🎉 {title || "Limited-time special"}: {percent}% off all packages
          </Badge>
        )}
      </div>

      {/* Customized Quote — featured */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <Card variant="glow" className="relative overflow-hidden border-primary/50 bg-gradient-to-br from-primary/10 via-background to-accent/10 shadow-[0_0_45px_rgba(255,215,0,0.14)]">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-primary/20 blur-3xl animate-pulse" />
            <div className="absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-accent/20 blur-3xl animate-pulse [animation-delay:1.2s]" />
          </div>
          <CardContent className="relative p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="flex-1">
              <Badge className="mb-3 bg-primary/15 text-primary border-primary/30 shadow-sm shadow-primary/20">
                Most flexible · Start here
              </Badge>
              <h3 className="premium-section-title text-2xl sm:text-4xl font-bold mb-3 flex items-center gap-3">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-lg shadow-primary/20 ring-1 ring-primary/25">
                  <Calculator className="w-6 h-6" />
                </span>
                <span className="bg-gradient-to-r from-primary via-foreground to-accent bg-clip-text text-transparent">
                  Build a Custom Quote
                </span>
              </h3>
              <p className="text-muted-foreground max-w-2xl text-sm sm:text-base">
                Tell us your venue, hours, guest count and the equipment you want — our calculator builds a transparent, itemised quote in seconds. Add a kids corner, Human Jukebox, travel, or outsourced catering as extras. Admin discounts can apply.
              </p>
            </div>
            <Button variant="hero" size="lg" asChild className="relative overflow-hidden shadow-lg shadow-primary/25">
              <Link to="/auth?tab=signup" className="gap-2">
                <Sparkles className="w-4 h-4" />
                Start my quote
              </Link>
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {isLoading && <p className="text-center text-sm text-muted-foreground">Loading packages…</p>}

      {/* Grouped by category in the requested order */}
      {categoriesInOrder.map((cat) => {
        const list = active.filter((p) => p.category === cat);
        if (!list.length) return null;
        return (
          <div key={cat} className="mb-12">
            <h3 className="premium-section-title text-xl sm:text-2xl font-bold mb-4">{getCategoryTitle(cat)}</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {list.map((p) => {
                const discounted = applyDiscount(p.price, percent);
                const grouped = groupPackageIncludes(p.includes);
                return (
                  <motion.div key={p.id} whileHover={{ y: -4 }} className="h-full">
                    <Card variant={p.popular ? "glow" : "glass"} className="h-full flex flex-col border-primary/25">
                      <CardContent className="p-5 flex flex-col flex-1">
                        {p.popular && <Badge className="self-start mb-2">Most popular</Badge>}
                        <h4 className="premium-section-title text-lg font-bold">{p.name}</h4>
                        <div className="mt-1 mb-3 rounded-lg border border-primary/20 bg-background/35 p-3">
                          <p className="text-[11px] uppercase tracking-wide text-primary/85 mb-1">Description</p>
                          <p className="text-sm text-muted-foreground">{p.description}</p>
                        </div>
                        <div className="mb-3 rounded-lg border border-accent/20 bg-background/35 p-3">
                          <p className="text-[11px] uppercase tracking-wide text-accent mb-1">Price</p>
                          {percent > 0 ? (
                            <div className="flex items-baseline gap-2 flex-wrap">
                              <span className="text-muted-foreground line-through text-sm">{formatCurrency(p.price)}</span>
                              <span className="font-display text-2xl font-bold text-primary">{formatCurrency(discounted)}</span>
                              <Badge variant="secondary" className="text-[10px]">−{percent}%</Badge>
                            </div>
                          ) : (
                            <span className="font-display text-2xl font-bold text-primary">{formatCurrency(p.price)}</span>
                          )}
                        </div>
                        <div className="space-y-2 flex-1">
                          {(["services", "equipment", "extras"] as const).map((groupKey) => (
                          <div key={groupKey} className="rounded-lg border border-border/60 bg-background/28 p-2.5">
                            <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5">
                              {groupKey}
                            </p>
                            {(grouped[groupKey].length > 0 ? grouped[groupKey] : ["Included in package details"]).map((item, index) => (
                              <p key={`${groupKey}-${index}`} className="flex gap-2 text-xs text-muted-foreground mb-1 last:mb-0">
                                <Check className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                                <span>{item}</span>
                              </p>
                            ))}
                          </div>
                          ))}
                        </div>
                        <Button variant="glass" className="mt-4" asChild>
                          <Link
                            to={`/auth?tab=signup&packageId=${encodeURIComponent(p.id)}`}
                            onClick={() => localStorage.setItem(SELECTED_PACKAGE_STORAGE_KEY, p.id)}
                          >
                            Book this package
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        );
      })}
    </section>
  );
}
