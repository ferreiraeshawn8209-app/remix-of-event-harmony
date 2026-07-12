import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type WeddingExpo = {
  id: string;
  name: string;
  tagline: string | null;
  description: string | null;
  venue: string | null;
  city: string | null;
  province: string | null;
  start_date: string | null;
  end_date: string | null;
  start_time: string | null;
  ticket_url: string | null;
  website_url: string | null;
  image_url: string | null;
  contact_phone: string | null;
  is_active: boolean;
  sort_order: number;
};

export function useWeddingExpos(onlyActive = true) {
  const [expos, setExpos] = useState<WeddingExpo[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("wedding_expos" as any).select("*").order("sort_order", { ascending: true }).order("start_date", { ascending: true });
    if (onlyActive) q = q.eq("is_active", true);
    const { data } = await q;
    // Filter out past expos (end_date < today) when onlyActive
    const today = new Date().toISOString().slice(0, 10);
    const rows = ((data || []) as any as WeddingExpo[]).filter((e) => {
      if (!onlyActive) return true;
      const end = e.end_date || e.start_date;
      return !end || end >= today;
    });
    setExpos(rows);
    setLoading(false);
  }, [onlyActive]);

  useEffect(() => { void refresh(); }, [refresh]);

  return { expos, loading, refresh };
}
