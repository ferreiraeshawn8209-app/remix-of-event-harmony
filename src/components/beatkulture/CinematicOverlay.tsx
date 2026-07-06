import { motion } from "framer-motion";

/**
 * Cinematic ambient layer: film grain, vignette, drifting light beams.
 * Purely decorative. Fixed to viewport, pointer-events none, sits above bg.
 */
export function CinematicOverlay({ intensity = "medium" as "subtle" | "medium" | "high" }) {
  const grainOpacity = intensity === "subtle" ? 0.05 : intensity === "high" ? 0.14 : 0.09;
  const beamOpacity = intensity === "subtle" ? 0.12 : intensity === "high" ? 0.32 : 0.22;

  return (
    <>
      {/* Vignette */}
      <div
        aria-hidden
        className="fixed inset-0 pointer-events-none z-[1]"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 45%, hsl(var(--background) / 0.55) 90%, hsl(var(--background)) 100%)",
        }}
      />

      {/* Drifting light beams */}
      <div aria-hidden className="fixed inset-0 pointer-events-none overflow-hidden z-[1]">
        <motion.div
          className="absolute -top-[20%] left-[10%] w-[45vw] h-[140vh] origin-top rotate-[14deg] blur-3xl"
          style={{ background: `linear-gradient(to bottom, hsl(var(--primary) / ${beamOpacity}), transparent 70%)` }}
          animate={{ x: [-20, 40, -20], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -top-[20%] right-[8%] w-[40vw] h-[140vh] origin-top -rotate-[18deg] blur-3xl"
          style={{ background: `linear-gradient(to bottom, hsl(var(--accent) / ${beamOpacity}), transparent 70%)` }}
          animate={{ x: [20, -30, 20], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <motion.div
          className="absolute -top-[10%] left-1/2 -translate-x-1/2 w-[25vw] h-[130vh] blur-3xl"
          style={{ background: `linear-gradient(to bottom, hsl(var(--secondary) / ${beamOpacity * 0.7}), transparent 70%)` }}
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Film grain (SVG noise) */}
      <div
        aria-hidden
        className="fixed inset-0 pointer-events-none mix-blend-overlay z-[2]"
        style={{
          opacity: grainOpacity,
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.7 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
          backgroundSize: "160px 160px",
        }}
      />

      {/* Subtle letterbox top/bottom */}
      <div aria-hidden className="fixed top-0 left-0 right-0 h-6 pointer-events-none z-[3] bg-gradient-to-b from-background to-transparent" />
      <div aria-hidden className="fixed bottom-0 left-0 right-0 h-10 pointer-events-none z-[3] bg-gradient-to-t from-background to-transparent" />
    </>
  );
}
