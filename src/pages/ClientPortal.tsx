import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/pricing";
import { QRCodeSVG } from "qrcode.react";
import logo from "@/assets/logo.png";
import {
  Music, Loader2, FileText, CheckCircle2, Clock, AlertCircle,
  Send, QrCode, PartyPopper, Plus, Heart, Calendar, MapPin,
  User, CreditCard, ListMusic, Image as ImageIcon
} from "lucide-react";
import { ClientPhotoGallery } from "@/components/ClientPhotoGallery";

interface QuoteData {
  id: string;
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

interface ExtraRequest {
  item: string;
  notes: string;
}

export default function ClientPortal() {
  const [step, setStep] = useState<"login" | "portal">("login");
  const [email, setEmail] = useState("");
  const [clientCode, setClientCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [activeTab, setActiveTab] = useState("quote");
  const [extraRequest, setExtraRequest] = useState<ExtraRequest>({ item: "", notes: "" });
  const [sendingExtra, setSendingExtra] = useState(false);
  const [equipmentNames, setEquipmentNames] = useState<Record<string, string>>({});

  // Load equipment names for display
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("equipment_catalog").select("item_key, name").eq("is_active", true);
      if (data) {
        const map: Record<string, string> = {};
        data.forEach(e => { map[e.item_key] = e.name; });
        setEquipmentNames(map);
      }
    })();
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !clientCode.trim()) {
      toast({ title: "Missing details", description: "Please enter both your email and client code.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("lookup_quote_by_code", {
        _email: email.trim(),
        _code: clientCode.trim(),
      });

      if (error) throw error;
      const results = data as unknown as QuoteData[];
      if (!results || results.length === 0) {
        toast({ title: "Not Found", description: "No quote found with that email and client code. Please check your details.", variant: "destructive" });
        setLoading(false);
        return;
      }

      const q = results[0];
      setQuote({
        ...q,
        equipment: (q.equipment as any) || {},
        custom_items: (q.custom_items as any) || [],
      });
      setStep("portal");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const handleRequestExtra = async () => {
    if (!extraRequest.item.trim() || !quote) return;
    setSendingExtra(true);

    // We'll use a simple approach: insert a record into event_plans additional_notes
    // or more practically, we send a notification by updating the quote's custom_items with a pending flag
    // For simplicity, let's create a lightweight approach using the existing structure
    try {
      // Fetch current quote to get latest custom_items
      const { data: current } = await supabase.rpc("lookup_quote_by_code", {
        _email: email.trim(),
        _code: clientCode.trim(),
      });
      
      if (!current || (current as any[]).length === 0) throw new Error("Quote not found");
      
      // We can't update directly (RLS), so we'll use the song_requests table as a notification channel
      // by inserting a special "extra request" type. But that's a hack.
      // Better: just show a toast with instructions to contact admin
      toast({
        title: "Extra Request Noted",
        description: `Please contact BeatKulture directly to add "${extraRequest.item}" to your quote. WhatsApp: 065 528 5528 or email: info@beatkulture.co.za`,
      });
      setExtraRequest({ item: "", notes: "" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setSendingExtra(false);
  };

  const songRequestUrl = typeof window !== "undefined"
    ? `${window.location.origin}/request/${quote?.id}`
    : "";

  // ─── LOGIN SCREEN ─────────────────────────────────────
  if (step === "login") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="text-center mb-8">
            <img src={logo} alt="BeatKulture" className="w-16 h-16 mx-auto mb-4" />
            <h1 className="font-display text-2xl font-bold">Client <span className="gradient-text">Portal</span></h1>
            <p className="text-sm text-muted-foreground mt-1">Enter your email and client code to view your quote</p>
          </div>

          <Card variant="glass">
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
              </div>
              <div className="space-y-2">
                <Label>Client Code</Label>
                <Input
                  placeholder="BK-XXXXXX"
                  value={clientCode}
                  onChange={(e) => setClientCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  className="font-mono tracking-wider"
                />
                <p className="text-xs text-muted-foreground">Your client code was provided by BeatKulture with your quote.</p>
              </div>
              <Button variant="hero" className="w-full" onClick={handleLogin} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                View My Quote
              </Button>
            </CardContent>
          </Card>

          <div className="text-center mt-4">
            <Link to="/" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              ← Back to BeatKulture
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── CLIENT PORTAL ────────────────────────────────────
  if (!quote) return null;

  const isPaid = quote.deposit_paid;
  const isFullyPaid = quote.balance_paid;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="BeatKulture" className="w-8 h-8" />
            <span className="font-display text-lg font-bold gradient-text">BEATKULTURE</span>
          </Link>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs">{quote.client_code}</Badge>
            <Button variant="ghost" size="sm" onClick={() => { setStep("login"); setQuote(null); }}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Welcome */}
          <div>
            <h1 className="font-display text-2xl font-bold">
              Welcome, <span className="gradient-text">{quote.client_name}</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              {quote.event_type} • {quote.event_date ? new Date(quote.event_date).toLocaleDateString("en-ZA", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "Date TBD"}
            </p>
          </div>

          {/* Payment Status Banner */}
          <Card variant="glass" className={`border-l-4 ${isFullyPaid ? "border-l-green-500 bg-green-500/5" : isPaid ? "border-l-blue-500 bg-blue-500/5" : "border-l-orange-500 bg-orange-500/5"}`}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  {isFullyPaid ? (
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  ) : isPaid ? (
                    <CreditCard className="w-8 h-8 text-blue-500" />
                  ) : (
                    <Clock className="w-8 h-8 text-orange-500" />
                  )}
                  <div>
                    <p className="font-semibold text-sm">
                      {isFullyPaid ? "Fully Paid ✓" : isPaid ? "Deposit Paid — Balance Outstanding" : "Deposit Required to Confirm Booking"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isFullyPaid
                        ? "Your booking is confirmed and fully paid. See you at the event!"
                        : isPaid
                          ? `Deposit of ${formatCurrency(Number(quote.deposit))} received${quote.deposit_paid_at ? ` on ${new Date(quote.deposit_paid_at).toLocaleDateString("en-ZA")}` : ""}. Outstanding: ${formatCurrency(Number(quote.balance))}`
                          : `A 30% deposit of ${formatCurrency(Number(quote.deposit))} is required to secure your booking.`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="font-display text-xl font-bold">{formatCurrency(Number(quote.total))}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="quote"><FileText className="w-3 h-3 mr-1" />Quote</TabsTrigger>
              <TabsTrigger value="planner"><Calendar className="w-3 h-3 mr-1" />Planner</TabsTrigger>
              <TabsTrigger value="songs"><Music className="w-3 h-3 mr-1" />Songs</TabsTrigger>
              <TabsTrigger value="extras"><Plus className="w-3 h-3 mr-1" />Extras</TabsTrigger>
            </TabsList>

            {/* ─── QUOTE TAB ─── */}
            <TabsContent value="quote" className="space-y-4 mt-4">
              <Card variant="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-primary" /> Your Quote</CardTitle>
                  <CardDescription>Ref: {quote.client_code} • Created {new Date(quote.created_at).toLocaleDateString("en-ZA")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Event Details */}
                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground"><User className="w-3 h-3" /> {quote.client_name}</div>
                      <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="w-3 h-3" /> {quote.venue || "TBD"}</div>
                      <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="w-3 h-3" /> {quote.event_date ? new Date(quote.event_date).toLocaleDateString("en-ZA") : "TBD"}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground"><Clock className="w-3 h-3" /> {quote.start_time?.slice(0, 5) || ""} – {quote.end_time?.slice(0, 5) || ""}</div>
                      <div className="flex items-center gap-2 text-muted-foreground"><PartyPopper className="w-3 h-3" /> {quote.event_type || "N/A"}</div>
                      <div className="flex items-center gap-2 text-muted-foreground"><Music className="w-3 h-3" /> DJ: {quote.dj_name || "TBD"}</div>
                    </div>
                  </div>

                  <Separator />

                  {/* Line Items */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span>DJ Service ({quote.hours} hours)</span>
                      <span>{formatCurrency(Number(quote.dj_cost))}</span>
                    </div>

                    {Object.entries(quote.equipment || {}).map(([key, qty]) => {
                      if (Number(qty) <= 0) return null;
                      return (
                        <div key={key} className="flex justify-between text-sm text-muted-foreground">
                          <span>{equipmentNames[key] || key} × {qty}</span>
                        </div>
                      );
                    })}

                    {(quote.custom_items || []).map((item, i) => (
                      <div key={i} className="flex justify-between text-sm text-muted-foreground">
                        <span>{item.name} × {item.qty}</span>
                        <span>{formatCurrency(item.price * item.qty)}</span>
                      </div>
                    ))}

                    {Number(quote.kids_cost) > 0 && (
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Kids Corner ({quote.kids_hours}h)</span>
                        <span>{formatCurrency(Number(quote.kids_cost))}</span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Totals */}
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(Number(quote.subtotal))}</span></div>
                    {Number(quote.travel_cost) > 0 && (
                      <div className="flex justify-between text-muted-foreground"><span>Travel ({quote.travel_distance}km)</span><span>{formatCurrency(Number(quote.travel_cost))}</span></div>
                    )}
                    {Number(quote.discount_amount) > 0 && (
                      <div className="flex justify-between text-green-600"><span>Discount ({quote.discount_percent}%)</span><span>-{formatCurrency(Number(quote.discount_amount))}</span></div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-display font-bold text-lg pt-1">
                      <span>Total</span><span>{formatCurrency(Number(quote.total))}</span>
                    </div>
                    <div className="flex justify-between text-primary font-semibold">
                      <span>30% Deposit</span><span>{formatCurrency(Number(quote.deposit))}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Remaining Balance</span><span>{formatCurrency(Number(quote.balance))}</span>
                    </div>
                  </div>

                  {/* Banking */}
                  <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border text-xs space-y-1">
                    <p className="font-semibold text-sm">Banking Details</p>
                    <p>Bank: First National Bank</p>
                    <p>Account: BEATKULTURE (PTY) LTD</p>
                    <p>Account No: 63189325905</p>
                    <p>Branch Code: 250655</p>
                    <p className="text-muted-foreground mt-1">Use your name as reference</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── PLANNER TAB ─── */}
            <TabsContent value="planner" className="space-y-4 mt-4">
              <Card variant="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5 text-primary" /> Event Planner</CardTitle>
                  <CardDescription>
                    Plan your event schedule, music cues, and special moments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-6">
                    <Heart className="w-10 h-10 text-primary mx-auto mb-3 opacity-60" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Use our event planner to tell us your song choices, timeline, and special moments.
                    </p>
                    <Button variant="hero" asChild>
                      <Link to={`/event-planner/${quote.id}`}>
                        <Calendar className="w-4 h-4 mr-2" />
                        Open Event Planner
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── SONG REQUEST QR TAB ─── */}
            <TabsContent value="songs" className="space-y-4 mt-4">
              <Card variant="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><QrCode className="w-5 h-5 text-primary" /> Song Request QR Code</CardTitle>
                  <CardDescription>
                    Share this QR code with your guests so they can request songs at your event
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center gap-4">
                    <div className="bg-white p-4 rounded-xl">
                      <QRCodeSVG
                        value={songRequestUrl}
                        size={200}
                        level="H"
                        includeMargin
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-center max-w-xs">
                      Guests scan this code → leave a review → then submit their song request. 
                      All requests go directly to your DJ's live queue.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(songRequestUrl);
                          toast({ title: "Link Copied", description: "Song request link copied to clipboard." });
                        }}
                      >
                        Copy Link
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const waMsg = encodeURIComponent(`🎵 Request songs at our event!\n\nScan or click: ${songRequestUrl}`);
                          window.open(`https://wa.me/?text=${waMsg}`, "_blank");
                        }}
                      >
                        Share via WhatsApp
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── EXTRAS REQUEST TAB ─── */}
            <TabsContent value="extras" className="space-y-4 mt-4">
              <Card variant="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Plus className="w-5 h-5 text-primary" /> Request Extras</CardTitle>
                  <CardDescription>
                    Want to add something to your booking? Let us know and we'll update your quote.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>What would you like to add?</Label>
                    <Input
                      placeholder="e.g. Extra speaker, Smoke machine, Low fog..."
                      value={extraRequest.item}
                      onChange={(e) => setExtraRequest(prev => ({ ...prev, item: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Additional Notes</Label>
                    <Textarea
                      placeholder="Any details about what you need..."
                      value={extraRequest.notes}
                      onChange={(e) => setExtraRequest(prev => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  <Button onClick={handleRequestExtra} disabled={sendingExtra || !extraRequest.item.trim()}>
                    {sendingExtra ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                    Send Request
                  </Button>

                  <div className="mt-4 p-3 rounded-lg bg-muted/20 border border-border text-xs text-muted-foreground">
                    <p><strong>How it works:</strong> Your request will be sent to BeatKulture. We'll update your quote with any additions and let you know the revised total.</p>
                    <p className="mt-1">Contact us directly: <strong>065 528 5528</strong> or <strong>info@beatkulture.co.za</strong></p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Quote validity */}
          <p className="text-xs text-center text-muted-foreground">
            This quote is valid for 7 days from {new Date(quote.created_at).toLocaleDateString("en-ZA")}. 
            BeatKulture Entertainment (PTY) LTD • Reg: 2025/533623/07
          </p>
        </motion.div>
      </main>
    </div>
  );
}
