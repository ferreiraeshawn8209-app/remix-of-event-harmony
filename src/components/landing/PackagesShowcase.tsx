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
const CATEGORY_TITLES: Record<string, string> = {
  wedding: "Wedding Packages",
  corporate: "Corporate Packages",
  party: "Party Packages",
};
const FALLBACK_PACKAGES = [
  {
    id: "fallback-wedding-premium",
    name: "Premium Wedding",
    category: "wedding",
    description: "Enhanced sound, intelligent lighting, and dedicated coordination for your big day.",
    price: 15000,
    includes: ["8 hours DJ service", "Premium sound system", "Moving head lights & uplighting", "MC services"],
    popular: true,
    is_active: true,
    sort_order: 2,
    image_url: null,
  },
  {
    id: "fallback-corporate-full",
    name: "Corporate Full",
    category: "corporate",
    description: "Complete corporate entertainment and presentation support for polished events.",
    price: 12000,
    includes: ["6 hours service", "Enhanced sound system", "Elegant lighting setup", "Presentation audio support"],
    popular: true,
    is_active: true,
    sort_order: 2,
    image_url: null,
  },
  {
    id: "fallback-party-premium",
    name: "Party Premium",
    category: "party",
    description: "Club-style sound and effects to level up birthdays and private celebrations.",
    price: 8000,
    includes: ["6 hours DJ service", "Enhanced sound system", "Moving head lights", "Smoke & bubble machines"],
    popular: true,
    is_active: true,
    sort_order: 2,
    image_url: null,
  },
];

const categoryHeading = (category: string) =>
  CATEGORY_TITLES[category] || `${category.charAt(0).toUpperCase() + category.slice(1)} Packages`;

export function PackagesShowcase() {
  const { packages, isLoading } = usePackages();
  const { percent, title } = useActiveDiscount();

  const active = packages.filter((p) => p.is_active).sort(
    (a, b) => (CATEGORY_ORDER[a.category] || 9) - (CATEGORY_ORDER[b.category] || 9) || a.sort_order - b.sort_order,
  );
  const visiblePackages = active.length > 0 ? active : FALLBACK_PACKAGES;

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
                Tell us your venue, hours, guest count and the equipment you want — our calculator builds a transparent, itemised quote in seconds. Add a kids corner, Human Jukebox, travel, or outsourced catering as extras. Admin discounts can apply.
              </p>
            </div>
            <Button variant="hero" size="lg" asChild>
              <Link to="/auth?tab=signup"><Sparkles className="w-4 h-4" /> Start my quote</Link>
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {isLoading && <p className="text-center text-sm text-muted-foreground">Loading packages…</p>}

      {/* Grouped by category in the requested order */}
      {Array.from(new Set(visiblePackages.map((p) => p.category)))
        .sort(
          (a, b) =>
            (CATEGORY_ORDER[a] || 9) - (CATEGORY_ORDER[b] || 9) ||
            a.localeCompare(b),
        )
        .map((cat) => {
        const list = visiblePackages.filter((p) => p.category === cat);
        if (!list.length) return null;
        return (
          <div key={cat} className="mb-12">
            <h3 className="font-display text-xl sm:text-2xl font-bold mb-4">{categoryHeading(cat)}</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {list.map((p) => {
                const discounted = applyDiscount(p.price, percent);
                return (
                  <motion.div key={p.id} whileHover={{ y: -4 }} className="h-full">
                    <Card variant={p.popular ? "glow" : "glass"} className="h-full flex flex-col">
                      <CardContent className="p-5 flex flex-col flex-1">
                        {p.image_url && (
                          <div className="-mx-5 -mt-5 mb-4 overflow-hidden rounded-t-lg bg-muted/40">
                            <img src={p.image_url} alt={p.name} className="w-full h-64 object-cover" loading="lazy" />
                          </div>
                        )}
                        {p.popular && <Badge className="self-start mb-2">Most popular</Badge>}
                        <h4 className="font-display text-lg font-bold">{p.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1 mb-3">{p.description}</p>
                        <div className="mb-3">
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
                        <ul className="space-y-1.5 text-sm flex-1">
                          {p.includes.slice(0, 6).map((inc, i) => (
                            <li key={i} className="flex gap-2 text-muted-foreground">
                              <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
                              <span>{inc}</span>
                            </li>
                          ))}
                        </ul>
                        <Button variant="glass" className="mt-4" asChild>
                          <Link
                            to={`/auth?package=${encodeURIComponent(p.id)}&redirect=${encodeURIComponent(`/client?package=${p.id}`)}`}
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
