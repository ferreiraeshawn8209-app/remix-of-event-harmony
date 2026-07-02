import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, TrendingDown } from "lucide-react";
import type { DashboardAnalytics } from "@/packages/shared-types/admin-dashboard";

export function AnalyticsSnapshot() {
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      try {
        // Simulate analytics load (in production, would query Supabase analytics functions)
        await new Promise((resolve) => setTimeout(resolve, 500));

        const mockAnalytics: DashboardAnalytics = {
          totalPlansCreated: 42,
          plansWithTimeline: 38,
          plansWithVisualization: 31,
          plansWithRehearsal: 28,
          averageTimeToFirstTimeline: 8,
          approvalRate: 0.76,
          changesRequestedRate: 0.24,
          mostUsedHumorCategories: [
            { category: "mc-icebreaker", count: 87 },
            { category: "dance-floor", count: 65 },
            { category: "crowd-warmup", count: 52 },
          ],
          mostUsedSpeechRoles: [
            { role: "best-man", count: 34 },
            { role: "maid-of-honor", count: 28 },
            { role: "mc", count: 22 },
          ],
          clientSatisfaction: 4.6,
          avgSessionDuration: 18,
        };

        setAnalytics(mockAnalytics);
      } finally {
        setLoading(false);
      }
    };

    void loadAnalytics();
  }, []);

  if (loading) {
    return (
      <Card variant="glass">
        <CardContent className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return <Card variant="glass"><CardContent>Failed to load analytics.</CardContent></Card>;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <Card variant="glass">
          <CardContent className="pt-6">
            <p className="text-xs uppercase text-muted-foreground">Total plans</p>
            <p className="text-3xl font-bold">{analytics.totalPlansCreated}</p>
            <div className="flex items-center gap-1 mt-2 text-xs text-green-500">
              <TrendingUp className="w-3 h-3" /> Active growth
            </div>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardContent className="pt-6">
            <p className="text-xs uppercase text-muted-foreground">Timeline generation</p>
            <p className="text-3xl font-bold">{Math.round((analytics.plansWithTimeline / analytics.totalPlansCreated) * 100)}%</p>
            <p className="text-xs text-muted-foreground mt-2">{analytics.plansWithTimeline} of {analytics.totalPlansCreated} plans</p>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardContent className="pt-6">
            <p className="text-xs uppercase text-muted-foreground">Visualization adoption</p>
            <p className="text-3xl font-bold">{Math.round((analytics.plansWithVisualization / analytics.totalPlansCreated) * 100)}%</p>
            <p className="text-xs text-muted-foreground mt-2">{analytics.plansWithVisualization} of {analytics.totalPlansCreated} plans</p>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardContent className="pt-6">
            <p className="text-xs uppercase text-muted-foreground">Rehearsal adoption</p>
            <p className="text-3xl font-bold">{Math.round((analytics.plansWithRehearsal / analytics.totalPlansCreated) * 100)}%</p>
            <p className="text-xs text-muted-foreground mt-2">{analytics.plansWithRehearsal} of {analytics.totalPlansCreated} plans</p>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardContent className="pt-6">
            <p className="text-xs uppercase text-muted-foreground">Approval rate</p>
            <p className="text-3xl font-bold text-green-500">{Math.round(analytics.approvalRate * 100)}%</p>
            <p className="text-xs text-muted-foreground mt-2">vs {Math.round(analytics.changesRequestedRate * 100)}% changes requested</p>
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardContent className="pt-6">
            <p className="text-xs uppercase text-muted-foreground">Client satisfaction</p>
            <p className="text-3xl font-bold">{analytics.clientSatisfaction}/5</p>
            <p className="text-xs text-muted-foreground mt-2">Based on review feedback</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-base">Top humor categories</CardTitle>
            <CardDescription>Most requested by clients</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {analytics.mostUsedHumorCategories.map((category) => (
              <div key={category.category} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{category.category}</span>
                <Badge variant="outline">{category.count} uses</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-base">Top speech roles</CardTitle>
            <CardDescription>Most drafted by clients</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {analytics.mostUsedSpeechRoles.map((role) => (
              <div key={role.role} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{role.role}</span>
                <Badge variant="outline">{role.count} drafts</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
