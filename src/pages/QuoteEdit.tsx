import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useQuotes, DatabaseQuote } from "@/hooks/useQuotes";
import { QuoteData, calculateQuote, DJ_LIST } from "@/lib/pricing";
import { QuoteCalculator } from "@/components/QuoteCalculator";
import { Music, ArrowLeft, Loader2, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

function dbQuoteToQuoteData(quote: DatabaseQuote): QuoteData {
  return {
    clientName: quote.client_name,
    contactNo: quote.contact_no || "",
    email: quote.email,
    venue: quote.venue || "",
    eventDate: quote.event_date || "",
    startTime: quote.start_time?.slice(0, 5) || "18:00",
    endTime: quote.end_time?.slice(0, 5) || "00:00",
    eventType: quote.event_type || "",
    djName: quote.dj_name || DJ_LIST[0],
    equipment: quote.equipment || {},
    customItems: quote.custom_items || [],
    extras: quote.extras || [],
    kidsCorner: quote.kids_corner || false,
    kidsHours: quote.kids_hours || 0,
    travelDistance: quote.travel_distance || 0,
    discountPercent: quote.discount_percent || 0,
  };
}

export default function QuoteEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { quotes, isLoading: quotesLoading, updateQuote } = useQuotes();
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

  const initialData = dbQuoteToQuoteData(quote);

  const handleSave = async (quoteData: QuoteData, calculations: ReturnType<typeof calculateQuote>) => {
    try {
      await updateQuote({
        quoteId: quote.id,
        quoteData: {
          client_name: quoteData.clientName,
          contact_no: quoteData.contactNo,
          email: quoteData.email,
          venue: quoteData.venue,
          event_date: quoteData.eventDate || null,
          start_time: quoteData.startTime || null,
          end_time: quoteData.endTime || null,
          event_type: quoteData.eventType,
          dj_name: quoteData.djName,
          equipment: quoteData.equipment,
          custom_items: quoteData.customItems,
          kids_corner: quoteData.kidsCorner,
          kids_hours: quoteData.kidsHours,
          travel_distance: quoteData.travelDistance,
          discount_percent: quoteData.discountPercent,
        } as any,
        calculations,
      });
      navigate(`/quote/${quote.id}`);
    } catch (error) {
      console.error("Error updating quote:", error);
    }
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
            <Link to={`/quote/${quote.id}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Quote
            </Link>
          </Button>
        </div>
      </header>

      <main className="py-4">
        <div className="container mx-auto px-4 mb-6">
          <h1 className="font-display text-2xl font-bold">
            Editing: <span className="gradient-text">{quote.client_name}</span>
          </h1>
        </div>
        <QuoteCalculator
          initialData={initialData}
          editQuoteId={quote.id}
          onSaveQuote={handleSave}
        />
      </main>
    </div>
  );
}
