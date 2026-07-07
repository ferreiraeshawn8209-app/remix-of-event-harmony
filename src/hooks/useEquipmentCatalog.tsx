import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface EquipmentCatalogItem {
  id: string;
  item_key: string;
  name: string;
  category: string;
  description: string;
  price: number;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
}

export function useEquipmentCatalog() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["equipment-catalog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("equipment_catalog")
        .select("*")
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as EquipmentCatalogItem[];
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (item: Partial<EquipmentCatalogItem> & { id?: string }) => {
      if (item.id) {
        const { data, error } = await supabase
          .from("equipment_catalog")
          .update(item as any)
          .eq("id", item.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("equipment_catalog")
          .insert(item as any)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment-catalog"] });
      toast({ title: "Saved", description: "Equipment item saved." });
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("equipment_catalog")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment-catalog"] });
      toast({ title: "Deleted", description: "Equipment item removed." });
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return {
    items: query.data || [],
    isLoading: query.isLoading,
    saveItem: upsertMutation.mutateAsync,
    deleteItem: deleteMutation.mutateAsync,
    isSaving: upsertMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
