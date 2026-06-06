import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";
import { QuoteData, calculateQuote, CustomLineItem } from "@/lib/pricing";

export interface DatabaseQuote {
  id: string;
  client_id: string;
  client_name: string;
  contact_no: string | null;
  email: string;
  venue: string | null;
  event_date: string | null;
  start_time: string | null;
  end_time: string | null;
  event_type: string | null;
  dj_name: string | null;
  equipment: Record<string, number>;
  custom_items: CustomLineItem[];
  custom_items_cost: number;
  kids_corner: boolean;
  kids_hours: number;
  travel_distance: number;
  discount_percent: number;
  dj_cost: number;
  equipment_cost: number;
  kids_cost: number;
  subtotal: number;
  travel_cost: number;
  discount_amount: number;
  total: number;
  deposit: number;
  balance: number;
  hours: number;
  status: string;
  deposit_paid: boolean;
  deposit_paid_at: string | null;
  balance_paid: boolean;
  balance_paid_at: string | null;
  client_code: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useQuotes() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const quotesQuery = useQuery({
    queryKey: ["quotes", profile?.id],
    queryFn: async () => {
      if (!profile) return [];

      const { data, error } = await supabase
        .from("quotes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching quotes:", error);
        throw error;
      }

      // Transform the data to match our interface
      return (data || []).map(quote => ({
        ...quote,
        equipment: (quote.equipment as Record<string, number>) || {},
        custom_items: (quote.custom_items as unknown as CustomLineItem[]) || [],
      })) as DatabaseQuote[];
    },
    enabled: !!profile,
  });

  const createQuoteMutation = useMutation({
    mutationFn: async ({
      quoteData,
      calculations,
      clientProfileId,
    }: {
      quoteData: QuoteData;
      calculations: ReturnType<typeof calculateQuote>;
      clientProfileId: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("You must be logged in to create a quote");
      }

      const quoteRecord = {
        client_id: clientProfileId,
        client_name: quoteData.clientName,
        contact_no: quoteData.contactNo,
        email: quoteData.email,
        venue: quoteData.venue,
        event_date: quoteData.eventDate || null,
        start_time: quoteData.startTime || null,
        end_time: quoteData.endTime || null,
        event_type: quoteData.eventType,
        dj_name: quoteData.djName,
        equipment: quoteData.equipment,
        custom_items: quoteData.customItems || [],
        kids_corner: quoteData.kidsCorner,
        kids_hours: quoteData.kidsHours,
        travel_distance: quoteData.travelDistance,
        discount_percent: quoteData.discountPercent,
        dj_cost: calculations.djCost,
        equipment_cost: calculations.equipmentCost,
        custom_items_cost: calculations.customItemsCost,
        kids_cost: calculations.kidsCost,
        subtotal: calculations.subtotal,
        travel_cost: calculations.travelCost,
        discount_amount: calculations.discount,
        total: calculations.total,
        deposit: calculations.deposit,
        balance: calculations.balance,
        hours: calculations.hours,
        status: "draft",
        created_by: user.id,
      };

      const { data, error } = await supabase
        .from("quotes")
        .insert(quoteRecord as any)
        .select()
        .single();

      if (error) {
        console.error("Error creating quote:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      toast({
        title: "Quote Created",
        description: "Your quote has been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create quote",
        variant: "destructive",
      });
    },
  });

  const updateQuoteMutation = useMutation({
    mutationFn: async ({
      quoteId,
      quoteData,
      calculations,
    }: {
      quoteId: string;
      quoteData: Partial<QuoteData>;
      calculations?: ReturnType<typeof calculateQuote>;
    }) => {
      const updateData: Record<string, unknown> = {
        ...quoteData,
      };

      if (calculations) {
        updateData.dj_cost = calculations.djCost;
        updateData.equipment_cost = calculations.equipmentCost;
        updateData.custom_items_cost = calculations.customItemsCost;
        updateData.kids_cost = calculations.kidsCost;
        updateData.subtotal = calculations.subtotal;
        updateData.travel_cost = calculations.travelCost;
        updateData.discount_amount = calculations.discount;
        updateData.total = calculations.total;
        updateData.deposit = calculations.deposit;
        updateData.balance = calculations.balance;
        updateData.hours = calculations.hours;
      }

      const { data, error } = await supabase
        .from("quotes")
        .update(updateData)
        .eq("id", quoteId)
        .select()
        .single();

      if (error) {
        console.error("Error updating quote:", error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      toast({
        title: "Quote Updated",
        description: "Quote has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update quote",
        variant: "destructive",
      });
    },
  });

  const deleteQuoteMutation = useMutation({
    mutationFn: async (quoteId: string) => {
      const { error } = await supabase
        .from("quotes")
        .delete()
        .eq("id", quoteId);

      if (error) {
        console.error("Error deleting quote:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      toast({
        title: "Quote Deleted",
        description: "Quote has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete quote",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ quoteId, status, declineReason }: { quoteId: string; status: string; declineReason?: string }) => {
      const patch: Record<string, any> = { status };
      if (status === "declined" || status === "rejected") {
        patch.decline_reason = declineReason ?? null;
        patch.declined_at = new Date().toISOString();
      } else {
        // Clear archive metadata when moving back out of declined/rejected
        patch.decline_reason = null;
        patch.declined_at = null;
      }

      const { data, error } = await supabase
        .from("quotes")
        .update(patch)
        .eq("id", quoteId)
        .select()
        .single();

      if (error) {
        console.error("Error updating status:", error);
        throw error;
      }

      // Auto-trigger AI alarm generation on key status transitions
      if (status === "sent") {
        supabase.functions.invoke("generate-alarms", {
          body: { category: "followup_quoted", quote_id: quoteId },
        }).catch((e) => console.warn("alarm gen (followup) failed", e));
      } else if (status === "accepted" || status === "paid") {
        supabase.functions.invoke("generate-alarms", {
          body: { category: "event_prep", quote_id: quoteId },
        }).catch((e) => console.warn("alarm gen (event prep) failed", e));
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      queryClient.invalidateQueries({ queryKey: ["alarms"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    },
  });

  return {
    quotes: quotesQuery.data || [],
    isLoading: quotesQuery.isLoading,
    error: quotesQuery.error,
    createQuote: createQuoteMutation.mutateAsync,
    updateQuote: updateQuoteMutation.mutateAsync,
    updateQuoteStatus: (quoteId: string, status: string, declineReason?: string) =>
      updateStatusMutation.mutateAsync({ quoteId, status, declineReason }),
    deleteQuote: deleteQuoteMutation.mutateAsync,
    isCreating: createQuoteMutation.isPending,
    isUpdating: updateQuoteMutation.isPending,
    isDeleting: deleteQuoteMutation.isPending,
  };
}
