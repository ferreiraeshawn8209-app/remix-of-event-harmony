import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useQuotes, DatabaseQuote } from "@/hooks/useQuotes";
import { formatCurrency } from "@/lib/pricing";
import { 
  Music, 
  LogOut, 
  FileText, 
  Plus, 
  Calendar,
  Clock,
  Loader2,
  Shield,
  Eye,
  Send,
  Trash2,
  DollarSign,
  Users,
  Search,
  ChevronRight,
  Receipt,
  Download,
  Mail
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { AdminAccountsTab } from "@/components/admin/AdminAccountsTab";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-500/20 text-blue-400 border-blue-400/30",
  accepted: "bg-success/20 text-success border-success/30",
  declined: "bg-destructive/20 text-destructive border-destructive/30",
  paid: "bg-primary/20 text-primary border-primary/30",
  expired: "bg-muted text-muted-foreground",
};

function QuoteListItem({ 
  quote, 
  onView, 
  onDelete, 
  onStatusChange,
  isDeleting 
}: { 
  quote: DatabaseQuote; 
  onView: () => void; 
  onDelete: () => void;
  onStatusChange: (status: string) => void;
  isDeleting: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <FileText className="w-5 h-5 text-primary" />
        </div>
        <div>
          <div className="font-medium">{quote.client_name}</div>
          <div className="text-sm text-muted-foreground">
            {quote.event_type || "Event"} • {quote.venue || "Venue TBD"}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
            {quote.event_date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(quote.event_date).toLocaleDateString()}
              </span>
            )}
            {quote.start_time && quote.end_time && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {quote.start_time.slice(0, 5)} - {quote.end_time.slice(0, 5)}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="font-semibold text-primary">{formatCurrency(Number(quote.total))}</div>
          <Select value={quote.status || "draft"} onValueChange={onStatusChange}>
            <SelectTrigger className="w-28 h-7 text-xs">
              <Badge variant="outline" className={statusColors[quote.status || "draft"]}>
                {quote.status || "draft"}
              </Badge>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="declined">Declined</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={onView} title="View Details" asChild>
            <Link to={`/quote/${quote.id}`}>
              <Eye className="w-4 h-4" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" title="Send Quote">
            <Send className="w-4 h-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" title="Delete">
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Quote?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the quote for {quote.client_name}. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete} disabled={isDeleting}>
                  {isDeleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}

function QuoteDetailModal({ quote, onClose }: { quote: DatabaseQuote | null; onClose: () => void }) {
  if (!quote) return null;

  const equipment = quote.equipment || {};
  const equipmentEntries = Object.entries(equipment).filter(([_, qty]) => qty > 0);

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">{quote.client_name}</h2>
              <p className="text-muted-foreground">{quote.email}</p>
            </div>
            <Badge variant="outline" className={statusColors[quote.status || "draft"]}>
              {quote.status || "draft"}
            </Badge>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Event Details</h3>
              <div className="space-y-2 text-sm">
                <div><span className="text-muted-foreground">Type:</span> {quote.event_type || "Not specified"}</div>
                <div><span className="text-muted-foreground">Venue:</span> {quote.venue || "Not specified"}</div>
                <div><span className="text-muted-foreground">Date:</span> {quote.event_date ? new Date(quote.event_date).toLocaleDateString() : "TBD"}</div>
                <div><span className="text-muted-foreground">Time:</span> {quote.start_time?.slice(0, 5)} - {quote.end_time?.slice(0, 5)}</div>
                <div><span className="text-muted-foreground">DJ:</span> {quote.dj_name || "Not assigned"}</div>
                <div><span className="text-muted-foreground">Contact:</span> {quote.contact_no || "Not provided"}</div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Equipment</h3>
              {equipmentEntries.length > 0 ? (
                <div className="space-y-1 text-sm">
                  {equipmentEntries.map(([id, qty]) => (
                    <div key={id} className="flex justify-between">
                      <span className="capitalize">{id.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <span className="text-muted-foreground">×{qty}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No equipment selected</p>
              )}
            </div>
          </div>

          <Separator className="my-6" />

          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Pricing</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">DJ Cost ({quote.hours} hrs)</span>
                <span>{formatCurrency(Number(quote.dj_cost))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Equipment</span>
                <span>{formatCurrency(Number(quote.equipment_cost))}</span>
              </div>
              {Number(quote.kids_cost) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kids Corner</span>
                  <span>{formatCurrency(Number(quote.kids_cost))}</span>
                </div>
              )}
              {Number(quote.travel_cost) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Travel ({quote.travel_distance}km)</span>
                  <span>{formatCurrency(Number(quote.travel_cost))}</span>
                </div>
              )}
              {Number(quote.discount_amount) > 0 && (
                <div className="flex justify-between text-success">
                  <span>Discount ({quote.discount_percent}%)</span>
                  <span>-{formatCurrency(Number(quote.discount_amount))}</span>
                </div>
              )}
            </div>

            <Separator className="my-4" />

            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(Number(quote.total))}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Deposit (30%)</span>
                <span className="font-semibold">{formatCurrency(Number(quote.deposit))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Balance</span>
                <span>{formatCurrency(Number(quote.balance))}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-8">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Close
            </Button>
            <Button variant="hero" className="flex-1">
              <Receipt className="w-4 h-4 mr-2" />
              Generate Invoice
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function Admin() {
  const navigate = useNavigate();
  const { user, profile, isAdmin, isLoading: authLoading, signOut } = useAuth();
  const { quotes, isLoading: quotesLoading, updateQuoteStatus, deleteQuote, isDeleting } = useQuotes();
  const [activeTab, setActiveTab] = useState("quotes");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedQuote, setSelectedQuote] = useState<DatabaseQuote | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    } else if (!authLoading && user && !isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have admin privileges.",
        variant: "destructive",
      });
      navigate("/dashboard");
    }
  }, [user, authLoading, isAdmin, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleStatusChange = async (quoteId: string, status: string) => {
    try {
      await updateQuoteStatus(quoteId, status);
      toast({
        title: "Status Updated",
        description: `Quote status changed to ${status}`,
      });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleDeleteQuote = async (quoteId: string) => {
    try {
      await deleteQuote(quoteId);
    } catch (error) {
      console.error("Error deleting quote:", error);
    }
  };

  // Filter quotes
  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = 
      quote.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (quote.venue?.toLowerCase() || "").includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || quote.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    total: quotes.length,
    draft: quotes.filter(q => q.status === "draft").length,
    sent: quotes.filter(q => q.status === "sent").length,
    accepted: quotes.filter(q => q.status === "accepted").length,
    paid: quotes.filter(q => q.status === "paid").length,
    revenue: quotes
      .filter(q => q.status === "paid")
      .reduce((sum, q) => sum + Number(q.total), 0),
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card variant="glass" className="max-w-lg w-full mx-4">
          <CardHeader>
            <CardTitle>Setting up your account…</CardTitle>
            <CardDescription>
              We’re preparing your admin access. If this takes longer than a few seconds, sign out and sign in again.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating/fetching your profile
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSignOut}>
                Sign out
              </Button>
              <Button variant="hero" asChild>
                <Link to="/auth">Sign in</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) return null;

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
            <Badge variant="secondary" className="gap-1">
              <Shield className="w-3 h-3" />
              Admin
            </Badge>
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {profile.full_name}
            </span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline ml-2">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold mb-2">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground">
                Manage quotes, invoices, and clients
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" asChild>
                <Link to="/dashboard">
                  <Eye className="w-4 h-4 mr-2" />
                  Client View
                </Link>
              </Button>
              <Button variant="hero" asChild>
                <Link to="/#quote-calculator">
                  <Plus className="w-4 h-4 mr-2" />
                  New Quote
                </Link>
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card variant="glass">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Quotes</p>
                    <p className="text-2xl font-bold font-display text-primary">{stats.total}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/10">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="glass">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="text-2xl font-bold font-display text-warning">{stats.draft + stats.sent}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-warning/10">
                    <Clock className="w-5 h-5 text-warning" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="glass">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Accepted</p>
                    <p className="text-2xl font-bold font-display text-success">{stats.accepted}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-success/10">
                    <Users className="w-5 h-5 text-success" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="glass">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Revenue</p>
                    <p className="text-2xl font-bold font-display text-primary">{formatCurrency(stats.revenue)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/10">
                    <DollarSign className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-muted/50 border border-border/50">
              <TabsTrigger value="quotes">All Quotes</TabsTrigger>
              <TabsTrigger value="invoices">Invoices</TabsTrigger>
              <TabsTrigger value="clients">Clients</TabsTrigger>
              <TabsTrigger value="admins">Admins</TabsTrigger>
            </TabsList>

            <TabsContent value="quotes">
              <Card variant="glass">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle>Quote Management</CardTitle>
                      <CardDescription>View, edit, and manage all quotes</CardDescription>
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto">
                      <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          placeholder="Search clients..." 
                          className="pl-9"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="sent">Sent</SelectItem>
                          <SelectItem value="accepted">Accepted</SelectItem>
                          <SelectItem value="declined">Declined</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {quotesLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : filteredQuotes.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold text-lg mb-2">No Quotes Found</h3>
                      <p className="text-muted-foreground mb-4">
                        {quotes.length === 0 
                          ? "Create your first quote to get started." 
                          : "No quotes match your search criteria."}
                      </p>
                      <Button variant="hero" asChild>
                        <Link to="/#quote-calculator">
                          <Plus className="w-4 h-4 mr-2" />
                          Create Quote
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredQuotes.map((quote) => (
                        <QuoteListItem
                          key={quote.id}
                          quote={quote}
                          onView={() => setSelectedQuote(quote)}
                          onDelete={() => handleDeleteQuote(quote.id)}
                          onStatusChange={(status) => handleStatusChange(quote.id, status)}
                          isDeleting={isDeleting}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="invoices">
              <Card variant="glass">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Invoice Management</CardTitle>
                      <CardDescription>Generate and track invoices from accepted quotes</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {quotes.filter(q => q.status === "accepted" || q.status === "paid").length === 0 ? (
                    <div className="text-center py-12">
                      <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold text-lg mb-2">No Invoiceable Quotes</h3>
                      <p className="text-muted-foreground">
                        Accept a quote first, then you can generate an invoice.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {quotes
                        .filter(q => q.status === "accepted" || q.status === "paid")
                        .map((quote) => (
                          <div key={quote.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Receipt className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <div className="font-medium">{quote.client_name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {quote.event_type} • {quote.event_date ? new Date(quote.event_date).toLocaleDateString() : "TBD"}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="font-semibold text-primary">{formatCurrency(Number(quote.total))}</div>
                                <Badge variant="outline" className={statusColors[quote.status || "draft"]}>
                                  {quote.status === "paid" ? "Paid" : "Invoice Ready"}
                                </Badge>
                              </div>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" title="Download PDF">
                                  <Download className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" title="Email Invoice">
                                  <Mail className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="clients">
              <Card variant="glass">
                <CardHeader>
                  <CardTitle>Client Database</CardTitle>
                  <CardDescription>View all clients who have created quotes</CardDescription>
                </CardHeader>
                <CardContent>
                  {quotes.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold text-lg mb-2">No Clients Yet</h3>
                      <p className="text-muted-foreground">
                        Clients will appear here once they create quotes.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Get unique clients */}
                      {Array.from(new Map(quotes.map(q => [q.email, q])).values()).map((quote) => (
                        <div key={quote.email} className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center">
                              <Users className="w-5 h-5 text-secondary" />
                            </div>
                            <div>
                              <div className="font-medium">{quote.client_name}</div>
                              <div className="text-sm text-muted-foreground">{quote.email}</div>
                              {quote.contact_no && (
                                <div className="text-xs text-muted-foreground">{quote.contact_no}</div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">
                              {quotes.filter(q => q.email === quote.email).length} quote(s)
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedQuote(quote)}>
                              View <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="admins">
              <AdminAccountsTab />
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>

      {/* Quote Detail Modal */}
      {selectedQuote && (
        <QuoteDetailModal 
          quote={selectedQuote} 
          onClose={() => setSelectedQuote(null)} 
        />
      )}
    </div>
  );
}
