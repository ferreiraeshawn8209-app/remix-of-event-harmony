import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePackages, DbPackage } from "@/hooks/usePackages";
import { useSpecials } from "@/hooks/useSpecials";
import { toast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/pricing";
import { QRCodeSVG } from "qrcode.react";
import logo from "@/assets/logo.png";
import {
  Music, Loader2, FileText, CheckCircle2, Clock,
  Send, QrCode, PartyPopper, Plus, Heart, Calendar, MapPin,
  User, CreditCard, Image as ImageIcon, Trash2, Sparkles
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
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { packages } = usePackages();
  const { activeSpecials } = useSpecials();

  const [step, setStep] = useState<"code" | "brochure" | "portal">("code");
  const [clientCode, setClientCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [activeTab, setActiveTab] = useState("quote");
  const [extraRequest, setExtraRequest] = useState<ExtraRequest>({ item: "", notes: "" });
  const [sendingExtra, setSendingExtra] = useState(false);
  const [requestingPkgId, setRequestingPkgId] = useState<string | null>(null);
  const [equipmentNames, setEquipmentNames] = useState<Record<string, string>>({});
  const [equipmentPrices, setEquipmentPrices] = useState<Record<string, number>>({});
  const [removingItem, setRemovingItem] = useState<string | null>(null);
  const [brochureTab, setBrochureTab] = useState("wedding");
  const [customNotes, setCustomNotes] = useState("");
  const [sendingCustom, setSendingCustom] = useState(false);
  const [acceptingQuote, setAcceptingQuote] = useState(false);
  const [acceptingPkgId, setAcceptingPkgId] = useState<string | null>(null);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?redirect=/client");
    }
  }, [authLoading, user, navigate]);

  // Check URL params for admin preview mode
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const previewEmail = params.get("email");
    const previewCode = params.get("code");
    if (previewEmail && previewCode) {
      setClientCode(previewCode.toUpperCase());
      setTimeout(() => {
        (async () => {
          setLoading(true);
          const { data, error } = await supabase.rpc("lookup_quote_by_code", {
            _email: previewEmail,
            _code: previewCode,
          });
          if (!error && data && (data as any[]).length > 0) {
            const q = (data as unknown as QuoteData[])[0];
            setQuote({ ...q, equipment: (q.equipment as any) || {}, custom_items: (q.custom_items as any) || [] });
            setStep("portal");
          }
          setLoading(false);
        })();
      }, 0);
    }
  }, []);

  // Load equipment names for display
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("equipment_catalog").select("item_key, name, price").eq("is_active", true);
      if (data) {
        const nameMap: Record<string, string> = {};
        const priceMap: Record<string, number> = {};
        data.forEach(e => { nameMap[e.item_key] = e.name; priceMap[e.item_key] = Number(e.price); });
        setEquipmentNames(nameMap);
        setEquipmentPrices(priceMap);
      }
    })();
  }, []);

  const userEmail = user?.email || "";

  const handleCodeSubmit = async () => {
    if (!clientCode.trim()) {
      toast({ title: "Missing code", description: "Please enter your client code.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      // Try standard lookup (email + code)
      let results: QuoteData[] = [];
      const { data, error } = await supabase.rpc("lookup_quote_by_code", {
        _email: userEmail,
        _code: clientCode.trim(),
      });
      if (error) throw error;
      results = (data as unknown as QuoteData[]) || [];

      // Admin fallback: lookup by code only if standard lookup returned nothing
      if (results.length === 0 && isAdmin) {
        const { data: adminData, error: adminError } = await supabase
          .from("quotes")
          .select("*")
          .ilike("client_code", clientCode.trim())
          .limit(1);
        if (!adminError && adminData && adminData.length > 0) {
          results = adminData as unknown as QuoteData[];
        }
      }

      if (results.length === 0) {
        toast({ title: "Not Found", description: "No quote found with that client code. Please check your details.", variant: "destructive" });
        setStep("brochure");
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

      // Log client access
      try {
        await supabase.from("client_access_logs").insert({
          quote_id: q.id,
          client_code: clientCode.trim().toUpperCase(),
          email: userEmail.toLowerCase(),
          user_agent: navigator.userAgent,
        });
      } catch { /* silent */ }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setLoading(false);
  };

  const handleRequestExtra = async () => {
    if (!extraRequest.item.trim() || !quote) return;
    setSendingExtra(true);

    try {
      await supabase.from("admin_notifications").insert({
        type: "extra_request",
        title: "Client Extra Request",
        message: `${quote.client_name} (${quote.client_code}) requested: "${extraRequest.item}"${extraRequest.notes ? ` — Notes: ${extraRequest.notes}` : ""}`,
        quote_id: quote.id,
        client_code: quote.client_code,
        email: userEmail,
      });
      toast({
        title: "Request Sent!",
        description: "BeatKulture has been notified and will update your quote shortly.",
      });
      setExtraRequest({ item: "", notes: "" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setSendingExtra(false);
  };

  const handleRemoveEquipment = async (itemKey: string) => {
    if (!quote) return;
    setRemovingItem(itemKey);
    try {
      const updatedEquipment = { ...quote.equipment };
      delete updatedEquipment[itemKey];

      // Recalculate equipment cost
      let newEquipmentCost = 0;
      Object.entries(updatedEquipment).forEach(([key, qty]) => {
        const price = equipmentPrices[key] || 0;
        newEquipmentCost += price * Number(qty);
      });

      const newSubtotal = Number(quote.dj_cost) + newEquipmentCost + Number(quote.kids_cost) + Number(quote.custom_items?.reduce((s, i) => s + i.price * i.qty, 0) || 0);
      const newTotal = newSubtotal + Number(quote.travel_cost) - Number(quote.discount_amount);
      
      const newDeposit = Math.round(newTotal * 0.3);
      const newBalance = newTotal - (quote.deposit_paid ? Number(quote.deposit) : 0);

      const { error } = await supabase
        .from("quotes")
        .update({
          equipment: updatedEquipment,
          equipment_cost: newEquipmentCost,
          subtotal: newSubtotal,
          total: newTotal,
          deposit: newDeposit,
          balance: newBalance,
        })
        .eq("id", quote.id);

      if (error) throw error;

      // Notify admin
      await supabase.from("admin_notifications").insert({
        type: "extra_request",
        title: "Client Removed Item",
        message: `${quote.client_name} (${quote.client_code}) removed "${equipmentNames[itemKey] || itemKey}" from their quote`,
        quote_id: quote.id,
        client_code: quote.client_code,
        email: userEmail,
      });

      // Update local state
      setQuote(prev => prev ? {
        ...prev,
        equipment: updatedEquipment,
        equipment_cost: newEquipmentCost,
        subtotal: newSubtotal,
        total: newTotal,
        deposit: newDeposit,
        balance: newBalance,
      } : null);

      toast({ title: "Item Removed", description: `${equipmentNames[itemKey] || itemKey} has been removed from your quote.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setRemovingItem(null);
  };

  const handleRemoveCustomItem = async (index: number) => {
    if (!quote) return;
    const item = quote.custom_items[index];
    setRemovingItem(`custom-${index}`);
    try {
      const updatedItems = quote.custom_items.filter((_, i) => i !== index);
      const newCustomCost = updatedItems.reduce((s, i) => s + i.price * i.qty, 0);

      const newSubtotal = Number(quote.dj_cost) + Number(quote.equipment_cost) + Number(quote.kids_cost) + newCustomCost;
      const newTotal = newSubtotal + Number(quote.travel_cost) - Number(quote.discount_amount);
      const newDeposit = Math.round(newTotal * 0.3);
      const newBalance = newTotal - (quote.deposit_paid ? Number(quote.deposit) : 0);

      const { error } = await supabase
        .from("quotes")
        .update({
          custom_items: updatedItems as any,
          custom_items_cost: newCustomCost,
          subtotal: newSubtotal,
          total: newTotal,
          deposit: newDeposit,
          balance: newBalance,
        })
        .eq("id", quote.id);

      if (error) throw error;

      await supabase.from("admin_notifications").insert({
        type: "extra_request",
        title: "Client Removed Item",
        message: `${quote.client_name} (${quote.client_code}) removed custom item "${item.name}" from their quote`,
        quote_id: quote.id,
        client_code: quote.client_code,
        email: userEmail,
      });

      setQuote(prev => prev ? {
        ...prev,
        custom_items: updatedItems,
        custom_items_cost: newCustomCost,
        subtotal: newSubtotal,
        total: newTotal,
        deposit: newDeposit,
        balance: newBalance,
      } : null);

      toast({ title: "Item Removed", description: `${item.name} has been removed from your quote.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setRemovingItem(null);
  };

  const handleAcceptQuote = async () => {
    if (!quote) return;
    setAcceptingQuote(true);
    try {
      const { error } = await supabase
        .from("quotes")
        .update({ status: "accepted" })
        .eq("id", quote.id);
      if (error) throw error;

      await supabase.from("admin_notifications").insert({
        type: "quote_accepted",
        title: "Quote Accepted",
        message: `${quote.client_name} (${quote.client_code}) accepted their custom quote of ${formatCurrency(Number(quote.total))}. Awaiting deposit payment.`,
        quote_id: quote.id,
        client_code: quote.client_code,
        email: userEmail,
      });

      setQuote(prev => prev ? { ...prev, status: "accepted" } : null);
      toast({ title: "Quote Accepted! ✓", description: "Please proceed with the deposit payment using the banking details provided." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setAcceptingQuote(false);
  };

  const handleAcceptPackage = async (pkg: typeof packages[0]) => {
    if (!quote) return;
    setAcceptingPkgId(pkg.id);
    try {
      // Create a new quote based on the package
      const { data: newQuote, error } = await supabase
        .from("quotes")
        .insert({
          client_id: quote.client_id,
          client_name: quote.client_name,
          contact_no: quote.contact_no,
          email: quote.email,
          venue: quote.venue,
          event_date: quote.event_date,
          start_time: quote.start_time,
          end_time: quote.end_time,
          event_type: pkg.category,
          dj_name: quote.dj_name,
          equipment: {},
          custom_items: [],
          kids_corner: false,
          kids_hours: 0,
          travel_distance: quote.travel_distance,
          discount_percent: 0,
          dj_cost: 0,
          equipment_cost: 0,
          custom_items_cost: 0,
          kids_cost: 0,
          subtotal: Number(pkg.price),
          travel_cost: Number(quote.travel_cost),
          discount_amount: 0,
          total: Number(pkg.price) + Number(quote.travel_cost),
          deposit: Math.round((Number(pkg.price) + Number(quote.travel_cost)) * 0.3),
          balance: Number(pkg.price) + Number(quote.travel_cost) - Math.round((Number(pkg.price) + Number(quote.travel_cost)) * 0.3),
          hours: quote.hours,
          status: "accepted",
          created_by: quote.created_by || null,
        } as any)
        .select()
        .single();

      if (error) throw error;

      await supabase.from("admin_notifications").insert({
        type: "package_accepted",
        title: "Package Accepted",
        message: `${quote.client_name} (${quote.client_code}) chose the "${pkg.name}" package (${formatCurrency(Number(pkg.price))}). New quote created. Awaiting deposit.`,
        quote_id: newQuote?.id,
        client_code: quote.client_code,
        email: userEmail,
      });

      // Load the new quote
      if (newQuote) {
        setQuote({
          ...(newQuote as unknown as QuoteData),
          equipment: {},
          custom_items: [],
        });
      }

      toast({ title: "Package Selected! ✓", description: `You've chosen the "${pkg.name}" package. Please pay the deposit to confirm your booking.` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
    setAcceptingPkgId(null);
  };

  const songRequestUrl = typeof window !== "undefined"
    ? `${window.location.origin}/request/${quote?.id}`
    : "";

  // ─── CODE ENTRY SCREEN ─────────────────────────────────────
  if (step === "code") {
    if (authLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="text-center mb-8">
            <img src={logo} alt="BeatKulture" className="w-16 h-16 mx-auto mb-4" />
            <h1 className="font-display text-2xl font-bold">Client <span className="gradient-text">Portal</span></h1>
            <p className="text-sm text-muted-foreground mt-1">Welcome, {user?.email}</p>
          </div>

          <Card variant="glass">
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label>Client Code</Label>
                <Input
                  placeholder="BK-XXXXXX"
                  value={clientCode}
                  onChange={(e) => setClientCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleCodeSubmit()}
                  className="font-mono tracking-wider text-center text-lg"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">Your client code was provided by BeatKulture with your quote.</p>
              </div>
              <Button variant="hero" className="w-full" onClick={handleCodeSubmit} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                View My Quote
              </Button>

              <Separator />

              <Button variant="outline" className="w-full" onClick={() => setStep("brochure")}>
                <Music className="w-4 h-4 mr-2" />
                Browse Our Packages
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

  // ─── BROCHURE / PACKAGE SELECTION SCREEN ─────────────────
  if (step === "brochure") {
    const weddingPkgs = packages.filter(p => p.category.toLowerCase().includes("wedding") && p.is_active);
    const corporatePkgs = packages.filter(p => p.category.toLowerCase().includes("corporate") && p.is_active);
    const partyPkgs = packages.filter(p => p.is_active && !p.category.toLowerCase().includes("wedding") && !p.category.toLowerCase().includes("corporate"));

    const handleSelectPackage = async (pkg: typeof packages[0]) => {
      setRequestingPkgId(pkg.id);
      try {
        await supabase.from("admin_notifications").insert({
          type: "package_quote_request",
          title: "Package Quote Request",
          message: `${user?.email} selected "${pkg.name}" (${formatCurrency(Number(pkg.price))}). Please prepare a quote and send their client code.`,
          email: user?.email || "",
        });
        toast({
          title: "Package Selected! ✓",
          description: "BeatKulture will prepare your quote and send you a client code shortly. You can then return here to view and manage your quote.",
        });
      } catch {
        toast({ title: "Error", description: "Could not send request. Please try again.", variant: "destructive" });
      }
      setRequestingPkgId(null);
    };

    const handleRequestCustomQuote = async () => {
      setSendingCustom(true);
      try {
        await supabase.from("admin_notifications").insert({
          type: "package_quote_request",
          title: "Custom Quote Request",
          message: `${user?.email} is requesting a customized quote.${customNotes ? ` Details: "${customNotes}"` : ""} Please contact the client to discuss requirements.`,
          email: user?.email || "",
        });
        toast({
          title: "Request Sent! ✓",
          description: "BeatKulture will contact you to discuss your custom requirements and prepare a tailored quote.",
        });
        setCustomNotes("");
      } catch {
        toast({ title: "Error", description: "Could not send request. Please try again.", variant: "destructive" });
      }
      setSendingCustom(false);
    };

    const categoryTabs = [
      { value: "wedding", label: "Wedding", icon: <Heart className="w-4 h-4" />, pkgs: weddingPkgs },
      { value: "corporate", label: "Corporate", icon: <PartyPopper className="w-4 h-4" />, pkgs: corporatePkgs },
      { value: "party", label: "Party", icon: <Music className="w-4 h-4" />, pkgs: partyPkgs },
    ].filter(t => t.pkgs.length > 0);

    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="BeatKulture" className="w-8 h-8" />
              <span className="font-display text-lg font-bold gradient-text">BEATKULTURE</span>
            </Link>
            <Button variant="ghost" size="sm" onClick={() => setStep("code")}>
              ← Back
            </Button>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6 max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="text-center">
              <h1 className="font-display text-3xl font-bold">Choose Your <span className="gradient-text">Package</span></h1>
              <p className="text-muted-foreground mt-2 text-sm">
                Select a package below to get started, or request a custom quote tailored to your needs.
              </p>
            </div>

            {/* Package Tabs */}
            <Tabs value={brochureTab} onValueChange={setBrochureTab}>
              <TabsList className={`grid w-full grid-cols-${categoryTabs.length}`}>
                {categoryTabs.map(tab => (
                  <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
                    {tab.icon}
                    <span>{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {categoryTabs.map(tab => (
                <TabsContent key={tab.value} value={tab.value}>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    {tab.pkgs.map(pkg => (
                      <Card key={pkg.id} variant={pkg.popular ? "glow" : "glass"} className={`relative hover:border-primary/30 transition-colors ${pkg.popular ? "ring-2 ring-primary" : ""}`}>
                        {pkg.popular && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                            <Badge className="bg-primary text-primary-foreground px-3 py-0.5 text-xs">Most Popular</Badge>
                          </div>
                        )}
                        <CardHeader>
                          <CardTitle className="text-base">{pkg.name}</CardTitle>
                          <CardDescription className="text-xs">{pkg.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="font-display text-2xl font-bold gradient-text">
                            {formatCurrency(Number(pkg.price))}
                          </p>
                          <p className="text-xs text-muted-foreground">Starting from</p>
                          <ul className="text-xs space-y-1.5 text-muted-foreground">
                            {(pkg.includes as string[]).map((item, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <CheckCircle2 className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                                {item}
                              </li>
                            ))}
                          </ul>
                          <Button
                            variant={pkg.popular ? "hero" : "default"}
                            size="sm"
                            className="w-full mt-3"
                            disabled={requestingPkgId === pkg.id}
                            onClick={() => handleSelectPackage(pkg)}
                          >
                            {requestingPkgId === pkg.id ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
                            Select This Package
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>

            {/* Custom Quote Option */}
            <Card variant="glass" className="border-dashed border-2">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Plus className="w-5 h-5 text-primary" />
                  Need Something Custom?
                </CardTitle>
                <CardDescription className="text-xs">
                  None of the packages fit? Tell us what you need and we'll create a tailored quote for you.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="Describe your event, requirements, and any specific needs..."
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  rows={3}
                  className="text-sm"
                />
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={sendingCustom}
                  onClick={handleRequestCustomQuote}
                >
                  {sendingCustom ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Send className="w-4 h-4 mr-1" />}
                  Request Custom Quote
                </Button>
              </CardContent>
            </Card>

            {/* Already have a code */}
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">Already have a client code?</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => setStep("code")}>
                Enter Client Code
              </Button>
            </div>
          </motion.div>
        </main>
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
            <Button variant="ghost" size="sm" onClick={() => { setStep("code"); setQuote(null); }}>
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

          {/* Specials Banner */}
          {activeSpecials.length > 0 && (
            <div className="space-y-3">
              {activeSpecials.map((special) => (
                <div key={special.id} className="relative rounded-xl overflow-hidden border border-primary/20">
                  <img
                    src={special.image_url}
                    alt={special.title || "Current Special"}
                    className="w-full h-auto max-h-48 object-cover"
                  />
                  {special.title && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                      <p className="text-white text-sm font-semibold flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> {special.title}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

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
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="quote"><FileText className="w-3 h-3 mr-1" />Quote</TabsTrigger>
              <TabsTrigger value="planner"><Calendar className="w-3 h-3 mr-1" />Planner</TabsTrigger>
              <TabsTrigger value="photos"><ImageIcon className="w-3 h-3 mr-1" />Photos</TabsTrigger>
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
                        <div key={key} className="flex justify-between items-center text-sm text-muted-foreground group">
                          <span>{equipmentNames[key] || key} × {qty}</span>
                          <div className="flex items-center gap-2">
                            <span>{formatCurrency((equipmentPrices[key] || 0) * Number(qty))}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive hover:bg-destructive/10 opacity-70 hover:opacity-100"
                              disabled={removingItem === key}
                              onClick={() => handleRemoveEquipment(key)}
                              title="Remove this item"
                            >
                              {removingItem === key ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                            </Button>
                          </div>
                        </div>
                      );
                    })}

                    {(quote.custom_items || []).map((item, i) => (
                      <div key={i} className="flex justify-between items-center text-sm text-muted-foreground group">
                        <span>{item.name} × {item.qty}</span>
                        <div className="flex items-center gap-2">
                          <span>{formatCurrency(item.price * item.qty)}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:bg-destructive/10 opacity-70 hover:opacity-100"
                            disabled={removingItem === `custom-${i}`}
                            onClick={() => handleRemoveCustomItem(i)}
                            title="Remove this item"
                          >
                            {removingItem === `custom-${i}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                          </Button>
                        </div>
                      </div>
                    ))}

                    {Number(quote.kids_cost) > 0 && (
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Kids Corner ({quote.kids_hours}h)</span>
                        <span>{formatCurrency(Number(quote.kids_cost))}</span>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground italic">
                    You may remove items above. To add extras, use the Extras tab to request from BeatKulture.
                  </p>

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
                  {isPaid ? (
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
                  ) : (
                    <div className="text-center py-6">
                      <Clock className="w-10 h-10 text-orange-500 mx-auto mb-3 opacity-60" />
                      <p className="font-semibold text-sm mb-2">Deposit Required</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        The event planner becomes available once your 30% deposit of {formatCurrency(Number(quote.deposit))} has been paid and confirmed.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Contact us: <strong>065 528 5528</strong> or <strong>info@beatkulture.co.za</strong>
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── PHOTOS TAB ─── */}
            <TabsContent value="photos" className="space-y-4 mt-4">
              <ClientPhotoGallery quoteId={quote.id} />
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
