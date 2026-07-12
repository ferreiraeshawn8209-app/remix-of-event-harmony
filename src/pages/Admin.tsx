import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2,
  LogOut,
  Plus,
  BarChart3,
  FileText,
  CalendarRange,
  Bell,
  Settings,
  Package2,
  Radio,
  Trash2,
  Archive,
  Download,
  Music,
  Calendar,
  Clock,
  Shield,
  Eye,
  Send,
  DollarSign,
  Users,
  Search,
  ChevronRight,
  Receipt,
  Mail,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuotes, DatabaseQuote } from "@/hooks/useQuotes";
import { usePackages } from "@/hooks/usePackages";
import { formatCurrency, QuoteData, calculateQuote } from "@/lib/pricing";
import { QuoteCalculator } from "@/components/QuoteCalculator";
import { toast } from "@/hooks/use-toast";
import { AdminAccountsTab } from "@/components/admin/AdminAccountsTab";
import { EventManager } from "@/components/admin/EventManager";
import { QuoteRequestsManager } from "@/components/admin/QuoteRequestsManager";
import { NotificationBell } from "@/components/admin/NotificationBell";
import { PackageManager } from "@/components/admin/PackageManager";
import { EquipmentManager } from "@/components/admin/EquipmentManager";
import { ExtraFeaturesManager } from "@/components/admin/ExtraFeaturesManager";
import { SpecialsManager } from "@/components/admin/SpecialsManager";
import { ServiceSettingsManager } from "@/components/admin/ServiceSettingsManager";
import { CalendarBookings } from "@/components/admin/CalendarBookings";
import { TracksManager } from "@/components/admin/TracksManager";
import { YoutubeManager } from "@/components/admin/YoutubeManager";
import { TestimonialsManager } from "@/components/admin/TestimonialsManager";
import { CompetitionsManager } from "@/components/admin/CompetitionsManager";
import { TermsUploader } from "@/components/admin/TermsUploader";
import { BusinessSettingsManager } from "@/components/admin/BusinessSettingsManager";
import { SupabaseEnvBadge } from "@/components/admin/SupabaseEnvBadge";
import { PageBackground } from "@/components/PageBackground";
import { useAlarms } from "@/hooks/useAlarms";
import { useSpecials } from "@/hooks/useSpecials";
import { useBrandingLogo } from "@/hooks/useBranding";
import { inferAutoDiscountPercent } from "@/lib/autoDiscount";
import { generateEventDayMonthlyPlan } from "@/lib/paymentPlanCalculator";
import { AnalyticsSnapshot } from "@/components/admin/AnalyticsSnapshot";
import { FinancialLog } from "@/components/admin/FinancialLog";
import { AlarmsManager } from "@/components/admin/AlarmsManager";
import { PlanManagementDashboard } from "@/components/admin/PlanManagementDashboard";
import { ApprovalWorkflowTracker } from "@/components/admin/ApprovalWorkflowTracker";
import { AuditLogViewer } from "@/components/admin/AuditLogViewer";
import { AdminReporting } from "@/components/admin/AdminReporting";
import { useEquipmentCatalog } from "@/hooks/useEquipmentCatalog";
import { CinematicAmbient } from "@/components/CinematicAmbient";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-500/20 text-blue-400 border-blue-400/30",
  accepted: "bg-success/20 text-success border-success/30",
  declined: "bg-destructive/20 text-destructive border-destructive/30",
  rejected: "bg-destructive/20 text-destructive border-destructive/30",
  paid: "bg-primary/20 text-primary border-primary/30",
  expired: "bg-muted text-muted-foreground",
};

function QuoteListItem({ 
  quote, 
  onView, 
  onDelete, 
  onStatusChange,
  isDeleting 
}: { 
  quote: DatabaseQuote; 
  onView: () => void; 
  onDelete: () => void;
  onStatusChange: (status: string) => void;
  isDeleting: boolean;
}) {
  return (
    <Card variant="glass">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <CardTitle className="text-base">
              {quote.client_name} • {quote.event_type || "Event"}
            </CardTitle>
            <CardDescription className="text-xs">
              {quote.email}
              {quote.event_date ? ` • ${new Date(quote.event_date).toLocaleDateString("en-ZA")}` : ""}
            </CardDescription>
          </div>
          <Badge variant="outline" className={statusClass(quote.status)}>{quote.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid md:grid-cols-3 gap-3 text-sm">
          <div><p className="text-muted-foreground">Total</p><p className="font-semibold text-primary">{formatCurrency(Number(quote.total))}</p></div>
          <div><p className="text-muted-foreground">Deposit</p><p className="font-semibold">{formatCurrency(Number(quote.deposit))}</p></div>
          <div><p className="text-muted-foreground">Balance</p><p className="font-semibold">{formatCurrency(Number(quote.balance))}</p></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={onView}><Eye className="w-3 h-3 mr-1" /> View</Button>
          <Button size="sm" variant="outline" onClick={() => onStatusChange("sent")}>Mark sent</Button>
          <Button size="sm" variant="outline" onClick={() => onStatusChange("accepted")}>Mark accepted</Button>
          <Button size="sm" variant="outline" onClick={() => onStatusChange("paid")}>Mark paid</Button>
          <Button size="sm" variant="ghost" className="text-destructive" disabled={isDeleting} onClick={onDelete}>
            <Trash2 className="w-3 h-3 mr-1" /> Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}


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

function QuotePipelineBoard({
  quotes,
  onSetStatus,
}: {
  quotes: DatabaseQuote[];
  onSetStatus: (quoteId: string, status: string) => Promise<void>;}) {
  const { items: equipmentCatalog } = useEquipmentCatalog();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

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

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === sorted.length) setSelected(new Set());
    else setSelected(new Set(sorted.map((q) => q.id)));
  };

  const bulkArchive = async () => {
    if (selected.size === 0) return;
    setBulkLoading(true);
    try {
      await Promise.all([...selected].map((id) => onSetStatus(id, "declined")));
      toast({ title: "Bulk archive", description: `${selected.size} quote(s) archived.` });
      setSelected(new Set());
    } finally {
      setBulkLoading(false);
    }
  };

  const bulkDelete = async () => {
    if (selected.size === 0) return;
    if (!window.confirm(`Delete ${selected.size} quote(s)? This cannot be undone.`)) return;
    setBulkLoading(true);
    try {
      await supabase.from("quotes").delete().in("id", [...selected]);
      toast({ title: "Bulk delete", description: `${selected.size} quote(s) deleted.` });
      setSelected(new Set());
    } finally {
      setBulkLoading(false);
    }
  };

  const bulkExport = () => {
    const rows = sorted.filter((q) => selected.has(q.id));
    const csv = [
      ["ID", "Client", "Email", "Event", "Date", "Total", "Status"].join(","),
      ...rows.map((q) =>
        [q.id, `"${q.client_name}"`, q.email, `"${q.event_type || ""}"`, q.event_date || "", q.total, q.status].join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quotes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
      {/* Bulk action toolbar */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-card/60 px-3 py-2">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={selected.size === sorted.length && sorted.length > 0}
            onCheckedChange={toggleAll}
            aria-label="Select all"
          />
          <span className="text-xs text-muted-foreground">
            {selected.size > 0 ? `${selected.size} selected` : "Select all"}
          </span>
        </div>
        {selected.size > 0 && (
          <>
            <Separator orientation="vertical" className="h-4" />
            <Button size="sm" variant="outline" onClick={bulkArchive} disabled={bulkLoading}>
              <Archive className="w-3.5 h-3.5 mr-1" /> Archive
            </Button>
            <Button size="sm" variant="outline" onClick={bulkExport} disabled={bulkLoading}>
              <Download className="w-3.5 h-3.5 mr-1" /> Export CSV
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={bulkDelete}
              disabled={bulkLoading}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
            </Button>
          </>
        )}
      </div>

      {sorted.map((quote) => (
        <Card key={quote.id} variant="glass" className={`border-border/60 ${selected.has(quote.id) ? "ring-1 ring-primary/40" : ""}`}>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={selected.has(quote.id)}
                  onCheckedChange={() => toggleSelect(quote.id)}
                  aria-label={`Select ${quote.client_name}`}
                  className="mt-0.5"
                />
                <div>
                  <CardTitle className="text-base">{quote.client_name} • {quote.event_type || "Event"}</CardTitle>
                  <CardDescription className="text-xs">
                    {quote.email}
                    {quote.event_date ? ` • ${new Date(quote.event_date).toLocaleDateString("en-ZA")}` : ""}
                    {quote.venue ? ` • ${quote.venue}` : ""}
                  </CardDescription>
                </div>
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
  const { user, profile, isAdmin, isLoading: authLoading, signOut } = useAuth(); revert-8-agent-client-quotes-1c3a
  const { quotes, isLoading: quotesLoading, createQuote, updateQuoteStatus, deleteQuote, isDeleting } = useQuotes();
  const { packages } = usePackages();
  const { activeSpecials } = useSpecials();
  const { dueCount } = useAlarms();
  const [activeTab, setActiveTab] = useState("quotes");
  const [requestPrefill, setRequestPrefill] = useState<QuoteData | undefined>(undefined);
  const [pendingRequestMeta, setPendingRequestMeta] = useState<{
    requestId: string;
    clientId: string;
    sourceType: "custom" | "package";
    packageId: string | null;
    packageName: string | null;
    paymentPreference: "deposit" | "monthly_installments";
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedQuote, setSelectedQuote] = useState<DatabaseQuote | null>(null);
  const [declineDialog, setDeclineDialog] = useState<{ quoteId: string; status: string } | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const logoImg = useBrandingLogo();
  const { quotes, isLoading: quotesLoading, updateQuoteStatus } = useQuotes();
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");

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
 revert-8-agent-client-quotes-1c3a
  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  useEffect(() => {
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    if (tab && TAB_SET.has(tab as AdminTab)) {
      setActiveTab(tab as AdminTab);
    }
  }, [location.search]);

  const setTab = (tab: AdminTab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(location.search);
    params.set("tab", tab);
    navigate({ pathname: "/admin", search: params.toString() }, { replace: true });
  };

 revert-8-agent-client-quotes-1c3a
  const handleSaveQuote = async (quoteData: QuoteData, calculations: ReturnType<typeof calculateQuote>) => {
    if (!profile) return;
    try {
      const createdQuote = await createQuote({
        quoteData,
        calculations,
        clientProfileId: pendingRequestMeta?.clientId || profile.id,
      });

      if (pendingRequestMeta?.requestId && (createdQuote as any)?.id) {
        const quotePatch: Record<string, unknown> = {
          source_type: pendingRequestMeta.sourceType,
          package_id: pendingRequestMeta.packageId,
          package_name: pendingRequestMeta.packageName,
          payment_structure: pendingRequestMeta.paymentPreference,
        };

        if (pendingRequestMeta.paymentPreference === "monthly_installments") {
          const eventDate = quoteData.eventDate ? new Date(quoteData.eventDate) : null;
          if (eventDate && !Number.isNaN(eventDate.getTime())) {
            const plan = generateEventDayMonthlyPlan(
              Number(calculations.total) || 0,
              new Date(),
              eventDate,
              "Monthly Installments",
            );
            const installments = plan.installments.map((item) => ({
              installment_number: item.installmentNumber,
              due_date: item.dueDate.toISOString().slice(0, 10),
              amount: Math.round(item.amount * 100) / 100,
              description: item.description,
            }));
            const firstInstallment = installments[0]?.amount ?? (Number(calculations.total) || 0);
            quotePatch.payment_plan_installments = installments;
            quotePatch.deposit = firstInstallment;
            quotePatch.balance = Math.round(((Number(calculations.total) || 0) - firstInstallment) * 100) / 100;
          } else {
            quotePatch.payment_structure = "deposit";
            quotePatch.payment_plan_installments = [];
          }
        } else {
          quotePatch.payment_plan_installments = [];
        }

        await Promise.all([
          supabase.from("quotes").update(quotePatch as any).eq("id", (createdQuote as any).id),
          supabase.from("quote_requests").update({
            status: "quoted",
            quote_id: (createdQuote as any).id,
          } as any).eq("id", pendingRequestMeta.requestId),
        ]);
        setPendingRequestMeta(null);
        setRequestPrefill(undefined);
        setPendingRequestMeta(null);
        sessionStorage.removeItem("prefill_quote_request");
      }

      setActiveTab("quotes");
    } catch (error) {
      console.error("Error creating quote:", error);
    }
  };

  const isArchivedStatus = (s?: string | null) => s === "declined" || s === "rejected";

  // Active = everything not archived; Archived = declined/rejected
  const activeQuotes = useMemo(() => quotes.filter(q => !isArchivedStatus(q.status)), [quotes]);
  const archivedQuotes = useMemo(
    () => quotes.filter(q => isArchivedStatus(q.status))
      .sort((a: any, b: any) => new Date(b.declined_at || b.updated_at || 0).getTime() - new Date(a.declined_at || a.updated_at || 0).getTime()),
    [quotes],
  );

  const matchesSearch = (quote: DatabaseQuote) => {
    const q = searchQuery.toLowerCase();
    return (
      quote.client_name.toLowerCase().includes(q) ||
      quote.email.toLowerCase().includes(q) ||
      (quote.venue?.toLowerCase() || "").includes(q)
    );
  const handleSignOut = async () => {
    await signOut();
    navigate("/", { replace: true });  };

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
            </Card> revert-8-agent-client-quotes-1c3a
          </div>

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-muted/50 border border-border/50 flex-wrap">
              <TabsTrigger value="requests">Quote Requests</TabsTrigger>
              <TabsTrigger value="quotes">Active Quotes</TabsTrigger>
              <TabsTrigger value="new-quote">New Quote</TabsTrigger>
              <TabsTrigger value="archived" className="relative">
                <Archive className="w-3.5 h-3.5 mr-1" /> Archived
                {archivedQuotes.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-muted text-muted-foreground">
                    {archivedQuotes.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="finance">Finance</TabsTrigger>
              <TabsTrigger value="events">Events & QR</TabsTrigger>
              <TabsTrigger value="equipment">Equipment</TabsTrigger>
              <TabsTrigger value="packages">Packages</TabsTrigger>
              <TabsTrigger value="settings">Pricing</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="invoices">Invoices</TabsTrigger>
              <TabsTrigger value="clients">Clients</TabsTrigger>
              <TabsTrigger value="specials">Specials</TabsTrigger>
              <TabsTrigger value="extra-features">Extra Features</TabsTrigger>
              <TabsTrigger value="youtube">YouTube</TabsTrigger>
              <TabsTrigger value="music">Music</TabsTrigger>
              <TabsTrigger value="competitions">Competitions</TabsTrigger>
              <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
              <TabsTrigger value="business">Branding & Banking</TabsTrigger>
              <TabsTrigger value="admins">Admins</TabsTrigger>
              <TabsTrigger value="alarms" className="relative">
                Alarms
                {dueCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-destructive text-destructive-foreground">
                    {dueCount}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="alarms">
              <AlarmsManager />
            </TabsContent>

            <TabsContent value="testimonials">
              <TestimonialsManager />
            </TabsContent>

            <TabsContent value="reviews">
              <ReviewsManager />
            </TabsContent>

            <TabsContent value="business">
              <BusinessSettingsManager />
            </TabsContent>

            <TabsContent value="calendar">
              <CalendarBookings quotes={quotes} />
            </TabsContent>

            <TabsContent value="finance">
              <FinancialLog quotes={quotes} />
            </TabsContent>

            <TabsContent value="events">
              <EventManager />
            </TabsContent>

            <TabsContent value="equipment">
              <EquipmentManager />
            </TabsContent>

            <TabsContent value="packages">
              <PackageManager />
            </TabsContent>

            <TabsContent value="settings">
              <ServiceSettingsManager />
            </TabsContent>

            <TabsContent value="documents">
              <TermsUploader />
            </TabsContent>

            <TabsContent value="quotes">
              <Card variant="glass">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle>Quote Management</CardTitle>
                      <CardDescription>View, edit, and manage all quotes</CardDescription>
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto">
                      <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          placeholder="Search clients..." 
                          className="pl-9"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Active</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="sent">Sent</SelectItem>
                          <SelectItem value="accepted">Accepted</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {quotesLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : filteredQuotes.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold text-lg mb-2">No Quotes Found</h3>
                      <p className="text-muted-foreground mb-4">
                        {quotes.length === 0 
                          ? "Create your first quote to get started." 
                          : "No quotes match your search criteria."}
                      </p>
                      <Button variant="hero" onClick={() => {
                        setRequestPrefill(undefined);
                        setPendingRequestMeta(null);
                        setActiveTab("new-quote");
                      }}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Quote
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredQuotes.map((quote) => (
                        <QuoteListItem
                          key={quote.id}
                          quote={quote}
                          onView={() => setSelectedQuote(quote)}
                          onDelete={() => handleDeleteQuote(quote.id)}
                          onStatusChange={(status) => handleStatusChange(quote.id, status)}
                          isDeleting={isDeleting}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="new-quote">
              <QuoteCalculator
                isAdmin={true}
                onSaveQuote={handleSaveQuote}
                initialData={requestPrefill}
              />
            </TabsContent>

            <TabsContent value="archived">
              <Card variant="glass">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Archive className="w-5 h-5 text-muted-foreground" /> Archived Quotes
                      </CardTitle>
                      <CardDescription>
                        Declined &amp; rejected quotes with reasons — useful for market research.
                      </CardDescription>
                    </div>
                    <div className="relative w-full sm:w-72">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search archived..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredArchived.length === 0 ? (
                    <div className="text-center py-12">
                      <Archive className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold text-lg mb-2">Nothing archived yet</h3>
                      <p className="text-muted-foreground text-sm">
                        When you mark a quote as declined or rejected, it'll appear here with the reason.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredArchived.map((quote: any) => (
                        <div key={quote.id} className="p-4 rounded-lg bg-muted/30 border border-border/40 space-y-3">
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div>
                              <div className="font-medium">{quote.client_name}</div>
                              <div className="text-xs text-muted-foreground">
                                {quote.event_type || "Event"} • {quote.venue || "Venue TBD"}
                                {quote.event_date && ` • ${new Date(quote.event_date).toLocaleDateString()}`}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                Archived{" "}
                                {quote.declined_at
                                  ? new Date(quote.declined_at).toLocaleString()
                                  : "(date unknown)"}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={statusColors[quote.status || "declined"]}>
                                {quote.status}
                              </Badge>
                              <span className="text-sm font-semibold text-muted-foreground">
                                {formatCurrency(Number(quote.total))}
                              </span>
                            </div>
                          </div>

                          <div className="bg-background/50 rounded-md p-3 border border-border/40">
                            <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
                              Reason (market research)
                            </p>
                            <p className="text-sm whitespace-pre-wrap">
                              {quote.decline_reason?.trim()
                                ? quote.decline_reason
                                : <span className="italic text-muted-foreground">No reason recorded.</span>}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link to={`/quote/${quote.id}`}>
                                <Eye className="w-3.5 h-3.5 mr-1" /> View
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStatusChange(quote.id, "draft")}
                            >
                              Restore to Draft
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete archived quote?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This permanently removes {quote.client_name}'s quote and its archived reason.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteQuote(quote.id)} disabled={isDeleting}>
                                    {isDeleting ? "Deleting..." : "Delete"}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>


            <TabsContent value="invoices">
              <Card variant="glass">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Invoice Management</CardTitle>
                      <CardDescription>Generate and track invoices from accepted quotes</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {quotes.filter(q => q.status === "accepted" || q.status === "paid").length === 0 ? (
                    <div className="text-center py-12">
                      <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold text-lg mb-2">No Invoiceable Quotes</h3>
                      <p className="text-muted-foreground">
                        Accept a quote first, then you can generate an invoice.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {quotes
                        .filter(q => q.status === "accepted" || q.status === "paid")
                        .map((quote) => (
                          <div key={quote.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Receipt className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <div className="font-medium">{quote.client_name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {quote.event_type} • {quote.event_date ? new Date(quote.event_date).toLocaleDateString() : "TBD"}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="font-semibold text-primary">{formatCurrency(Number(quote.total))}</div>
                                <Badge variant="outline" className={statusColors[quote.status || "draft"]}>
                                  {quote.status === "paid" ? "Paid" : "Invoice Ready"}
                                </Badge>
                              </div>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" title="Download PDF">
                                  <Download className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" title="Email Invoice">
                                  <Mail className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="clients">
              <Card variant="glass">
                <CardHeader>
                  <CardTitle>Client Database</CardTitle>
                  <CardDescription>View all clients, portal access history, and manage event photos</CardDescription>
                </CardHeader>
                <CardContent>
                  {quotes.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold text-lg mb-2">No Clients Yet</h3>
                      <p className="text-muted-foreground">
                        Clients will appear here once they create quotes.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Get unique clients */}
                      {Array.from(new Map(quotes.map(q => [q.email, q])).values()).map((quote) => {
                        const clientQuotes = quotes.filter(q => q.email === quote.email);
                        return (
                          <Card key={quote.email} variant="glass" className="border border-border/50">
                            <CardContent className="pt-4 space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center">
                                    <Users className="w-5 h-5 text-secondary" />
                                  </div>
                                  <div>
                                    <div className="font-medium">{quote.client_name}</div>
                                    <div className="text-sm text-muted-foreground">{quote.email}</div>
                                    {quote.contact_no && (
                                      <div className="text-xs text-muted-foreground">{quote.contact_no}</div>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right space-y-1">
                                  <div className="text-sm text-muted-foreground">
                                    {clientQuotes.length} quote(s)
                                  </div>
                                  {quote.client_code && (
                                    <Badge variant="outline" className="font-mono text-xs">{quote.client_code}</Badge>
                                  )}
                                </div>
                              </div>

                              {/* Client quotes with View as Client button */}
                              <div className="space-y-2">
                                {clientQuotes.map((cq) => (
                                  <div key={cq.id} className="flex items-center justify-between p-2 rounded bg-muted/20 text-sm">
                                    <div>
                                      <span className="font-medium">{cq.event_type || "Event"}</span>
                                      <span className="text-muted-foreground ml-2">
                                        {cq.event_date ? new Date(cq.event_date).toLocaleDateString("en-ZA") : "TBD"}
                                      </span>
                                      <span className="text-muted-foreground ml-2">{formatCurrency(Number(cq.total))}</span>
                                    </div>
                                    <div className="flex gap-1">
                                      <Button variant="ghost" size="sm" asChild>
                                        <Link to={`/quote/${cq.id}`}>
                                          <Eye className="w-3 h-3 mr-1" /> View
                                        </Link>
                                      </Button>
                                      {cq.client_code && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="text-xs"
                                          onClick={() => {
                                            const url = `/client?email=${encodeURIComponent(cq.email)}&code=${encodeURIComponent(cq.client_code)}`;
                                            window.open(url, "_blank");
                                          }}
                                        >
                                          <Eye className="w-3 h-3 mr-1" /> Client View
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Portal access logs */}
                              <div className="border-t border-border/30 pt-3">
                                <p className="text-xs font-semibold text-muted-foreground mb-2">Portal Access History</p>
                                <ClientAccessLogs email={quote.email} />
                              </div>

                              {/* Event photos uploader */}
                              {clientQuotes.filter(cq => cq.client_code).map((cq) => (
                                <div key={`photos-${cq.id}`} className="border-t border-border/30 pt-3">
                                  <EventPhotoUploader quoteId={cq.id} clientCode={cq.client_code} />
                                </div>
                              ))}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="specials">
              <SpecialsManager />
            </TabsContent>

            <TabsContent value="extra-features">
              <ExtraFeaturesManager />
            </TabsContent>

            <TabsContent value="youtube">
              <YoutubeManager />
            </TabsContent>

            <TabsContent value="music">
              <TracksManager />
            </TabsContent>

            <TabsContent value="competitions">
              <CompetitionsManager />
            </TabsContent>



            <TabsContent value="requests">
              <QuoteRequestsManager />
            </TabsContent>

            <TabsContent value="admins">
              <AdminAccountsTab />
            </TabsContent>
          </Tabs>
        </motion.div>
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
            <QuoteCalculator
              isAdmin
              onSaveQuote={() => {
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
            <AdminReporting quotes={quotes} />
            <AnalyticsSnapshot />
            <AuditLogViewer />
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
