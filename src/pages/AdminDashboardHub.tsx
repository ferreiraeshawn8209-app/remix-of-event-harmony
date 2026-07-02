import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, CheckCircle2, LineChart } from "lucide-react";
import { PlanManagementDashboard } from "@/components/admin/PlanManagementDashboard";
import { ApprovalWorkflowTracker } from "@/components/admin/ApprovalWorkflowTracker";
import { AnalyticsSnapshot } from "@/components/admin/AnalyticsSnapshot";

export function AdminDashboardHub() {
  const [activeTab, setActiveTab] = useState("plans");

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold gradient-text mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage plans, track approvals, and monitor platform analytics</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="plans" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Plans
            </TabsTrigger>
            <TabsTrigger value="approvals" className="gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Approvals
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <LineChart className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="plans">
            <PlanManagementDashboard />
          </TabsContent>

          <TabsContent value="approvals">
            <ApprovalWorkflowTracker />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsSnapshot />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
