import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import djCharacter from "@/assets/dj-character.png.asset.json";

interface BeatkultureMascotProps {
  mood?: "idle" | "speaking" | "celebrating" | "listening" | "thinking";
  className?: string;
  speechEnergy?: number;
  viseme?: string;
}

/**
 * The official BeatKulture DJ character — headphones on, shades down, ready to spin.
 * Uses the uploaded character portrait instead of the previous cartoon avatar.
 */
export function BeatkultureMascot({
  mood = "idle",
  className,
  speechEnergy = 0,
}: BeatkultureMascotProps) {
  const isSpeaking = mood === "speaking";
  const isCelebrating = mood === "celebrating";
  const isListening = mood === "listening";
  const isThinking = mood === "thinking";
  const glow = 0.35 + speechEnergy * 0.5;

  const label =
    mood === "speaking" ? "Speaking"
    : mood === "listening" ? "Listening"
    : mood === "thinking" ? "Thinking"
    : mood === "celebrating" ? "Nice!"
    : null;

  const labelColor =
    mood === "speaking" ? "border-primary/40 bg-primary/15 text-primary"
    : mood === "listening" ? "border-cyan-400/40 bg-cyan-400/15 text-cyan-300"
    : mood === "thinking" ? "border-violet-400/40 bg-violet-400/15 text-violet-300"
    : "border-accent/40 bg-accent/20 text-accent";

  return (
    <motion.div
      className={cn("relative h-40 w-32", className)}
      initial={{ x: -20, opacity: 0 }}
      animate={{
        x: 0,
        opacity: 1,
        y: isCelebrating ? [0, -7, 0] : [0, -3, 0],
        rotate: isSpeaking ? [0, -1, 1, 0] : isThinking ? [0, 0.8, -0.8, 0] : 0,
      }}
      transition={{
        opacity: { duration: 0.35 },
        x: { duration: 0.45 },
        y: { duration: isCelebrating ? 0.8 : 2.4, repeat: Infinity, ease: "easeInOut" },
        rotate: { duration: 1.2, repeat: isSpeaking || isThinking ? Infinity : 0 },
      }}
    >
      <div
        className="absolute inset-0 rounded-2xl overflow-hidden border border-primary/30"
        style={{ boxShadow: `0 0 24px hsl(var(--primary) / ${glow})` }}
      >
        <img
          src={djCharacter.url}
          alt="BeatKulture DJ character"
          className="h-full w-full object-cover object-top"
          loading="lazy"
        />
        {isListening && (
          <div className="absolute inset-0 bg-cyan-400/10 mix-blend-screen" />
        )}
        {isCelebrating && (
          <div className="absolute inset-0 bg-gradient-to-t from-accent/30 via-transparent to-transparent" />
        )}
      </div>
      {label && (
        <div className={cn("absolute -right-2 top-2 rounded-full border px-2 py-0.5 text-[10px]", labelColor)}>
          {label}
        </div>
      )}
    </motion.div>
  );
}
