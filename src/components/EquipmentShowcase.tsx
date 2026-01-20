import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { EQUIPMENT_CATALOG, EquipmentItem, formatCurrency } from "@/lib/pricing";
import { Volume2, Lightbulb, Mic2, Sparkles, X } from "lucide-react";

const categoryIcons: Record<string, React.ReactNode> = {
  'Speakers': <Volume2 className="w-5 h-5" />,
  'Mixers/Amplifiers': <Volume2 className="w-5 h-5" />,
  'Lighting': <Lightbulb className="w-5 h-5" />,
  'Microphones': <Mic2 className="w-5 h-5" />,
  'Effects': <Sparkles className="w-5 h-5" />,
};

const categoryColors: Record<string, string> = {
  'Speakers': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Mixers/Amplifiers': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'Lighting': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'Microphones': 'bg-green-500/20 text-green-400 border-green-500/30',
  'Effects': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
};

function EquipmentCard({ item, onClick }: { item: EquipmentItem; onClick: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        variant="glass" 
        className="overflow-hidden cursor-pointer group h-full"
        onClick={onClick}
      >
        <div className="aspect-[4/3] relative overflow-hidden">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
          <Badge 
            className={`absolute top-3 left-3 ${categoryColors[item.category]} border`}
          >
            {categoryIcons[item.category]}
            <span className="ml-1">{item.category}</span>
          </Badge>
          <div className="absolute bottom-3 right-3">
            <span className="text-lg font-bold text-primary">{formatCurrency(item.price)}</span>
          </div>
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">
            {item.name}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {item.description}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function EquipmentShowcase() {
  const [selectedItem, setSelectedItem] = useState<EquipmentItem | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const categories = ['all', ...Array.from(new Set(EQUIPMENT_CATALOG.map(item => item.category)))];
  
  const filteredItems = filter === 'all' 
    ? EQUIPMENT_CATALOG 
    : EQUIPMENT_CATALOG.filter(item => item.category === filter);

  return (
    <section className="py-20 bg-background" id="equipment">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">Professional Equipment</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Top-quality audio, lighting, and effects equipment to make your event unforgettable.
            Click any item for full details.
          </p>
        </motion.div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {categories.map((category) => (
            <Button
              key={category}
              variant={filter === category ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(category)}
              className="capitalize"
            >
              {category === 'all' ? 'All Equipment' : category}
            </Button>
          ))}
        </div>

        {/* Equipment Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <AnimatePresence>
            {filteredItems.map((item) => (
              <EquipmentCard
                key={item.id}
                item={item}
                onClick={() => setSelectedItem(item)}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Detail Modal */}
        <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
          <DialogContent className="sm:max-w-lg">
            {selectedItem && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {categoryIcons[selectedItem.category]}
                    {selectedItem.name}
                  </DialogTitle>
                  <DialogDescription>
                    <Badge className={`${categoryColors[selectedItem.category]} border mt-2`}>
                      {selectedItem.category}
                    </Badge>
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="aspect-video relative rounded-lg overflow-hidden">
                    <img
                      src={selectedItem.image}
                      alt={selectedItem.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Description</h4>
                    <p className="text-muted-foreground">{selectedItem.description}</p>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10 border border-primary/30">
                    <span className="font-medium">Rental Price</span>
                    <span className="text-2xl font-bold text-primary">
                      {formatCurrency(selectedItem.price)}
                    </span>
                  </div>
                  <Button 
                    variant="hero" 
                    className="w-full"
                    onClick={() => {
                      setSelectedItem(null);
                      document.getElementById('quote-calculator')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    Add to Quote
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
