import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  WEDDING_PACKAGES, 
  CORPORATE_PACKAGES, 
  PARTY_PACKAGES, 
  Package,
  formatCurrency 
} from "@/lib/pricing";
import { Check, Heart, Building2, PartyPopper, Sparkles } from "lucide-react";

function PackageCard({ pkg, onSelect }: { pkg: Package; onSelect: (pkg: Package) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <Card 
        variant={pkg.popular ? "glow" : "glass"} 
        className={`relative h-full flex flex-col ${pkg.popular ? 'ring-2 ring-primary' : ''}`}
      >
        {pkg.popular && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge className="bg-primary text-primary-foreground px-4 py-1">
              <Sparkles className="w-3 h-3 mr-1" />
              Most Popular
            </Badge>
          </div>
        )}
        
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-xl">{pkg.name}</CardTitle>
          <CardDescription className="text-sm">{pkg.description}</CardDescription>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col">
          <div className="text-center mb-6">
            <div className="text-4xl font-bold gradient-text">
              {formatCurrency(pkg.price)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Starting from</p>
          </div>

          <ul className="space-y-3 flex-1">
            {pkg.includes.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-success mt-0.5 shrink-0" />
                <span className="text-muted-foreground">{item}</span>
              </li>
            ))}
          </ul>

          <Button 
            variant={pkg.popular ? "hero" : "default"}
            className="w-full mt-6"
            onClick={() => onSelect(pkg)}
          >
            Get Quote
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function PackagesSection() {
  const [activeTab, setActiveTab] = useState("wedding");

  const handleSelectPackage = (pkg: Package) => {
    // Scroll to quote calculator or open modal
    const quoteSection = document.getElementById('quote-calculator');
    if (quoteSection) {
      quoteSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'wedding':
        return <Heart className="w-4 h-4" />;
      case 'corporate':
        return <Building2 className="w-4 h-4" />;
      case 'party':
        return <PartyPopper className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <section className="py-20 bg-muted/30 scroll-mt-24" id="packages">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">Event Packages</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Choose from our carefully crafted packages designed for every occasion. 
            All packages can be customized to your needs.
          </p>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-6xl mx-auto">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="wedding" className="gap-2">
              {getCategoryIcon('wedding')}
              <span className="hidden sm:inline">Wedding</span>
              <span className="sm:hidden">Weddings</span>
            </TabsTrigger>
            <TabsTrigger value="corporate" className="gap-2">
              {getCategoryIcon('corporate')}
              <span className="hidden sm:inline">Corporate</span>
              <span className="sm:hidden">Corp</span>
            </TabsTrigger>
            <TabsTrigger value="party" className="gap-2">
              {getCategoryIcon('party')}
              <span className="hidden sm:inline">Private Party</span>
              <span className="sm:hidden">Party</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="wedding">
            <div className="grid md:grid-cols-3 gap-6">
              {WEDDING_PACKAGES.map((pkg) => (
                <PackageCard key={pkg.id} pkg={pkg} onSelect={handleSelectPackage} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="corporate">
            <div className="grid md:grid-cols-3 gap-6">
              {CORPORATE_PACKAGES.map((pkg) => (
                <PackageCard key={pkg.id} pkg={pkg} onSelect={handleSelectPackage} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="party">
            <div className="grid md:grid-cols-3 gap-6">
              {PARTY_PACKAGES.map((pkg) => (
                <PackageCard key={pkg.id} pkg={pkg} onSelect={handleSelectPackage} />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-muted-foreground">
            Need something custom? <span className="text-primary font-semibold">Build your own quote below</span> or contact us for a tailored package.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
