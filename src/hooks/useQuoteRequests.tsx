import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface QuoteRequest {
  id: string;
  client_id: string;
  client_name: string;
  email: string;
  contact_no: string | null;
  event_type: string;
  venue_name: string | null;
  venue_address: string | null;
  event_date: string | null;
  start_time: string | null;
  end_time: string | null;
  city: string | null;
  is_outdoor: boolean;
  venue_provides_sound: boolean;
  requires_microphones: boolean;
  requires_lighting: boolean;
  requires_laser_effects: boolean;
  requires_smoke_machine: boolean;
  requires_fog_machine: boolean;
  requires_low_fog_machine: boolean;
  requires_cold_spark_machines: boolean;
  needs_sound: boolean;
  needs_lighting: boolean;
  needs_special_effects: boolean;
  needs_mic: boolean;
  guest_count: number | null;
  package_id: string | null;
  package_name: string | null;
  notes: string | null;
  terms_accepted: boolean;
  terms_accepted_at: string;
  status: string; // pending | in_progress | quoted | declined
  quote_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useQuoteRequests(clientId?: string | null) {
  const queryClient = useQueryClient();

  const requestsQuery = useQuery({
    queryKey: ["quote_requests", clientId || "admin"],
    queryFn: async () => {
      let q = supabase.from("quote_requests").select("*").order("created_at", { ascending: false });
      if (clientId) q = q.eq("client_id", clientId);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as QuoteRequest[];
    },
  });

  const createRequest = useMutation({
    mutationFn: async (input: Omit<QuoteRequest, "id" | "status" | "quote_id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("quote_requests")
        .insert(input as any)
        .select()
        .single();
      if (error) throw error;
      // Admin in-app notification is created automatically by DB trigger.
      // Trigger AI alarm cadence so the lead is not forgotten.
      if (data?.id) {
        void Promise.allSettled([
          supabase.functions.invoke("generate-alarms", {
            body: { category: "followup_request", quote_request_id: data.id },
          }),
          supabase.functions.invoke("notify-admin-quote-request", {
            body: {
              requestId: data.id,
              clientName: data.client_name,
              clientEmail: data.email,
              eventType: data.event_type,
              eventDate: data.event_date,
              packageName: data.package_name,
            },
          }),
        ]).then((results) => {
          const [alarmResult, emailResult] = results;
          if (alarmResult.status === "rejected") {
            console.warn("alarm gen (lead) failed", alarmResult.reason);
          } else if (alarmResult.value.error) {
            console.warn("alarm gen (lead) failed", alarmResult.value.error);
          }
          if (emailResult.status === "rejected") {
            console.warn("admin quote request email failed", emailResult.reason);
          } else if (emailResult.value.error) {
            console.warn("admin quote request email failed", emailResult.value.error);
          }
        });
      }
      return data as QuoteRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quote_requests"] });
      queryClient.invalidateQueries({ queryKey: ["alarms"] });
      toast({ title: "Request Submitted", description: "We'll prepare your quote and let you know when it's ready." });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  const updateRequest = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<QuoteRequest> }) => {
      const { error } = await supabase.from("quote_requests").update(updates as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quote_requests"] });
    },
  });

  return {
    requests: requestsQuery.data || [],
    isLoading: requestsQuery.isLoading,
    createRequest: createRequest.mutateAsync,
    isCreating: createRequest.isPending,
    updateRequest: updateRequest.mutateAsync,
  };
}
