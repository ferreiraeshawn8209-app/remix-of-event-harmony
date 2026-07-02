import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, CheckCircle2, LineChart } from "lucide-react";
import { PlanManagementDashboard } from "@/components/admin/PlanManagementDashboard";
import { ApprovalWorkflowTracker } from "@/components/admin/ApprovalWorkflowTracker";
import { AnalyticsSnapshot } from "@/components/admin/AnalyticsSnapshot";
import { CinematicAmbient } from "@/components/CinematicAmbient";
import { BeatkultureMascot } from "@/components/BeatkultureMascot";

export function AdminDashboardHub() {
  const [activeTab, setActiveTab] = useState("plans");

  return (
    <div className="cinematic-shell min-h-screen">
      <CinematicAmbient intensity="soft" />
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold gradient-text mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage plans, track approvals, and monitor platform analytics</p>
        </div>

        <Card variant="glass" className="feature-card-luxe mb-6 border-primary/20">
          <CardContent className="py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <BeatkultureMascot className="h-28 w-24" mood="idle" />
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-primary/80">Control Tower</p>
                <h2 className="font-display text-xl font-semibold">Operational overview with concierge-grade visuals</h2>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-black/30 border border-border/50">
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
