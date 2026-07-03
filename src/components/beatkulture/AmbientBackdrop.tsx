/**
 * BeatKulture ambient backdrop.
 * Cinematic aurora orbs + subtle particle grid.
 * Purely decorative, pointer-events: none. Sits behind content.
 */
export function AmbientBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Deep base wash */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-10%,hsl(275_90%_18%/0.7),transparent_60%)]" />

      {/* Purple aurora orb */}
      <div className="absolute -top-32 -left-24 h-[520px] w-[520px] rounded-full opacity-60 blur-3xl animate-aurora"
           style={{ background: "radial-gradient(circle at 30% 30%, hsl(275 90% 55% / 0.55), transparent 60%)" }} />

      {/* Orange aurora orb */}
      <div className="absolute top-1/3 -right-32 h-[600px] w-[600px] rounded-full opacity-50 blur-3xl animate-drift-slow"
           style={{ background: "radial-gradient(circle at 70% 40%, hsl(22 100% 55% / 0.5), transparent 60%)" }} />

      {/* Gold shimmer */}
      <div className="absolute bottom-0 left-1/4 h-[420px] w-[420px] rounded-full opacity-30 blur-3xl animate-drift-fast"
           style={{ background: "radial-gradient(circle at 50% 50%, hsl(42 90% 60% / 0.45), transparent 60%)" }} />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(45 60% 80% / .6) 1px, transparent 1px), linear-gradient(90deg, hsl(45 60% 80% / .6) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse at 50% 20%, black 40%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 20%, black 40%, transparent 75%)",
        }}
      />

      {/* Floating specks */}
      {Array.from({ length: 14 }).map((_, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-gold/70 animate-float"
          style={{
            left: `${(i * 73) % 100}%`,
            top: `${(i * 41) % 100}%`,
            width: `${2 + (i % 3)}px`,
            height: `${2 + (i % 3)}px`,
            animationDelay: `${i * 0.7}s`,
            animationDuration: `${6 + (i % 5)}s`,
            filter: "drop-shadow(0 0 6px hsl(42 78% 58% / 0.7))",
          }}
        />
      ))}
    </div>
  );
}
