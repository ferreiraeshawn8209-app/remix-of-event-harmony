import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, Calendar, AlertCircle, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/pricing";
import { DatabaseQuote } from "@/hooks/useQuotes";

interface ReportData {
  conversionRate: number;
  upcomingEvents: { id: string; client: string; date: string; type: string; venue: string }[];
  outstandingPayments: { id: string; client: string; balance: number; eventDate: string | null }[];
  popularPackages: { name: string; count: number }[];
  recentLogins: { email: string; timestamp: string }[];
}

export function AdminReporting({ quotes }: { quotes: DatabaseQuote[] }) {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // Conversion: sent → accepted
        const sent = quotes.filter((q) => ["sent", "accepted", "paid", "declined", "rejected"].includes(q.status));
        const converted = quotes.filter((q) => ["accepted", "paid"].includes(q.status));
        const conversionRate = sent.length > 0 ? Math.round((converted.length / sent.length) * 100) : 0;

        // Upcoming events (accepted/paid with future event date)
        const today = new Date().toISOString().slice(0, 10);
        const upcomingEvents = quotes
          .filter((q) => (q.status === "accepted" || q.status === "paid") && q.event_date && q.event_date >= today)
          .sort((a, b) => (a.event_date || "").localeCompare(b.event_date || ""))
          .slice(0, 8)
          .map((q) => ({
            id: q.id,
            client: q.client_name,
            date: q.event_date || "",
            type: q.event_type || "Event",
            venue: q.venue || "TBD",
          }));

        // Outstanding payments: deposit paid but balance not paid
        const outstandingPayments = quotes
          .filter((q) => q.deposit_paid && !q.balance_paid && Number(q.balance) > 0)
          .sort((a, b) => Number(b.balance) - Number(a.balance))
          .slice(0, 8)
          .map((q) => ({
            id: q.id,
            client: q.client_name,
            balance: Number(q.balance),
            eventDate: q.event_date,
          }));

        // Popular packages
        const pkgCount: Record<string, number> = {};
        quotes.forEach((q) => {
          if (q.package_name) {
            pkgCount[q.package_name] = (pkgCount[q.package_name] || 0) + 1;
          }
        });
        const popularPackages = Object.entries(pkgCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([name, count]) => ({ name, count }));

        // Recent logins from access logs
        const { data: logs } = await supabase
          .from("client_access_logs")
          .select("email, created_at")
          .order("created_at", { ascending: false })
          .limit(8);

        const recentLogins = (logs as any[] || []).map((l: any) => ({
          email: l.email || "Unknown",
          timestamp: l.created_at,
        }));

        setReport({ conversionRate, upcomingEvents, outstandingPayments, popularPackages, recentLogins });
      } finally {
        setLoading(false);
      }
    })();
  }, [quotes]);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card variant="glass">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Conversion Rate</p>
                <p className="text-3xl font-bold font-display text-primary">{report.conversionRate}%</p>
                <p className="text-xs text-muted-foreground mt-1">Sent → Accepted</p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary/40" />
            </div>
          </CardContent>
        </Card>
        <Card variant="glass">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Upcoming Events</p>
                <p className="text-3xl font-bold font-display text-secondary">{report.upcomingEvents.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Confirmed bookings</p>
              </div>
              <Calendar className="w-8 h-8 text-secondary/40" />
            </div>
          </CardContent>
        </Card>
        <Card variant="glass">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Outstanding Balances</p>
                <p className="text-3xl font-bold font-display text-warning">
                  {formatCurrency(report.outstandingPayments.reduce((s, p) => s + p.balance, 0))}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{report.outstandingPayments.length} client(s)</p>
              </div>
              <AlertCircle className="w-8 h-8 text-warning/40" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events list */}
      {report.upcomingEvents.length > 0 && (
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="w-4 h-4 text-secondary" /> Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {report.upcomingEvents.map((ev) => (
                <div key={ev.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/50 px-3 py-2 text-sm">
                  <div>
                    <span className="font-medium">{ev.client}</span>
                    <span className="text-muted-foreground ml-2">· {ev.type} · {ev.venue}</span>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {new Date(ev.date).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" })}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Outstanding Payments */}
      {report.outstandingPayments.length > 0 && (
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="w-4 h-4 text-warning" /> Outstanding Balance Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {report.outstandingPayments.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 rounded-lg border border-warning/20 bg-warning/5 px-3 py-2 text-sm">
                  <span className="font-medium">{p.client}</span>
                  <div className="flex items-center gap-2">
                    {p.eventDate && (
                      <span className="text-xs text-muted-foreground">
                        Event: {new Date(p.eventDate).toLocaleDateString("en-ZA")}
                      </span>
                    )}
                    <Badge variant="outline" className="text-warning border-warning/30">
                      {formatCurrency(p.balance)} due
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Popular Packages */}
      {report.popularPackages.length > 0 && (
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="w-4 h-4 text-primary" /> Popular Packages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-2">
              {report.popularPackages.map((pkg) => (
                <div key={pkg.name} className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2 text-sm">
                  <span className="font-medium truncate mr-2">{pkg.name}</span>
                  <Badge variant="outline">{pkg.count} booking{pkg.count !== 1 ? "s" : ""}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Logins */}
      {report.recentLogins.length > 0 && (
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-base">Recent Client Logins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {report.recentLogins.map((l, i) => (
                <div key={i} className="flex items-center justify-between text-sm px-2 py-1 rounded border border-border/40">
                  <span className="text-muted-foreground">{l.email}</span>
                  <time className="text-xs text-muted-foreground">
                    {new Date(l.timestamp).toLocaleString("en-ZA", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </time>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
