import { useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface QuoteMessage {
  id: string;
  quote_id: string;
  sender_id: string | null;
  sender_role: "client" | "admin";
  sender_name: string;
  message: string;
  created_at: string;
}

export function useQuoteMessages(quoteId?: string | null) {
  const qc = useQueryClient();
  const key = ["quote_messages", quoteId];

  const query = useQuery({
    queryKey: key,
    enabled: !!quoteId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quote_messages")
        .select("*")
        .eq("quote_id", quoteId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as QuoteMessage[];
    },
  });

  useEffect(() => {
    if (!quoteId) return;
    const channel = supabase
      .channel(`quote_messages_${quoteId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "quote_messages", filter: `quote_id=eq.${quoteId}` },
        () => qc.invalidateQueries({ queryKey: key })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteId]);

  const send = useMutation({
    mutationFn: async (input: { message: string; sender_role: "client" | "admin"; sender_name: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("quote_messages").insert({
        quote_id: quoteId!,
        sender_id: user?.id || null,
        sender_role: input.sender_role,
        sender_name: input.sender_name,
        message: input.message.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    onError: (e: any) => toast({ title: "Could not send", description: e.message, variant: "destructive" }),
  });

  return {
    messages: query.data || [],
    isLoading: query.isLoading,
    send: send.mutateAsync,
    sending: send.isPending,
  };
}
