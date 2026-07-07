import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BeatkultureMascotProps {
  mood?: "idle" | "speaking" | "celebrating" | "listening" | "thinking";
  className?: string;
  speechEnergy?: number;
  viseme?: string;
}

export function BeatkultureMascot({
  mood = "idle",
  className,
  speechEnergy = 0,
  viseme = "rest",
}: BeatkultureMascotProps) {
  const isSpeaking = mood === "speaking";
  const isCelebrating = mood === "celebrating";
  const isListening = mood === "listening";
  const isThinking = mood === "thinking";
  const mouthScale = isSpeaking ? 0.5 + speechEnergy * 0.9 : 0.2;
  const mouthWidth = viseme === "m" ? "w-3" : viseme === "o" ? "w-5" : "w-6";

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
      <div className="absolute left-1/2 top-3 h-14 w-14 -translate-x-1/2 rounded-full border border-primary/30 bg-gradient-to-b from-amber-100 to-amber-200 shadow-[0_0_18px_hsl(var(--primary)/0.35)]" />
      <div className="absolute left-1/2 top-[5.9rem] h-20 w-20 -translate-x-1/2 rounded-2xl border border-secondary/30 bg-gradient-to-b from-slate-800 to-slate-950" />
      <div className="absolute left-1/2 top-[6.3rem] h-4 w-7 -translate-x-1/2 rounded bg-gradient-to-r from-secondary to-primary" />
      <div className={cn("absolute left-[1.8rem] top-[6.6rem] h-2 w-2 rounded-full", isListening ? "bg-cyan-300" : "bg-secondary")} />
      <div className={cn("absolute right-[1.8rem] top-[6.6rem] h-2 w-2 rounded-full", isListening ? "bg-cyan-300" : "bg-secondary")} />
      <div className="absolute left-1/2 top-0 h-6 w-16 -translate-x-1/2 rounded-t-full border border-primary/30 bg-slate-900" />
      <div className="absolute left-1/2 top-4 h-2 w-20 -translate-x-1/2 rounded-full bg-slate-900" />
      <div className="absolute left-[2.35rem] top-8 h-1.5 w-1.5 rounded-full bg-slate-900" />
      <div className="absolute right-[2.35rem] top-8 h-1.5 w-1.5 rounded-full bg-slate-900" />
      <motion.div
        className={cn("absolute left-1/2 top-10 -translate-x-1/2 rounded-full bg-slate-900", mouthWidth)}
        animate={{
          height: `${Math.max(2, Math.floor(3 + mouthScale * 6))}px`,
        }}
        transition={{ duration: 0.08, ease: "linear" }}
      />
      <div className="absolute left-0 right-0 top-[7.3rem] mx-auto h-px w-10 bg-primary/30" />
      {isSpeaking && (
        <div className="absolute -right-2 top-8 rounded-full border border-primary/40 bg-primary/15 px-2 py-0.5 text-[10px] text-primary">
          Speaking
        </div>
      )}
      {isListening && (
        <div className="absolute -right-2 top-8 rounded-full border border-cyan-400/40 bg-cyan-400/15 px-2 py-0.5 text-[10px] text-cyan-300">
          Listening
        </div>
      )}
      {isThinking && (
        <div className="absolute -right-2 top-8 rounded-full border border-violet-400/40 bg-violet-400/15 px-2 py-0.5 text-[10px] text-violet-300">
          Thinking
        </div>
      )}
      {isCelebrating && (
        <div className="absolute -right-3 top-6 rounded-full border border-accent/40 bg-accent/20 px-2 py-0.5 text-[10px] text-accent">
          Nice!
        </div>
      )}
    </motion.div>
  );
}
