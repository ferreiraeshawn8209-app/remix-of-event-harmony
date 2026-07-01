import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useQuotes, DatabaseQuote } from "@/hooks/useQuotes";
import { formatCurrency } from "@/lib/pricing";
import { useEquipmentCatalog } from "@/hooks/useEquipmentCatalog";
import { CatalogItemForPdf } from "@/lib/generateInvoicePdf";
import {
  Music,
  ArrowLeft,
  Loader2,
  FileText,
  Calendar,
  Clock,
  MapPin,
  Edit,
  Receipt,
  Send,
  CheckCircle2,
  Circle,
  Mail,
  MessageCircle,
} from "lucide-react";
import { generateInvoicePdf, generateQuotePdf, sharePdfViaWhatsApp, shareViaEmail } from "@/lib/generateInvoicePdf";
import { toast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { QuoteMessageThread } from "@/components/QuoteMessageThread";

export default function QuoteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading, profile } = useAuth();
  const { quotes, isLoading: quotesLoading, updateQuote } = useQuotes();
  const { items: catalogItems } = useEquipmentCatalog();
  const [quote, setQuote] = useState<DatabaseQuote | null>(null);
  const [markingPayment, setMarkingPayment] = useState(false);

  const catalogForPdf: CatalogItemForPdf[] = catalogItems.map(i => ({
    id: i.item_key, name: i.name, price: i.price,
    image_url: i.image_url, description: i.description,
  }));

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!quotesLoading && quotes.length > 0 && id) {
      const found = quotes.find((q) => q.id === id);
      setQuote(found || null);
    }
  }, [quotes, quotesLoading, id]);

  if (authLoading || quotesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  if (!quotesLoading && !quote) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card variant="glass" className="max-w-md w-full mx-4 text-center">
          <CardContent className="py-12">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Quote Not Found</h2>
            <p className="text-muted-foreground mb-4">This quote may have been deleted or you don't have access.</p>
            <Button variant="hero" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!quote) return null;

  const equipment = quote.equipment || {};
  const equipmentEntries = Object.entries(equipment).filter(([_, qty]) => (qty as number) > 0);

  const statusColors: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    sent: "bg-blue-500/20 text-blue-400",
    accepted: "bg-success/20 text-success",
    declined: "bg-destructive/20 text-destructive",
    paid: "bg-primary/20 text-primary",
    expired: "bg-muted text-muted-foreground",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Music className="w-6 h-6 text-primary" />
            <span className="font-display text-xl font-bold gradient-text">BEATKULTURE</span>
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Title */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold mb-1">{quote.client_name}</h1>
              <p className="text-muted-foreground">{quote.email}</p>
              {quote.client_code && (
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="font-mono text-xs">Client Code: {quote.client_code}</Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => {
                      navigator.clipboard.writeText(quote.client_code);
                      toast({ title: "Copied", description: "Client code copied to clipboard." });
                    }}
                  >
                    Copy
                  </Button>
                </div>
              )}
            </div>
            <Badge className={statusColors[quote.status || "draft"]} variant="outline">
              {quote.status || "draft"}
            </Badge>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Event Details */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="text-lg">Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Type:</span>
                  <span>{quote.event_type || "Not specified"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Venue:</span>
                  <span>{quote.venue || "Not specified"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Date:</span>
                  <span>{quote.event_date ? new Date(quote.event_date).toLocaleDateString() : "TBD"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Time:</span>
                  <span>{quote.start_time?.slice(0, 5)} – {quote.end_time?.slice(0, 5)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">DJ:</span>{" "}
                  <span>{quote.dj_name || "Not assigned"}</span>
                </div>
                {quote.contact_no && (
                  <div>
                    <span className="text-muted-foreground">Contact:</span>{" "}
                    <span>{quote.contact_no}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Equipment */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="text-lg">Equipment</CardTitle>
              </CardHeader>
              <CardContent>
                {equipmentEntries.length > 0 || (quote.custom_items || []).length > 0 ? (
                  <div className="space-y-2 text-sm">
                    {equipmentEntries.map(([eqId, qty]) => {
                      const item = catalogItems.find((e) => e.item_key === eqId);
                      return (
                        <div key={eqId} className="flex justify-between items-center gap-2">
                          <div className="flex items-center gap-2">
                            {item?.image_url && (
                              <img src={item.image_url} alt={item.name} className="w-8 h-8 rounded object-cover" />
                            )}
                            <span>{item?.name || eqId}</span>
                          </div>
                          <span className="text-muted-foreground">×{qty as number}</span>
                        </div>
                      );
                    })}
                    {(quote.custom_items || []).map((item, idx) => (
                      <div key={`custom-${idx}`} className="flex justify-between">
                        <span>{item.name} <Badge variant="outline" className="text-xs ml-1">Custom</Badge></span>
                        <span className="text-muted-foreground">×{item.qty} @ {formatCurrency(item.price)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No equipment selected</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Pricing */}
          <Card variant="glow" className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Pricing Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">DJ Service ({quote.hours} hrs)</span>
                <span>{formatCurrency(Number(quote.dj_cost))}</span>
              </div>
              {Number(quote.equipment_cost) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Equipment</span>
                  <span>{formatCurrency(Number(quote.equipment_cost))}</span>
                </div>
              )}
              {Number(quote.custom_items_cost) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Custom Items</span>
                  <span>{formatCurrency(Number(quote.custom_items_cost))}</span>
                </div>
              )}
              {Number(quote.extras_cost || 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Extras</span>
                  <span>{formatCurrency(Number(quote.extras_cost))}</span>
                </div>
              )}
              {Number(quote.kids_cost) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Kids Corner</span>
                  <span>{formatCurrency(Number(quote.kids_cost))}</span>
                </div>
              )}

              <Separator />

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(Number(quote.subtotal))}</span>
              </div>
              {Number(quote.travel_cost) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Travel ({quote.travel_distance}km)</span>
                  <span>{formatCurrency(Number(quote.travel_cost))}</span>
                </div>
              )}
              {Number(quote.discount_amount) > 0 && (
                <div className="flex justify-between text-sm text-success">
                  <span>Discount ({quote.discount_percent}%)</span>
                  <span>-{formatCurrency(Number(quote.discount_amount))}</span>
                </div>
              )}

              <Separator />

              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(Number(quote.total))}</span>
              </div>

              <div className="p-4 rounded-lg bg-primary/10 border border-primary/30 space-y-3">
                <div className="flex justify-between items-center text-sm font-semibold">
                  <div className="flex items-center gap-2">
                    {quote.deposit_paid ? (
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    ) : (
                      <Circle className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span>30% Non-Refundable Deposit</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-primary">{formatCurrency(Number(quote.deposit))}</span>
                    {quote.deposit_paid ? (
                      <Badge className="bg-green-500/20 text-green-400 text-xs" variant="outline">PAID</Badge>
                    ) : (
                      <Badge className="bg-yellow-500/20 text-yellow-400 text-xs" variant="outline">UNPAID</Badge>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    {quote.balance_paid ? (
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    ) : (
                      <Circle className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span>Remaining Balance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{formatCurrency(Number(quote.balance))}</span>
                    {quote.balance_paid ? (
                      <Badge className="bg-green-500/20 text-green-400 text-xs" variant="outline">PAID</Badge>
                    ) : (
                      <Badge className="bg-yellow-500/20 text-yellow-400 text-xs" variant="outline">UNPAID</Badge>
                    )}
                  </div>
                </div>
                {quote.deposit_paid_at && (
                  <p className="text-xs text-muted-foreground">Deposit paid: {new Date(quote.deposit_paid_at).toLocaleDateString()}</p>
                )}
                {quote.balance_paid_at && (
                  <p className="text-xs text-muted-foreground">Balance paid: {new Date(quote.balance_paid_at).toLocaleDateString()}</p>
                )}
                <Separator className="bg-primary/20" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  ⚠️ A <strong>30% non-refundable deposit</strong> is required to secure your booking. 
                  The remaining balance of <strong>{formatCurrency(Number(quote.balance))}</strong> must be paid 
                  in full <strong>before the scheduled performance begins</strong>. No performance will take place 
                  without full payment confirmation.
                </p>
              </div>
            </CardContent>
          </Card>

          {!!quote.client_removed_items?.length && (
            <Card variant="glass" className="mb-8">
              <CardHeader>
                <CardTitle className="text-lg">Client Quote Changes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {quote.client_removed_items.map((item, index) => (
                  <div key={`${item.removed_at}-${index}`} className="rounded-md border border-border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{item.name}</p>
                      <Badge variant="outline" className="capitalize">{item.kind.replace("_", " ")}</Badge>
                    </div>
                    <p className="text-muted-foreground mt-1">
                      Removed {new Date(item.removed_at).toLocaleString()} • {formatCurrency(Number(item.price) * Number(item.qty))}
                    </p>
                    <p className="text-muted-foreground mt-2">Reason: {item.reason}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Payment Actions (Admin only) */}
          {profile && (
            <Card variant="glass" className="mb-8">
              <CardHeader>
                <CardTitle className="text-lg">Payment Tracking</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button
                  variant={quote.deposit_paid ? "outline" : "default"}
                  size="sm"
                  disabled={markingPayment}
                  onClick={async () => {
                    setMarkingPayment(true);
                    try {
                      const newVal = !quote.deposit_paid;
                      await updateQuote({
                        quoteId: quote.id,
                        quoteData: {
                          deposit_paid: newVal,
                          deposit_paid_at: newVal ? new Date().toISOString() : null,
                        } as any,
                      });
                      toast({
                        title: newVal ? "Deposit Marked as Paid" : "Deposit Marked as Unpaid",
                        description: newVal ? "The 30% booking deposit has been recorded." : "Deposit payment status has been reset.",
                      });
                    } catch (e) {
                      console.error(e);
                    } finally {
                      setMarkingPayment(false);
                    }
                  }}
                >
                  {quote.deposit_paid ? (
                    <><CheckCircle2 className="w-4 h-4 mr-2" /> Deposit Paid ✓</>
                  ) : (
                    <><Circle className="w-4 h-4 mr-2" /> Mark Deposit Paid</>
                  )}
                </Button>
                <Button
                  variant={quote.balance_paid ? "outline" : "default"}
                  size="sm"
                  disabled={markingPayment || !quote.deposit_paid}
                  onClick={async () => {
                    setMarkingPayment(true);
                    try {
                      const newVal = !quote.balance_paid;
                      await updateQuote({
                        quoteId: quote.id,
                        quoteData: {
                          balance_paid: newVal,
                          balance_paid_at: newVal ? new Date().toISOString() : null,
                          status: newVal ? "paid" : quote.status,
                        } as any,
                      });
                      toast({
                        title: newVal ? "Balance Marked as Paid" : "Balance Marked as Unpaid",
                        description: newVal 
                          ? "Full payment confirmed. Performance is cleared to proceed." 
                          : "Balance payment status has been reset.",
                      });
                    } catch (e) {
                      console.error(e);
                    } finally {
                      setMarkingPayment(false);
                    }
                  }}
                >
                  {quote.balance_paid ? (
                    <><CheckCircle2 className="w-4 h-4 mr-2" /> Balance Paid ✓</>
                  ) : (
                    <><Circle className="w-4 h-4 mr-2" /> Mark Balance Paid</>
                  )}
                </Button>
                {!quote.deposit_paid && (
                  <p className="text-xs text-muted-foreground w-full">Deposit must be paid before balance can be marked.</p>
                )}
              </CardContent>
            </Card>
          )}
          <div className="flex flex-wrap gap-3">
            <Button variant="hero" asChild>
              <Link to={`/quote/${quote.id}/edit`}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Quote
              </Link>
            </Button>
            <Button variant="outline" onClick={() => { generateQuotePdf(quote, true, catalogForPdf); }}>
              <FileText className="w-4 h-4 mr-2" />
              Download Quote PDF
            </Button>
            <Button variant="outline" onClick={() => { generateInvoicePdf(quote, true, catalogForPdf); }}>
              <Receipt className="w-4 h-4 mr-2" />
              Download Invoice PDF
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Send className="w-4 h-4 mr-2" />
                  Share with Client
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => {
                  const phone = (quote.contact_no || "").replace(/\D/g, "");
                  if (!phone) {
                    toast({ title: "No phone number", description: "This quote has no contact number saved.", variant: "destructive" });
                    return;
                  }
                  const code = quote.client_code || "N/A";
                  const appUrl = "https://bkentertainment.lovable.app/client-portal";
                  const message = `Hi ${quote.client_name} 👋\n\nYour quote from BK Entertainment is ready!\n\nYour client code is: *${code}*\n\nTo view your quote:\n1. Go to ${appUrl}\n2. Sign up with your email address (${quote.email})\n3. Enter your client code: *${code}*\n\nLooking forward to making your event unforgettable! 🎶`;
                  const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
                  window.open(waUrl, "_blank");
                  navigator.clipboard.writeText(code);
                  toast({ title: "Client code copied!", description: `Code ${code} copied to clipboard & WhatsApp opened.` });
                }}>
                  <Send className="w-4 h-4 mr-2" />
                  Share Client Code via WhatsApp
                </DropdownMenuItem>
                <Separator className="my-1" />
                <DropdownMenuItem onClick={() => sharePdfViaWhatsApp(quote, "quote", catalogForPdf)}>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp Quote
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => sharePdfViaWhatsApp(quote, "invoice", catalogForPdf)}>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp Invoice
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => shareViaEmail(quote, "quote", catalogForPdf)}>
                  <Mail className="w-4 h-4 mr-2" />
                  Email Quote
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => shareViaEmail(quote, "invoice", catalogForPdf)}>
                  <Mail className="w-4 h-4 mr-2" />
                  Email Invoice
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="mt-8">
            <QuoteMessageThread
              quoteId={quote.id}
              role="admin"
              senderName={profile?.full_name || "BeatKulture Admin"}
            />
          </div>

          <p className="text-xs text-muted-foreground mt-6">
            Created: {new Date(quote.created_at).toLocaleDateString()} • Last updated: {new Date(quote.updated_at).toLocaleDateString()}
          </p>
        </motion.div>
      </main>
    </div>
  );
}
