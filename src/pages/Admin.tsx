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
import { RecommendedVenuesManager } from "@/components/admin/RecommendedVenuesManager";
import { WeddingExposManager } from "@/components/admin/WeddingExposManager";
import { StaffManager } from "@/components/admin/StaffManager";
import { BusinessSettingsManager } from "@/components/admin/BusinessSettingsManager";
import { FinancialsReport } from "@/components/admin/FinancialsReport";
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
  | "financials"
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
  "financials",
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
  const { user, profile, isAdmin, isLoading: authLoading, signOut } = useAuth();
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

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  useEffect(() => {

    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    if (tab && TAB_SET.has(tab as AdminTab)) {
      setActiveTab(tab as AdminTab);
    }

    // If admin arrived from "Build Quote" on a client request, hydrate prefill
    const requestId = params.get("newQuoteRequest");
    if (requestId) {
      try {
        const raw = sessionStorage.getItem("prefill_quote_request");
        if (raw) {
          const r = JSON.parse(raw);
          const notesParts: string[] = [];
          if (r.guest_count) notesParts.push(`Guests: ~${r.guest_count}`);
          notesParts.push(`Venue type: ${r.is_outdoor ? "Outdoor" : "Indoor"}`);
          const reqs: string[] = [];
          if (r.needs_sound) reqs.push("Sound");
          if (r.needs_mic) reqs.push("Microphones");
          if (r.needs_lighting) reqs.push("Lighting");
          if (r.needs_special_effects) reqs.push("Special effects");
          if (reqs.length) notesParts.push(`Requested: ${reqs.join(", ")}`);
          if (r.notes) notesParts.push(`Client notes: ${r.notes}`);

          setRequestPrefill({
            clientName: r.client_name || "",
            contactNo: r.contact_no || "",
            email: r.email || "",
            venue: [r.venue_name, r.venue_address].filter(Boolean).join(" — "),
            eventDate: r.event_date || "",
            startTime: (r.start_time || "18:00").slice(0, 5),
            endTime: (r.end_time || "00:00").slice(0, 5),
            eventType: r.event_type || "",
            djName: "",
            equipment: {},
            customItems: [{ name: "Client requirements", price: 0, qty: 1 }].filter(() => notesParts.length > 0 && false),
            extras: [],
            kidsCorner: false,
            kidsHours: 0,
            humanJukebox: false,
            humanJukeboxHours: 0,
            travelDistance: 0,
            discountPercent: 0,
          } as QuoteData);

          setPendingRequestMeta({
            requestId,
            clientId: r.client_id,
            sourceType: r.package_id ? "package" : "custom",
            packageId: r.package_id || null,
            packageName: r.package_name || null,
            paymentPreference: "deposit",
          });

          // Show a toast so admin sees prefill loaded (notes shown in a toast)
          if (notesParts.length) {
            toast({ title: "Quote request loaded", description: notesParts.join(" • ") });
          }

          setActiveTab("new-quote");
        }
      } catch (e) {
        console.warn("Could not load quote request prefill", e);
      }
    }
  }, [location.search]);


  const setTab = (tab: AdminTab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(location.search);
    params.set("tab", tab);
    navigate({ pathname: "/admin", search: params.toString() }, { replace: true });
  };


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

        // Push quote to client immediately (visible in their dashboard as "sent")
        await updateQuoteStatus((createdQuote as any).id, "sent");

        setPendingRequestMeta(null);
        setRequestPrefill(undefined);
        sessionStorage.removeItem("prefill_quote_request");
        toast({ title: "Quote sent to client", description: "The client can now review and trim items in their dashboard." });
      }

      setActiveTab("quotes");
      // Clear the newQuoteRequest param from the URL
      navigate("/admin?tab=quotes", { replace: true });
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
            <TabsTrigger value="financials"><Receipt className="w-4 h-4 mr-1" />Financials</TabsTrigger>
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
            <StaffManager />
            <TracksManager />
            <YoutubeManager />
            <RecommendedVenuesManager />
            <WeddingExposManager />
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

          <TabsContent value="financials" className="space-y-4">
            <FinancialsReport quotes={quotes} />
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
