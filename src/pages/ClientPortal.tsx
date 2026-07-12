// @ts-nocheck
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePackages, DbPackage } from "@/hooks/usePackages";
import { useSpecials } from "@/hooks/useSpecials";
import { useQuoteRequests } from "@/hooks/useQuoteRequests";
import { useBusinessSettings } from "@/hooks/useBusinessSettings";
import { toast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/pricing";
import { QRCodeSVG } from "qrcode.react";
import logo from "@/assets/logo.png";
import {
  Music, Loader2, FileText, CheckCircle2, Clock, Send, QrCode, PartyPopper,
  Calendar, MapPin, User, CreditCard, Image as ImageIcon, Sparkles, ArrowLeft,
  Plus, MessageSquare, Lightbulb, Mic, Speaker, Wand2, Users, LogOut,
} from "lucide-react";
import { ClientPhotoGallery } from "@/components/ClientPhotoGallery";
import { QuoteMessageThread } from "@/components/QuoteMessageThread";
import { PlannerHub } from "@/components/planner/PlannerHub";
import { PremiumAiCompanionPanel } from "@/components/client/PremiumAiCompanionPanel";
import { EventWeatherCard } from "@/components/client/EventWeatherCard";
import { MusicPlanningForm } from "@/components/client/MusicPlanningForm";
import { YoutubeShowcase } from "@/components/YoutubeShowcase";
import { CompetitionsBanner } from "@/components/CompetitionsBanner";
import { TestimonialsCarousel } from "@/components/landing/TestimonialsCarousel";
import { PageBackground } from "@/components/PageBackground";
import { LoopingGifImage } from "@/components/ui/LoopingGifImage";
import { MusicPlayer } from "@/components/MusicPlayer";
import { MixcloudRotator } from "@/components/MixcloudRotator";
import { CinematicAmbient } from "@/components/CinematicAmbient";

type View = "dashboard" | "questionnaire" | "quote";

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
  custom_items: { name: string; price: number; qty: number }[];
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
  created_at: string;
}

function groupPackageIncludes(includes: string[]) {
  const buckets: Record<"services" | "equipment" | "extras", string[]> = {
    services: [],
    equipment: [],
    extras: [],
  };
  const equipmentPattern = /(sound|speaker|sub|woofer|monitor|mic|microphone|light|lighting|laser|fog|smoke|truss|booth|deck|controller|mixer|projector|screen)/i;
  const extrasPattern = /(extra|bonus|upgrade|add-on|addon|travel|overtime|kids|human jukebox|spark|cold|confetti|mc|host|special)/i;
  includes.forEach((item) => {
    if (equipmentPattern.test(item)) {
      buckets.equipment.push(item);
      return;
    }
    if (extrasPattern.test(item)) {
      buckets.extras.push(item);
      return;
    }
    buckets.services.push(item);
  });
  return buckets;
}

export default function ClientPortal() {
  const { user, profile, isLoading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const section = searchParams.get("section");
  const goSection = (s: string | null) => {
    if (s) setSearchParams({ section: s });
    else setSearchParams({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const { packages } = usePackages();
  const { activeSpecials } = useSpecials();
  const { get: getSetting } = useBusinessSettings();

  const [view, setView] = useState<View>("dashboard");
  const [quotes, setQuotes] = useState<QuoteData[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [activeQuote, setActiveQuote] = useState<QuoteData | null>(null);
  const [equipmentNames, setEquipmentNames] = useState<Record<string, string>>({});
  const [actioning, setActioning] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(
    () => localStorage.getItem("bk:selected-package-id"),
  );
  const { requests, createRequest, isCreating } = useQuoteRequests(profile?.id);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) navigate("/auth?redirect=/client");
  }, [authLoading, user, navigate]);

  // Load this client's quotes
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
        setQuotes(data.map((q: any) => ({
          ...q,
          equipment: q.equipment || {},
          custom_items: q.custom_items || [],
        })) as QuoteData[]);
      }
      setLoadingQuotes(false);
    })();
  }, [profile?.id]);

  // Log portal visit (admins get notified via DB trigger)
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
    // run once per session per profile
  }, [user?.id, profile?.id, quotes.length > 0]);

  // Equipment label cache (for line items)
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("equipment_catalog").select("item_key, name").eq("is_active", true);
      if (data) {
        const m: Record<string, string> = {};
        data.forEach((e: any) => { m[e.item_key] = e.name; });
        setEquipmentNames(m);
      }
    })();
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // Group packages by category for the dashboard (must be before any conditional return)
  const packagesByCategory = useMemo(() => {
    const map: Record<string, DbPackage[]> = {};
    packages.filter(p => p.is_active).forEach(p => {
      const k = p.category || "other";
      if (!map[k]) map[k] = [];
      map[k].push(p);
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

  // ─── DASHBOARD ────────────────────────────────────────────
  if (view === "dashboard") {
    return (
      <div className="min-h-screen bg-background pb-24 relative premium-page cinematic-shell">
        <PageBackground pageKey="bg_client_portal" />
        <CinematicAmbient intensity="soft" />
        <Header profile={profile} onSignOut={handleSignOut} />
        <main className="container mx-auto px-4 py-6 max-w-5xl space-y-6 relative z-10">

          {/* Welcome */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
            <h1 className="font-display text-2xl md:text-3xl font-bold">
              Welcome, <span className="gradient-text">{profile?.full_name || user.email}</span>
            </h1>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              Enjoy the mixes, browse packages, or request a <span className="text-primary font-semibold">custom quotation</span> tailored to your event.
            </p>
          </motion.div>

          {(() => {
            const HUB_ITEMS = [
              { key: "music", label: "Music Lounge", desc: "Live mixes, curated for the mood.", Icon: Music, grad: "from-fuchsia-500 via-purple-500 to-indigo-600" },
              { key: "specials", label: "Current Specials", desc: "Limited-time offers, hand-picked.", Icon: Sparkles, grad: "from-amber-400 via-orange-500 to-pink-600" },
              { key: "quote", label: "Request a Quote", desc: "Custom-built for your event.", Icon: MessageSquare, grad: "from-orange-500 via-pink-500 to-purple-600" },
              { key: "packages", label: "Our Packages", desc: "Wedding · Party · Corporate.", Icon: PartyPopper, grad: "from-emerald-400 via-teal-500 to-cyan-600" },
              { key: "ai", label: "AI & Special Features", desc: "Your smart party companion.", Icon: Wand2, grad: "from-cyan-400 via-sky-500 to-indigo-600" },
              { key: "reviews", label: "Reviews", desc: "Bark · Google · Facebook.", Icon: Users, grad: "from-yellow-400 via-amber-500 to-orange-600" },
              { key: "competitions", label: "Competitions", desc: "Win bundles & experiences.", Icon: Sparkles, grad: "from-pink-500 via-rose-500 to-red-600" },
            ] as const;

            if (!section) {
              return (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {HUB_ITEMS.map(({ key, label, desc, Icon, grad }, i) => (
                    <motion.button
                      key={key}
                      onClick={() => goSection(key)}
                      initial={{ opacity: 0, y: 14, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: i * 0.05, duration: 0.4 }}
                      whileHover={{ y: -4, scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      className={`group relative overflow-hidden rounded-2xl p-[2px] bg-gradient-to-br ${grad} shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60`}
                      aria-label={`Open ${label}`}
                    >
                      <div className="relative rounded-[14px] bg-background/85 backdrop-blur-md p-4 h-full flex flex-col items-start gap-2 min-h-[130px]">
                        <span className={`inline-flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br ${grad} text-white shadow-md group-hover:scale-110 transition-transform`}>
                          <Icon className="w-5 h-5" />
                        </span>
                        <div className="text-left">
                          <p className="font-display text-sm sm:text-base font-bold leading-tight">{label}</p>
                          <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{desc}</p>
                        </div>
                        <span className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-white/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </motion.button>
                  ))}
                </motion.div>
              );
            }

            const current = HUB_ITEMS.find(h => h.key === section);
            return (
              <motion.div key={section} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <Button variant="ghost" size="sm" onClick={() => goSection(null)} className="gap-1">
                    <ArrowLeft className="w-4 h-4" /> Menu
                  </Button>
                  {current && (
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center justify-center h-7 w-7 rounded-lg bg-gradient-to-br ${current.grad} text-white`}>
                        <current.Icon className="w-3.5 h-3.5" />
                      </span>
                      <p className="text-sm font-semibold">{current.label}</p>
                    </div>
                  )}
                </div>



            {section === "music" && (
            <div className="space-y-3 mt-4">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Music className="w-4 h-4 text-primary" /> Music Lounge
              </h2>
              <MusicPlayer autoplayTrigger={profile?.id || user.id} mixcloudUrl={getSetting("mixcloud_url")} />
              <MixcloudRotator backupUrl={getSetting("mixcloud_url")} />
            </div>
            )}

            {section === "specials" && (
            <div className="space-y-3 mt-4">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> Current Specials
              </h2>
              {activeSpecials.length === 0 ? (
                <p className="text-xs text-muted-foreground">No specials running right now.</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {activeSpecials.map((s) => (
                    <div key={s.id} className="relative rounded-xl overflow-hidden border border-primary/20">
                      <div className="w-full aspect-[16/9] bg-muted/40 flex items-center justify-center">
                        <LoopingGifImage
                          src={s.image_url}
                          alt={s.title || "Special"}
                          className="w-full h-full object-contain"
                          loading="eager"
                        />
                      </div>
                      {s.title && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                          <p className="text-white text-sm font-semibold">{s.title}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            )}

            {section === "quote" && (
            <div className="mt-4">
              <motion.div
                initial={{ opacity: 0, y: 18, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.45 }}
              >
                <button
                  onClick={() => setView("questionnaire")}
                  className="group relative w-full overflow-hidden rounded-2xl p-[3px] focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-400/50"
                  style={{
                    background: "linear-gradient(90deg, #ff6a00, #ff2fb3, #a020f0, #ff6a00)",
                    backgroundSize: "300% 100%",
                    animation: "bk-attention-shine 4s linear infinite",
                  }}
                  aria-label="Request a customized quote"
                >
                  <div className="relative rounded-[14px] px-6 py-5 sm:py-6 flex items-center justify-between gap-4"
                       style={{ background: "linear-gradient(135deg, #ff7a1a 0%, #ff2fb3 55%, #7a20e0 100%)" }}>
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-white/20 blur-2xl animate-pulse" />
                      <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full bg-white/10 blur-2xl animate-pulse [animation-delay:1s]" />
                    </div>
                    <div className="text-left relative">
                      <p className="text-[11px] uppercase tracking-widest font-bold text-white/90">Start here</p>
                      <p className="font-display text-xl sm:text-2xl font-extrabold text-white drop-shadow">
                        Request a Customized Quote
                      </p>
                      <p className="text-xs sm:text-sm text-white/90 mt-0.5">
                        Answer a few questions — we build a tailored quote around your event.
                      </p>
                    </div>
                    <span className="relative inline-flex items-center justify-center h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-white text-orange-600 shadow-lg shrink-0 group-hover:scale-110 transition-transform">
                      <MessageSquare className="w-6 h-6" />
                    </span>
                  </div>
                </button>
                <style>{`@keyframes bk-attention-shine { 0%{background-position:0% 50%} 100%{background-position:300% 50%} }`}</style>
              </motion.div>
            </div>
            )}

            {section === "packages" && (
            <div className="space-y-4 mt-4">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <PartyPopper className="w-4 h-4 text-primary" /> Our Packages
              </h2>
              {Object.keys(packagesByCategory).length === 0 ? (
                <p className="text-xs text-muted-foreground">No packages available right now.</p>
              ) : (
                (["wedding", "party", "corporate", "other"] as const)
                  .filter(cat => packagesByCategory[cat])
                  .map(cat => (
                    <div key={cat} className="space-y-2">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                        {cat === "party" ? "Private Party" : cat.charAt(0).toUpperCase() + cat.slice(1)} Packages
                      </p>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {packagesByCategory[cat].map(pkg => (
                          <Card key={pkg.id} variant="glass" className={pkg.popular ? "border-primary/30 overflow-hidden" : "overflow-hidden"}>
                            {pkg.image_url && (
                              <div className="w-full aspect-[16/9] bg-muted/40 flex items-center justify-center">
                                <LoopingGifImage
                                  src={pkg.image_url}
                                  alt={pkg.name}
                                  className="w-full h-full object-contain"
                                  loading="lazy"
                                />
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
                              {(["services", "equipment", "extras"] as const).map((groupKey) => {
                                const grouped = groupPackageIncludes(pkg.includes || []);
                                return (
                                  <div key={`${pkg.id}-${groupKey}`} className="rounded-lg border border-border/60 bg-background/28 p-2">
                                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">{groupKey}</p>
                                    {(grouped[groupKey].length > 0 ? grouped[groupKey] : ["Included in package"]).map((line, idx) => (
                                      <p key={idx} className="text-xs text-muted-foreground flex items-start gap-1 mb-1 last:mb-0">
                                        <CheckCircle2 className="w-3 h-3 text-primary mt-0.5 shrink-0" /> {line}
                                      </p>
                                    ))}
                                  </div>
                                );
                              })}
                              <Button
                                variant="hero"
                                size="sm"
                                className="w-full"
                                onClick={() => {
                                  setSelectedPackageId(pkg.id);
                                  localStorage.setItem("bk:selected-package-id", pkg.id);
                                  setView("questionnaire");
                                }}
                              >
                                Select &amp; Confirm
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))
              )}
            </div>
            )}

            {section === "ai" && (
            <div className="space-y-4 mt-4">
              <PremiumAiCompanionPanel
                userScope={profile?.id || user.id}
                userName={profile?.full_name || user.email || "there"}
                quoteCount={quotes.length}
                requestCount={requests.length}
                latestQuoteStatus={quotes[0]?.status}
                eventType={quotes[0]?.event_type || profile?.event_type}
              />
              <EventWeatherCard
                eventDate={quotes[0]?.event_date || profile?.event_date}
                locationHint={quotes[0]?.venue || profile?.city || profile?.event_location}
              />
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
              <MusicPlanningForm
                profileId={profile.id}
                clientName={profile.full_name || user.email || "Client"}
                email={user.email || ""}
                quoteId={quotes[0]?.id || null}
              />
            </TabsContent>

            {/* 6 ─ REVIEWS */}
            <TabsContent value="reviews" className="space-y-3 mt-4">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" /> Reviews — Bark.com · Google · Facebook
              </h2>
              <TestimonialsCarousel />
              <YoutubeShowcase />
            </TabsContent>

            {/* 7 ─ COMPETITIONS */}
            <TabsContent value="competitions" className="space-y-3 mt-4">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> Competitions
              </h2>
              <CompetitionsBanner />
            </TabsContent>
          </Tabs>


          {/* My Requests / Quotes (kept at bottom for access) */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> My Requests &amp; Quotes
            </h2>

            {loadingQuotes ? (
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            ) : (
              <div className="space-y-2">
                {requests.filter(r => !r.quote_id).map(r => (
                  <Card key={r.id} variant="glass">
                    <CardContent className="py-3 flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <p className="text-sm font-semibold">
                          {r.event_type}{r.package_name ? ` — ${r.package_name}` : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {r.event_date ? new Date(r.event_date).toLocaleDateString("en-ZA") : "Date TBD"}
                          {r.venue_name ? ` • ${r.venue_name}` : ""}
                        </p>
                      </div>
                      <Badge variant="outline" className="capitalize">{r.status.replace("_", " ")}</Badge>
                    </CardContent>
                  </Card>
                ))}

                {quotes.map(q => (
                  <Card key={q.id} variant="glass">
                    <CardContent className="py-3 flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <p className="text-sm font-semibold">
                          {q.event_type || "Event"} • <span className="font-mono text-xs">{q.client_code}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {q.event_date ? new Date(q.event_date).toLocaleDateString("en-ZA") : "Date TBD"}
                          {q.venue ? ` • ${q.venue}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">{q.status}</Badge>
                        <Button size="sm" variant="outline" onClick={() => { setActiveQuote(q); setView("quote"); }}>
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {requests.length === 0 && quotes.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    You don't have any quotes yet. Pick a package or request a custom quote above.
                  </p>
                )}
              </div>
            )}
          </section>

        </main>
      </div>
    );
  }

  // ─── QUESTIONNAIRE ────────────────────────────────────────
  if (view === "questionnaire") {
    return (
      <Questionnaire
        profile={profile}
        userEmail={user.email || ""}
        packages={packages.filter(p => p.is_active)}
        selectedPackageId={selectedPackageId}
        onCancel={() => setView("dashboard")}
        onSubmit={async (payload) => {
          await createRequest(payload as any);
          setSelectedPackageId(null);
          localStorage.removeItem("bk:selected-package-id");
          setView("dashboard");
        }}
        submitting={isCreating}
      />
    );
  }

  // ─── QUOTE VIEW (read-only) ────────────────────────────────
  if (view === "quote" && activeQuote) {
    const q = activeQuote;
    const isPaid = q.deposit_paid;
    const isFullyPaid = q.balance_paid;
    const songRequestUrl = `${window.location.origin}/request/${q.id}`;

    const handleAccept = async () => {
      setActioning(true);
      const { error } = await supabase.from("quotes").update({ status: "accepted" }).eq("id", q.id);
      if (!error) {
        await supabase.from("admin_notifications").insert({
          type: "quote_accepted",
          title: "Quote Accepted",
          message: `${q.client_name} (${q.client_code}) accepted their quote of ${formatCurrency(Number(q.total))}.`,
          quote_id: q.id,
          client_code: q.client_code,
          email: q.email,
        });
        setActiveQuote({ ...q, status: "accepted" });
        toast({ title: "Quote Accepted ✓", description: "Please pay the deposit to confirm your booking." });
      } else {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
      setActioning(false);
    };

    const handleDecline = async () => {
      setActioning(true);
      const { error } = await supabase.from("quotes").update({ status: "declined" }).eq("id", q.id);
      if (!error) {
        await supabase.from("admin_notifications").insert({
          type: "quote_declined",
          title: "Quote Declined",
          message: `${q.client_name} (${q.client_code}) declined their quote.`,
          quote_id: q.id,
          client_code: q.client_code,
          email: q.email,
        });
        setActiveQuote({ ...q, status: "declined" });
        toast({ title: "Quote Declined" });
      }
      setActioning(false);
    };

    return (
      <div className="min-h-screen bg-background premium-page cinematic-shell">
        <CinematicAmbient intensity="soft" />
        <Header profile={profile} onSignOut={handleSignOut} extra={
          <Button variant="ghost" size="sm" onClick={() => setView("dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Dashboard
          </Button>
        } />
        <main className="container mx-auto px-4 py-6 max-w-3xl space-y-4 relative z-10">
          {/* Status banner */}
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
                  <p className="text-xs text-muted-foreground">Status: <span className="capitalize">{q.status}</span></p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="font-display text-xl font-bold">{formatCurrency(Number(q.total))}</p>
              </div>
            </CardContent>
          </Card>

          {/* Quote details (read-only) */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" /> Your Quote
              </CardTitle>
              <CardDescription>Ref: <span className="font-mono">{q.client_code}</span> • Created {new Date(q.created_at).toLocaleDateString("en-ZA")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-muted-foreground"><User className="w-3 h-3" /> {q.client_name}</div>
                  <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="w-3 h-3" /> {q.venue || "TBD"}</div>
                  <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="w-3 h-3" /> {q.event_date ? new Date(q.event_date).toLocaleDateString("en-ZA") : "TBD"}</div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-muted-foreground"><Clock className="w-3 h-3" /> {q.start_time?.slice(0,5) || ""} – {q.end_time?.slice(0,5) || ""}</div>
                  <div className="flex items-center gap-2 text-muted-foreground"><PartyPopper className="w-3 h-3" /> {q.event_type || "N/A"}</div>
                  <div className="flex items-center gap-2 text-muted-foreground"><Music className="w-3 h-3" /> DJ: {q.dj_name || "TBD"}</div>
                </div>
              </div>

              <Separator />

              {/* Line items (no remove button — clients are read-only) */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-medium">
                  <span>DJ Service ({q.hours} hours)</span>
                  <span>{formatCurrency(Number(q.dj_cost))}</span>
                </div>
                {Object.entries(q.equipment || {}).map(([k, qty]) => Number(qty) > 0 && (
                  <div key={k} className="flex justify-between text-muted-foreground">
                    <span>{equipmentNames[k] || k} × {qty}</span>
                  </div>
                ))}
                {(q.custom_items || []).map((it, i) => (
                  <div key={i} className="flex justify-between text-muted-foreground">
                    <span>{it.name} × {it.qty}</span>
                  </div>
                ))}
                {Number(q.kids_cost) > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Kids Corner ({q.kids_hours}h)</span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-1">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(Number(q.subtotal))}</span></div>
                {Number(q.travel_cost) > 0 && (
                  <div className="flex justify-between text-muted-foreground"><span>Travel</span><span>{formatCurrency(Number(q.travel_cost))}</span></div>
                )}
                {Number(q.discount_amount) > 0 && (
                  <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatCurrency(Number(q.discount_amount))}</span></div>
                )}
                <Separator />
                <div className="flex justify-between font-display font-bold text-lg pt-1">
                  <span>Total</span><span>{formatCurrency(Number(q.total))}</span>
                </div>
                <div className="flex justify-between text-primary font-semibold">
                  <span>30% Deposit</span><span>{formatCurrency(Number(q.deposit))}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Balance</span><span>{formatCurrency(Number(q.balance))}</span>
                </div>
              </div>

              {/* Deposit policy */}
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/30 text-xs space-y-1">
                <p className="font-semibold text-sm text-primary">30% Deposit Required</p>
                <p className="text-muted-foreground leading-relaxed">
                  A <strong className="text-foreground">non-refundable 30% deposit</strong> ({formatCurrency(Number(q.deposit))}) secures your booking date.
                  The <strong className="text-foreground">remaining balance</strong> ({formatCurrency(Number(q.balance))}) is payable
                  <strong className="text-foreground"> on or before the day of your event</strong>, prior to the DJ performing.
                  Accepted methods: EFT or cash. Quote validity: 7 days.
                </p>
              </div>

              {/* Banking */}
              <div className="p-3 rounded-lg bg-muted/30 border border-border text-xs space-y-1">
                <p className="font-semibold text-sm">Banking Details</p>
                <p>Bank: First National Bank</p>
                <p>Account: BEATKULTURE (PTY) LTD</p>
                <p>Account No: 63189325905</p>
                <p>Branch Code: 250655</p>
                <p className="text-muted-foreground">Use your client code <strong className="font-mono">{q.client_code}</strong> as reference.</p>
              </div>

              {/* Company / Legal details */}
              <div className="p-3 rounded-lg bg-muted/20 border border-border text-[11px] space-y-0.5 text-muted-foreground">
                <p className="font-semibold text-foreground text-xs mb-1">BeatKulture Entertainment (Pty) Ltd</p>
                <p>Registration No: 2025/533623/07</p>
                <p>Contact: +27 65 528 5528</p>
                <p>Based in Hatfield, Pretoria — serving all of South Africa.</p>
              </div>

              {/* Actions */}
              {q.status !== "accepted" && q.status !== "paid" && q.status !== "declined" && (
                <div className="grid sm:grid-cols-2 gap-2 pt-2">
                  <Button variant="hero" disabled={actioning} onClick={handleAccept}>
                    {actioning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                    Accept Quote
                  </Button>
                  <Button variant="outline" disabled={actioning} onClick={handleDecline}>
                    Decline
                  </Button>
                </div>
              )}

            </CardContent>
          </Card>

          {/* Conversation thread */}
          <QuoteMessageThread
            quoteId={q.id}
            role="client"
            senderName={q.client_name || profile?.full_name || "Client"}
          />
          {/* Unlocked features once paid */}
          {isPaid && (
            <div className="grid sm:grid-cols-3 gap-3">
              <Button variant="outline" asChild>
                <Link to={`/event-planner/${q.id}`}><Calendar className="w-4 h-4 mr-2" /> Event Planner</Link>
              </Button>
              <Card variant="glass" className="p-3 flex flex-col items-center gap-2">
                <div className="bg-white p-2 rounded-md">
                  <QRCodeSVG value={songRequestUrl} size={120} level="H" includeMargin />
                </div>
                <p className="text-[11px] text-muted-foreground">Song requests QR</p>
              </Card>
              <div>
                <ClientPhotoGallery quoteId={q.id} />
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  return null;
}

// ───────────── Header ─────────────
function Header({ profile, onSignOut, extra }: { profile: any; onSignOut: () => void; extra?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="BeatKulture" className="w-8 h-8" />
          <span className="font-display text-lg font-bold gradient-text">BEATKULTURE</span>
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

// ───────────── Questionnaire ─────────────
function Questionnaire({
  profile, userEmail, packages, selectedPackageId, onCancel, onSubmit, submitting,
}: {
  profile: any;
  userEmail: string;
  packages: DbPackage[];
  selectedPackageId?: string | null;
  onCancel: () => void;
  onSubmit: (payload: any) => Promise<void>;
  submitting: boolean;
}) {
  const [form, setForm] = useState({
    event_type: "",
    venue_name: "",
    venue_address: "",
    area: "",
    city: "",
    province: "",
    event_date: "",
    start_time: "",
    end_time: "",
    is_outdoor: false,
    needs_sound: true,
    needs_lighting: false,
    needs_special_effects: false,
    needs_mic: false,
    guest_count: "",
    package_id: selectedPackageId && packages.some((p) => p.id === selectedPackageId) ? selectedPackageId : "none",
    music_preferences: "",
    special_requests: "",
    notes: "",
    contact_no: profile?.phone || "",
  });

  const update = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  useEffect(() => {
    if (!selectedPackageId) return;
    if (!packages.some((p) => p.id === selectedPackageId)) return;
    setForm((prev) => ({ ...prev, package_id: selectedPackageId }));
  }, [selectedPackageId, packages]);

  const submit = async () => {
    if (!form.event_type) {
      toast({ title: "Event type required", variant: "destructive" });
      return;
    }
    const chosenPkg = packages.find(p => p.id === form.package_id);
    // Build notes string that includes location details and music preferences
    // (city/area/province stored here until schema migration adds dedicated columns)
    const locationParts = [
      form.area ? `Area: ${form.area}` : "",
      form.city ? `City: ${form.city}` : "",
      form.province ? `Province: ${form.province}` : "",
    ].filter(Boolean).join(" | ");
    const musicPart = form.music_preferences ? `Music preferences: ${form.music_preferences}` : "";
    const specialPart = form.special_requests ? `Special requests: ${form.special_requests}` : "";
    const basePart = form.notes || "";
    const combinedNotes = [locationParts, musicPart, specialPart, basePart]
      .filter(Boolean).join("\n");
    await onSubmit({
      client_id: profile.id,
      client_name: profile?.full_name || userEmail,
      email: userEmail,
      contact_no: form.contact_no || null,
      event_type: form.event_type,
      venue_name: form.venue_name || null,
      venue_address: form.venue_address || null,
      city: form.city || null,
      event_date: form.event_date || null,
      start_time: form.start_time || null,
      end_time: form.end_time || null,
      is_outdoor: form.is_outdoor,
      needs_sound: form.needs_sound,
      needs_lighting: form.needs_lighting,
      needs_special_effects: form.needs_special_effects,
      needs_mic: form.needs_mic,
      guest_count: form.guest_count ? Number(form.guest_count) : null,
      package_id: chosenPkg?.id || null,
      package_name: chosenPkg?.name || null,
      notes: combinedNotes || null,
    });
  };

  return (
    <div className="min-h-screen bg-background premium-page cinematic-shell">
      <CinematicAmbient intensity="soft" />
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={onCancel} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          <span className="font-display font-bold gradient-text">Custom Quote Request</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl relative z-10">
        <Card variant="glass">
          <CardHeader>
            <CardTitle>Tell us about your event</CardTitle>
            <CardDescription>Answer a few quick questions and we'll prepare your quote.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Type of event *</Label>
              <Select value={form.event_type} onValueChange={(v) => update("event_type", v)}>
                <SelectTrigger><SelectValue placeholder="Select event type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Wedding">Wedding</SelectItem>
                  <SelectItem value="Birthday">Birthday</SelectItem>
                  <SelectItem value="Corporate">Corporate</SelectItem>
                  <SelectItem value="Private Party">Private Party</SelectItem>
                  <SelectItem value="Anniversary">Anniversary</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {packages.length > 0 && (
              <div className="space-y-2">
                <Label>Interested in a package? (optional)</Label>
                <Select value={form.package_id} onValueChange={(v) => update("package_id", v)}>
                  <SelectTrigger><SelectValue placeholder="Choose a package or skip" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific package</SelectItem>
                    {packages.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name} — {p.category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Venue name</Label>
                <Input value={form.venue_name} onChange={(e) => update("venue_name", e.target.value)} placeholder="e.g. The Garden Venue" />
              </div>
              <div className="space-y-2">
                <Label>Contact number</Label>
                <Input value={form.contact_no} onChange={(e) => update("contact_no", e.target.value)} placeholder="082 ..." />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Venue address</Label>
              <Input value={form.venue_address} onChange={(e) => update("venue_address", e.target.value)} placeholder="Street, suburb, city" />
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Area / Suburb</Label>
                <Input value={form.area} onChange={(e) => update("area", e.target.value)} placeholder="e.g. Sandton" />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="e.g. Johannesburg" />
              </div>
              <div className="space-y-2">
                <Label>Province</Label>
                <Select value={form.province} onValueChange={(v) => update("province", v)}>
                  <SelectTrigger><SelectValue placeholder="Select province" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Gauteng">Gauteng</SelectItem>
                    <SelectItem value="Western Cape">Western Cape</SelectItem>
                    <SelectItem value="KwaZulu-Natal">KwaZulu-Natal</SelectItem>
                    <SelectItem value="Eastern Cape">Eastern Cape</SelectItem>
                    <SelectItem value="Limpopo">Limpopo</SelectItem>
                    <SelectItem value="Mpumalanga">Mpumalanga</SelectItem>
                    <SelectItem value="North West">North West</SelectItem>
                    <SelectItem value="Free State">Free State</SelectItem>
                    <SelectItem value="Northern Cape">Northern Cape</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Event date</Label>
                <Input type="date" value={form.event_date} onChange={(e) => update("event_date", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Start time</Label>
                <Input type="time" value={form.start_time} onChange={(e) => update("start_time", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>End time</Label>
                <Input type="time" value={form.end_time} onChange={(e) => update("end_time", e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Approximate guest count</Label>
              <Input type="number" min="0" value={form.guest_count} onChange={(e) => update("guest_count", e.target.value)} placeholder="e.g. 80" />
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="text-sm">Venue &amp; requirements</Label>

              <div className="flex items-start gap-3 rounded-md border border-border p-3">
                <Checkbox
                  id="outdoor"
                  checked={form.is_outdoor}
                  onCheckedChange={(c) => update("is_outdoor", !!c)}
                />
                <div>
                  <Label htmlFor="outdoor" className="cursor-pointer flex items-center gap-2"><MapPin className="w-3 h-3" /> Outdoor event</Label>
                  <p className="text-[11px] text-muted-foreground">Tick if your event is outdoors (affects equipment &amp; cover).</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-md border border-border p-3">
                <Checkbox
                  id="sound"
                  checked={form.needs_sound}
                  onCheckedChange={(c) => update("needs_sound", !!c)}
                />
                <div>
                  <Label htmlFor="sound" className="cursor-pointer flex items-center gap-2"><Speaker className="w-3 h-3" /> I need sound equipment</Label>
                  <p className="text-[11px] text-muted-foreground">Untick if your venue already provides sound.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-md border border-border p-3">
                <Checkbox
                  id="lighting"
                  checked={form.needs_lighting}
                  onCheckedChange={(c) => update("needs_lighting", !!c)}
                />
                <div>
                  <Label htmlFor="lighting" className="cursor-pointer flex items-center gap-2"><Lightbulb className="w-3 h-3" /> Lighting</Label>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-md border border-border p-3">
                <Checkbox
                  id="effects"
                  checked={form.needs_special_effects}
                  onCheckedChange={(c) => update("needs_special_effects", !!c)}
                />
                <div>
                  <Label htmlFor="effects" className="cursor-pointer flex items-center gap-2"><Wand2 className="w-3 h-3" /> Special effects</Label>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                    Includes options like <strong className="text-foreground">smoke machines, low fog (for first dances),
                    laser lights, confetti cannons, bubble machines and uplighters</strong>. Perfect for weddings, birthdays
                    and high-energy parties. We'll confirm the exact mix with you.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-md border border-border p-3">
                <Checkbox
                  id="mic"
                  checked={form.needs_mic}
                  onCheckedChange={(c) => update("needs_mic", !!c)}
                />
                <div>
                  <Label htmlFor="mic" className="cursor-pointer flex items-center gap-2"><Mic className="w-3 h-3" /> Microphone for speeches</Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Music preferences</Label>
              <Textarea
                rows={3}
                value={form.music_preferences}
                onChange={(e) => update("music_preferences", e.target.value)}
                placeholder="e.g. Afrobeats, House, R&B, no explicit lyrics, favourite artists..."
              />
            </div>

            <div className="space-y-2">
              <Label>Special requests</Label>
              <Textarea
                rows={3}
                value={form.special_requests}
                onChange={(e) => update("special_requests", e.target.value)}
                placeholder="e.g. Specific songs for key moments, theme, no genres, etc."
              />
            </div>

            <div className="space-y-2">
              <Label>Anything else we should know?</Label>
              <Textarea
                rows={3}
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                placeholder="Theme, accessibility, dietary notes, etc."
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={onCancel} disabled={submitting} className="flex-1">Cancel</Button>
              <Button variant="hero" onClick={submit} disabled={submitting} className="flex-1">
                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Submit Request
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}