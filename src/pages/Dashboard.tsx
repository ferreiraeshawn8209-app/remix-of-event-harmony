import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useQuotes, DatabaseQuote } from "@/hooks/useQuotes";
import { formatCurrency } from "@/lib/pricing";
import { 
  Music, 
  LogOut, 
  FileText, 
  Plus, 
  Calendar,
  MapPin,
  Clock,
  Loader2,
  Shield,
  User
} from "lucide-react";

function QuoteCard({ quote }: { quote: DatabaseQuote }) {
  const statusColors: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    sent: "bg-blue-500/20 text-blue-400",
    accepted: "bg-success/20 text-success",
    declined: "bg-destructive/20 text-destructive",
    expired: "bg-muted text-muted-foreground",
  };

  return (
    <Card variant="glass" className="hover:border-primary/30 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{quote.event_type || "Event"}</CardTitle>
            <CardDescription>{quote.venue || "Venue TBD"}</CardDescription>
          </div>
          <Badge className={statusColors[quote.status] || statusColors.draft}>
            {quote.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {quote.event_date && (
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(quote.event_date).toLocaleDateString()}
            </div>
          )}
          {quote.start_time && quote.end_time && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {quote.start_time.slice(0, 5)} - {quote.end_time.slice(0, 5)}
            </div>
          )}
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total Quote</p>
            <p className="text-xl font-bold text-primary">{formatCurrency(Number(quote.total))}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Deposit (30%)</p>
            <p className="font-semibold">{formatCurrency(Number(quote.deposit))}</p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Created: {new Date(quote.created_at).toLocaleDateString()}
        </p>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, profile, isAdmin, isLoading: authLoading, signOut } = useAuth();
  const { quotes, isLoading: quotesLoading } = useQuotes();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Music className="w-6 h-6 text-primary" />
            <span className="font-display text-xl font-bold gradient-text">BEATKULTURE</span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {isAdmin ? (
                <Badge variant="secondary" className="gap-1">
                  <Shield className="w-3 h-3" />
                  Admin
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1">
                  <User className="w-3 h-3" />
                  Client
                </Badge>
              )}
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {profile.full_name}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline ml-2">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold mb-2">
              Welcome back, <span className="gradient-text">{profile.full_name}</span>
            </h1>
            <p className="text-muted-foreground">
              {isAdmin
                ? "Manage quotes, clients, and events from your admin dashboard."
                : "View your quotes and manage your event bookings."}
            </p>
          </div>

          {/* Admin Actions */}
          {isAdmin && (
            <div className="mb-8">
              <Card variant="glow" className="border-secondary/30 bg-secondary/10">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-secondary" />
                      <span className="font-semibold">Admin Controls</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to="/admin">
                          <FileText className="w-4 h-4 mr-2" />
                          Manage All Quotes
                        </Link>
                      </Button>
                      <Button variant="hero" size="sm" asChild>
                        <Link to="/#quote-calculator">
                          <Plus className="w-4 h-4 mr-2" />
                          Create Quote for Client
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <Link to="/#quote-calculator">
              <Card variant="glass" className="hover:border-primary/30 transition-colors cursor-pointer">
                <CardContent className="py-6 flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Plus className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">New Quote</p>
                    <p className="text-sm text-muted-foreground">Build a custom quote</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/#packages">
              <Card variant="glass" className="hover:border-primary/30 transition-colors cursor-pointer">
                <CardContent className="py-6 flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-secondary/10">
                    <FileText className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <p className="font-semibold">View Packages</p>
                    <p className="text-sm text-muted-foreground">Browse our packages</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Card variant="glass" className="hover:border-primary/30 transition-colors">
              <CardContent className="py-6 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-muted">
                  <MapPin className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-semibold">Contact Us</p>
                  <p className="text-sm text-muted-foreground">Get in touch</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quotes Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-2xl font-bold">Your Quotes</h2>
              <Badge variant="outline">{quotes.length} total</Badge>
            </div>

            {quotesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : quotes.length === 0 ? (
              <Card variant="glass" className="text-center py-12">
                <CardContent>
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold text-lg mb-2">No Quotes Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start by creating your first quote or browse our packages.
                  </p>
                  <Button variant="hero" asChild>
                    <Link to="/#quote-calculator">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Quote
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {quotes.map((quote) => (
                  <QuoteCard key={quote.id} quote={quote} />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
