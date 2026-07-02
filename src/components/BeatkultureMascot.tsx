import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BeatkultureMascotProps {
  mood?: "idle" | "speaking" | "celebrating";
  className?: string;
}

export function BeatkultureMascot({ mood = "idle", className }: BeatkultureMascotProps) {
  const isSpeaking = mood === "speaking";
  const isCelebrating = mood === "celebrating";

  return (
    <motion.div
      className={cn("relative h-40 w-32", className)}
      initial={{ x: -20, opacity: 0 }}
      animate={{
        x: 0,
        opacity: 1,
        y: isCelebrating ? [0, -6, 0] : [0, -3, 0],
        rotate: isSpeaking ? [0, -1, 1, 0] : 0,
      }}
      transition={{
        opacity: { duration: 0.4 },
        x: { duration: 0.45 },
        y: { duration: isCelebrating ? 0.8 : 2.2, repeat: Infinity, ease: "easeInOut" },
        rotate: { duration: 1.1, repeat: isSpeaking ? Infinity : 0 },
      }}
    >
      <div className="absolute left-1/2 top-3 h-14 w-14 -translate-x-1/2 rounded-full border border-primary/30 bg-gradient-to-b from-amber-100 to-amber-200 shadow-[0_0_18px_hsl(var(--primary)/0.35)]" />
      <div className="absolute left-1/2 top-[5.9rem] h-20 w-20 -translate-x-1/2 rounded-2xl border border-secondary/30 bg-gradient-to-b from-slate-800 to-slate-950" />
      <div className="absolute left-1/2 top-[6.3rem] h-4 w-7 -translate-x-1/2 rounded bg-gradient-to-r from-secondary to-primary" />
      <div className="absolute left-[1.8rem] top-[6.6rem] h-2 w-2 rounded-full bg-secondary" />
      <div className="absolute right-[1.8rem] top-[6.6rem] h-2 w-2 rounded-full bg-secondary" />
      <div className="absolute left-1/2 top-0 h-6 w-16 -translate-x-1/2 rounded-t-full border border-primary/30 bg-slate-900" />
      <div className="absolute left-1/2 top-4 h-2 w-20 -translate-x-1/2 rounded-full bg-slate-900" />
      <div className="absolute left-[2.35rem] top-8 h-1.5 w-1.5 rounded-full bg-slate-900" />
      <div className="absolute right-[2.35rem] top-8 h-1.5 w-1.5 rounded-full bg-slate-900" />
      <div className={cn("absolute left-1/2 top-10 h-1 w-6 -translate-x-1/2 rounded-full bg-slate-900", isSpeaking && "animate-pulse")} />
      <div className="absolute left-0 right-0 top-[7.3rem] mx-auto h-px w-10 bg-primary/30" />
      {isSpeaking && (
        <div className="absolute -right-2 top-8 rounded-full border border-primary/40 bg-primary/15 px-2 py-0.5 text-[10px] text-primary">
          Speaking
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

