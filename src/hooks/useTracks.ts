import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Track {
  id: string;
  title: string;
  url: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useTracks() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("tracks")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    setTracks((data as Track[]) || []);
    setIsLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (title: string, url: string) => {
    const { error } = await supabase.from("tracks").insert({ title, url });
    if (error) throw error;
    await fetch();
  };

  const update = async (id: string, patch: Partial<Omit<Track, "id" | "created_at" | "updated_at">>) => {
    const { error } = await supabase.from("tracks").update(patch).eq("id", id);
    if (error) throw error;
    await fetch();
  };

  const remove = async (id: string, fileUrl?: string) => {
    // Remove the DB row first
    const { error } = await supabase.from("tracks").delete().eq("id", id);
    if (error) throw error;

    // If we have the storage URL, delete the file too
    if (fileUrl) {
      const marker = "/tracks/";
      const idx = fileUrl.indexOf(marker);
      if (idx !== -1) {
        const path = fileUrl.slice(idx + marker.length);
        await supabase.storage.from("tracks").remove([path]);
      }
    }

    await fetch();
  };

  return { tracks, isLoading, create, update, remove, refetch: fetch };
}

/** Returns only active tracks (for the client player). */
export function useActiveTracks() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("tracks")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      setTracks((data as Track[]) || []);
      setIsLoading(false);
    })();
  }, []);

  return { tracks, isLoading };
}
