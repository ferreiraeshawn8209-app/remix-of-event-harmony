import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";

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
  is_outdoor: boolean;
  needs_sound: boolean;
  needs_lighting: boolean;
  needs_special_effects: boolean;
  needs_mic: boolean;
  guest_count: number | null;
  package_id: string | null;
  package_name: string | null;
  notes: string | null;
  status: string; // pending | in_progress | quoted | declined
  quote_id: string | null;
  created_at: string;
  updated_at: string;
}

type CreateQuoteRequestInput = Omit<QuoteRequest, "id" | "status" | "quote_id" | "created_at" | "updated_at">;


export function useQuoteRequests(clientId?: string | null) {
  const queryClient = useQueryClient();
  const { get: getSetting } = useBusinessSettings();

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
    mutationFn: async (input: CreateQuoteRequestInput) => {
      const fallbackEmails = getSetting("admin_notification_emails")
        .split(",")
        .map((email) => email.trim())
        .filter(Boolean);
      const fallbackWhatsAppTo = getSetting("admin_notification_whatsapp_to")
        .split(",")
        .map((phone) => phone.trim())
        .filter(Boolean);

      // Only send columns that exist in the live quote_requests table.
      // This prevents stale form-only fields like city/area/province from reaching PostgREST.
      const payload = {
        client_id: input.client_id,
        client_name: input.client_name,
        email: input.email,
        contact_no: input.contact_no,
        event_type: input.event_type,
        venue_name: input.venue_name,
        venue_address: input.venue_address,
        event_date: input.event_date,
        start_time: input.start_time,
        end_time: input.end_time,
        is_outdoor: input.is_outdoor,
        needs_sound: input.needs_sound,
        needs_lighting: input.needs_lighting,
        needs_special_effects: input.needs_special_effects,
        needs_mic: input.needs_mic,
        guest_count: input.guest_count,
        package_id: input.package_id,
        package_name: input.package_name,
        notes: input.notes,
      };

      const { data, error } = await supabase
        .from("quote_requests")
        .insert(payload as any)
        .select()
        .single();
      if (error) throw error;
      // Admin in-app notification is created automatically by DB trigger.
      // Trigger AI alarm cadence so the lead is not forgotten.
      let adminAlertNotified = true;
      if (data?.id) {
        const alarmResult = await supabase.functions.invoke("generate-alarms", {
          body: { category: "followup_request", quote_request_id: data.id },
        });
        if (alarmResult.error) {
          console.warn("alarm gen (lead) failed", alarmResult.error);
        }

        let alertError: unknown = null;
        for (let attempt = 1; attempt <= 2; attempt += 1) {
          const notifyResult = await supabase.functions.invoke("notify-admin-quote-request", {
            body: {
              requestId: data.id,
              clientName: data.client_name,
              clientEmail: data.email,
              clientPhone: data.contact_no,
              eventType: data.event_type,
              eventDate: data.event_date,
              venueName: data.venue_name,
              packageName: data.package_name,
              fallbackEmails,
              fallbackWhatsAppTo,
            },
          });

          if (!notifyResult.error) {
            alertError = null;
            break;
          }

          alertError = notifyResult.error;
        }

        if (alertError) {
          adminAlertNotified = false;
          console.warn("admin quote request alert failed", alertError);
        }
      }
      return { request: data as QuoteRequest, adminAlertNotified };
    },
    onSuccess: ({ adminAlertNotified }) => {
      queryClient.invalidateQueries({ queryKey: ["quote_requests"] });
      queryClient.invalidateQueries({ queryKey: ["alarms"] });
      toast({ title: "Request Submitted", description: "We'll prepare your quote and let you know when it's ready." });
      if (!adminAlertNotified) {
        toast({
          title: "Admin alert delayed",
          description: "Your request was submitted. In-app admin notifications are active while outbound email/WhatsApp retries continue.",
          variant: "destructive",
        });
      }
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });

  useEffect(() => {
    const channelName = clientId ? `quote_requests_client_${clientId}` : "quote_requests_admin";
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "quote_requests" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["quote_requests"] });
          queryClient.invalidateQueries({ queryKey: ["quote_requests", clientId || "admin"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, clientId]);

  const updateRequest = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<QuoteRequest> }) => {
      const { error } = await supabase.from("quote_requests").update(updates as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quote_requests"] });
    },
  });

  const deleteRequest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("quote_requests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quote_requests"] });
      toast({ title: "Request deleted", description: "Quote request removed from admin dashboard." });
    },
    onError: (e: any) => {
      toast({ title: "Delete failed", description: e.message, variant: "destructive" });
    },
  });

  return {
    requests: requestsQuery.data || [],
    isLoading: requestsQuery.isLoading,
    createRequest: createRequest.mutateAsync,
    isCreating: createRequest.isPending,
    updateRequest: updateRequest.mutateAsync,
    deleteRequest: deleteRequest.mutateAsync,
  };
}
