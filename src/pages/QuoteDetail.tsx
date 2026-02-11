import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useQuotes, DatabaseQuote } from "@/hooks/useQuotes";
import { formatCurrency, EQUIPMENT_CATALOG } from "@/lib/pricing";
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
} from "lucide-react";

export default function QuoteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { quotes, isLoading: quotesLoading } = useQuotes();
  const [quote, setQuote] = useState<DatabaseQuote | null>(null);

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
                {equipmentEntries.length > 0 ? (
                  <div className="space-y-2 text-sm">
                    {equipmentEntries.map(([eqId, qty]) => {
                      const item = EQUIPMENT_CATALOG.find((e) => e.id === eqId);
                      return (
                        <div key={eqId} className="flex justify-between">
                          <span>{item?.name || eqId}</span>
                          <span className="text-muted-foreground">×{qty as number}</span>
                        </div>
                      );
                    })}
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

              <div className="p-4 rounded-lg bg-primary/10 border border-primary/30 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>30% Booking Deposit</span>
                  <span className="font-semibold text-primary">{formatCurrency(Number(quote.deposit))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Balance Due</span>
                  <span>{formatCurrency(Number(quote.balance))}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button variant="hero" asChild>
              <Link to={`/quote/${quote.id}/edit`}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Quote
              </Link>
            </Button>
            <Button variant="outline">
              <Receipt className="w-4 h-4 mr-2" />
              Generate Invoice
            </Button>
            <Button variant="outline">
              <Send className="w-4 h-4 mr-2" />
              Send to Client
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-6">
            Created: {new Date(quote.created_at).toLocaleDateString()} • Last updated: {new Date(quote.updated_at).toLocaleDateString()}
          </p>
        </motion.div>
      </main>
    </div>
  );
}
