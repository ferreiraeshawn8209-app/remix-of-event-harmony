import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, LogOut, Plus, BarChart3, FileText, CalendarRange, Bell, Settings, Package2, Radio } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { DatabaseQuote, useQuotes } from "@/hooks/useQuotes";
import { QuoteRequestsManager } from "@/components/admin/QuoteRequestsManager";
import { NotificationBell } from "@/components/admin/NotificationBell";
import { PackageManager } from "@/components/admin/PackageManager";
import { EquipmentManager } from "@/components/admin/EquipmentManager";
import { ExtraFeaturesManager } from "@/components/admin/ExtraFeaturesManager";
import { SpecialsManager } from "@/components/admin/SpecialsManager";
import { ServiceSettingsManager } from "@/components/admin/ServiceSettingsManager";
import { EventManager } from "@/components/admin/EventManager";
import { CalendarBookings } from "@/components/admin/CalendarBookings";
import { TracksManager } from "@/components/admin/TracksManager";
import { YoutubeManager } from "@/components/admin/YoutubeManager";
import { TestimonialsManager } from "@/components/admin/TestimonialsManager";
import { CompetitionsManager } from "@/components/admin/CompetitionsManager";
import { TermsUploader } from "@/components/admin/TermsUploader";
import { BusinessSettingsManager } from "@/components/admin/BusinessSettingsManager";
import { AdminAccountsTab } from "@/components/admin/AdminAccountsTab";
import { SupabaseEnvBadge } from "@/components/admin/SupabaseEnvBadge";
import { AnalyticsSnapshot } from "@/components/admin/AnalyticsSnapshot";
import { FinancialLog } from "@/components/admin/FinancialLog";
import { AlarmsManager } from "@/components/admin/AlarmsManager";
import { PlanManagementDashboard } from "@/components/admin/PlanManagementDashboard";
import { ApprovalWorkflowTracker } from "@/components/admin/ApprovalWorkflowTracker";
import { useQuoteRequests } from "@/hooks/useQuoteRequests";
import { QuoteCalculator } from "@/components/QuoteCalculator";
import { DJ_LIST, QuoteData } from "@/lib/pricing";
import { toast } from "@/hooks/use-toast";
import { useEquipmentCatalog } from "@/hooks/useEquipmentCatalog";
import { formatCurrency } from "@/lib/pricing";
import { CinematicAmbient } from "@/components/CinematicAmbient";

type AdminTab =
  | "overview"
  | "requests"
  | "quotes"
  | "new-quote"
  | "bookings"
  | "catalog"
  | "media"
  | "notifications"
  | "analytics"
  | "settings";

const TAB_SET = new Set<AdminTab>([
  "overview",
  "requests",
  "quotes",
  "new-quote",
  "bookings",
  "catalog",
  "media",
  "notifications",
  "analytics",
  "settings",
]);

function statusClass(status: string) {
  if (status === "paid") return "text-success border-success/30";
  if (status === "accepted") return "text-primary border-primary/30";
  if (status === "declined" || status === "rejected") return "text-destructive border-destructive/30";
  if (status === "sent") return "text-blue-400 border-blue-400/30";
  return "text-muted-foreground";
}

function buildPrefillFromRequest(payload: any): QuoteData | null {
  if (!payload) return null;
  return {
    clientName: payload.client_name || "",
    contactNo: payload.contact_no || "",
    email: payload.email || "",
    venue: [payload.venue_name, payload.venue_address].filter(Boolean).join(" — "),
    eventDate: payload.event_date || "",
    startTime: payload.start_time?.slice?.(0, 5) || "18:00",
    endTime: payload.end_time?.slice?.(0, 5) || "00:00",
    eventType: payload.event_type || "",
    djName: DJ_LIST[0],
    equipment: {},
    customItems: [],
    extras: [],
    kidsCorner: false,
    kidsHours: 0,
    humanJukebox: false,
    humanJukeboxHours: 0,
    travelDistance: 0,
    discountPercent: 0,
  };
}

function QuotePipelineBoard({
  quotes,
  onSetStatus,
}: {
  quotes: DatabaseQuote[];
  onSetStatus: (quoteId: string, status: string) => Promise<void>;
}) {
  const { items: equipmentCatalog } = useEquipmentCatalog();
  const equipmentNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    equipmentCatalog.forEach((item) => {
      map[item.item_key] = item.name;
    });
    return map;
  }, [equipmentCatalog]);

  const sorted = useMemo(
    () => [...quotes].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [quotes],
  );

  if (sorted.length === 0) {
    return (
      <Card variant="glass">
        <CardContent className="py-10 text-center text-muted-foreground">
          No quotes available yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {sorted.map((quote) => (
        <Card key={quote.id} variant="glass" className="border-border/60">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <CardTitle className="text-base">{quote.client_name} • {quote.event_type || "Event"}</CardTitle>
                <CardDescription className="text-xs">
                  {quote.email}
                  {quote.event_date ? ` • ${new Date(quote.event_date).toLocaleDateString("en-ZA")}` : ""}
                  {quote.venue ? ` • ${quote.venue}` : ""}
                </CardDescription>
              </div>
              <Badge variant="outline" className={statusClass(quote.status)}>
                {quote.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid md:grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Total</p>
                <p className="font-semibold text-primary">{formatCurrency(Number(quote.total))}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Deposit</p>
                <p className="font-semibold">{formatCurrency(Number(quote.deposit))}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Balance</p>
                <p className="font-semibold">{formatCurrency(Number(quote.balance))}</p>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              {(quote.equipment ? Object.entries(quote.equipment).filter(([, qty]) => Number(qty) > 0) : []).slice(0, 3).map(([key, qty]) => (
                <span key={key} className="mr-3">{equipmentNameMap[key] || key} × {qty}</span>
              ))}
            </div>
            <Separator />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => void onSetStatus(quote.id, "sent")}>Mark sent</Button>
              <Button size="sm" variant="outline" onClick={() => void onSetStatus(quote.id, "accepted")}>Mark accepted</Button>
              <Button size="sm" variant="outline" onClick={() => void onSetStatus(quote.id, "paid")}>Mark paid</Button>
              <Button size="sm" variant="outline" onClick={() => void onSetStatus(quote.id, "declined")}>Mark declined</Button>
              <Button size="sm" variant="ghost" asChild>
                <a href={`/quote/${quote.id}`}>Open quote</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function Admin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, isAdmin, isLoading: authLoading, signOut } = useAuth();
  const { quotes, isLoading: quotesLoading, updateQuoteStatus } = useQuotes();
  const { updateRequest } = useQuoteRequests();
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [requestPrefill, setRequestPrefill] = useState<QuoteData | null>(null);
  const [requestToResolve, setRequestToResolve] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth?redirect=/admin", { replace: true });
      return;
    }
    if (!isAdmin) {
      navigate("/client", { replace: true });
    }
  }, [authLoading, isAdmin, navigate, user]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    if (tab && TAB_SET.has(tab as AdminTab)) {
      setActiveTab(tab as AdminTab);
    }
    const fromRequest = params.get("fromRequest");
    if (fromRequest) {
      setRequestToResolve(fromRequest);
      try {
        const raw = sessionStorage.getItem("prefill_quote_request");
        if (raw) {
          const parsed = JSON.parse(raw);
          setRequestPrefill(buildPrefillFromRequest(parsed));
        }
      } catch {
        setRequestPrefill(null);
      }
    }
  }, [location.search]);

  const setTab = (tab: AdminTab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(location.search);
    params.set("tab", tab);
    if (tab !== "new-quote") {
      params.delete("fromRequest");
    }
    navigate({ pathname: "/admin", search: params.toString() }, { replace: true });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/", { replace: true });
  };

  const quoteStats = useMemo(() => {
    const total = quotes.length;
    const sent = quotes.filter((q) => q.status === "sent").length;
    const accepted = quotes.filter((q) => q.status === "accepted").length;
    const paid = quotes.filter((q) => q.status === "paid" || q.balance_paid).length;
    return { total, sent, accepted, paid };
  }, [quotes]);

  if (authLoading || quotesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin || !profile) return null;

  return (
    <div className="min-h-screen bg-background premium-page cinematic-shell">
      <CinematicAmbient intensity="soft" />
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/85 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-primary/80">BeatKulture Control</p>
            <h1 className="font-display text-2xl font-bold gradient-text">Admin Command Center</h1>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Button variant="outline" size="sm" onClick={() => setTab("new-quote")}>
              <Plus className="w-4 h-4 mr-1" />
              New Quote
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-1" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6 relative z-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Card variant="glass" className="border-primary/25"><CardContent className="py-4"><p className="text-xs text-muted-foreground">Quotes</p><p className="font-display text-2xl">{quoteStats.total}</p></CardContent></Card>
          <Card variant="glass" className="border-secondary/25"><CardContent className="py-4"><p className="text-xs text-muted-foreground">Sent</p><p className="font-display text-2xl">{quoteStats.sent}</p></CardContent></Card>
          <Card variant="glass" className="border-accent/25"><CardContent className="py-4"><p className="text-xs text-muted-foreground">Accepted</p><p className="font-display text-2xl">{quoteStats.accepted}</p></CardContent></Card>
          <Card variant="glass" className="border-primary/25"><CardContent className="py-4"><p className="text-xs text-muted-foreground">Paid</p><p className="font-display text-2xl">{quoteStats.paid}</p></CardContent></Card>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setTab(value as AdminTab)} className="space-y-4">
          <TabsList className="h-auto flex flex-wrap gap-1 justify-start">
            <TabsTrigger value="overview"><BarChart3 className="w-4 h-4 mr-1" />Overview</TabsTrigger>
            <TabsTrigger value="requests"><Bell className="w-4 h-4 mr-1" />Requests</TabsTrigger>
            <TabsTrigger value="quotes"><FileText className="w-4 h-4 mr-1" />Quotes</TabsTrigger>
            <TabsTrigger value="new-quote"><Plus className="w-4 h-4 mr-1" />New Quote</TabsTrigger>
            <TabsTrigger value="bookings"><CalendarRange className="w-4 h-4 mr-1" />Bookings</TabsTrigger>
            <TabsTrigger value="catalog"><Package2 className="w-4 h-4 mr-1" />Catalog</TabsTrigger>
            <TabsTrigger value="media"><Radio className="w-4 h-4 mr-1" />Media</TabsTrigger>
            <TabsTrigger value="notifications"><Bell className="w-4 h-4 mr-1" />Alerts</TabsTrigger>
            <TabsTrigger value="analytics"><BarChart3 className="w-4 h-4 mr-1" />Analytics</TabsTrigger>
            <TabsTrigger value="settings"><Settings className="w-4 h-4 mr-1" />Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card variant="glass">
              <CardHeader>
                <CardTitle>Operations overview</CardTitle>
                <CardDescription>Live admin modules for requests, planning, approvals and analytics.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <AnalyticsSnapshot />
                <PlanManagementDashboard />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests">
            <QuoteRequestsManager />
          </TabsContent>

          <TabsContent value="quotes">
            <QuotePipelineBoard
              quotes={quotes}
              onSetStatus={async (quoteId, status) => {
                await updateQuoteStatus(quoteId, status);
                toast({ title: "Status updated", description: `Quote marked as ${status}.` });
              }}
            />
          </TabsContent>

          <TabsContent value="new-quote" className="space-y-4">
            {requestToResolve && (
              <Card variant="glass">
                <CardContent className="py-3 flex items-center justify-between gap-2">
                  <p className="text-sm text-muted-foreground">
                    Building quote for request <span className="font-semibold text-foreground">{requestToResolve}</span>.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setRequestToResolve(null);
                      setRequestPrefill(null);
                      sessionStorage.removeItem("prefill_quote_request");
                      const params = new URLSearchParams(location.search);
                      params.delete("fromRequest");
                      navigate({ pathname: "/admin", search: params.toString() }, { replace: true });
                    }}
                  >
                    Clear request link
                  </Button>
                </CardContent>
              </Card>
            )}
            <QuoteCalculator
              isAdmin
              initialData={requestPrefill || undefined}
              onSaveQuote={async () => {
                if (requestToResolve) {
                  await updateRequest({ id: requestToResolve, updates: { status: "quoted" } });
                  sessionStorage.removeItem("prefill_quote_request");
                  setRequestToResolve(null);
                  setRequestPrefill(null);
                }
                setTab("quotes");
              }}
            />
          </TabsContent>

          <TabsContent value="bookings" className="space-y-4">
            <CalendarBookings quotes={quotes} />
            <EventManager />
          </TabsContent>

          <TabsContent value="catalog" className="space-y-4">
            <PackageManager />
            <EquipmentManager />
            <ExtraFeaturesManager />
            <SpecialsManager />
            <ServiceSettingsManager />
          </TabsContent>

          <TabsContent value="media" className="space-y-4">
            <TracksManager />
            <YoutubeManager />
            <TestimonialsManager />
            <CompetitionsManager />
            <TermsUploader />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <AlarmsManager />
            <ApprovalWorkflowTracker />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <FinancialLog quotes={quotes} />
            <AnalyticsSnapshot />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <BusinessSettingsManager />
            <AdminAccountsTab />
            <SupabaseEnvBadge />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
