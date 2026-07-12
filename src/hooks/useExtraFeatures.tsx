// @ts-nocheck
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface ExtraFeature {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  price: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useExtraFeatures() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["extra_features"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("extra_features")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as ExtraFeature[];
    },
  });

  const activeFeatures = (query.data || []).filter((feature) => feature.is_active);

  const saveMutation = useMutation({
    mutationFn: async (input: Partial<ExtraFeature> & { id?: string }) => {
      if (input.id) {
        const { data, error } = await supabase
          .from("extra_features")
          .update(input as any)
          .eq("id", input.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }

      const { data, error } = await supabase
        .from("extra_features")
        .insert(input as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["extra_features"] });
      toast({ title: "Saved", description: "Feature updated." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("extra_features").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["extra_features"] });
      toast({ title: "Deleted", description: "Feature removed." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return {
    features: query.data || [],
    activeFeatures,
    isLoading: query.isLoading,
    saveFeature: saveMutation.mutateAsync,
    deleteFeature: deleteMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}