// @ts-nocheck
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { ApprovalItem } from "@/packages/shared-types/admin-dashboard";

export function ApprovalWorkflowTracker() {
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadApprovals = async () => {
      setLoading(true);
      try {
        const { data: messages, error } = await supabase
          .from("quote_messages")
          .select("*")
          .ilike("message", "%Planner Review%")
          .order("created_at", { ascending: false })
          .limit(100);

        if (error) throw error;

        const items: ApprovalItem[] = (messages || []).map((msg: any, idx: number) => {
          const isApproved = msg.message?.includes("approved");
          const artifactMatch = msg.message?.match(/(Timeline|Visuals|Rehearsal)/);
          const artifactType = artifactMatch
            ? (artifactMatch[1].toLowerCase() as "timeline" | "visualization" | "rehearsal")
            : "timeline";

          return {
            id: `${msg.id}-${idx}`,
            eventId: msg.quote_id,
            clientName: msg.sender_name || "Unknown",
            artifactType: artifactType === "visuals" ? "visualization" : artifactType,
            status: isApproved ? "approved" : "changes_requested",
            requestedChangeNotes: msg.message?.split("Feedback: ")[1] || undefined,
            submittedAt: msg.created_at,
          };
        });

        setApprovals(items);
      } catch (error) {
        console.error("Failed to load approvals:", error);
      } finally {
        setLoading(false);
      }
    };

    void loadApprovals();
  }, []);

  const stats = {
    total: approvals.length,
    approved: approvals.filter((a) => a.status === "approved").length,
    changesRequested: approvals.filter((a) => a.status === "changes_requested").length,
  };

  const statColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-500/20";
      case "changes_requested":
        return "bg-orange-500/20";
      default:
        return "bg-gray-500/20";
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card variant="glass">
          <CardContent className="pt-6">
            <p className="text-xs uppercase text-muted-foreground">Total reviews</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card variant="glass">
          <CardContent className="pt-6">
            <p className="text-xs uppercase text-muted-foreground">Approved</p>
            <p className="text-2xl font-bold text-green-500">{stats.approved}</p>
          </CardContent>
        </Card>
        <Card variant="glass">
          <CardContent className="pt-6">
            <p className="text-xs uppercase text-muted-foreground">Changes requested</p>
            <p className="text-2xl font-bold text-orange-500">{stats.changesRequested}</p>
          </CardContent>
        </Card>
      </div>

      <Card variant="glass">
        <CardHeader>
          <CardTitle>Recent Reviews</CardTitle>
          <CardDescription>Track approval workflow across all client artifacts.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : approvals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No reviews yet.</div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {approvals.map((approval) => (
                <div key={approval.id} className="rounded-lg border border-border/50 p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <p className="font-medium text-sm">{approval.clientName}</p>
                      <p className="text-xs text-muted-foreground">
                        {approval.artifactType.charAt(0).toUpperCase() + approval.artifactType.slice(1)} review
                      </p>
                    </div>
                    <Badge variant="outline" className={statColor(approval.status)}>
                      {approval.status === "approved" ? "✓ Approved" : "⚠ Changes Requested"}
                    </Badge>
                  </div>
                  {approval.requestedChangeNotes && (
                    <p className="text-xs text-muted-foreground italic bg-background/40 rounded p-2">
                      "{approval.requestedChangeNotes}"
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {new Date(approval.submittedAt).toLocaleDateString("en-ZA")} at{" "}
                    {new Date(approval.submittedAt).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}