import { motion } from "framer-motion";
import {
  Sparkles, CalendarHeart, Clock, Music2, Film, CheckSquare, ChevronRight,
} from "lucide-react";

/**
 * Premium feature tiles for the Client Portal.
 * Each tile has a unique visual identity + hover glow + tasteful motion.
 * Clicking dispatches a scroll to the corresponding section id / opens PlannerHub tab.
 */
interface FeatureShowcaseProps {
  onOpen?: (id: FeatureId) => void;
}

export type FeatureId =
  | "ai-assistant" | "my-event" | "timeline" | "music" | "rehearsal" | "approval";

type Tile = {
  id: FeatureId;
  title: string;
  subtitle: string;
  Icon: any;
  gradient: string;
  glow: string;
  preview: React.ReactNode;
};

const tiles: Tile[] = [
  {
    id: "ai-assistant",
    title: "AI Assistant",
    subtitle: "Kulture — your concierge",
    Icon: Sparkles,
    gradient: "from-neon-purple/40 via-neon-purple-deep/30 to-transparent",
    glow: "shadow-[0_0_50px_hsl(275_90%_62%/0.35)]",
    preview: (
      <div className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-neon-purple animate-pulse" />
        <span className="h-1.5 w-1.5 rounded-full bg-neon-purple animate-pulse [animation-delay:.2s]" />
        <span className="h-1.5 w-1.5 rounded-full bg-neon-purple animate-pulse [animation-delay:.4s]" />
        <span className="ml-2 text-[10px] uppercase tracking-widest text-neon-purple/80">Listening</span>
      </div>
    ),
  },
  {
    id: "my-event",
    title: "My Event",
    subtitle: "All the details, one canvas",
    Icon: CalendarHeart,
    gradient: "from-neon-orange/35 via-neon-orange-warm/25 to-transparent",
    glow: "shadow-[0_0_50px_hsl(22_100%_58%/0.3)]",
    preview: (
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-neon-orange/90">
        <span className="h-1 w-8 rounded-full bg-gradient-to-r from-neon-orange to-gold" />
        <span>Live</span>
      </div>
    ),
  },
  {
    id: "timeline",
    title: "Timeline",
    subtitle: "Every moment orchestrated",
    Icon: Clock,
    gradient: "from-gold/35 via-gold-soft/25 to-transparent",
    glow: "shadow-[0_0_50px_hsl(42_78%_58%/0.35)]",
    preview: (
      <div className="flex items-center gap-1">
        {[0,1,2,3,4].map((i) => (
          <span key={i} className={`h-1 w-1 rounded-full ${i < 3 ? "bg-gold" : "bg-muted-foreground/40"}`} />
        ))}
        <span className="ml-2 text-[10px] uppercase tracking-widest text-gold/80">3/5 set</span>
      </div>
    ),
  },
  {
    id: "music",
    title: "Music Player",
    subtitle: "Curated mixes, live",
    Icon: Music2,
    gradient: "from-neon-purple/35 via-neon-orange/20 to-transparent",
    glow: "shadow-[0_0_50px_hsl(275_90%_62%/0.35)]",
    preview: (
      <div className="flex items-end gap-1 h-4">
        <span className="w-1 rounded-sm bg-neon-purple animate-eq-1 origin-bottom h-full" />
        <span className="w-1 rounded-sm bg-neon-orange animate-eq-2 origin-bottom h-full" />
        <span className="w-1 rounded-sm bg-gold animate-eq-3 origin-bottom h-full" />
        <span className="w-1 rounded-sm bg-neon-purple animate-eq-4 origin-bottom h-full" />
        <span className="w-1 rounded-sm bg-neon-orange animate-eq-2 origin-bottom h-full" />
      </div>
    ),
  },
  {
    id: "rehearsal",
    title: "Virtual Rehearsal",
    subtitle: "Preview the big night",
    Icon: Film,
    gradient: "from-neon-orange-warm/35 via-neon-purple/25 to-transparent",
    glow: "shadow-[0_0_50px_hsl(14_95%_60%/0.3)]",
    preview: (
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-neon-orange-warm/90">
        <span className="h-2 w-2 rounded-full bg-neon-orange animate-pulse" />
        <span>Ready to play</span>
      </div>
    ),
  },
  {
    id: "approval",
    title: "Client Approval",
    subtitle: "Sign off & confirm",
    Icon: CheckSquare,
    gradient: "from-gold/35 via-neon-purple/20 to-transparent",
    glow: "shadow-[0_0_50px_hsl(42_78%_58%/0.35)]",
    preview: (
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-gold/90">
        <span className="h-1.5 w-6 rounded-full bg-gradient-to-r from-gold to-neon-purple" />
        <span>2 steps</span>
      </div>
    ),
  },
];

export function FeatureShowcase({ onOpen }: FeatureShowcaseProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Your <span className="gold-text">command deck</span>
        </h2>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground/70">Tap to open</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {tiles.map((t, i) => (
          <motion.button
            key={t.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onOpen?.(t.id)}
            className={`group relative overflow-hidden rounded-2xl text-left glass-premium hover-glow ${t.glow}`}
          >
            {/* gradient wash */}
            <div className={`absolute inset-0 bg-gradient-to-br ${t.gradient} opacity-90 pointer-events-none`} />
            {/* corner shimmer */}
            <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-white/5 blur-2xl group-hover:bg-white/10 transition-colors" />

            <div className="relative p-4 sm:p-5 space-y-4 min-h-[142px] sm:min-h-[160px] flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="relative">
                  <div className="absolute inset-0 rounded-xl blur-lg opacity-70"
                       style={{ background: "radial-gradient(circle,hsl(42 78% 58% / 0.5),transparent 70%)" }} />
                  <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-gold/30 bg-background/40 backdrop-blur">
                    <t.Icon className="h-5 w-5 text-gold" />
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/60 group-hover:text-gold group-hover:translate-x-0.5 transition-all" />
              </div>

              <div className="space-y-1.5">
                <h3 className="font-display font-semibold text-sm sm:text-base text-foreground leading-tight">
                  {t.title}
                </h3>
                <p className="text-[11px] sm:text-xs text-muted-foreground line-clamp-2">{t.subtitle}</p>
                <div className="pt-1">{t.preview}</div>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  );
}
