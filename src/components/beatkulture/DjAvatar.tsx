import { motion } from "framer-motion";

interface DjAvatarProps {
  /** idle = subtle sway; mixing = active fader/deck; hyped = fast head bob */
  mood?: "idle" | "mixing" | "hyped";
  /** css size, e.g. "w-64" | "w-80" | "w-full" */
  className?: string;
  /** show pedestal glow + light beams beneath the avatar */
  showStage?: boolean;
}

/**
 * Kulture — the BeatKulture DJ concierge.
 * Pure SVG full-body character with idle/mixing/hyped animation moods.
 * Uses design tokens (primary / accent / secondary) so it inherits theme.
 */
export function DjAvatar({ mood = "idle", className = "w-full max-w-sm", showStage = true }: DjAvatarProps) {
  const bobSpeed = mood === "hyped" ? 0.45 : mood === "mixing" ? 0.9 : 1.6;
  const handSpeed = mood === "hyped" ? 0.35 : mood === "mixing" ? 0.55 : 1.4;

  return (
    <div className={`relative ${className}`}>
      {/* Stage glow behind DJ */}
      {showStage && (
        <>
          <div className="absolute inset-x-4 bottom-2 h-16 rounded-[50%] bg-primary/40 blur-3xl animate-pulse pointer-events-none" />
          <div className="absolute inset-x-10 bottom-6 h-10 rounded-[50%] bg-accent/50 blur-2xl pointer-events-none" />
          {/* light beams */}
          <motion.div
            aria-hidden
            className="absolute left-1/2 top-0 -translate-x-1/2 w-[140%] h-full pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.15, 0.35, 0.15] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="absolute left-[10%] top-0 w-24 h-full origin-top rotate-[8deg] bg-gradient-to-b from-primary/40 via-primary/10 to-transparent blur-2xl" />
            <div className="absolute right-[12%] top-0 w-24 h-full origin-top -rotate-[10deg] bg-gradient-to-b from-accent/40 via-accent/10 to-transparent blur-2xl" />
            <div className="absolute left-1/2 -translate-x-1/2 top-0 w-16 h-full bg-gradient-to-b from-secondary/40 via-secondary/10 to-transparent blur-xl" />
          </motion.div>
        </>
      )}

      <motion.svg
        viewBox="0 0 320 420"
        className="relative w-full drop-shadow-[0_20px_40px_hsl(var(--primary)/0.35)]"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        role="img"
        aria-label="Kulture, the BeatKulture DJ concierge"
      >
        <defs>
          <linearGradient id="dj-skin" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#8a5a3c" />
            <stop offset="1" stopColor="#5c3a24" />
          </linearGradient>
          <linearGradient id="dj-jacket" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="hsl(var(--primary))" />
            <stop offset="1" stopColor="hsl(var(--accent))" />
          </linearGradient>
          <linearGradient id="dj-shine" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="hsl(var(--secondary))" stopOpacity="0.9" />
            <stop offset="1" stopColor="hsl(var(--secondary))" stopOpacity="0.1" />
          </linearGradient>
          <radialGradient id="deck-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="hsl(var(--primary))" stopOpacity="0.9" />
            <stop offset="1" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="deck-metal" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#1f2933" />
            <stop offset="1" stopColor="#0b1015" />
          </linearGradient>
        </defs>

        {/* --- pedestal shadow --- */}
        <ellipse cx="160" cy="405" rx="120" ry="10" fill="hsl(var(--background))" opacity="0.55" />

        {/* --- DJ decks (behind body) --- */}
        <g>
          {/* Deck base */}
          <rect x="30" y="290" width="260" height="70" rx="10" fill="url(#deck-metal)" stroke="hsl(var(--primary) / 0.5)" strokeWidth="1.5" />
          {/* Left turntable */}
          <circle cx="80" cy="325" r="26" fill="#0a0a0f" stroke="hsl(var(--primary) / 0.6)" strokeWidth="1.5" />
          <motion.circle
            cx="80" cy="325" r="22" fill="url(#deck-glow)" opacity="0.7"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: "80px 325px" }}
          />
          <circle cx="80" cy="325" r="4" fill="hsl(var(--secondary))" />
          {/* Right turntable */}
          <circle cx="240" cy="325" r="26" fill="#0a0a0f" stroke="hsl(var(--accent) / 0.6)" strokeWidth="1.5" />
          <motion.circle
            cx="240" cy="325" r="22" fill="url(#deck-glow)" opacity="0.7"
            animate={{ rotate: -360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: "240px 325px" }}
          />
          <circle cx="240" cy="325" r="4" fill="hsl(var(--secondary))" />
          {/* Center mixer with LEDs */}
          <rect x="130" y="305" width="60" height="45" rx="4" fill="#141821" stroke="hsl(var(--primary) / 0.4)" />
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.rect
              key={i}
              x={138 + i * 10}
              y={313}
              width={6}
              height={14}
              rx={1}
              fill="hsl(var(--primary))"
              animate={{ opacity: [0.2, 1, 0.3, 0.8, 0.2] }}
              transition={{ duration: 0.9 + i * 0.15, repeat: Infinity, ease: "easeInOut", delay: i * 0.1 }}
            />
          ))}
          {/* Fader slot */}
          <rect x="145" y="335" width="30" height="4" rx="2" fill="#000" />
          <motion.rect
            x={155} y={332}
            width={10} height={10} rx={1.5}
            fill="hsl(var(--secondary))"
            animate={{ x: [147, 165, 155, 160, 147] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
        </g>

        {/* --- BODY: head-nod group --- */}
        <motion.g
          animate={{ y: [0, -3, 0, -2, 0] }}
          transition={{ duration: bobSpeed, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Torso / jacket */}
          <path
            d="M110 220 Q160 195 210 220 L215 305 Q160 315 105 305 Z"
            fill="url(#dj-jacket)"
            stroke="hsl(var(--primary) / 0.6)"
            strokeWidth="1.2"
          />
          {/* Jacket shine */}
          <path d="M130 220 Q160 210 190 220 L188 260 Q160 268 132 260 Z" fill="url(#dj-shine)" opacity="0.35" />
          {/* Collar / shirt V */}
          <path d="M150 220 L160 250 L170 220 Z" fill="#0a0a0f" />
          <circle cx="160" cy="252" r="3" fill="hsl(var(--secondary))" />

          {/* Neck */}
          <rect x="151" y="188" width="18" height="14" rx="4" fill="url(#dj-skin)" />

          {/* Head */}
          <g>
            <ellipse cx="160" cy="165" rx="34" ry="38" fill="url(#dj-skin)" />
            {/* hairline / fade */}
            <path d="M126 152 Q160 118 194 152 Q194 138 160 128 Q126 138 126 152 Z" fill="#111" />
            {/* eyebrows */}
            <rect x="140" y="158" width="12" height="2.5" rx="1" fill="#111" />
            <rect x="168" y="158" width="12" height="2.5" rx="1" fill="#111" />
            {/* sunglasses */}
            <g>
              <rect x="134" y="162" width="52" height="14" rx="3" fill="#0a0a0f" stroke="hsl(var(--primary))" strokeWidth="1.2" />
              <rect x="137" y="164" width="20" height="10" rx="2" fill="hsl(var(--primary) / 0.35)" />
              <rect x="163" y="164" width="20" height="10" rx="2" fill="hsl(var(--accent) / 0.35)" />
              {/* reflection */}
              <rect x="140" y="165" width="6" height="3" rx="1" fill="hsl(var(--secondary))" opacity="0.8" />
              <rect x="166" y="165" width="6" height="3" rx="1" fill="hsl(var(--secondary))" opacity="0.8" />
            </g>
            {/* smirk */}
            <path d="M148 187 Q160 194 172 187" stroke="#111" strokeWidth="2" fill="none" strokeLinecap="round" />
            {/* beard */}
            <path d="M142 188 Q160 200 178 188 Q178 196 160 200 Q142 196 142 188 Z" fill="#111" opacity="0.75" />

            {/* Headphones */}
            <path d="M124 152 Q160 100 196 152" stroke="hsl(var(--primary))" strokeWidth="4" fill="none" />
            <rect x="116" y="150" width="18" height="26" rx="6" fill="#0a0a0f" stroke="hsl(var(--primary))" strokeWidth="1.5" />
            <rect x="186" y="150" width="18" height="26" rx="6" fill="#0a0a0f" stroke="hsl(var(--primary))" strokeWidth="1.5" />
            <motion.circle
              cx="125" cy="163" r="3" fill="hsl(var(--primary))"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
            <motion.circle
              cx="195" cy="163" r="3" fill="hsl(var(--accent))"
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
          </g>

          {/* Left arm (on turntable) — subtle scratch motion */}
          <motion.g
            animate={{ rotate: mood === "idle" ? [-2, 2, -2] : [-8, 8, -8] }}
            transition={{ duration: handSpeed, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: "115px 235px" }}
          >
            <path
              d="M115 232 Q95 255 82 305"
              stroke="url(#dj-jacket)" strokeWidth="18" strokeLinecap="round" fill="none"
            />
            {/* hand */}
            <circle cx="82" cy="308" r="9" fill="url(#dj-skin)" />
            <circle cx="82" cy="308" r="9" fill="hsl(var(--secondary))" opacity="0.15" />
          </motion.g>

          {/* Right arm (on fader) */}
          <motion.g
            animate={{ rotate: mood === "idle" ? [2, -2, 2] : [6, -6, 6] }}
            transition={{ duration: handSpeed * 1.1, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: "205px 235px" }}
          >
            <path
              d="M205 232 Q225 258 238 305"
              stroke="url(#dj-jacket)" strokeWidth="18" strokeLinecap="round" fill="none"
            />
            <circle cx="238" cy="308" r="9" fill="url(#dj-skin)" />
          </motion.g>
        </motion.g>

        {/* --- Floating music notes --- */}
        {[0, 1, 2].map((i) => (
          <motion.g
            key={i}
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: [0, 1, 0], y: [-6, -60, -90], x: [0, i % 2 ? 12 : -12, 0] }}
            transition={{ duration: 3.2 + i * 0.4, repeat: Infinity, delay: i * 0.9, ease: "easeOut" }}
            style={{ transformOrigin: `${100 + i * 60}px 200px` }}
          >
            <text x={100 + i * 60} y={210} fontSize="22" fill="hsl(var(--secondary))" opacity="0.85">
              {i % 2 ? "♫" : "♪"}
            </text>
          </motion.g>
        ))}
      </motion.svg>
    </div>
  );
}
