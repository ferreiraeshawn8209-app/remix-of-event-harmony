import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";
import { useTestimonials } from "@/hooks/useTestimonials";
import { motion } from "framer-motion";

export function TestimonialsCarousel() {
  const { testimonials, isLoading } = useTestimonials(true);

  if (isLoading || testimonials.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h2 className="font-display text-3xl sm:text-5xl font-bold mb-3">
          <span className="gradient-text">Loved by hosts &amp; couples</span>
        </h2>
        <p className="text-muted-foreground">Real words from clients whose nights we helped soundtrack.</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {testimonials.map((t, i) => (
          <motion.div key={t.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
            <Card variant="glass" className="h-full">
              <CardContent className="p-5 flex flex-col gap-3 h-full">
                <Quote className="w-6 h-6 text-primary" />
                <p className="text-sm text-foreground/90 italic flex-1">"{t.message}"</p>
                <div className="flex items-center gap-3">
                  {t.photo_url ? (
                    <img src={t.photo_url} alt={t.client_name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                      {t.client_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{t.client_name}</div>
                    {t.event_type && <div className="text-xs text-muted-foreground">{t.event_type}</div>}
                  </div>
                  <div className="flex">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-warning text-warning" />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
