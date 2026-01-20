import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  EQUIPMENT_CATALOG, 
  EVENT_TYPES, 
  DJ_LIST, 
  QuoteData, 
  calculateQuote, 
  formatCurrency,
  DJ_HOURLY_RATE,
  DEPOSIT_PERCENT
} from "@/lib/pricing";
import { Plus, Minus, FileText, Send } from "lucide-react";

interface QuoteCalculatorProps {
  isAdmin?: boolean;
  onSaveQuote?: (quote: QuoteData, calculations: ReturnType<typeof calculateQuote>) => void;
}

const groupedEquipment = EQUIPMENT_CATALOG.reduce((acc, item) => {
  if (!acc[item.category]) acc[item.category] = [];
  acc[item.category].push(item);
  return acc;
}, {} as Record<string, typeof EQUIPMENT_CATALOG>);

export function QuoteCalculator({ isAdmin = false, onSaveQuote }: QuoteCalculatorProps) {
  const [quoteData, setQuoteData] = useState<QuoteData>({
    clientName: "",
    contactNo: "",
    email: "",
    venue: "",
    eventDate: "",
    startTime: "18:00",
    endTime: "00:00",
    eventType: "",
    djName: DJ_LIST[0],
    equipment: {},
    kidsCorner: false,
    kidsHours: 0,
    travelDistance: 0,
    discountPercent: 0,
  });

  const calculations = useMemo(() => calculateQuote(quoteData), [quoteData]);

  const updateEquipment = (id: string, delta: number) => {
    setQuoteData(prev => ({
      ...prev,
      equipment: {
        ...prev.equipment,
        [id]: Math.max(0, (prev.equipment[id] || 0) + delta),
      },
    }));
  };

  const handleSubmit = () => {
    if (onSaveQuote) {
      onSaveQuote(quoteData, calculations);
    }
  };

  return (
    <section className="py-20 bg-card">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">Build Your Quote</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Customize your perfect event package. All prices in South African Rand (ZAR).
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Left Column - Client Details & Equipment */}
          <div className="lg:col-span-2 space-y-6">
            {/* Client Details */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
                <CardDescription>Tell us about your event</CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientName">Client Name</Label>
                  <Input
                    id="clientName"
                    value={quoteData.clientName}
                    onChange={(e) => setQuoteData({ ...quoteData, clientName: e.target.value })}
                    placeholder="Your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactNo">Contact Number</Label>
                  <Input
                    id="contactNo"
                    value={quoteData.contactNo}
                    onChange={(e) => setQuoteData({ ...quoteData, contactNo: e.target.value })}
                    placeholder="+27 XX XXX XXXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={quoteData.email}
                    onChange={(e) => setQuoteData({ ...quoteData, email: e.target.value })}
                    placeholder="your@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="venue">Venue / Address</Label>
                  <Input
                    id="venue"
                    value={quoteData.venue}
                    onChange={(e) => setQuoteData({ ...quoteData, venue: e.target.value })}
                    placeholder="Event venue"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eventDate">Event Date</Label>
                  <Input
                    id="eventDate"
                    type="date"
                    value={quoteData.eventDate}
                    onChange={(e) => setQuoteData({ ...quoteData, eventDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Event Type</Label>
                  <Select value={quoteData.eventType} onValueChange={(v) => setQuoteData({ ...quoteData, eventType: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={quoteData.startTime}
                    onChange={(e) => setQuoteData({ ...quoteData, startTime: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={quoteData.endTime}
                    onChange={(e) => setQuoteData({ ...quoteData, endTime: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Your DJ</Label>
                  <Select value={quoteData.djName} onValueChange={(v) => setQuoteData({ ...quoteData, djName: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DJ_LIST.map((dj) => (
                        <SelectItem key={dj} value={dj}>{dj}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="travelDistance">Travel Distance (km)</Label>
                  <Input
                    id="travelDistance"
                    type="number"
                    min={0}
                    value={quoteData.travelDistance}
                    onChange={(e) => setQuoteData({ ...quoteData, travelDistance: Number(e.target.value) })}
                    placeholder="Distance from Hatfield Square PTA"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Equipment Selection */}
            {Object.entries(groupedEquipment).map(([category, items]) => (
              <Card key={category} variant="glass">
                <CardHeader>
                  <CardTitle className="text-lg">{category}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{item.name}</div>
                        <div className="text-xs text-muted-foreground">{item.description}</div>
                        <div className="text-sm text-primary font-semibold mt-1">{formatCurrency(item.price)}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateEquipment(item.id, -1)}
                          disabled={(quoteData.equipment[item.id] || 0) === 0}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-8 text-center font-medium">{quoteData.equipment[item.id] || 0}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateEquipment(item.id, 1)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}

            {/* Additional Services */}
            <Card variant="glass">
              <CardHeader>
                <CardTitle className="text-lg">Additional Services</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Kiddies Corner</div>
                    <div className="text-sm text-muted-foreground">Dedicated entertainment for children</div>
                  </div>
                  <Switch
                    checked={quoteData.kidsCorner}
                    onCheckedChange={(checked) => setQuoteData({ ...quoteData, kidsCorner: checked, kidsHours: checked ? calculations.hours : 0 })}
                  />
                </div>
                {quoteData.kidsCorner && (
                  <div className="space-y-2 ml-4">
                    <Label>Hours</Label>
                    <Input
                      type="number"
                      min={1}
                      value={quoteData.kidsHours}
                      onChange={(e) => setQuoteData({ ...quoteData, kidsHours: Number(e.target.value) })}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Admin-only Discount */}
            {isAdmin && (
              <Card variant="glow">
                <CardHeader>
                  <CardTitle className="text-lg text-secondary">Admin: Discount</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <Label>Discount %</Label>
                    <Select
                      value={String(quoteData.discountPercent)}
                      onValueChange={(v) => setQuoteData({ ...quoteData, discountPercent: Number(v) })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0%</SelectItem>
                        <SelectItem value="10">10%</SelectItem>
                        <SelectItem value="15">15%</SelectItem>
                        <SelectItem value="20">20%</SelectItem>
                        <SelectItem value="25">25%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Quote Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card variant="glow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Quote Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">DJ Service ({calculations.hours.toFixed(1)} hrs × {formatCurrency(DJ_HOURLY_RATE)})</span>
                      <span>{formatCurrency(calculations.djCost)}</span>
                    </div>
                    {calculations.equipmentCost > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Equipment</span>
                        <span>{formatCurrency(calculations.equipmentCost)}</span>
                      </div>
                    )}
                    {calculations.kidsCost > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Kiddies Corner</span>
                        <span>{formatCurrency(calculations.kidsCost)}</span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(calculations.subtotal)}</span>
                  </div>

                  {calculations.travelCost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Travel Fee</span>
                      <span>{formatCurrency(calculations.travelCost)}</span>
                    </div>
                  )}

                  {calculations.discount > 0 && (
                    <div className="flex justify-between text-sm text-success">
                      <span>Discount ({quoteData.discountPercent}%)</span>
                      <span>-{formatCurrency(calculations.discount)}</span>
                    </div>
                  )}

                  <Separator />

                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">{formatCurrency(calculations.total)}</span>
                  </div>

                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/30 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{DEPOSIT_PERCENT}% Booking Deposit</span>
                      <span className="font-semibold text-primary">{formatCurrency(calculations.deposit)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Balance Due</span>
                      <span>{formatCurrency(calculations.balance)}</span>
                    </div>
                  </div>

                  <Button variant="hero" className="w-full" size="lg" onClick={handleSubmit}>
                    <Send className="w-4 h-4" />
                    {isAdmin ? "Save Quote" : "Request Quote"}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    Quote valid for 7 days. Setup & take-down (1.5 hrs) free.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
