import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, Filter, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { PlanSnapshot } from "@/packages/shared-types/admin-dashboard";

export function PlanManagementDashboard() {
  const [plans, setPlans] = useState<PlanSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    const loadPlans = async () => {
      setLoading(true);
      try {
        const { data: quotes, error } = await supabase
          .from("quotes")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        const snapshots: PlanSnapshot[] = (quotes || []).map((q: any) => ({
          id: q.id,
          eventId: q.id,
          clientId: q.client_id,
          clientName: q.client_name || "Unknown",
          eventType: q.event_type || "Not specified",
          eventDate: q.event_date || "TBD",
          venue: q.venue || "TBD",
          status: q.status === "accepted" && q.deposit_paid ? "pending_review" : "draft",
          hasTimeline: false,
          hasVisualization: false,
          hasRehearsal: false,
          createdAt: q.created_at,
          updatedAt: q.updated_at,
        }));

        setPlans(snapshots);
      } catch (error) {
        console.error("Failed to load plans:", error);
      } finally {
        setLoading(false);
      }
    };

    void loadPlans();
  }, []);

  const filtered = plans.filter((plan) => {
    const matchesSearch =
      plan.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.eventType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.venue.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || plan.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const exportCSV = () => {
    const headers = ["Client", "Event Type", "Venue", "Date", "Status", "Created"];
    const rows = filtered.map((p) => [p.clientName, p.eventType, p.venue, p.eventDate, p.status, p.createdAt]);
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `plans-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const statusBadgeColor: Record<string, string> = {
    draft: "bg-gray-500/20",
    timeline_generated: "bg-blue-500/20",
    visualization_generated: "bg-pink-500/20",
    rehearsal_generated: "bg-indigo-500/20",
    pending_review: "bg-yellow-500/20",
    approved: "bg-green-500/20",
    changes_requested: "bg-orange-500/20",
  };

  return (
    <div className="space-y-4">
      <Card variant="glass">
        <CardHeader>
          <CardTitle>Plan Management</CardTitle>
          <CardDescription>Monitor and manage all client event plans across the platform.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by client, event type, venue..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-md border border-border bg-background text-sm"
            >
              <option value="all">All statuses</option>
              <option value="draft">Draft</option>
              <option value="pending_review">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="changes_requested">Changes Requested</option>
            </select>
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No plans match your filters.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border/50">
                  <tr className="text-left text-xs uppercase text-muted-foreground">
                    <th className="pb-2 font-semibold">Client</th>
                    <th className="pb-2 font-semibold">Event Type</th>
                    <th className="pb-2 font-semibold">Venue</th>
                    <th className="pb-2 font-semibold">Date</th>
                    <th className="pb-2 font-semibold">Status</th>
                    <th className="pb-2 font-semibold">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filtered.map((plan) => (
                    <tr key={plan.id} className="hover:bg-primary/5 transition">
                      <td className="py-3 font-medium">{plan.clientName}</td>
                      <td className="py-3 text-muted-foreground">{plan.eventType}</td>
                      <td className="py-3 text-muted-foreground">{plan.venue}</td>
                      <td className="py-3 text-muted-foreground">{plan.eventDate}</td>
                      <td className="py-3">
                        <Badge variant="outline" className={statusBadgeColor[plan.status]}>
                          {plan.status.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="py-3 text-xs text-muted-foreground">
                        {new Date(plan.createdAt).toLocaleDateString("en-ZA")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="text-xs text-muted-foreground pt-2">
            Showing {filtered.length} of {plans.length} plans
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
