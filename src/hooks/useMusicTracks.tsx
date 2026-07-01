import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MusicTrack {
  id: string;
  title: string;
  artist: string | null;
  file_url: string;
  mime_type: string | null;
  duration_seconds: number | null;
  sort_order: number;
  active: boolean;
  created_at: string;
}

/** Upload MP3/WAV to the public site-images bucket under music/. */
export async function uploadMusicFile(file: File): Promise<string> {
  const ext = (file.name.split(".").pop() || "mp3").toLowerCase();
  const path = `music/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("site-images").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || (ext === "wav" ? "audio/wav" : "audio/mpeg"),
  });
  if (error) throw error;
  return supabase.storage.from("site-images").getPublicUrl(path).data.publicUrl;
}

export function useMusicTracks() {
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["music-tracks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("music_tracks" as any)
        .select("*")
        .order("sort_order")
        .order("created_at");
      if (error) throw error;
      return (data || []) as unknown as MusicTrack[];
    },
  });

  const create = async (input: Partial<MusicTrack>) => {
    const { error } = await supabase.from("music_tracks" as any).insert(input as any);
    if (error) throw error;
    qc.invalidateQueries({ queryKey: ["music-tracks"] });
  };

  const update = async (id: string, patch: Partial<MusicTrack>) => {
    const { error } = await supabase.from("music_tracks" as any).update(patch as any).eq("id", id);
    if (error) throw error;
    qc.invalidateQueries({ queryKey: ["music-tracks"] });
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("music_tracks" as any).delete().eq("id", id);
    if (error) throw error;
    qc.invalidateQueries({ queryKey: ["music-tracks"] });
  };

  return {
    tracks: q.data ?? [],
    activeTracks: (q.data ?? []).filter(t => t.active),
    isLoading: q.isLoading,
    create,
    update,
    remove,
  };
}
