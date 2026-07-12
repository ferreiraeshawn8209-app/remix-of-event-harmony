// @ts-nocheck
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Testimonial {
  id: string;
  client_name: string;
  event_type: string | null;
  rating: number;
  message: string;
  photo_url: string | null;
  source_platform: string | null;
  source_review_id: string | null;
  source_url: string | null;
  sort_order: number;
  is_live: boolean;
  created_at: string;
}

export function useTestimonials(onlyLive = false) {
  const qc = useQueryClient();

  const { data = [], isLoading } = useQuery({
    queryKey: ["testimonials", onlyLive],
    queryFn: async () => {
      let q = supabase.from("testimonials").select("*").order("sort_order").order("created_at", { ascending: false });
      if (onlyLive) q = q.eq("is_live", true);
      const { data, error } = await q;
      if (error) throw error;
      return data as Testimonial[];
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["testimonials"] });

  const create = async (t: Omit<Testimonial, "id" | "created_at">) => {
    const { error } = await supabase.from("testimonials").insert(t as any);
    if (error) throw error;
    invalidate();
  };
  const update = async (id: string, t: Partial<Testimonial>) => {
    const { error } = await supabase.from("testimonials").update(t as any).eq("id", id);
    if (error) throw error;
    invalidate();
  };
  const remove = async (id: string) => {
    const { error } = await supabase.from("testimonials").delete().eq("id", id);
    if (error) throw error;
    invalidate();
  };

  const upsertImported = async (rows: Array<Omit<Testimonial, "id" | "created_at">>) => {
    const { error } = await supabase
      .from("testimonials")
      .upsert(rows as any, { onConflict: "source_platform,source_review_id" });
    if (error) throw error;
    invalidate();
  };

  return { testimonials: data, isLoading, create, update, remove, upsertImported };
}