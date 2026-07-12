import { motion } from "framer-motion";
import {
  Flower2, Cake, Camera, MapPin, Mail, Car, Mic2, Sparkles,
  PartyPopper, Gift, Utensils, Palette, ArrowRight, HeartHandshake,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Service {
  key: string;
  label: string;
  tagline: string;
  Icon: React.ComponentType<{ className?: string }>;
  grad: string;
  prompt: string;
}

const SERVICES: Service[] = [
  {
    key: "decor",
    label: "Decor & Styling",
    tagline: "Backdrops, drapes, table styling, themes",
    Icon: Palette,
    grad: "from-fuchsia-500 via-pink-500 to-rose-500",
    prompt: "Help me plan the decor & styling for my event. Give me 3 theme options with colour palettes, table styling ideas, and quote a decor budget. Then find local decor vendors I can contact.",
  },
  {
    key: "cake",
    label: "Wedding & Event Cakes",
    tagline: "Custom tiered cakes, cupcakes, dessert tables",
    Icon: Cake,
    grad: "from-rose-400 via-pink-400 to-fuchsia-500",
    prompt: "I need a cake for my event. Ask me about flavour, servings, style and dietary needs, then recommend cake designs and connect me with local cake artists.",
  },
  {
    key: "florals",
    label: "Florals & Bouquets",
    tagline: "Bouquets, centrepieces, ceremony arches",
    Icon: Flower2,
    grad: "from-emerald-400 via-teal-400 to-cyan-500",
    prompt: "Design a florals plan for my event — bouquets, centrepieces, ceremony flowers. Suggest in-season blooms, palette matches and connect me with florists.",
  },
  {
    key: "catering",
    label: "Catering & Bar",
    tagline: "Menus, buffets, canapés, bar service",
    Icon: Utensils,
    grad: "from-amber-400 via-orange-500 to-red-500",
    prompt: "Plan the catering & bar for my event. Recommend menu styles for my guest count, drinks packages and quote per-head budgets. Then suggest caterers to contact.",
  },
  {
    key: "photo",
    label: "Photo & Video",
    tagline: "Photographers, videographers, drone",
    Icon: Camera,
    grad: "from-indigo-500 via-purple-500 to-fuchsia-500",
    prompt: "Recommend photography & videography coverage for my event, including shot lists and drone options, and connect me with photographers/videographers.",
  },
  {
    key: "venue",
    label: "Venue Coordination",
    tagline: "Site visits, logistics, floor plans",
    Icon: MapPin,
    grad: "from-cyan-400 via-sky-500 to-blue-600",
    prompt: "Coordinate with my venue: build a run-sheet, confirm load-in/out times, power/parking, and generate a floor plan with DJ booth, dance floor, seating and bar.",
  },
  {
    key: "invitations",
    label: "Invitations & RSVPs",
    tagline: "Design, print, digital invites, RSVP tracking",
    Icon: Mail,
    grad: "from-violet-500 via-purple-500 to-pink-500",
    prompt: "Design digital & print invitations for my event and set up an RSVP tracker. Suggest wording and match the visuals to my theme.",
  },
  {
    key: "transport",
    label: "Transport & Guest Logistics",
    tagline: "Shuttles, luxury cars, accommodation lists",
    Icon: Car,
    grad: "from-slate-500 via-zinc-500 to-neutral-600",
    prompt: "Plan transport & guest logistics — shuttles, luxury cars, group accommodation blocks, arrival timings — and find providers I can contact.",
  },
  {
    key: "mc",
    label: "MC, Officiant & Speakers",
    tagline: "Wedding MC, celebrant, speech coaching",
    Icon: Mic2,
    grad: "from-yellow-400 via-amber-500 to-orange-600",
    prompt: "I need an MC/officiant. Draft ceremony wording, speech guidance and connect me with professional MCs and celebrants.",
  },
  {
    key: "entertainment",
    label: "Extra Entertainment",
    tagline: "Dancers, live acts, kids entertainers",
    Icon: PartyPopper,
    grad: "from-red-500 via-rose-500 to-pink-600",
    prompt: "Recommend extra entertainment for my event — live band, dancers, kids' entertainer, human jukebox, saxophonist — with pricing.",
  },
  {
    key: "gifts",
    label: "Favours & Gifts",
    tagline: "Guest favours, hampers, thank-you gifts",
    Icon: Gift,
    grad: "from-teal-400 via-emerald-500 to-green-600",
    prompt: "Suggest guest favours and thank-you gifts for my event with pricing tiers, and find suppliers I can order from.",
  },
  {
    key: "surprise",
    label: "Surprise & Wow Moments",
    tagline: "Fireworks, sparks, first-dance reveals",
    Icon: Sparkles,
    grad: "from-purple-500 via-fuchsia-500 to-pink-500",
    prompt: "Design 3 unforgettable 'wow moments' for my event — cold-spark first dance, LED reveal, choreographed surprises — with cost and safety notes.",
  },
  {
    key: "vows",
    label: "Wedding Vows Designer",
    tagline: "Personalized vows with religious & cultural guidance",
    Icon: HeartHandshake,
    grad: "from-rose-400 via-fuchsia-500 to-purple-600",
    prompt: "Help me write personalized wedding vows. Ask me about our story, my partner's name, our shared values, religious or spiritual tradition (Christian, Catholic, Jewish, Muslim, Hindu, secular, etc.), and the tone I want (romantic, heartfelt, humorous, poetic). Then draft 2-3 vow options. For each religious/traditional phrase you suggest, explain WHY that wording is meaningful in that tradition (e.g. 'covenant' in Christian vows, 'I take you as my witness before God' in Catholic vows, 'until death parts us' historical meaning) so I can choose what feels right. Include guidance on structure: opening declaration, promises, closing commitment.",
  },
];

function seedPromptToAssistant(prompt: string, label: string) {
  try {
    navigator.clipboard?.writeText(prompt);
  } catch { /* ignore */ }
  // Broadcast — the AI chat can pick this up if it wants to auto-fill
  window.dispatchEvent(new CustomEvent("ai:seed-prompt", { detail: { prompt, label } }));
  toast({
    title: `${label} — copied to clipboard`,
    description: "Paste it into the AI Assistant below to get started, or just describe what you need.",
  });
  // Scroll to the AI chat panel
  setTimeout(() => {
    const el = document.querySelector("[data-ai-companion-panel]");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 60);
}

export function AiConciergeServices() {
  return (
    <div className="space-y-3">
      {/* Marketing header */}
      <div className="relative overflow-hidden rounded-2xl p-[1.5px] bg-gradient-to-r from-fuchsia-500 via-purple-500 to-cyan-500 shadow-[0_0_28px_hsl(280_95%_60%/0.35)]">
        <div className="rounded-[14px] bg-background/90 backdrop-blur px-4 py-3.5 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-br from-fuchsia-500 to-cyan-500 text-white shadow-md">
              <Sparkles className="w-4 h-4" />
            </span>
            <h3 className="font-display text-base sm:text-lg font-bold gradient-text leading-tight">
              Your AI Event Concierge
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Way more than a DJ booking — our AI helps you <span className="text-primary font-semibold">plan, quote and contact
            vendors</span> for every part of your event. Tap any tile below and the assistant does the running around for you.
          </p>
        </div>
      </div>

      {/* Service tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {SERVICES.map((s, i) => (
          <motion.button
            type="button"
            key={s.key}
            onClick={() => seedPromptToAssistant(s.prompt, s.label)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03, duration: 0.25 }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            className={`group relative overflow-hidden rounded-xl p-[1.5px] bg-gradient-to-br ${s.grad} shadow-md hover:shadow-[0_0_22px_hsl(280_95%_60%/0.45)] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 text-left`}
          >
            <div className="relative rounded-[10px] bg-background/90 backdrop-blur-md p-2.5 h-full flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-br ${s.grad} text-white shadow group-hover:scale-110 transition-transform`}>
                  <s.Icon className="w-4 h-4" />
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-[11px] sm:text-xs font-bold leading-tight">{s.label}</p>
              <p className="text-[10px] text-muted-foreground leading-snug line-clamp-2">{s.tagline}</p>
            </div>
          </motion.button>
        ))}
      </div>

      <p className="text-[11px] text-center text-muted-foreground italic">
        Ask the AI Assistant below anything — <span className="text-primary font-semibold">decor, cake, florals, catering, transport</span> — it'll plan, quote and connect you with vendors.
      </p>
    </div>
  );
}
