import { useSpecials } from "@/hooks/useSpecials";

/**
 * Derives the currently active percentage discount from active specials.
 * If multiple active specials carry a discount_percent, the largest wins.
 */
export function useActiveDiscount(): { percent: number; title: string | null } {
  const { activeSpecials } = useSpecials();
  let best = 0;
  let title: string | null = null;
  for (const s of activeSpecials as any[]) {
    const p = Number(s.discount_percent || 0);
    if (p > best) { best = p; title = s.title || null; }
  }
  return { percent: best, title };
}

export function applyDiscount(price: number, percent: number): number {
  if (!percent || percent <= 0) return price;
  return Math.round(price * (1 - percent / 100));
}
