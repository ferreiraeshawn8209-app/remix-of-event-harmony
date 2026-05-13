import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface Alarm {
  id: string;
  category: "followup_quoted" | "followup_request" | "event_prep";
  title: string;
  description: string;
  due_at: string;
  stage: number;
  is_done: boolean;
  done_at: string | null;
  quote_id: string | null;
  quote_request_id: string | null;
  client_name: string | null;
  client_email: string | null;
  ai_reasoning: string | null;
  created_at: string;
}

export function useAlarms() {
  const qc = useQueryClient();

  const alarmsQuery = useQuery({
    queryKey: ["alarms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alarms")
        .select("*")
        .order("due_at", { ascending: true });
      if (error) throw error;
      return (data || []) as Alarm[];
    },
  });

  const toggleDone = useMutation({
    mutationFn: async ({ id, is_done }: { id: string; is_done: boolean }) => {
      const { error } = await supabase
        .from("alarms")
        .update({ is_done, done_at: is_done ? new Date().toISOString() : null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alarms"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("alarms").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alarms"] }),
  });

  const generate = useMutation({
    mutationFn: async (payload: { category: Alarm["category"]; quote_id?: string; quote_request_id?: string }) => {
      const { data, error } = await supabase.functions.invoke("generate-alarms", { body: payload });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["alarms"] });
      toast({ title: "Alarms generated", description: `${data?.inserted ?? 0} reminders scheduled by AI.` });
    },
    onError: (e: any) => toast({ title: "Failed to generate alarms", description: e.message, variant: "destructive" }),
  });

  const dueCount = (alarmsQuery.data || []).filter(
    (a) => !a.is_done && new Date(a.due_at).getTime() <= Date.now()
  ).length;

  return {
    alarms: alarmsQuery.data || [],
    isLoading: alarmsQuery.isLoading,
    dueCount,
    toggleDone: toggleDone.mutateAsync,
    remove: remove.mutateAsync,
    generate: generate.mutateAsync,
    isGenerating: generate.isPending,
  };
}
