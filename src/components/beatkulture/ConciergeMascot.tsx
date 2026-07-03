import { useEffect, useState } from "react";

/**
 * BeatKulture Concierge — a stylized SVG tuxedo gentleman.
 * Walks onto the screen, idles with a subtle bob, waves a gloved hand,
 * and delivers a welcome line in a glass speech bubble.
 */
interface Props {
  name?: string;
  greeting?: string;
}

export function ConciergeMascot({ name = "Kulture", greeting }: Props) {
  const [showBubble, setShowBubble] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowBubble(true), 900);
    return () => clearTimeout(t);
  }, []);

  const line =
    greeting ||
    `Welcome. I'm ${name} — your BeatKulture concierge. Let's craft an unforgettable evening.`;

  return (
    <div className="relative flex items-end gap-3 sm:gap-4">
      {/* Speech bubble */}
      <div
        className={`glass-premium max-w-[220px] sm:max-w-xs rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed transition-all duration-500 order-2
          ${showBubble ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
        style={{ boxShadow: "0 20px 40px -20px hsl(275 90% 30% / 0.5)" }}
      >
        <span className="gold-text font-semibold">{name}:</span>{" "}
        <span className="text-foreground/90">{line}</span>
        <div className="absolute -left-1.5 bottom-4 h-3 w-3 rotate-45 bg-[hsl(260_25%_10%/0.85)] border-l border-b border-[hsl(45_60%_70%/0.18)] hidden sm:block" />
      </div>

      {/* Mascot */}
      <div className="relative order-1 shrink-0 animate-walkin">
        <div className="animate-bob">
          <Gentleman />
        </div>
        {/* Ground glow */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-3 w-16 rounded-full blur-md bg-gold/40" />
      </div>
    </div>
  );
}

function Gentleman() {
  return (
    <svg
      viewBox="0 0 120 160"
      className="h-28 w-24 sm:h-32 sm:w-28 drop-shadow-[0_10px_20px_hsl(275_90%_40%/0.5)]"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="tux" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="hsl(260 30% 12%)" />
          <stop offset="100%" stopColor="hsl(260 40% 4%)" />
        </linearGradient>
        <linearGradient id="skin" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="hsl(30 55% 72%)" />
          <stop offset="100%" stopColor="hsl(24 45% 58%)" />
        </linearGradient>
        <linearGradient id="gold-g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="hsl(42 90% 72%)" />
          <stop offset="100%" stopColor="hsl(42 78% 48%)" />
        </linearGradient>
        <radialGradient id="halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsl(275 90% 62% / 0.7)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>

      {/* Halo */}
      <ellipse cx="60" cy="40" rx="46" ry="34" fill="url(#halo)" />

      {/* Top hat */}
      <rect x="40" y="8" width="40" height="22" rx="2" fill="url(#tux)" />
      <rect x="34" y="28" width="52" height="5" rx="2" fill="url(#tux)" />
      <rect x="40" y="18" width="40" height="3" fill="url(#gold-g)" />

      {/* Head */}
      <ellipse cx="60" cy="48" rx="16" ry="18" fill="url(#skin)" />
      {/* Eyes */}
      <circle cx="54" cy="48" r="1.6" fill="hsl(260 40% 8%)" />
      <circle cx="66" cy="48" r="1.6" fill="hsl(260 40% 8%)" />
      {/* Moustache */}
      <path d="M52 56 Q60 60 68 56 Q64 58 60 57.5 Q56 58 52 56 Z" fill="hsl(260 40% 8%)" />
      {/* Smile */}
      <path d="M55 61 Q60 65 65 61" stroke="hsl(260 40% 8%)" strokeWidth="1.2" fill="none" strokeLinecap="round" />

      {/* Bow tie */}
      <path d="M52 72 L60 76 L68 72 L68 82 L60 78 L52 82 Z" fill="url(#gold-g)" />
      <circle cx="60" cy="77" r="1.8" fill="hsl(260 40% 8%)" />

      {/* Tux body */}
      <path d="M32 82 Q60 74 88 82 L92 140 Q60 148 28 140 Z" fill="url(#tux)" />
      {/* Lapels */}
      <path d="M60 78 L44 100 L54 108 L60 92 Z" fill="hsl(275 90% 32%)" opacity="0.85" />
      <path d="M60 78 L76 100 L66 108 L60 92 Z" fill="hsl(275 90% 32%)" opacity="0.85" />
      {/* Shirt */}
      <path d="M56 84 L60 92 L64 84 L64 108 L56 108 Z" fill="hsl(45 30% 96%)" />
      {/* Buttons */}
      <circle cx="60" cy="98" r="1.2" fill="url(#gold-g)" />
      <circle cx="60" cy="104" r="1.2" fill="url(#gold-g)" />

      {/* Pocket square */}
      <path d="M76 96 L82 96 L80 104 L78 100 Z" fill="hsl(22 100% 58%)" />

      {/* Left arm (static) */}
      <path d="M32 84 Q22 100 26 128 L34 130 Q34 108 42 92 Z" fill="url(#tux)" />
      <circle cx="30" cy="130" r="4" fill="hsl(45 30% 96%)" />

      {/* Right arm — waving */}
      <g className="animate-wave" style={{ transformOrigin: "88px 88px" }}>
        <path d="M86 84 Q104 70 110 44 L104 40 Q96 62 82 82 Z" fill="url(#tux)" />
        <circle cx="108" cy="42" r="5" fill="hsl(45 30% 96%)" />
      </g>

      {/* Legs / shoes */}
      <rect x="46" y="138" width="10" height="14" rx="2" fill="url(#tux)" />
      <rect x="64" y="138" width="10" height="14" rx="2" fill="url(#tux)" />
      <ellipse cx="51" cy="154" rx="7" ry="3" fill="hsl(260 40% 4%)" />
      <ellipse cx="69" cy="154" rx="7" ry="3" fill="hsl(260 40% 4%)" />
    </svg>
  );
}
