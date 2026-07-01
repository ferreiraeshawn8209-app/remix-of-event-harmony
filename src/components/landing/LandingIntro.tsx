import { motion } from "framer-motion";
import { Sparkles, Music, PartyPopper, Calendar, MessageSquare, QrCode, Trophy, ClipboardList } from "lucide-react";
import { Card } from "@/components/ui/card";

const FEATURES = [
  { icon: MessageSquare, title: "AI Coordinator", desc: "Chat with Kulture 24/7 for planning, pricing and song ideas." },
  { icon: Calendar, title: "Instant Quotes", desc: "Book packages or build a fully custom quote in minutes." },
  { icon: ClipboardList, title: "Event Planner", desc: "Timeline, floor plan, budget, checklists — all in one place." },
  { icon: QrCode, title: "QR Song Requests", desc: "Guests scan and request songs live on the night." },
  { icon: Music, title: "Live Music Radio", desc: "Enjoy BeatKulture mixes while you plan your event." },
  { icon: Trophy, title: "Competitions", desc: "Win free DJ hours and special add-ons." },
];

export function LandingIntro() {
  return (
    <section className="container mx-auto px-4 py-12 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-3xl mx-auto text-center space-y-4 mb-10"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-xs">
          <Sparkles className="w-3 h-3 text-primary" /> Welcome to BeatKulture Entertainment
        </div>
        <h2 className="font-display text-3xl sm:text-4xl font-bold">
          South Africa's <span className="gradient-text">most connected</span> DJ + Events crew
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
          From intimate ceremonies to full-scale corporate showcases, we bring the sound system,
          the lights, the effects — and the AI-powered planning tools to make every detail sing.
          Weddings, corporate, birthdays, matric farewells, private parties, kids' entertainment —
          if it needs a beat, we've got you covered.
        </p>
        <p className="text-xs text-muted-foreground">
          Sign up (it's free) to unlock live quotes, the event planner, QR song requests and more.
        </p>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-5xl mx-auto">
        {FEATURES.map((f) => (
          <Card key={f.title} variant="glass" className="p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
              <f.icon className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">{f.title}</p>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
