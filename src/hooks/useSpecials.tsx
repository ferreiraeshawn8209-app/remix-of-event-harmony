import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Special {
  id: string;
  title: string;
  image_url: string;
  is_active: boolean;
  discount_percent: number | null;
  created_at: string;
}

export function useSpecials() {
  const queryClient = useQueryClient();

  const { data: specials = [], isLoading } = useQuery({
    queryKey: ["specials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("specials")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Special[];
    },
  });

  const activeSpecials = specials.filter(s => s.is_active);
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["specials"] });

  const uploadSpecial = async (file: File, title: string) => {
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("specials-images")
      .upload(path, file, { contentType: file.type || undefined });
    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from("specials-images")
      .getPublicUrl(path);

    const { error } = await supabase.from("specials").insert({
      title,
      image_url: urlData.publicUrl,
      is_active: true,
    });
    if (error) throw error;
    invalidate();
  };

  const toggleSpecial = async (id: string, is_active: boolean) => {
    const { error } = await supabase.from("specials").update({ is_active }).eq("id", id);
    if (error) throw error;
    invalidate();
  };

  const deleteSpecial = async (id: string) => {
    const { error } = await supabase.from("specials").delete().eq("id", id);
    if (error) throw error;
    invalidate();
  };

  return { specials, activeSpecials, isLoading, uploadSpecial, toggleSpecial, deleteSpecial };
}
