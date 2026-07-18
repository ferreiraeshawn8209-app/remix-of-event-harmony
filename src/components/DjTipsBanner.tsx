import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import djCharacter from "@/assets/dj-character.png.asset.json";
const djAvatar = djCharacter.url;

/**
 * DjTipsBanner
 * ────────────────────────────────────────────────────────────
 * Meet "DJ" — BeatKulture's AI character mascot.
 * Rotating advice banners about weddings, corporate events,
 * off-season savings, deposits, specials, and app features.
 *
 * • A "Tip of the Month" is auto-picked from the current month.
 * • Evergreen tips rotate every 8s (pausable via arrows).
 * • Appears at the top of the public landing page and the
 *   signed-in client portal.
 *
 * To swap in the user's own character art later, just replace
 * src/assets/dj-avatar.png with the uploaded image.
 */

type Tip = {
  id: string;
  title: string;
  body: string;
  tag?: string;
};

// Evergreen advice — cycles all year
const EVERGREEN: Tip[] = [
  {
    id: "book-early",
    tag: "Smart Booking",
    title: "Book in advance — it's the smartest move.",
    body: "Locking in your DJ and event coordinator early alleviates stress, avoids last-minute price hikes, and guarantees your date. The only way to secure the booking is by paying the 30% deposit.",
  },
  {
    id: "off-season",
    tag: "Off-Season Deal",
    title: "April → July: off-season, best prices.",
    body: "Wedding season quiets down between April and July before picking up again from August into summer. Book in this window for the sharpest rates — and lock it with a deposit before the specials close.",
  },
  {
    id: "cheap-dj",
    tag: "Real Talk",
    title: "A cheap DJ is a weak DJ.",
    body: "Great sound, lighting and reading the crowd is exhausting work — not just fun. Without the right music and effects, an event falls flat. BeatKulture keeps prices competitive, but never at the cost of the vibe.",
  },
  {
    id: "music-is-everything",
    tag: "The Truth",
    title: "The music makes the wedding. The music makes the party.",
    body: "The right sound, the right lights, the right energy — that's what people remember. A great DJ carries the room from ceremony to last dance.",
  },
  {
    id: "specials",
    tag: "Watch the Specials",
    title: "Up to 50% off — but only on specials.",
    body: "We run rotating specials throughout the year. Check the landing page regularly — depending on the date and package, you can save up to 50%. Secure it with your deposit before the slot's gone.",
  },
  {
    id: "budget-calc",
    tag: "In-App Feature",
    title: "Try the AI Budget Calculator.",
    body: "Inside the app, DJ helps you plan: budget calculator, package comparisons, vendor coordination for decor, cakes, florals and more. Ask DJ anything about your event.",
  },
  {
    id: "deposit",
    tag: "How Bookings Work",
    title: "No deposit, no booking.",
    body: "A 30% non-refundable deposit (EFT or Cash) confirms your event. It validates for 7 days — pay to lock the date before anyone else grabs it.",
  },
  {
    id: "corporate",
    tag: "Corporate Events",
    title: "Not just weddings — corporates too.",
    body: "Year-end functions, launches, brand activations, private parties. BeatKulture brings the same pro-grade sound, lights and coordination to every event type.",
  },
];

// Month-specific tips (0 = Jan). Falls back to evergreen if empty.
const MONTHLY: Record<number, Tip> = {
  0: { id: "jan", tag: "January Tip", title: "New year, new date — lock it in.", body: "The best venues and DJs for the year get booked in January. Beat the rush." },
  1: { id: "feb", tag: "February Tip", title: "Valentine's + autumn = off-season savings incoming.", body: "March-April is when prices soften. Plan your winter or spring event now for the sharpest quotes." },
  2: { id: "mar", tag: "March Tip", title: "Off-season is starting.", body: "March → July is the cheapest window of the year. Book now for maximum value." },
  3: { id: "apr", tag: "April Tip", title: "Peak off-season pricing — right now.", body: "April through July is when BeatKulture runs its best specials. Grab up to 50% off select packages." },
  4: { id: "may", tag: "May Tip", title: "Winter weddings are magical (and cheaper).", body: "Cozy venues, dramatic lighting, off-season pricing. Winter events have a mood peak-season can't touch." },
  5: { id: "jun", tag: "June Tip", title: "Corporate year-end planning starts now.", body: "Book your November/December year-end function in June to lock the best slot at winter prices." },
  6: { id: "jul", tag: "July Tip", title: "Last month of off-season.", body: "August onwards, wedding season ramps back up. Confirm your quote and deposit before prices climb." },
  7: { id: "aug", tag: "August Tip", title: "Season is back — book fast.", body: "Spring weddings are here. Popular Saturdays go first. Deposit locks the date." },
  8: { id: "sep", tag: "September Tip", title: "Peak season pricing kicks in.", body: "Spring & summer = premium demand. Advance bookings save the most. Ask about our combo packages." },
  9: { id: "oct", tag: "October Tip", title: "Summer weddings & year-ends collide.", body: "October fills up fast for both markets. Confirm early or explore off-peak weekdays for discounts." },
  10: { id: "nov", tag: "November Tip", title: "Peak season — every weekend is fire.", body: "Year-end parties, weddings, launches — DJ's diary is heating up. Deposit today or lose the slot." },
  11: { id: "dec", tag: "December Tip", title: "Festive season = full calendar.", body: "December bookings must be secured well in advance. Ask about NYE and Christmas packages." },
};

export function DjTipsBanner({ variant = "landing" }: { variant?: "landing" | "portal" }) {
  const tips = useMemo<Tip[]>(() => {
    const month = new Date().getMonth();
    const monthly = MONTHLY[month];
    return monthly ? [monthly, ...EVERGREEN] : EVERGREEN;
  }, []);

  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setI((n) => (n + 1) % tips.length), 8000);
    return () => clearInterval(t);
  }, [paused, tips.length]);

  const tip = tips[i];
  const heading =
    variant === "landing"
      ? "DJ's Wedding, Corporate & Event Tips"
      : "A quick word from DJ";

  return (
    <section
      aria-label="DJ tips and advice"
      className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-fuchsia-950/40 via-purple-950/30 to-cyan-950/40 shadow-[0_0_40px_hsl(280_95%_60%/0.25)] backdrop-blur-sm"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Neon ambient glow */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-cyan-500/20 blur-3xl" />

      <div className="relative flex flex-col sm:flex-row gap-4 p-4 sm:p-5">
        {/* Avatar */}
        <div className="flex-shrink-0 self-center sm:self-start">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-fuchsia-500 via-purple-500 to-cyan-400 blur-md opacity-70 animate-pulse" />
            <img
              src={djAvatar}
              alt="DJ — BeatKulture's AI event advisor"
              width={128}
              height={128}
              loading="lazy"
              className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover ring-2 ring-primary/60 shadow-[0_0_25px_hsl(280_95%_60%/0.6)]"
            />
            <span className="absolute -bottom-1 -right-1 bg-background border border-primary/50 rounded-full px-2 py-0.5 text-[10px] font-bold text-primary">
              DJ
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-primary/90">
              {heading}
            </h2>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={tip.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
            >
              {tip.tag && (
                <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-cyan-300 mb-1">
                  {tip.tag}
                </span>
              )}
              <h3 className="font-display text-base sm:text-lg font-bold leading-snug text-foreground">
                {tip.title}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                {tip.body}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Controls */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex gap-1">
              {tips.slice(0, 8).map((_, idx) => (
                <button
                  key={idx}
                  aria-label={`Show tip ${idx + 1}`}
                  onClick={() => setI(idx)}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === i % 8 ? "w-6 bg-primary" : "w-1.5 bg-primary/30 hover:bg-primary/60"
                  }`}
                />
              ))}
            </div>
            <div className="flex gap-1">
              <button
                aria-label="Previous tip"
                onClick={() => setI((n) => (n - 1 + tips.length) % tips.length)}
                className="p-1.5 rounded-md border border-primary/30 hover:bg-primary/10 text-primary transition"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                aria-label="Next tip"
                onClick={() => setI((n) => (n + 1) % tips.length)}
                className="p-1.5 rounded-md border border-primary/30 hover:bg-primary/10 text-primary transition"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default DjTipsBanner;
