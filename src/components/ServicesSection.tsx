import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Music, 
  Lightbulb, 
  Mic, 
  Sparkles, 
  PartyPopper, 
  Heart,
  Users,
  Clock
} from "lucide-react";

const services = [
  {
    icon: Music,
    title: "Professional DJs",
    description: "26+ years experience with the latest hits and timeless classics",
    gradient: "from-primary to-primary/50",
  },
  {
    icon: Lightbulb,
    title: "Stunning Lighting",
    description: "RGB lasers, moving heads, strobes, and mood lighting",
    gradient: "from-secondary to-secondary/50",
  },
  {
    icon: Mic,
    title: "MC Services",
    description: "Professional hosting and event coordination",
    gradient: "from-accent to-accent/50",
  },
  {
    icon: Sparkles,
    title: "Special Effects",
    description: "Smoke machines, low fog, and bubble blasters",
    gradient: "from-primary to-accent",
  },
  {
    icon: PartyPopper,
    title: "Event Planning",
    description: "Full timeline coordination and song planning",
    gradient: "from-secondary to-primary",
  },
  {
    icon: Heart,
    title: "Weddings",
    description: "Specialized packages for your perfect day",
    gradient: "from-accent to-secondary",
  },
  {
    icon: Users,
    title: "Kiddies Corner",
    description: "Dedicated entertainment for the little ones",
    gradient: "from-primary to-secondary",
  },
  {
    icon: Clock,
    title: "Flexible Hours",
    description: "From sunset to sunrise, we've got you covered",
    gradient: "from-accent to-primary",
  },
];

export function ServicesSection() {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Our <span className="gradient-text">Services</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Everything you need to make your event unforgettable
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {services.map((service, i) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card variant="glass" className="h-full hover:border-primary/50 transition-all duration-300 group hover-glow">
                <CardContent className="pt-6">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${service.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <service.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-display font-semibold text-lg mb-2">{service.title}</h3>
                  <p className="text-sm text-muted-foreground">{service.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
