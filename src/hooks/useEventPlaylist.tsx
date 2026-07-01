import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Moment = "arrival" | "ceremony" | "first_dance" | "cake_cut" | "party" | "last_song" | "custom";

export const MOMENT_LABELS: Record<Moment, string> = {
  arrival: "Arrival",
  ceremony: "Ceremony",
  first_dance: "First Dance",
  cake_cut: "Cake Cutting",
  party: "Party / Dancefloor",
  last_song: "Last Song",
  custom: "Custom Moment",
};

export interface PlaylistItem {
  id: string;
  playlist_id: string;
  moment: Moment;
  song_title: string;
  artist: string | null;
  cue_time_seconds: number | null;
  notes: string | null;
  sort_order: number;
}

export interface EventPlaylist {
  id: string;
  quote_id: string;
  name: string;
  notes: string | null;
}

export function useEventPlaylist(quoteId?: string) {
  const qc = useQueryClient();

  const playlistQ = useQuery({
    queryKey: ["event-playlist", quoteId],
    enabled: !!quoteId,
    queryFn: async () => {
      const { data } = await supabase
        .from("event_playlists" as any).select("*").eq("quote_id", quoteId!).maybeSingle();
      return (data || null) as unknown as EventPlaylist | null;
    },
  });

  const itemsQ = useQuery({
    queryKey: ["event-playlist-items", playlistQ.data?.id],
    enabled: !!playlistQ.data?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("event_playlist_items" as any)
        .select("*").eq("playlist_id", playlistQ.data!.id)
        .order("moment").order("sort_order");
      return (data || []) as unknown as PlaylistItem[];
    },
  });

  const ensurePlaylist = async (): Promise<string> => {
    if (playlistQ.data?.id) return playlistQ.data.id;
    if (!quoteId) throw new Error("Missing quote id");
    const { data, error } = await supabase
      .from("event_playlists" as any).insert({ quote_id: quoteId }).select("*").single();
    if (error) throw error;
    qc.invalidateQueries({ queryKey: ["event-playlist", quoteId] });
    return (data as any).id;
  };

  const addItem = async (input: Omit<PlaylistItem, "id" | "playlist_id" | "sort_order"> & { sort_order?: number }) => {
    const pid = await ensurePlaylist();
    const { error } = await supabase.from("event_playlist_items" as any).insert({
      ...input,
      playlist_id: pid,
      sort_order: input.sort_order ?? 0,
    } as any);
    if (error) throw error;
    qc.invalidateQueries({ queryKey: ["event-playlist-items", pid] });
  };

  const updateItem = async (id: string, patch: Partial<PlaylistItem>) => {
    const { error } = await supabase.from("event_playlist_items" as any).update(patch as any).eq("id", id);
    if (error) throw error;
    qc.invalidateQueries({ queryKey: ["event-playlist-items", playlistQ.data?.id] });
  };

  const removeItem = async (id: string) => {
    const { error } = await supabase.from("event_playlist_items" as any).delete().eq("id", id);
    if (error) throw error;
    qc.invalidateQueries({ queryKey: ["event-playlist-items", playlistQ.data?.id] });
  };

  return {
    playlist: playlistQ.data,
    items: itemsQ.data ?? [],
    isLoading: playlistQ.isLoading || itemsQ.isLoading,
    ensurePlaylist,
    addItem,
    updateItem,
    removeItem,
  };
}
