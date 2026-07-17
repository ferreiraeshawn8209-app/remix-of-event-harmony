// @ts-nocheck
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/pricing";
import { ClientQuoteTrimmer } from "@/components/client/ClientQuoteTrimmer";
import { MusicPlanningForm } from "@/components/client/MusicPlanningForm";
import { QuoteMessageThread } from "@/components/QuoteMessageThread";
import { PageBackground } from "@/components/PageBackground";
import { CinematicAmbient } from "@/components/CinematicAmbient";
import logo from "@/assets/logo.png";
import {
  ArrowLeft, Loader2, FileText, Music, Palette, Save,
  Calendar, MapPin, PartyPopper, LogOut, Sparkles,
} from "lucide-react";

/**
 * "My Event Hub" — dedicated client-facing page that consolidates:
 *   1. All of the client's quotes (with the interactive trimmer)
 *   2. Music planning + song requests
 *   3. Event vibe & colour scheme
 *   4. Message thread with the BeatKulture team
 *
 * Route: /client/event-hub
 */
export default function EventHub() {
  const navigate = useNavigate();
  const { user, profile, isLoading: authLoading, signOut } = useAuth();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeQuoteId, setActiveQuoteId] = useState<string | null>(null);
  const [colorForm, setColorForm] = useState({
    theme_primary: "",
    theme_secondary: "",
    theme_notes: "",
  });
  const [savingColors, setSavingColors] = useState(false);
  const [existingPlanId, setExistingPlanId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth?redirect=/client/event-hub");
  }, [authLoading, user, navigate]);

  const load = async () => {
    if (!profile?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from("quotes")
      .select("*")
      .eq("client_id", profile.id)
      .order("created_at", { ascending: false });
    const list = (data || []).map((q: any) => ({
      ...q,
      equipment: q.equipment || {},
      custom_items: q.custom_items || [],
      extras: q.extras || [],
    }));
    setQuotes(list);
    if (!activeQuoteId && list[0]) setActiveQuoteId(list[0].id);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-line */ }, [profile?.id]);

  // Load colour scheme from event_plans.additional_notes (namespaced JSON header)
  useEffect(() => {
    if (!profile?.id) return;
    (async () => {
      const { data } = await supabase
        .from("event_plans")
        .select("id, additional_notes")
        .eq("client_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(1);
      if (data && data[0]) {
        setExistingPlanId(data[0].id);
        const raw = data[0].additional_notes || "";
        const match = raw.match(/<<COLOURS>>([\s\S]*?)<<\/COLOURS>>/);
        if (match) {
          try {
            const parsed = JSON.parse(match[1]);
            setColorForm({
              theme_primary: parsed.theme_primary || "",
              theme_secondary: parsed.theme_secondary || "",
              theme_notes: parsed.theme_notes || "",
            });
          } catch { /* ignore */ }
        }
      }
    })();
  }, [profile?.id]);

  const saveColours = async () => {
    if (!profile?.id) return;
    setSavingColors(true);
    try {
      const payloadBlock = `<<COLOURS>>${JSON.stringify(colorForm)}<</COLOURS>>`;
      if (existingPlanId) {
        // preserve any prior notes, replace the colour block
        const { data: existing } = await supabase
          .from("event_plans").select("additional_notes").eq("id", existingPlanId).single();
        const prior = (existing?.additional_notes || "").replace(/<<COLOURS>>[\s\S]*?<<\/COLOURS>>/, "").trim();
        const merged = [prior, payloadBlock].filter(Boolean).join("\n\n");
        const { error } = await supabase.from("event_plans")
          .update({ additional_notes: merged })
          .eq("id", existingPlanId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("event_plans").insert({
          client_id: profile.id,
          client_name: profile.full_name || user?.email || "Client",
          email: user?.email || "",
          quote_id: activeQuoteId,
          additional_notes: payloadBlock,
        } as any).select("id").single();
        if (error) throw error;
        if (data) setExistingPlanId((data as any).id);
      }
      toast({ title: "Colour scheme saved", description: "Your event vibe is locked in." });
    } catch (e: any) {
      toast({ title: "Could not save colours", description: e.message, variant: "destructive" });
    } finally {
      setSavingColors(false);
    }
  };

  if (authLoading || !user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const activeQuote = quotes.find((q) => q.id === activeQuoteId) || null;

  return (
    <div className="min-h-screen bg-background pb-20 premium-page cinematic-shell">
      <PageBackground pageKey="bg_client_portal" />
      <CinematicAmbient intensity="soft" />

      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/client" className="flex items-center gap-2">
            <img src={logo} alt="BeatKulture" className="w-8 h-8" />
            <span className="font-display text-lg font-bold gradient-text">BEATKULTURE</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/client"><ArrowLeft className="w-4 h-4 mr-1" /> Portal</Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={async () => { await signOut(); navigate("/"); }}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-5xl relative z-10 space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary via-fuchsia-500 to-orange-400 shadow-[0_0_28px_hsl(280_95%_60%/0.45)]">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-primary/80">My Event Hub</p>
              <h1 className="font-display text-2xl md:text-3xl font-bold">
                Everything for <span className="gradient-text">{profile.full_name}'s</span> event
              </h1>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Your quotes, song selections, colour scheme and event prep — all in one place.
          </p>
        </motion.div>

        {loading ? (
          <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : quotes.length === 0 ? (
          <Card variant="glass">
            <CardContent className="py-12 text-center space-y-3">
              <FileText className="w-10 h-10 text-muted-foreground mx-auto" />
              <h3 className="font-semibold">No quotes yet</h3>
              <p className="text-sm text-muted-foreground">
                Request a quote from the portal — once our admin sends it, it'll appear here for you to review and customise.
              </p>
              <Button variant="hero" asChild><Link to="/client">Back to Portal</Link></Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Quote picker */}
            {quotes.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {quotes.map((q) => (
                  <Button
                    key={q.id}
                    size="sm"
                    variant={q.id === activeQuoteId ? "hero" : "outline"}
                    onClick={() => setActiveQuoteId(q.id)}
                    className="text-xs"
                  >
                    <span className="font-mono mr-1">{q.client_code}</span>
                    <span className="capitalize">{q.event_type || "event"}</span>
                    <Badge variant="outline" className="ml-2 text-[9px] capitalize">{q.status}</Badge>
                  </Button>
                ))}
              </div>
            )}

            {activeQuote && (
              <Tabs defaultValue="quote" className="space-y-4">
                <TabsList className="w-full grid grid-cols-2 sm:grid-cols-4">
                  <TabsTrigger value="quote"><FileText className="w-4 h-4 mr-1" /> Quote</TabsTrigger>
                  <TabsTrigger value="music"><Music className="w-4 h-4 mr-1" /> Music</TabsTrigger>
                  <TabsTrigger value="vibe"><Palette className="w-4 h-4 mr-1" /> Vibe</TabsTrigger>
                  <TabsTrigger value="messages"><PartyPopper className="w-4 h-4 mr-1" /> Team</TabsTrigger>
                </TabsList>

                <TabsContent value="quote" className="space-y-4">
                  <Card variant="glass">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center justify-between gap-2">
                        <span>Quote {activeQuote.client_code}</span>
                        <Badge variant="outline" className="capitalize">{activeQuote.status}</Badge>
                      </CardTitle>
                      <CardDescription className="text-xs">
                        <span className="flex flex-wrap gap-3 mt-1">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />
                            {activeQuote.event_date ? new Date(activeQuote.event_date).toLocaleDateString("en-ZA") : "Date TBD"}</span>
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{activeQuote.venue || "Venue TBD"}</span>
                          <span className="flex items-center gap-1"><PartyPopper className="w-3 h-3" />{activeQuote.event_type || "Event"}</span>
                        </span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-3 rounded-lg border border-border/40 bg-black/20">
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Subtotal</p>
                          <p className="font-semibold">{formatCurrency(Number(activeQuote.subtotal || 0))}</p>
                        </div>
                        <div className="p-3 rounded-lg border border-primary/30 bg-primary/5">
                          <p className="text-[10px] uppercase tracking-wide text-primary">Total</p>
                          <p className="font-display font-bold text-primary">{formatCurrency(Number(activeQuote.total || 0))}</p>
                        </div>
                        <div className="p-3 rounded-lg border border-border/40 bg-black/20">
                          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">30% Deposit</p>
                          <p className="font-semibold">{formatCurrency(Number(activeQuote.deposit || 0))}</p>
                        </div>
                      </div>
                      <Separator />
                      <p className="text-[11px] text-muted-foreground">
                        DJ hours and the discount % are fixed. You can remove any equipment or extras below —
                        or add them back later up to the originally quoted amount.
                      </p>
                    </CardContent>
                  </Card>

                  <ClientQuoteTrimmer quote={activeQuote} onUpdated={load} />

                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" asChild size="sm">
                      <Link to={`/quote/${activeQuote.id}`}>Open full quote view</Link>
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="music">
                  <MusicPlanningForm
                    profileId={profile.id}
                    clientName={profile.full_name || user.email || "Client"}
                    email={user.email || ""}
                    quoteId={activeQuote.id}
                  />
                </TabsContent>

                <TabsContent value="vibe">
                  <Card variant="glass">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Palette className="w-5 h-5 text-primary" /> Event Vibe & Colour Scheme
                      </CardTitle>
                      <CardDescription>
                        Tell your DJ the colours and mood — we'll match the lighting, uplighters and lasers to your theme.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Primary colour</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={colorForm.theme_primary || "#7c3aed"}
                              onChange={(e) => setColorForm((p) => ({ ...p, theme_primary: e.target.value }))}
                              className="h-9 w-14 p-1 cursor-pointer"
                            />
                            <Input
                              value={colorForm.theme_primary}
                              onChange={(e) => setColorForm((p) => ({ ...p, theme_primary: e.target.value }))}
                              placeholder="#7c3aed or 'burgundy'"
                              className="h-9"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Secondary colour</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={colorForm.theme_secondary || "#f59e0b"}
                              onChange={(e) => setColorForm((p) => ({ ...p, theme_secondary: e.target.value }))}
                              className="h-9 w-14 p-1 cursor-pointer"
                            />
                            <Input
                              value={colorForm.theme_secondary}
                              onChange={(e) => setColorForm((p) => ({ ...p, theme_secondary: e.target.value }))}
                              placeholder="#f59e0b or 'champagne gold'"
                              className="h-9"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Mood, dress code & extra notes</Label>
                        <Textarea
                          rows={4}
                          value={colorForm.theme_notes}
                          onChange={(e) => setColorForm((p) => ({ ...p, theme_notes: e.target.value }))}
                          placeholder="e.g. Modern romantic — warm ambers on cocktails, purples & pinks for dancefloor, soft strobes only during peak hours."
                        />
                      </div>
                      <Button variant="hero" onClick={saveColours} disabled={savingColors} className="w-full">
                        {savingColors ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Save colour scheme
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="messages">
                  <QuoteMessageThread
                    quoteId={activeQuote.id}
                    role="client"
                    senderName={activeQuote.client_name || profile.full_name || "Client"}
                  />
                </TabsContent>
              </Tabs>
            )}
          </>
        )}
      </main>
    </div>
  );
}
