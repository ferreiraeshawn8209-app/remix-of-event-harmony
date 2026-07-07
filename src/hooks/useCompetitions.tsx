import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Competition {
  id: string;
  title: string;
  description: string;
  prize: string;
  image_url: string | null;
  ends_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CompetitionEntry {
  id: string;
  competition_id: string;
  user_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  created_at: string;
}

export function useCompetitions() {
  const qc = useQueryClient();

  const { data: competitions = [], isLoading } = useQuery({
    queryKey: ["competitions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competitions" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as Competition[]) || [];
    },
  });

  const activeCompetitions = competitions.filter((c) => {
    if (!c.is_active) return false;
    if (c.ends_at && new Date(c.ends_at) < new Date()) return false;
    return true;
  });

  const create = async (patch: Partial<Competition>) => {
    const { error } = await supabase.from("competitions" as any).insert(patch as any);
    if (error) throw error;
    qc.invalidateQueries({ queryKey: ["competitions"] });
  };

  const update = async (id: string, patch: Partial<Competition>) => {
    const { error } = await supabase.from("competitions" as any).update(patch as any).eq("id", id);
    if (error) throw error;
    qc.invalidateQueries({ queryKey: ["competitions"] });
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("competitions" as any).delete().eq("id", id);
    if (error) throw error;
    qc.invalidateQueries({ queryKey: ["competitions"] });
  };

  const enter = async (input: {
    competition_id: string;
    user_id: string;
    name: string;
    email: string;
    phone?: string;
    message?: string;
  }) => {
    const { error } = await supabase.from("competition_entries" as any).insert(input as any);
    if (error) throw error;
    qc.invalidateQueries({ queryKey: ["competition_entries"] });
  };

  return { competitions, activeCompetitions, isLoading, create, update, remove, enter };
}

export function useCompetitionEntries(competitionId?: string) {
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["competition_entries", competitionId || "all"],
    queryFn: async () => {
      let q = supabase
        .from("competition_entries" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (competitionId) q = q.eq("competition_id", competitionId);
      const { data, error } = await q;
      if (error) throw error;
      return (data as unknown as CompetitionEntry[]) || [];
    },
  });

  return { entries, isLoading };
}
