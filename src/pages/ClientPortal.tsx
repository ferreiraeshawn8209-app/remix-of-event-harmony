import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePackages, DbPackage } from "@/hooks/usePackages";
import { useSpecials } from "@/hooks/useSpecials";
import { useQuoteRequests } from "@/hooks/useQuoteRequests";
import { toast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/pricing";
import { QRCodeSVG } from "qrcode.react";
import { useBrandingLogo } from "@/hooks/useBranding";
import {
  Music,
  Loader2,
  FileText,
  CheckCircle2,
  Clock,
  Send,
  PartyPopper,
  Calendar,
  MapPin,
  User,
  CreditCard,
  Sparkles,
  ArrowLeft,
  Lightbulb,
  Mic,
  Speaker,
  Wand2,
  Users,
  LogOut,
  Minus,
  CloudSun,
  AlertTriangle,
} from "lucide-react";
import { ClientPhotoGallery } from "@/components/ClientPhotoGallery";
import { QuoteMessageThread } from "@/components/QuoteMessageThread";
import { PlannerHub } from "@/components/planner/PlannerHub";
import { YoutubeShowcase } from "@/components/YoutubeShowcase";
import { CompetitionsBanner } from "@/components/CompetitionsBanner";
import { PageBackground } from "@/components/PageBackground";
import { MusicPlayer } from "@/components/MusicPlayer";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { ExtraFeaturesScroller } from "@/components/client/ExtraFeaturesScroller";
import { generateMonthlyPlan } from "@/lib/paymentPlanCalculator";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import { resolveMixcloudProfileUrl } from "@/lib/mixcloud";

type View = "dashboard" | "questionnaire" | "quote";

type QuoteLineItem = {
  name: string;
  price: number;
  qty: number;
  supplier?: string;
};

type ClientRemovedItem = {
  kind: "custom_item" | "extra";
  name: string;
  price: number;
  qty: number;
  reason: string;
  removed_at: string;
};

interface QuestionnairePrefill {
  package_id?: string | null;
  package_name?: string | null;
}

interface QuestionnairePayload {
  client_id: string;
  client_name: string;
  email: string;
  contact_no: string | null;
  event_type: string;
  venue_name: string | null;
  venue_address: string | null;
  event_date: string | null;
  start_time: string | null;
  end_time: string | null;
  guest_count: number | null;
  city: string | null;
  is_outdoor: boolean;
  venue_provides_sound: boolean;
  requires_microphones: boolean;
  requires_lighting: boolean;
  requires_laser_effects: boolean;
  requires_smoke_machine: boolean;
  requires_fog_machine: boolean;
  requires_low_fog_machine: boolean;
  requires_cold_spark_machines: boolean;
  needs_sound: boolean;
  needs_lighting: boolean;
  needs_special_effects: boolean;
  needs_mic: boolean;
  package_id: string | null;
  package_name: string | null;
  notes: string | null;
  terms_accepted: boolean;
  terms_accepted_at: string;
}

interface QuoteData {
  id: string;
  client_id: string;
  client_code: string;
  client_name: string;
  email: string;
  contact_no: string | null;
  venue: string | null;
  event_date: string | null;
  start_time: string | null;
  end_time: string | null;
  event_type: string | null;
  dj_name: string | null;
  equipment: Record<string, number>;
  custom_items: QuoteLineItem[];
  custom_items_cost: number;
  extras: QuoteLineItem[];
  extras_cost: number;
  dj_cost: number;
  equipment_cost: number;
  kids_cost: number;
  kids_hours: number;
  kids_corner: boolean;
  subtotal: number;
  travel_cost: number;
  travel_distance: number;
  discount_percent: number;
  discount_amount: number;
  total: number;
  deposit: number;
  balance: number;
  hours: number;
  status: string;
  deposit_paid: boolean;
  deposit_paid_at: string | null;
  balance_paid: boolean;
  balance_paid_at: string | null;
  source_type: "custom" | "package";
  package_id: string | null;
  package_name: string | null;
  client_removed_items: ClientRemovedItem[];
  created_at: string;
}

const SOUND_SURCHARGE = 2050;
const MICROPHONE_SURCHARGE = 350;
const LIGHTING_SURCHARGE = 1200;
const LASER_SURCHARGE = 500;
const SMOKE_SURCHARGE = 400;
const FOG_SURCHARGE = 550;
const LOW_FOG_SURCHARGE = 700;
const COLD_SPARK_SURCHARGE = 1800;
const DEPOSIT_PERCENT = 0.3;

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function hydrateQuote(q: any): QuoteData {
  const customItems = Array.isArray(q.custom_items) ? q.custom_items : [];
  const sourceType =
    q.source_type ||
    (customItems.some((item: any) => typeof item?.name === "string" && item.name.startsWith("[PKG:"))
      ? "package"
      : "custom");

  return {
    ...q,
    equipment: q.equipment || {},
    custom_items: customItems,
    extras: Array.isArray(q.extras) ? q.extras : [],
    custom_items_cost: Number(q.custom_items_cost) || 0,
    extras_cost: Number(q.extras_cost) || 0,
    subtotal: Number(q.subtotal) || 0,
    travel_cost: Number(q.travel_cost) || 0,
    discount_percent: Number(q.discount_percent) || 0,
    discount_amount: Number(q.discount_amount) || 0,
    total: Number(q.total) || 0,
    deposit: Number(q.deposit) || 0,
    balance: Number(q.balance) || 0,
    dj_cost: Number(q.dj_cost) || 0,
    equipment_cost: Number(q.equipment_cost) || 0,
    kids_cost: Number(q.kids_cost) || 0,
    source_type: sourceType,
    package_id: q.package_id || null,
    package_name: q.package_name || null,
    client_removed_items: Array.isArray(q.client_removed_items) ? q.client_removed_items : [],
  } as QuoteData;
}

function hasCompleteEventProfile(profile: any) {
  return !!(
    profile?.event_type &&
    profile?.event_date &&
    profile?.venue_name &&
    profile?.venue_address &&
    profile?.start_time &&
    profile?.end_time &&
    profile?.guest_count &&
    profile?.event_setting &&
    profile?.city
  );
}

function buildSurchargeItems(payload: {
  venue_provides_sound: boolean;
  requires_microphones: boolean;
  requires_lighting: boolean;
  requires_laser_effects: boolean;
  requires_smoke_machine: boolean;
  requires_fog_machine: boolean;
  requires_low_fog_machine: boolean;
  requires_cold_spark_machines: boolean;
}) {
  return [
    ...(!payload.venue_provides_sound ? [{ name: "Sound equipment surcharge", price: SOUND_SURCHARGE, qty: 1 }] : []),
    ...(payload.requires_microphones ? [{ name: "Microphone surcharge", price: MICROPHONE_SURCHARGE, qty: 1 }] : []),
    ...(payload.requires_lighting ? [{ name: "Lighting surcharge", price: LIGHTING_SURCHARGE, qty: 1 }] : []),
    ...(payload.requires_laser_effects ? [{ name: "Laser effects surcharge", price: LASER_SURCHARGE, qty: 1 }] : []),
    ...(payload.requires_smoke_machine ? [{ name: "Smoke machine surcharge", price: SMOKE_SURCHARGE, qty: 1 }] : []),
    ...(payload.requires_fog_machine ? [{ name: "Fog machine surcharge", price: FOG_SURCHARGE, qty: 1 }] : []),
    ...(payload.requires_low_fog_machine ? [{ name: "Low fog machine surcharge", price: LOW_FOG_SURCHARGE, qty: 1 }] : []),
    ...(payload.requires_cold_spark_machines ? [{ name: "Cold spark surcharge", price: COLD_SPARK_SURCHARGE, qty: 1 }] : []),
  ];
}

function recalculateQuoteForClientReview(
  quote: QuoteData,
  customItems: QuoteLineItem[],
  extras: QuoteLineItem[],
) {
  const customItemsCost = roundCurrency(customItems.reduce((sum, item) => sum + Number(item.price) * Number(item.qty), 0));
  const extrasCost = roundCurrency(extras.reduce((sum, item) => sum + Number(item.price) * Number(item.qty), 0));
  const nonCustomSubtotal = roundCurrency(quote.subtotal - quote.custom_items_cost);
  const subtotal = roundCurrency(nonCustomSubtotal + customItemsCost);
  const discountAmount = roundCurrency(subtotal * (quote.discount_percent / 100));
  const total = roundCurrency(subtotal + quote.travel_cost + extrasCost - discountAmount);
  const deposit = roundCurrency(total * DEPOSIT_PERCENT);

  return {
    custom_items: customItems,
    custom_items_cost: customItemsCost,
    extras,
    extras_cost: extrasCost,
    subtotal,
    discount_amount: discountAmount,
    total,
    deposit,
    balance: roundCurrency(total - deposit),
  };
}

function isClientRemovableLineItem(item: QuoteLineItem, kind: "custom_item" | "extra") {
  if (kind === "extra") return Number(item.price) > 0;
  const lower = item.name.toLowerCase();
  if (lower.startsWith("[pkg:")) return false;
  if (lower.includes("deposit") || lower.includes("balance") || lower.includes("travel") || lower.includes("dj service")) return false;
  return Number(item.price) > 0;
}

function formatEventSetting(value: string | null | undefined) {
  if (!value) return "Not set";
  return value === "outdoor" ? "Outdoor" : "Indoor";
}

function ClientMusicDock({ autoplayTrigger, mixcloudUrl }: { autoplayTrigger: string; mixcloudUrl: string }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-4">
      <div className="mx-auto max-w-3xl">
        <MusicPlayer autoplayTrigger={autoplayTrigger} mixcloudUrl={mixcloudUrl} />
      </div>
    </div>
  );
}

function EventSnapshotCard({ profile }: { profile: any }) {
  const eventDate = profile?.event_date ? new Date(`${profile.event_date}T00:00:00`) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysUntil = eventDate ? Math.ceil((eventDate.getTime() - today.getTime()) / 86400000) : null;

  return (
    <Card variant="glass" className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="w-4 h-4 text-primary" /> Event countdown
        </CardTitle>
        <CardDescription>Your saved event profile drives quotes, planning, and weather.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-border/60 bg-background/40 p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Countdown</p>
          <p className="mt-2 font-display text-3xl font-bold text-primary">
            {daysUntil === null ? "—" : daysUntil < 0 ? "Event passed" : `${daysUntil} days`}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {profile?.event_type || "Event"} on {profile?.event_date ? new Date(profile.event_date).toLocaleDateString("en-ZA") : "TBD"}
          </p>
        </div>
        <div className="rounded-lg border border-border/60 bg-background/40 p-4 space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4" /> {profile?.venue_name || "Venue TBD"}
          </div>
          <p className="text-muted-foreground">{profile?.venue_address || "Venue address not saved"}</p>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" /> {profile?.start_time?.slice(0, 5) || "--:--"} - {profile?.end_time?.slice(0, 5) || "--:--"}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="w-4 h-4" /> {profile?.guest_count || 0} guests • {formatEventSetting(profile?.event_setting)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function WeatherCard({ eventDate, city }: { eventDate?: string | null; city?: string | null }) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string>("Weather preview will appear here once your event date and city are saved.");

  useEffect(() => {
    const run = async () => {
      if (!eventDate || !city) {
        setSummary("Weather preview will appear here once your event date and city are saved.");
        return;
      }

      const event = new Date(`${eventDate}T00:00:00`);
      const now = new Date();
      const daysAway = Math.ceil((event.getTime() - now.getTime()) / 86400000);
      if (daysAway > 16) {
        setSummary(`Forecasts for ${city} become available closer to ${new Date(eventDate).toLocaleDateString("en-ZA")}.`);
        return;
      }

      setLoading(true);
      try {
        const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
        const geoJson = await geoResponse.json();
        const place = geoJson?.results?.[0];
        if (!place) {
          setSummary(`We could not find a weather forecast for ${city} yet.`);
          return;
        }

        const weatherResponse = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto&forecast_days=16`,
        );
        const weatherJson = await weatherResponse.json();
        const index = weatherJson?.daily?.time?.findIndex((value: string) => value === eventDate);
        if (index === undefined || index < 0) {
          setSummary(`Forecasts for ${city} are not available for ${new Date(eventDate).toLocaleDateString("en-ZA")} yet.`);
          return;
        }

        const max = weatherJson.daily.temperature_2m_max[index];
        const min = weatherJson.daily.temperature_2m_min[index];
        setSummary(`${city}: ${Math.round(min)}°C to ${Math.round(max)}°C expected on ${new Date(eventDate).toLocaleDateString("en-ZA")}.`);
      } catch (error) {
        console.warn("Weather lookup failed:", error);
        setSummary(`Weather preview for ${city} is temporarily unavailable.`);
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [city, eventDate]);

  return (
    <Card variant="glass">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CloudSun className="w-4 h-4 text-primary" /> Weather widget
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        {loading ? <div className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading forecast…</div> : summary}
      </CardContent>
    </Card>
  );
}

export default function ClientPortal() {
  const { user, profile, isLoading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const logo = useBrandingLogo();
  const { packages } = usePackages();
  const { activeSpecials } = useSpecials();
  const { requests, createRequest, isCreating } = useQuoteRequests(profile?.id);
  const { get: getSetting } = useBusinessSettings();
  const mixcloudUrl = resolveMixcloudProfileUrl(getSetting("mixcloud_url"));

  const [view, setView] = useState<View>("dashboard");
  const [quotes, setQuotes] = useState<QuoteData[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [activeQuote, setActiveQuote] = useState<QuoteData | null>(null);
  const [equipmentNames, setEquipmentNames] = useState<Record<string, string>>({});
  const [actioning, setActioning] = useState(false);
  const [questionnairePrefill, setQuestionnairePrefill] = useState<QuestionnairePrefill | undefined>(undefined);
  const [submittingQuestionnaire, setSubmittingQuestionnaire] = useState(false);
  const paymentDetailsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth?redirect=/client");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!profile?.id) return;
    (async () => {
      setLoadingQuotes(true);
      const { data, error } = await supabase
        .from("quotes")
        .select("*")
        .eq("client_id", profile.id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setQuotes(data.map(hydrateQuote));
      }
      setLoadingQuotes(false);
    })();
  }, [profile?.id]);

  useEffect(() => {
    if (!user || !profile?.id || loadingQuotes || view !== "dashboard") return;
    const params = new URLSearchParams(location.search);
    const selectedPackageId = params.get("package");
    if (!selectedPackageId) return;

    const selectedPackage = packages.find((pkg) => pkg.id === selectedPackageId && pkg.is_active);
    if (!selectedPackage) return;

    setQuestionnairePrefill({
      package_id: selectedPackage.id,
      package_name: selectedPackage.name,
    });
    setView("questionnaire");
    navigate("/client", { replace: true });
  }, [user, profile, loadingQuotes, view, location.search, packages, navigate]);

  useEffect(() => {
    if (!user || !profile) return;
    const mostRecent = quotes[0];
    supabase.rpc("log_client_portal_visit" as any, {
      _quote_id: mostRecent?.id ?? null,
      _client_code: mostRecent?.client_code ?? "",
      _email: profile.email ?? user.email ?? "",
      _user_agent: navigator.userAgent,
    }).then(({ error }) => {
      if (error) console.warn("Portal visit log failed:", error.message);
    });
  }, [user?.id, profile?.id, quotes.length]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("equipment_catalog").select("item_key, name").eq("is_active", true);
      if (data) {
        const map: Record<string, string> = {};
        data.forEach((entry: any) => { map[entry.item_key] = entry.name; });
        setEquipmentNames(map);
      }
    })();
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleQuestionnaireSubmit = async (payload: QuestionnairePayload) => {
    setSubmittingQuestionnaire(true);
    try {
      await createRequest(payload as any);
      setQuestionnairePrefill(undefined);
      setView("dashboard");
    } finally {
      setSubmittingQuestionnaire(false);
    }
  };

  const packagesByCategory = useMemo(() => {
    const map: Record<string, DbPackage[]> = {};
    packages.filter((pkg) => pkg.is_active).forEach((pkg) => {
      const key = pkg.category || "other";
      if (!map[key]) map[key] = [];
      map[key].push(pkg);
    });
    return map;
  }, [packages]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (view === "dashboard") {
    const plannerReadyQuote = quotes.find((q) => q.deposit_paid && (q.status === "accepted" || q.status === "paid"));
    const eventProfileReady = hasCompleteEventProfile(profile);

    return (
      <div className="min-h-screen bg-background pb-44 relative isolate">
        <PageBackground pageKey="bg_client_portal" />
        <Header onSignOut={handleSignOut} profile={profile} logo={logo} />
        <main className="container mx-auto px-4 py-6 max-w-5xl space-y-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
            <h1 className="font-display text-2xl md:text-3xl font-bold">
              Welcome, <span className="gradient-text">{profile?.full_name || user.email}</span>
            </h1>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              Review your saved event details, choose a package or custom quote flow, and manage every quote from one place.
            </p>
          </motion.div>

          {!eventProfileReady && (
            <Card variant="glass" className="border-yellow-500/30 bg-yellow-500/10">
              <CardContent className="py-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">Complete your saved event profile</p>
                    <p className="text-xs text-muted-foreground">
                      Quotes now use your sign-up event details automatically. Add any missing event information before requesting a package or custom quote.
                    </p>
                  </div>
                </div>
                <Button variant="hero" size="sm" asChild>
                  <Link to="/profile">Update event profile</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <EventSnapshotCard profile={profile} />
            <WeatherCard eventDate={profile?.event_date} city={profile?.city} />
          </div>

          <PlannerHub
            scopeKey={profile?.id || user.id}
            quote={quotes[0] ? {
              id: quotes[0].id,
              event_type: quotes[0].event_type,
              event_date: quotes[0].event_date,
              venue: quotes[0].venue,
              start_time: quotes[0].start_time,
              end_time: quotes[0].end_time,
            } : undefined}
          />

          {plannerReadyQuote && (
            <Card variant="glass" className="border-primary/50 bg-primary/5">
              <CardContent className="py-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <Calendar className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">Complete your Event Planner</p>
                    <p className="text-xs text-muted-foreground leading-relaxed max-w-md">
                      Your quote is accepted and your deposit has been received. Complete your event planner, including your 35-50 song list and event cue songs.
                    </p>
                  </div>
                </div>
                <Button variant="hero" size="sm" asChild>
                  <Link to={`/event-planner/${plannerReadyQuote.id}`}>
                    <Calendar className="w-4 h-4 mr-2" /> Open Event Planner
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {activeSpecials.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> Current Specials
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {activeSpecials.map((special) => (
                  <div key={special.id} className="relative rounded-xl overflow-hidden border border-primary/20">
                    <div className="w-full aspect-[16/9] bg-muted/40 flex items-center justify-center">
                      <img src={special.image_url} alt={special.title || "Special"} className="w-full h-full object-contain" />
                    </div>
                    {special.title && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                        <p className="text-white text-sm font-semibold">{special.title}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          <ExtraFeaturesScroller />

          <Card
            variant="glass"
            className="relative overflow-hidden border-2 border-fuchsia-400/60 bg-gradient-to-r from-fuchsia-500/20 via-purple-500/25 to-primary/15 shadow-[0_0_0_1px_rgba(255,255,255,0.14),0_18px_40px_-20px_hsl(289_100%_62%)]"
          >
            <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-fuchsia-400/30 blur-xl" />
            <CardContent className="py-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-fuchsia-100 flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-fuchsia-200" />
                  Need a customised quote?
                </p>
                <p className="text-xs text-muted-foreground">
                  Start the same final questionnaire flow and BeatKulture Entertainment will build your custom quote from the event details already saved on your account.
                </p>
              </div>
              <Button
                variant="default"
                className="relative bg-gradient-to-r from-fuchsia-500 via-purple-500 to-primary text-white border border-white/30 hover:from-fuchsia-400 hover:via-purple-400 hover:to-primary/90 shadow-[0_10px_24px_-12px_hsl(289_100%_62%)]"
                disabled={!eventProfileReady}
                onClick={() => {
                  setQuestionnairePrefill({ package_id: null, package_name: null });
                  setView("questionnaire");
                }}
              >
                <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
                Create My Signature Quote
              </Button>
            </CardContent>
          </Card>

          <section className="space-y-4">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <PartyPopper className="w-4 h-4 text-primary" /> Available packages
            </h2>
            {Object.keys(packagesByCategory).length === 0 ? (
              <p className="text-xs text-muted-foreground">No packages available right now.</p>
            ) : (
              (["wedding", "corporate", "party", "other"] as const)
                .filter((category) => packagesByCategory[category])
                .map((category) => (
                  <div key={category} className="space-y-2">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                      {category === "party" ? "Private Party" : category.charAt(0).toUpperCase() + category.slice(1)} Packages
                    </p>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {packagesByCategory[category].map((pkg) => (
                        <Card key={pkg.id} variant="glass" className={pkg.popular ? "border-primary/30 overflow-hidden" : "overflow-hidden"}>
                          {pkg.image_url && (
                            <div className="w-full h-64 bg-muted/40 flex items-center justify-center">
                              <img src={pkg.image_url} alt={pkg.name} className="w-full h-full object-cover" loading="lazy" />
                            </div>
                          )}
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between">
                              <CardTitle className="text-base">{pkg.name}</CardTitle>
                              {pkg.popular && <Badge className="bg-primary text-primary-foreground text-[10px]">Popular</Badge>}
                            </div>
                            <CardDescription className="text-xs">{pkg.description}</CardDescription>
                            <p className="text-primary font-bold text-sm pt-1">{formatCurrency(pkg.price)}</p>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <ul className="text-xs text-muted-foreground space-y-1">
                              {(pkg.includes || []).map((item, index) => (
                                <li key={index} className="flex items-start gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                                  <span className="whitespace-pre-wrap">{item}</span>
                                </li>
                              ))}
                            </ul>
                            <Button
                              variant="hero"
                              size="sm"
                              className="w-full"
                              disabled={!eventProfileReady}
                              onClick={() => {
                                setQuestionnairePrefill({ package_id: pkg.id, package_name: pkg.name });
                                setView("questionnaire");
                              }}
                            >
                              Select Package
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))
            )}
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> My Requests &amp; Quotes
            </h2>

            {loadingQuotes ? (
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            ) : (
              <div className="space-y-2">
                {requests.filter((request) => !request.quote_id).map((request) => (
                  <Card key={request.id} variant="glass">
                    <CardContent className="py-3 flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <p className="text-sm font-semibold">
                          {request.event_type}{request.package_name ? ` — ${request.package_name}` : " — Custom quote"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {request.event_date ? new Date(request.event_date).toLocaleDateString("en-ZA") : "Date TBD"}
                          {request.venue_name ? ` • ${request.venue_name}` : ""}
                        </p>
                      </div>
                      <Badge variant="outline" className="capitalize">{request.status.replace("_", " ")}</Badge>
                    </CardContent>
                  </Card>
                ))}

                {quotes.map((quote) => (
                  <Card key={quote.id} variant="glass">
                    <CardContent className="py-3 flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <p className="text-sm font-semibold">
                          {quote.package_name || quote.event_type || "Event"} • <span className="font-mono text-xs">{quote.client_code}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {quote.event_date ? new Date(quote.event_date).toLocaleDateString("en-ZA") : "Date TBD"}
                          {quote.venue ? ` • ${quote.venue}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">{quote.status}</Badge>
                        <Button size="sm" variant="outline" onClick={() => { setActiveQuote(quote); setView("quote"); }}>
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {requests.length === 0 && quotes.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    You do not have any requests or quotes yet. Select a package or start a custom quote above.
                  </p>
                )}
              </div>
            )}
          </section>

          <CompetitionsBanner />
          <TestimonialsSection quoteId={quotes[0]?.id} />
          <YoutubeShowcase />
        </main>
        <ClientMusicDock autoplayTrigger={user.id} mixcloudUrl={mixcloudUrl} />
      </div>
    );
  }

  if (view === "questionnaire") {
    const selectedPackage = questionnairePrefill?.package_id
      ? packages.find((pkg) => pkg.id === questionnairePrefill.package_id && pkg.is_active) || null
      : null;

    return (
      <div className="min-h-screen bg-background relative pb-44 isolate">
        <PageBackground pageKey="bg_client_portal" />
        <Questionnaire
          profile={profile}
          userEmail={user.email || ""}
          selectedPackage={selectedPackage}
          onCancel={() => {
            setQuestionnairePrefill(undefined);
            setView("dashboard");
          }}
          onSubmit={handleQuestionnaireSubmit}
          submitting={submittingQuestionnaire || isCreating}
        />
        <ClientMusicDock autoplayTrigger={user.id} mixcloudUrl={mixcloudUrl} />
      </div>
    );
  }

  if (view === "quote" && activeQuote) {
    const quote = activeQuote;
    const isPaid = quote.deposit_paid;
    const isFullyPaid = quote.balance_paid;
    const plannerUnlocked = isPaid && (quote.status === "accepted" || quote.status === "paid");
    const eventDate = quote.event_date ? new Date(quote.event_date) : null;
    const now = new Date();
    const isPastEventDate = !!eventDate && eventDate < now;
    const serviceBlocked = isPastEventDate && !isFullyPaid;
    const paymentPlan = eventDate && !Number.isNaN(eventDate.getTime())
      ? generateMonthlyPlan(Number(quote.total || 0), eventDate, "AI Installment Plan")
      : null;
    const songRequestUrl = `${window.location.origin}/request/${quote.id}`;
    const canClientAdjustCustomQuote = quote.source_type === "custom" && !quote.deposit_paid && !["accepted", "paid", "declined"].includes(quote.status);
    const canProceedToPayment = quote.status === "accepted" && !quote.deposit_paid;

    const syncQuoteState = (updatedQuote: QuoteData) => {
      setActiveQuote(updatedQuote);
      setQuotes((previous) => previous.map((entry) => entry.id === updatedQuote.id ? updatedQuote : entry));
    };

    const handleAccept = async () => {
      setActioning(true);
      const { error } = await supabase.from("quotes").update({ status: "accepted" }).eq("id", quote.id);
      if (!error) {
        await supabase.from("admin_notifications").insert({
          type: "quote_accepted",
          title: "Quote Accepted",
          message: `${quote.client_name} (${quote.client_code}) accepted their quote of ${formatCurrency(Number(quote.total))}.`,
          quote_id: quote.id,
          client_code: quote.client_code,
          email: quote.email,
        } as any);
        syncQuoteState({ ...quote, status: "accepted" });
        toast({ title: "Quote Accepted ✓", description: "Your updated total is now ready for payment." });
        setTimeout(() => paymentDetailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
      } else {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
      setActioning(false);
    };

    const handleDecline = async () => {
      setActioning(true);
      const { error } = await supabase.from("quotes").update({ status: "declined" }).eq("id", quote.id);
      if (!error) {
        await supabase.from("admin_notifications").insert({
          type: "quote_declined",
          title: "Quote Declined",
          message: `${quote.client_name} (${quote.client_code}) declined their quote.`,
          quote_id: quote.id,
          client_code: quote.client_code,
          email: quote.email,
        } as any);
        syncQuoteState({ ...quote, status: "declined" });
        toast({ title: "Quote Declined" });
      }
      setActioning(false);
    };

    const handleRemoveLineItem = async (kind: "custom_item" | "extra", index: number) => {
      const lineItem = kind === "custom_item" ? quote.custom_items[index] : quote.extras[index];
      if (!lineItem) return;

      const reason = window.prompt(
        `Why would you like to remove "${lineItem.name}"?\n\nExamples:\n- We no longer require this item.\n- Budget constraints.\n- We have sourced this elsewhere.`,
      );

      if (!reason || !reason.trim()) return;

      const customItems = kind === "custom_item"
        ? quote.custom_items.filter((_, itemIndex) => itemIndex !== index)
        : quote.custom_items;
      const extras = kind === "extra"
        ? quote.extras.filter((_, itemIndex) => itemIndex !== index)
        : quote.extras;
      const recalculated = recalculateQuoteForClientReview(quote, customItems, extras);
      const removalRecord: ClientRemovedItem = {
        kind,
        name: lineItem.name,
        price: Number(lineItem.price),
        qty: Number(lineItem.qty),
        reason: reason.trim(),
        removed_at: new Date().toISOString(),
      };

      setActioning(true);
      try {
        const { data, error } = await supabase
          .from("quotes")
          .update({
            ...recalculated,
            client_removed_items: [...quote.client_removed_items, removalRecord],
          } as any)
          .eq("id", quote.id)
          .select("*")
          .single();

        if (error) {
          toast({ title: "Unable to update quote", description: error.message, variant: "destructive" });
          return;
        }

        await Promise.all([
          supabase.from("admin_notifications").insert({
            type: "client_quote_updated",
            title: "Client modified a custom quote",
            message: `${quote.client_name} removed ${lineItem.name} from custom quote ${quote.client_code}. Reason: ${reason.trim()}`,
            quote_id: quote.id,
            client_code: quote.client_code,
            email: quote.email,
          } as any),
          supabase.from("quote_messages").insert({
            quote_id: quote.id,
            sender_id: user.id,
            sender_role: "client",
            sender_name: quote.client_name || profile?.full_name || "Client",
            message: `Removed "${lineItem.name}" from the custom quote. Reason: ${reason.trim()}`,
          } as any),
        ]);

        syncQuoteState(hydrateQuote(data));
        toast({ title: "Quote updated", description: "The total has been recalculated and the admin has been notified." });
      } finally {
        setActioning(false);
      }
    };

    const handleProceedToPayment = async () => {
      try {
        await navigator.clipboard.writeText(quote.client_code);
      } catch {
        // ignore clipboard failures
      }
      paymentDetailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      toast({
        title: "Proceed to payment",
        description: "Your client code has been copied. Use the updated total and deposit amount below for payment.",
      });
    };

    return (
      <div className="min-h-screen bg-background relative pb-44 isolate">
        <PageBackground pageKey="bg_client_portal" />
        <Header
          onSignOut={handleSignOut}
          profile={profile}
          logo={logo}
          extra={
            <Button variant="ghost" size="sm" onClick={() => setView("dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Dashboard
            </Button>
          }
        />
        <main className="container mx-auto px-4 py-6 max-w-3xl space-y-4">
          <Card variant="glass" className={`border-l-4 ${isFullyPaid ? "border-l-green-500" : isPaid ? "border-l-blue-500" : "border-l-orange-500"}`}>
            <CardContent className="py-4 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                {isFullyPaid ? <CheckCircle2 className="w-7 h-7 text-green-500" />
                  : isPaid ? <CreditCard className="w-7 h-7 text-blue-500" />
                  : <Clock className="w-7 h-7 text-orange-500" />}
                <div>
                  <p className="font-semibold text-sm">
                    {isFullyPaid ? "Fully Paid ✓" : isPaid ? "Deposit Paid" : "Awaiting Deposit"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Status: <span className="capitalize">{quote.status}</span>
                    {quote.package_name ? ` • ${quote.package_name}` : quote.source_type === "custom" ? " • Custom quote" : ""}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="font-display text-xl font-bold">{formatCurrency(Number(quote.total))}</p>
              </div>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" /> Your Quote
              </CardTitle>
              <CardDescription>
                Ref: <span className="font-mono">{quote.client_code}</span> • Created {new Date(quote.created_at).toLocaleDateString("en-ZA")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-muted-foreground"><User className="w-3 h-3" /> {quote.client_name}</div>
                  <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="w-3 h-3" /> {quote.venue || "TBD"}</div>
                  <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="w-3 h-3" /> {quote.event_date ? new Date(quote.event_date).toLocaleDateString("en-ZA") : "TBD"}</div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-muted-foreground"><Clock className="w-3 h-3" /> {quote.start_time?.slice(0, 5) || ""} – {quote.end_time?.slice(0, 5) || ""}</div>
                  <div className="flex items-center gap-2 text-muted-foreground"><PartyPopper className="w-3 h-3" /> {quote.event_type || "N/A"}</div>
                  <div className="flex items-center gap-2 text-muted-foreground"><Music className="w-3 h-3" /> DJ: {quote.dj_name || "TBD"}</div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex justify-between font-medium">
                  <span>DJ Service ({quote.hours} hours)</span>
                  <span>{formatCurrency(Number(quote.dj_cost))}</span>
                </div>

                {Object.entries(quote.equipment || {}).map(([key, qty]) => Number(qty) > 0 && (
                  <div key={key} className="flex justify-between text-muted-foreground">
                    <span>{equipmentNames[key] || key} × {qty}</span>
                    <span>Included</span>
                  </div>
                ))}

                {quote.custom_items.map((item, index) => (
                  <div key={`${item.name}-${index}`} className="flex items-center justify-between gap-3">
                    <div className="text-muted-foreground">
                      <span>{item.name} × {item.qty}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>{formatCurrency(Number(item.price) * Number(item.qty))}</span>
                      {canClientAdjustCustomQuote && isClientRemovableLineItem(item, "custom_item") && (
                        <Button size="sm" variant="outline" disabled={actioning} onClick={() => handleRemoveLineItem("custom_item", index)}>
                          <Minus className="w-3 h-3 mr-1" /> Remove
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                {quote.extras.map((item, index) => (
                  <div key={`${item.name}-${index}`} className="flex items-center justify-between gap-3">
                    <div className="text-muted-foreground">
                      <span>{item.name} × {item.qty}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>{formatCurrency(Number(item.price) * Number(item.qty))}</span>
                      {canClientAdjustCustomQuote && isClientRemovableLineItem(item, "extra") && (
                        <Button size="sm" variant="outline" disabled={actioning} onClick={() => handleRemoveLineItem("extra", index)}>
                          <Minus className="w-3 h-3 mr-1" /> Remove
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {canClientAdjustCustomQuote && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs text-muted-foreground">
                  Custom quotes can be reduced here before payment. You may remove optional extras or services, but you cannot add items or change prices yourself.
                </div>
              )}

              {quote.client_removed_items.length > 0 && (
                <div className="rounded-lg border border-border p-3 space-y-2">
                  <p className="font-semibold text-sm">Removed items</p>
                  {quote.client_removed_items.map((item, index) => (
                    <div key={`${item.removed_at}-${index}`} className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{item.name}</span> removed — {item.reason}
                    </div>
                  ))}
                  <p className="text-[11px] text-primary">
                    The updated total below is the amount that will be used for payment and deposit calculations.
                  </p>
                </div>
              )}

              <Separator />

              <div className="space-y-1">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(Number(quote.subtotal))}</span></div>
                {Number(quote.extras_cost) > 0 && (
                  <div className="flex justify-between text-muted-foreground"><span>Extras</span><span>{formatCurrency(Number(quote.extras_cost))}</span></div>
                )}
                {Number(quote.travel_cost) > 0 && (
                  <div className="flex justify-between text-muted-foreground"><span>Travel</span><span>{formatCurrency(Number(quote.travel_cost))}</span></div>
                )}
                {Number(quote.discount_amount) > 0 && (
                  <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatCurrency(Number(quote.discount_amount))}</span></div>
                )}
                <Separator />
                <div className="flex justify-between font-display font-bold text-lg pt-1">
                  <span>Total</span><span>{formatCurrency(Number(quote.total))}</span>
                </div>
                <div className="flex justify-between text-primary font-semibold">
                  <span>30% Deposit</span><span>{formatCurrency(Number(quote.deposit))}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Balance</span><span>{formatCurrency(Number(quote.balance))}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-primary/10 border border-primary/30 text-xs space-y-1">
                <p className="font-semibold text-sm text-primary">30% Deposit Required</p>
                <p className="text-muted-foreground leading-relaxed">
                  A <strong className="text-foreground">non-refundable 30% deposit</strong> ({formatCurrency(Number(quote.deposit))}) secures your booking date.
                  The <strong className="text-foreground">remaining balance</strong> ({formatCurrency(Number(quote.balance))}) is payable
                  <strong className="text-foreground"> on or before the day of your event</strong>, prior to the DJ performing.
                </p>
              </div>

              {paymentPlan && (
                <div className="p-3 rounded-lg bg-muted/20 border border-border text-xs space-y-2">
                  <p className="font-semibold text-sm">AI Payment Plan</p>
                  <p className="text-muted-foreground">
                    Total split across remaining months before your event. Final installment is scheduled before event day.
                  </p>
                  <div className="space-y-1">
                    {paymentPlan.installments.map((installment) => (
                      <div key={installment.installmentNumber} className="flex items-center justify-between">
                        <span>{installment.installmentNumber}. {installment.description}</span>
                        <span className="font-medium">{formatCurrency(installment.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {serviceBlocked && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/40 text-xs">
                  <p className="font-semibold text-destructive">DJ service blocked until fully settled</p>
                  <p className="text-muted-foreground mt-1">
                    Your event date has been reached and payment is not fully complete. Full settlement is required before service can proceed.
                  </p>
                </div>
              )}

              <div ref={paymentDetailsRef} className="p-3 rounded-lg bg-muted/30 border border-border text-xs space-y-1">
                <p className="font-semibold text-sm">Banking Details</p>
                <p>Bank: First National Bank</p>
                <p>Account: BEATKULTURE (PTY) LTD</p>
                <p>Account No: 63189325905</p>
                <p>Branch Code: 250655</p>
                <p className="text-muted-foreground">Use your client code <strong className="font-mono">{quote.client_code}</strong> as reference.</p>
              </div>

              <div className="p-3 rounded-lg bg-muted/20 border border-border text-[11px] space-y-0.5 text-muted-foreground">
                <p className="font-semibold text-foreground text-xs mb-1">BeatKulture Entertainment (Pty) Ltd</p>
                <p>Registration No: 2025/533623/07</p>
                <p>Contact: +27 65 528 5528</p>
                <p>Based in Hatfield, Pretoria — serving all of South Africa.</p>
              </div>

              {quote.status !== "accepted" && quote.status !== "paid" && quote.status !== "declined" && (
                <div className="grid sm:grid-cols-2 gap-2 pt-2">
                  <Button variant="hero" disabled={actioning} onClick={handleAccept}>
                    {actioning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                    {quote.source_type === "custom" ? "Accept & Proceed to Payment" : "Accept Quote"}
                  </Button>
                  <Button variant="outline" disabled={actioning} onClick={handleDecline}>
                    Decline
                  </Button>
                </div>
              )}

              {canProceedToPayment && (
                <Button variant="hero" className="w-full" onClick={handleProceedToPayment}>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Proceed to Payment
                </Button>
              )}
            </CardContent>
          </Card>

          <QuoteMessageThread
            quoteId={quote.id}
            role="client"
            senderName={quote.client_name || profile?.full_name || "Client"}
          />

          {plannerUnlocked && (
            <div className="grid sm:grid-cols-3 gap-3">
              <Button variant="outline" asChild>
                <Link to={`/event-planner/${quote.id}`}><Calendar className="w-4 h-4 mr-2" /> Event Planner</Link>
              </Button>
              <Card variant="glass" className="p-3 flex flex-col items-center gap-2">
                <div className="bg-white p-2 rounded-md">
                  <QRCodeSVG value={songRequestUrl} size={120} level="H" includeMargin />
                </div>
                <p className="text-[11px] text-muted-foreground">Song requests QR</p>
              </Card>
              <div>
                <ClientPhotoGallery quoteId={quote.id} />
              </div>
            </div>
          )}
        </main>
        <ClientMusicDock autoplayTrigger={user.id} mixcloudUrl={mixcloudUrl} />
      </div>
    );
  }

  return null;
}

function Header({
  profile,
  onSignOut,
  extra,
  logo,
}: {
  profile: any;
  onSignOut: () => void;
  extra?: ReactNode;
  logo: string;
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="BeatKulture Entertainment" className="w-8 h-8 object-contain" />
          <span className="font-display text-lg font-bold gradient-text">BEATKULTURE ENTERTAINMENT</span>
        </Link>
        <div className="flex items-center gap-2">
          {extra}
          <span className="text-xs text-muted-foreground hidden sm:inline">{profile?.full_name}</span>
          <Button variant="ghost" size="sm" onClick={onSignOut}>
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline ml-2">Sign Out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

function Questionnaire({
  profile,
  userEmail,
  selectedPackage,
  onCancel,
  onSubmit,
  submitting,
}: {
  profile: any;
  userEmail: string;
  selectedPackage: DbPackage | null;
  onCancel: () => void;
  onSubmit: (payload: QuestionnairePayload) => Promise<void>;
  submitting: boolean;
}) {
  const termsUrl = supabase.storage.from("documents").getPublicUrl("terms-and-conditions.pdf").data.publicUrl;
  const [form, setForm] = useState({
    venue_provides_sound: false,
    requires_microphones: false,
    requires_lighting: false,
    requires_laser_effects: false,
    requires_smoke_machine: false,
    requires_fog_machine: false,
    requires_low_fog_machine: false,
    requires_cold_spark_machines: false,
    notes: "",
    terms_accepted: false,
  });

  const update = (key: string, value: boolean | string) => setForm((previous) => ({ ...previous, [key]: value }));

  const submit = async () => {
    if (!profile?.id || !hasCompleteEventProfile(profile)) {
      toast({
        title: "Event profile incomplete",
        description: "Please complete your saved event details before requesting a quote.",
        variant: "destructive",
      });
      return;
    }

    if (!form.terms_accepted) {
      toast({
        title: "Terms acceptance required",
        description: "Please agree to the Terms & Conditions before sending your quote request.",
        variant: "destructive",
      });
      return;
    }

    await onSubmit({
      client_id: profile.id,
      client_name: profile?.full_name || userEmail,
      email: userEmail,
      contact_no: profile?.phone || null,
      event_type: profile.event_type,
      venue_name: profile.venue_name,
      venue_address: profile.venue_address,
      event_date: profile.event_date,
      start_time: profile.start_time,
      end_time: profile.end_time,
      guest_count: profile.guest_count || null,
      city: profile.city || null,
      is_outdoor: profile.event_setting === "outdoor",
      venue_provides_sound: form.venue_provides_sound,
      requires_microphones: form.requires_microphones,
      requires_lighting: form.requires_lighting,
      requires_laser_effects: form.requires_laser_effects,
      requires_smoke_machine: form.requires_smoke_machine,
      requires_fog_machine: form.requires_fog_machine,
      requires_low_fog_machine: form.requires_low_fog_machine,
      requires_cold_spark_machines: form.requires_cold_spark_machines,
      needs_sound: !form.venue_provides_sound,
      needs_lighting: form.requires_lighting || form.requires_laser_effects,
      needs_special_effects:
        form.requires_smoke_machine ||
        form.requires_fog_machine ||
        form.requires_low_fog_machine ||
        form.requires_cold_spark_machines ||
        form.requires_laser_effects,
      needs_mic: form.requires_microphones,
      package_id: selectedPackage?.id || null,
      package_name: selectedPackage?.name || null,
      notes: form.notes.trim() || null,
      terms_accepted: true,
      terms_accepted_at: new Date().toISOString(),
    });
  };

  const surchargePreview = buildSurchargeItems(form);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={onCancel} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          <span className="font-display font-bold gradient-text">Final Questionnaire</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <Card variant="glass">
          <CardHeader>
            <CardTitle>{selectedPackage ? `${selectedPackage.name} package` : "Custom quote request"}</CardTitle>
            <CardDescription>
              Your event details are already saved. Only choose the extra services you still need added to this quote request.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-lg border border-border/60 bg-background/40 p-4 space-y-2 text-sm">
              <p className="font-semibold">Saved event details</p>
              <p className="text-muted-foreground">{profile?.event_type} • {profile?.event_date ? new Date(profile.event_date).toLocaleDateString("en-ZA") : "TBD"}</p>
              <p className="text-muted-foreground">{profile?.venue_name} • {profile?.city}</p>
              <p className="text-muted-foreground">{profile?.start_time?.slice(0, 5)} - {profile?.end_time?.slice(0, 5)} • {profile?.guest_count || 0} guests • {formatEventSetting(profile?.event_setting)}</p>
            </div>

            {selectedPackage && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
                <p className="font-semibold text-primary">{selectedPackage.name}</p>
                <p className="text-muted-foreground mt-1">{selectedPackage.description}</p>
              </div>
            )}

            <Separator />

            <div className="space-y-3">
              <LabelledCheckbox
                checked={form.venue_provides_sound}
                onCheckedChange={(checked) => update("venue_provides_sound", checked)}
                icon={<Speaker className="w-3 h-3" />}
                label="Does the venue provide sound?"
                description="Leave this unchecked if you need BeatKulture sound equipment added to the quote."
              />
              <LabelledCheckbox
                checked={form.requires_microphones}
                onCheckedChange={(checked) => update("requires_microphones", checked)}
                icon={<Mic className="w-3 h-3" />}
                label="Do you require microphones?"
              />
              <LabelledCheckbox
                checked={form.requires_lighting}
                onCheckedChange={(checked) => update("requires_lighting", checked)}
                icon={<Lightbulb className="w-3 h-3" />}
                label="Do you require lighting?"
              />
              <LabelledCheckbox
                checked={form.requires_laser_effects}
                onCheckedChange={(checked) => update("requires_laser_effects", checked)}
                icon={<Wand2 className="w-3 h-3" />}
                label="Do you require laser effects?"
              />
              <LabelledCheckbox
                checked={form.requires_smoke_machine}
                onCheckedChange={(checked) => update("requires_smoke_machine", checked)}
                icon={<Sparkles className="w-3 h-3" />}
                label="Smoke machine"
              />
              <LabelledCheckbox
                checked={form.requires_fog_machine}
                onCheckedChange={(checked) => update("requires_fog_machine", checked)}
                icon={<Sparkles className="w-3 h-3" />}
                label="Fog machine"
              />
              <LabelledCheckbox
                checked={form.requires_low_fog_machine}
                onCheckedChange={(checked) => update("requires_low_fog_machine", checked)}
                icon={<Sparkles className="w-3 h-3" />}
                label="Low fog machine"
              />
              <LabelledCheckbox
                checked={form.requires_cold_spark_machines}
                onCheckedChange={(checked) => update("requires_cold_spark_machines", checked)}
                icon={<Sparkles className="w-3 h-3" />}
                label="Cold spark machines"
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold">Anything else we should know?</p>
              <Textarea
                rows={4}
                value={form.notes}
                onChange={(event) => update("notes", event.target.value)}
                placeholder="Special timing, venue restrictions, lighting colours, ceremony notes, or anything else for the admin quote."
              />
            </div>

            <div className="rounded-lg border border-border/60 bg-background/40 p-4 space-y-2">
              <p className="font-semibold text-sm">Surcharge preview</p>
              {surchargePreview.length === 0 ? (
                <p className="text-xs text-muted-foreground">No extra surcharge items selected.</p>
              ) : (
                surchargePreview.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{item.name}</span>
                    <span>{formatCurrency(item.price)}</span>
                  </div>
                ))
              )}
            </div>

            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={form.terms_accepted}
                  onCheckedChange={(value) => update("terms_accepted", !!value)}
                  id="terms-acceptance"
                />
                <div className="space-y-1">
                  <label htmlFor="terms-acceptance" className="text-sm font-medium cursor-pointer">
                    I agree to BeatKulture Entertainment's Terms & Conditions.
                  </label>
                  <p className="text-xs text-muted-foreground">
                    By continuing, you confirm acceptance of our booking, payment, and service terms.
                    {" "}
                    <a href={termsUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      View Terms & Conditions
                    </a>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={onCancel} disabled={submitting} className="flex-1">Cancel</Button>
              <Button variant="hero" onClick={submit} disabled={submitting} className="flex-1">
                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Send to Admin
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function LabelledCheckbox({
  checked,
  onCheckedChange,
  icon,
  label,
  description,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  icon: ReactNode;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-md border border-border p-3">
      <Checkbox checked={checked} onCheckedChange={(value) => onCheckedChange(!!value)} />
      <div>
        <p className="cursor-pointer flex items-center gap-2 text-sm font-medium">{icon} {label}</p>
        {description ? <p className="text-[11px] text-muted-foreground mt-1">{description}</p> : null}
      </div>
    </div>
  );
}
