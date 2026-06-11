import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ClientReview {
  id: string;
  event_id: string | null;
  guest_name: string | null;
  guest_email: string | null;
  rating: number;
  message: string | null;
  posted_to_facebook: boolean;
  posted_to_bark: boolean;
  user_agent: string | null;
  created_at: string;
}

export function useClientReviews() {
  const qc = useQueryClient();

  const { data = [], isLoading } = useQuery({
    queryKey: ["client_reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_reviews")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ClientReview[];
    },
  });

  const update = async (id: string, patch: Partial<ClientReview>) => {
    const { error } = await supabase.from("client_reviews").update(patch as any).eq("id", id);
    if (error) throw error;
    qc.invalidateQueries({ queryKey: ["client_reviews"] });
  };
  const remove = async (id: string) => {
    const { error } = await supabase.from("client_reviews").delete().eq("id", id);
    if (error) throw error;
    qc.invalidateQueries({ queryKey: ["client_reviews"] });
  };

  return { reviews: data, isLoading, update, remove };
}

export async function submitClientReview(input: {
  eventId?: string | null;
  rating: number;
  guestName?: string;
  guestEmail?: string;
  message?: string;
}) {
  const { error } = await supabase.from("client_reviews").insert({
    event_id: input.eventId || null,
    rating: input.rating,
    guest_name: input.guestName || null,
    guest_email: input.guestEmail || null,
    message: input.message || null,
    user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
  } as any);
  if (error) throw error;
}
