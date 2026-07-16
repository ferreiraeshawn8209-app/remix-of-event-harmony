// @ts-nocheck
import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { QuoteCalculator } from "@/components/QuoteCalculator";
import { 
  FileText, 
  Calendar, 
  DollarSign, 
  Users, 
  Music,
  ChevronRight,
  Plus,
  Eye,
  Send,
  Trash2,
  QrCode
} from "lucide-react";
import { formatCurrency } from "@/lib/pricing";

interface Quote {
  id: string;
  clientName: string;
  eventDate: string;
  eventType: string;
  total: number;
  status: "pending" | "approved" | "Pid" | "completed";
  createdAt: string;
}

const mockQuotes: Quote[] = [
  {
    id: "Q001",
    clientName: "Trevor",
    eventDate: "2026-02-14",
    eventType: "Birthday Party",
    total: 5535,
    status: "pending",
    createdAt: "2026-01-18"
  },
  {
    id: "Q002",
    clientName: "Sarah Johnson",
    eventDate: "2026-03-22",
    eventType: "Wedding",
    total: 12500,
    status: "approved",
    createdAt: "2026-01-15"
  },
  {
    id: "Q003",
    clientName: "Mike Corp",
    eventDate: "2026-02-28",
    eventType: "Corporate Event",
    total: 8200,
    status: "paid",
    createdAt: "2026-01-10"
  },
];

const statusColors = {
  pending: "bg-warning/20 text-warning border-warning/30",
  approved: "bg-primary/20 text-primary border-primary/30",
  paid: "bg-success/20 text-success border-success/30",
  completed: "bg-muted text-muted-foreground border-border",
};

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [quotes] = useState<Quote[]>(mockQuotes);

  const stats = [
    { label: "Total Quotes", value: quotes.length, icon: FileText, color: "text-primary" },
    { label: "Pending", value: quotes.filter(q => q.status === "pending").length, icon: Calendar, color: "text-warning" },
    { label: "Revenue (Paid)", value: formatCurrency(quotes.filter(q => q.status === "paid").reduce((acc, q) => acc + q.total, 0)), icon: DollarSign, color: "text-success" },
    { label: "This Month", value: "5 events", icon: Music, color: "text-secondary" },
  ];

  return (
    <div className="min-h-screen bg-background pt-20 pb-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            Manage quotes, invoices, and events
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {stats.map((stat, i) => (
            <Card key={i} variant="glass">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className={`text-2xl font-bold font-display ${stat.color}`}>{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg bg-muted/50 ${stat.color}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted/50 border border-border/50">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="quotes">Quotes</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="new-quote">New Quote</TabsTrigger>
            <TabsTrigger value="qr-codes">QR Codes</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Recent Quotes */}
              <Card variant="glass">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Recent Quotes</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab("quotes")}>
                      View All <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {quotes.slice(0, 3).map((quote) => (
                    <div key={quote.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div>
                        <div className="font-medium">{quote.clientName}</div>
                        <div className="text-sm text-muted-foreground">{quote.eventType} • {quote.eventDate}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-primary">{formatCurrency(quote.total)}</div>
                        <Badge variant="outline" className={statusColors[quote.status]}>
                          {quote.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card variant="glass">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common tasks</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => setActiveTab("new-quote")}>
                    <Plus className="w-5 h-5" />
                    <span className="text-xs">New Quote</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                    <Send className="w-5 h-5" />
                    <span className="text-xs">Send Invoice</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => setActiveTab("qr-codes")}>
                    <QrCode className="w-5 h-5" />
                    <span className="text-xs">Song QR</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                    <Users className="w-5 h-5" />
                    <span className="text-xs">Clients</span>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="quotes">
            <Card variant="glass">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>All Quotes</CardTitle>
                  <Button onClick={() => setActiveTab("new-quote")}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Quote
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {quotes.map((quote) => (
                    <div key={quote.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{quote.id} • {quote.clientName}</div>
                          <div className="text-sm text-muted-foreground">{quote.eventType} • {quote.eventDate}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-semibold text-primary">{formatCurrency(quote.total)}</div>
                          <Badge variant="outline" className={statusColors[quote.status]}>
                            {quote.status}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Send className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoices">
            <Card variant="glass">
              <CardHeader>
                <CardTitle>Invoices</CardTitle>
                <CardDescription>Manage and track invoices</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No invoices yet. Create a quote and convert it to an invoice.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="new-quote">
            <QuoteCalculator
              isAdmin={true}
              onSaveQuote={undefined as any}
            />
          </TabsContent>


          <TabsContent value="qr-codes">
            <Card variant="glass">
              <CardHeader>
                <CardTitle>Song Request QR Codes</CardTitle>
                <CardDescription>Generate event-specific QR codes for song requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <QrCode className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>QR code generation coming soon. This will allow guests to request songs at your events.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}