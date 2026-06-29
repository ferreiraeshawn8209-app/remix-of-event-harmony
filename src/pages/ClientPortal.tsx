import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePackages, DbPackage } from "@/hooks/usePackages";
import { useSpecials } from "@/hooks/useSpecials";
import { useQuoteRequests } from "@/hooks/useQuoteRequests";
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
import { YoutubeShowcase } from "@/components/YoutubeShowcase";
import { CompetitionsBanner } from "@/components/CompetitionsBanner";
import { PageBackground } from "@/components/PageBackground";
import { MixcloudRotator } from "@/components/MixcloudRotator";
import { TestimonialsSection } from "@/components/TestimonialsSection";

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

export default function ClientPortal() {
  const { user, profile, isLoading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { packages } = usePackages();
  const { activeSpecials } = useSpecials();

  const [view, setView] = useState<View>("dashboard");
  const [quotes, setQuotes] = useState<QuoteData[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [activeQuote, setActiveQuote] = useState<QuoteData | null>(null);
  const [equipmentNames, setEquipmentNames] = useState<Record<string, string>>({});
  const [actioning, setActioning] = useState(false);
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

  const userId = user?.id;
  const userEmail = user?.email ?? "";
  const profileId = profile?.id;
  const profileEmail = profile?.email ?? "";

  // Log portal visit (admins get notified via DB trigger)
  useEffect(() => {
    if (!userId || !profileId) return;
    const mostRecent = quotes[0];
    supabase.rpc("log_client_portal_visit" as any, {
      _quote_id: mostRecent?.id ?? null,
      _client_code: mostRecent?.client_code ?? "",
      _email: profileEmail || userEmail,
      _user_agent: navigator.userAgent,
    }).then(({ error }) => {
      if (error) console.warn("Portal visit log failed:", error.message);
    });
    // run once per session per profile
  }, [profileEmail, profileId, quotes, userEmail, userId]);

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
    const depositPaidQuote = quotes.find(q => q.deposit_paid);

    return (
      <div className="min-h-screen bg-background pb-24 relative">
        <PageBackground pageKey="bg_client_portal" />
        <Header profile={profile} onSignOut={handleSignOut} />
        <main className="container mx-auto px-4 py-6 max-w-5xl space-y-6">

          {/* Welcome + Slogan */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
            <h1 className="font-display text-2xl md:text-3xl font-bold">
              Welcome, <span className="gradient-text">{profile?.full_name || user.email}</span>
            </h1>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              Pick one of our <span className="text-foreground font-semibold">ready-made packages</span> below —
              or, if you'd prefer something <span className="text-foreground font-semibold">tailored to your needs</span>,
              tap the button to request a <span className="text-primary font-semibold">custom quotation</span>.
            </p>
          </motion.div>

          {/* ① AI Event Assistance — always at top */}
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

          {/* Forced event planner prompt after deposit paid */}
          {depositPaidQuote && (
            <Card variant="glass" className="border-primary/50 bg-primary/5">
              <CardContent className="py-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <Calendar className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">Complete your Event Planner</p>
                    <p className="text-xs text-muted-foreground leading-relaxed max-w-md">
                      Your deposit has been received — please complete your event planner including your song playlist
                      (minimum 35 songs), songs you do not want played, and your event timeline.
                      This is required before your event.
                    </p>
                  </div>
                </div>
                <Button variant="hero" size="sm" asChild>
                  <Link to={`/event-planner/${depositPaidQuote.id}`}>
                    <Calendar className="w-4 h-4 mr-2" /> Open Event Planner
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* ② Special banner */}
          {activeSpecials.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> Current Specials
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {activeSpecials.map((s) => (
                  <div key={s.id} className="relative rounded-xl overflow-hidden border border-primary/20">
                    <div className="w-full aspect-[16/9] bg-muted/40 flex items-center justify-center">
                      <img src={s.image_url} alt={s.title || "Special"} className="w-full h-full object-contain" />
                    </div>
                    {s.title && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                        <p className="text-white text-sm font-semibold">{s.title}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ③ Get a Customized Quote */}
          <Card variant="glass" className="border-primary/40 bg-primary/5">
            <CardContent className="py-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">Prefer something tailored?</p>
                <p className="text-xs text-muted-foreground">
                  Tell us about your event — venue, date, times, special effects — and we'll prepare a custom quote.
                  If you need an event organiser, catering, furniture, or table décor, please mention it in the comments
                  when applying — <span className="text-foreground font-semibold">BeatKulture provides that service.</span>
                </p>
              </div>
              <Button variant="hero" onClick={() => setView("questionnaire")}>
                <MessageSquare className="w-4 h-4 mr-2" />
                Request Custom Quotation
              </Button>
            </CardContent>
          </Card>

          {/* ④⑤⑥ Packages — Wedding → Corporate → Party */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <PartyPopper className="w-4 h-4 text-primary" /> Our Packages
            </h2>
            {Object.keys(packagesByCategory).length === 0 ? (
              <p className="text-xs text-muted-foreground">No packages available right now.</p>
            ) : (
              (["wedding", "corporate", "party", "other"] as const)
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
                              <img src={pkg.image_url} alt={pkg.name} className="w-full h-full object-contain" loading="lazy" />
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
                              {(pkg.includes || []).slice(0, 5).map((it, i) => (
                                <li key={i} className="flex items-start gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-primary mt-0.5 shrink-0" /> {it}
                                </li>
                              ))}
                            </ul>
                            <Button
                              variant="hero"
                              size="sm"
                              className="w-full"
                              onClick={() => setView("questionnaire")}
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
          </section>

          {/* My Requests / Quotes */}
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

          {/* ⑦ Competitions banner */}
          <CompetitionsBanner />

          {/* ⑧ Testimonials / Reviews */}
          <TestimonialsSection quoteId={quotes[0]?.id} />

          {/* ⑨ YouTube videos */}
          <YoutubeShowcase />

          {/* ⑩ Mixcloud player — last */}
          <MixcloudRotator autoplayTrigger={user.id} />

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
        onCancel={() => setView("dashboard")}
        onSubmit={async (payload) => {
          await createRequest(payload as any);
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
      <div className="min-h-screen bg-background">
        <Header profile={profile} onSignOut={handleSignOut} extra={
          <Button variant="ghost" size="sm" onClick={() => setView("dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Dashboard
          </Button>
        } />
        <main className="container mx-auto px-4 py-6 max-w-3xl space-y-4">
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
  profile, userEmail, packages, onCancel, onSubmit, submitting,
}: {
  profile: any;
  userEmail: string;
  packages: DbPackage[];
  onCancel: () => void;
  onSubmit: (payload: any) => Promise<void>;
  submitting: boolean;
}) {
  const [form, setForm] = useState({
    event_type: "",
    venue_name: "",
    venue_address: "",
    event_date: "",
    start_time: "",
    end_time: "",
    is_outdoor: false,
    needs_sound: true,
    needs_lighting: false,
    needs_special_effects: false,
    needs_mic: false,
    guest_count: "",
    package_id: "none",
    notes: "",
    contact_no: profile?.phone || "",
  });

  const update = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const submit = async () => {
    if (!form.event_type) {
      toast({ title: "Event type required", variant: "destructive" });
      return;
    }
    const chosenPkg = packages.find(p => p.id === form.package_id);
    await onSubmit({
      client_id: profile.id,
      client_name: profile?.full_name || userEmail,
      email: userEmail,
      contact_no: form.contact_no || null,
      event_type: form.event_type,
      venue_name: form.venue_name || null,
      venue_address: form.venue_address || null,
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
      notes: form.notes || null,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={onCancel} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          <span className="font-display font-bold gradient-text">Custom Quote Request</span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
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
              <Label>Anything else we should know?</Label>
              <Textarea
                rows={4}
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                placeholder="Theme, special moments, accessibility, etc."
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
