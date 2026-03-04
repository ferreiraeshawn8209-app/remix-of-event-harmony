import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DbPackage {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  includes: string[];
  popular: boolean;
  is_active: boolean;
  sort_order: number;
}

export function usePackages() {
  const queryClient = useQueryClient();

  const { data: packages = [], isLoading } = useQuery({
    queryKey: ["packages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("packages")
        .select("*")
        .order("sort_order");

      if (error) throw error;
      return (data || []).map((p: any) => ({
        ...p,
        includes: Array.isArray(p.includes) ? p.includes : JSON.parse(p.includes || "[]"),
      })) as DbPackage[];
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["packages"] });

  const updatePackage = async (id: string, updates: Partial<DbPackage>) => {
    const payload: any = { ...updates };
    if (updates.includes) payload.includes = JSON.stringify(updates.includes);
    delete payload.id;
    const { error } = await supabase.from("packages").update(payload).eq("id", id);
    if (error) throw error;
    invalidate();
  };

  const createPackage = async (pkg: Omit<DbPackage, "id">) => {
    const payload: any = { ...pkg, includes: JSON.stringify(pkg.includes) };
    const { error } = await supabase.from("packages").insert(payload);
    if (error) throw error;
    invalidate();
  };

  const deletePackage = async (id: string) => {
    const { error } = await supabase.from("packages").delete().eq("id", id);
    if (error) throw error;
    invalidate();
  };

  return { packages, isLoading, updatePackage, createPackage, deletePackage };
}
