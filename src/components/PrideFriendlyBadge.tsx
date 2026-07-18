import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * PrideFriendlyBadge
 * ────────────────────────────────────────────────
 * A warm, inclusive badge shown on the landing page and client dashboard
 * to signal that BeatKulture proudly celebrates LGBTQIA+ weddings and events.
 * Uses the rainbow flag gradient and a heart to keep the tone loving, not corporate.
 */
export function PrideFriendlyBadge({
  variant = "full",
  className,
}: {
  variant?: "full" | "compact";
  className?: string;
}) {
  return (
    <div
      aria-label="LGBTQIA+ friendly — all love welcome"
      className={cn(
        "relative inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-black/40 px-3 py-1.5 backdrop-blur-sm shadow-[0_0_18px_rgba(255,255,255,0.15)]",
        className,
      )}
    >
      {/* Rainbow flag chip */}
      <span
        className="inline-block h-4 w-6 rounded-sm ring-1 ring-white/40"
        style={{
          background:
            "linear-gradient(to bottom, #E40303 0 16.6%, #FF8C00 16.6% 33.3%, #FFED00 33.3% 50%, #008026 50% 66.6%, #004DFF 66.6% 83.3%, #750787 83.3% 100%)",
        }}
        aria-hidden
      />
      <Heart className="w-3.5 h-3.5 text-pink-400 fill-pink-400" aria-hidden />
      {variant === "full" ? (
        <span className="text-[11px] sm:text-xs font-semibold tracking-wide text-white">
          LGBTQIA+ Friendly · All Love Welcome
        </span>
      ) : (
        <span className="text-[11px] font-semibold tracking-wide text-white">All Love Welcome</span>
      )}
    </div>
  );
}

export default PrideFriendlyBadge;
