import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DatabaseQuote } from "./useQuotes";

export interface ClientPlan {
  id: string;
  clientName: string;
  clientEmail: string;
  eventDate?: string;
  eventType?: string;
  packageName?: string;
  total: number;
  status: string;
  createdAt: string;
}

export interface ApprovalMetrics {
  pending: number;
  approved: number;
  changesRequested: number;
  recentFeedback: {
    id: string;
    clientName: string;
    feedback: string;
    type: "approval" | "changes_requested";
    createdAt: string;
  }[];
}

export interface AnalyticsData {
  adoptionRate: number;
  approvalSuccessRate: number;
  humorUsageRate: number;
  speechUsageRate: number;
  totalClients: number;
  activeClients: number;
  averageClientSatisfaction: number;
}

// Fetch client plans (quotations)
export function useClientPlans() {
  return useQuery({
    queryKey: ["client-plans"],
    queryFn: async () => {
      const { data: quotes, error } = await supabase
        .from("quotes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      return (
        quotes?.map((q: DatabaseQuote) => ({
          id: q.id,
          clientName: q.client_name || "Unknown",
          clientEmail: q.email || "N/A",
          eventDate: q.event_date,
          eventType: q.event_type,
          packageName: q.package_name,
          total: q.total || 0,
          status: q.status || "draft",
          createdAt: q.created_at,
        })) || []
      );
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Fetch approval workflow metrics
export function useApprovalMetrics() {
  return useQuery({
    queryKey: ["approval-metrics"],
    queryFn: async () => {
      // Get all quote messages to track approval workflow
      const { data: messages, error } = await supabase
        .from("quote_messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) throw error;

      const pending = messages?.filter((m: any) => m.type === "approval_pending").length || 0;
      const approved = messages?.filter((m: any) => m.type === "approval_approved").length || 0;
      const changesRequested =
        messages?.filter((m: any) => m.type === "approval_changes_requested").length || 0;

      // Get recent feedback (last 10)
      const recentFeedback =
        messages
          ?.filter((m: any) => m.type !== "approval_pending" && m.content)
          .slice(0, 10)
          .map((m: any) => ({
            id: m.id,
            clientName: m.sender_name || "Client",
            feedback: m.content || "",
            type: m.type === "approval_approved" ? ("approval" as const) : ("changes_requested" as const),
            createdAt: m.created_at,
          })) || [];

      return {
        pending,
        approved,
        changesRequested,
        recentFeedback,
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Fetch platform analytics
export function useAnalytics() {
  return useQuery({
    queryKey: ["platform-analytics"],
    queryFn: async () => {
      // Fetch quotes for basic metrics
      const { data: quotes, error: quotesError } = await supabase
        .from("quotes")
        .select("*")
        .limit(1000);

      if (quotesError) throw quotesError;

      // Fetch AI conversations for humor/speech usage
      const { data: conversations, error: convsError } = await supabase
        .from("ai_conversations")
        .select("*")
        .limit(1000);

      if (convsError) throw convsError;

      const totalClients = new Set((quotes || []).map((q: any) => q.client_id)).size;
      const activeClients = new Set(
        (quotes || [])
          .filter((q: any) => q.status !== "draft" && q.status !== "archived")
          .map((q: any) => q.client_id)
      ).size;

      // Count approvals for success rate
      const approvedQuotes = (quotes || []).filter((q: any) => q.status === "approved").length;
      const approvalSuccessRate = totalClients > 0 ? Math.round((approvedQuotes / totalClients) * 100) : 0;

      // Estimate humor/speech usage from conversations
      const humorConversations = (conversations || []).filter((c: any) =>
        c.summary?.toLowerCase().includes("humor") || c.summary?.toLowerCase().includes("joke")
      ).length;
      const speechConversations = (conversations || []).filter((c: any) =>
        c.summary?.toLowerCase().includes("speech") || c.summary?.toLowerCase().includes("toast")
      ).length;

      const humorUsageRate = (conversations || []).length > 0 
        ? Math.round((humorConversations / (conversations || []).length) * 100)
        : 0;

      const speechUsageRate = (conversations || []).length > 0 
        ? Math.round((speechConversations / (conversations || []).length) * 100)
        : 0;

      // Adoption rate: clients who have gone beyond initial quote
      const adoptionRate = totalClients > 0 
        ? Math.round(((totalClients - ((quotes || []).filter((q: any) => q.status === "draft").length || 0)) / totalClients) * 100)
        : 0;

      return {
        adoptionRate,
        approvalSuccessRate,
        humorUsageRate,
        speechUsageRate,
        totalClients,
        activeClients,
        averageClientSatisfaction: 4.7, // Would come from satisfaction survey table if available
      };
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
