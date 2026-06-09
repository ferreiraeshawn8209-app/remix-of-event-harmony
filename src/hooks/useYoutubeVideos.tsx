import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface YoutubeVideo {
  id: string;
  title: string;
  youtube_id: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

/** Extract a YouTube video ID from a full URL or return as-is if already an id. */
export function extractYoutubeId(input: string): string {
  const trimmed = (input || "").trim();
  if (!trimmed) return "";
  // Already looks like an ID (11 chars, no slash)
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;
  try {
    const u = new URL(trimmed);
    if (u.hostname.includes("youtu.be")) return u.pathname.replace("/", "").slice(0, 11);
    const v = u.searchParams.get("v");
    if (v) return v.slice(0, 11);
    // /embed/<id> or /shorts/<id>
    const parts = u.pathname.split("/").filter(Boolean);
    const last = parts[parts.length - 1];
    if (last && /^[\w-]{11}$/.test(last)) return last;
  } catch {
    // not a URL
  }
  return trimmed.slice(0, 11);
}

export function useYoutubeVideos() {
  const qc = useQueryClient();

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ["youtube_videos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("youtube_videos" as any)
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as YoutubeVideo[]) || [];
    },
  });

  const activeVideos = videos.filter((v) => v.is_active);

  const create = async (input: { title: string; youtube_id: string; description?: string }) => {
    const { error } = await supabase
      .from("youtube_videos" as any)
      .insert({
        title: input.title,
        youtube_id: input.youtube_id,
        description: input.description || "",
      });
    if (error) throw error;
    qc.invalidateQueries({ queryKey: ["youtube_videos"] });
  };

  const update = async (id: string, patch: Partial<YoutubeVideo>) => {
    const { error } = await supabase
      .from("youtube_videos" as any)
      .update(patch as any)
      .eq("id", id);
    if (error) throw error;
    qc.invalidateQueries({ queryKey: ["youtube_videos"] });
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("youtube_videos" as any).delete().eq("id", id);
    if (error) throw error;
    qc.invalidateQueries({ queryKey: ["youtube_videos"] });
  };

  return { videos, activeVideos, isLoading, create, update, remove };
}
