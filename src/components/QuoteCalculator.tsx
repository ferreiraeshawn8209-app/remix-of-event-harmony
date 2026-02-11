import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Minus, FileText, Send, Lightbulb, Loader2, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuotes } from "@/hooks/useQuotes";
import { toast } from "@/hooks/use-toast";

interface QuoteCalculatorProps {
  isAdmin?: boolean;
  initialData?: QuoteData;
  editQuoteId?: string;
  onSaveQuote?: (quote: QuoteData, calculations: ReturnType<typeof calculateQuote>) => void;
}

const groupedEquipment = EQUIPMENT_CATALOG.reduce((acc, item) => {
  if (!acc[item.category]) acc[item.category] = [];
  acc[item.category].push(item);
  return acc;
}, {} as Record<string, typeof EQUIPMENT_CATALOG>);

// Category-level suggestions to guide users
const CATEGORY_SUGGESTIONS: Record<string, { icon: string; title: string; description: string }> = {
  "Sound System": {
    icon: "🔊",
    title: "How many speakers will you need?",
    description: "For most venues, we recommend at least 2 party rocker speakers for balanced stereo sound. Larger venues (150+ guests) may need 4 speakers. Adding a subwoofer brings that powerful bass your guests will feel!"
  },
  "Lighting": {
    icon: "💡",
    title: "Create the perfect atmosphere",
    description: "Professional lighting transforms any venue! We suggest starting with RGB strobes for energy, wash heads for color ambiance, and mood lights (uplighters) around the venue for a complete look."
  },
  "Effects": {
    icon: "✨",
    title: "Make magical moments",
    description: "Smoke machines make lights visible and dramatic. Low fog creates stunning first-dance moments. Bubbles add fun for all ages! These extras make events truly memorable."
  },
  "Audio Equipment": {
    icon: "🎤",
    title: "Communication essentials",
    description: "A wireless microphone is essential for speeches and announcements. Two-way radios help coordinate with venue staff. We recommend at least one wireless mic for any event."
  },
  "DJ Equipment": {
    icon: "🎧",
    title: "Professional DJ setup",
    description: "Our DJ brings professional-grade controllers, but adding a mixer ensures seamless transitions. If you have passive speakers or subwoofers, you'll need an amplifier to power them."
  }
};

// Equipment recommendations with reasons
const EQUIPMENT_RECOMMENDATIONS: Record<string, { recommended: number; reason: string }> = {
  partyrocker: { recommended: 2, reason: "Two speakers provide balanced stereo sound coverage for your venue" },
  boothSpeaker: { recommended: 1, reason: "One booth speaker lets the DJ monitor the mix clearly" },
  subwoofer: { recommended: 1, reason: "One subwoofer adds powerful bass for a full, immersive sound" },
  mixer: { recommended: 1, reason: "One professional mixer is essential for seamless track transitions" },
  amplifier: { recommended: 1, reason: "Required to power passive speakers and subwoofers effectively" },
  rgbStrobe: { recommended: 1, reason: "Creates exciting visual impact on the dance floor" },
  uvBar: { recommended: 2, reason: "Two UV bars create an even glow across your venue" },
  spiderHead: { recommended: 1, reason: "One moving head provides dynamic sweeping light effects" },
  washHead: { recommended: 2, reason: "Two wash lights blend colors beautifully across the space" },
  rgbLaser: { recommended: 1, reason: "One laser creates stunning patterns and adds wow factor" },
  disco21: { recommended: 1, reason: "One disco light fills the room with colorful effects" },
  moodLight: { recommended: 4, reason: "Four uplighters create ambient décor lighting around your venue" },
  laserBall: { recommended: 1, reason: "One disco ball adds classic party vibes" },
  wirelessMic: { recommended: 1, reason: "One wireless mic is perfect for speeches and announcements" },
  wiredMic: { recommended: 1, reason: "A backup mic ensures your event runs smoothly" },
  twoWayRadio: { recommended: 2, reason: "Two radios allow DJ and coordinator to communicate seamlessly" },
  smokeMachine: { recommended: 1, reason: "Smoke enhances all lighting effects dramatically" },
  lowFog: { recommended: 1, reason: "Creates magical floor-hugging fog for first dance moments" },
  bubbleBlaster: { recommended: 1, reason: "Bubbles add a fun, whimsical touch to celebrations" },
};

// Dynamic suggestions based on current selections
function getContextualSuggestions(equipment: Record<string, number>): { id: string; message: string }[] {
  const suggestions: { id: string; message: string }[] = [];
  
  // If they have subwoofers but no amplifier
  if ((equipment.subwoofer || 0) > 0 && (equipment.amplifier || 0) === 0) {
    suggestions.push({ 
      id: 'amplifier', 
      message: "💡 You've selected subwoofers - we strongly recommend adding an amplifier to power them properly!" 
    });
  }
  
  // If they have any lighting but no smoke machine
  const hasLighting = ['rgbStrobe', 'uvBar', 'spiderHead', 'washHead', 'rgbLaser', 'disco21', 'laserBall'].some(
    id => (equipment[id] || 0) > 0
  );
  if (hasLighting && (equipment.smokeMachine || 0) === 0) {
    suggestions.push({ 
      id: 'smokeMachine', 
      message: "💡 Smoke machines make lighting effects 10x better - light beams become visible!" 
    });
  }
  
  // If they have speakers but no mixer
  const hasSpeakers = (equipment.partyrocker || 0) > 0 || (equipment.boothSpeaker || 0) > 0;
  if (hasSpeakers && (equipment.mixer || 0) === 0) {
    suggestions.push({ 
      id: 'mixer', 
      message: "💡 A professional mixer ensures smooth transitions between songs" 
    });
  }
  
  // If they have moving heads, suggest more for better effect
  if ((equipment.spiderHead || 0) === 1 && (equipment.washHead || 0) === 0) {
    suggestions.push({ 
      id: 'washHead', 
      message: "💡 Pair your spider head with wash lights for a complete professional lighting setup" 
    });
  }
  
  // If it's a wedding-style setup, suggest low fog
  if ((equipment.moodLight || 0) > 0 && (equipment.lowFog || 0) === 0) {
    suggestions.push({ 
      id: 'lowFog', 
      message: "💡 Low fog creates a magical atmosphere for first dances and special moments" 
    });
  }

  return suggestions;
}

export function QuoteCalculator({ isAdmin = false, initialData, editQuoteId, onSaveQuote }: QuoteCalculatorProps) {
  const navigate = useNavigate();
  const { user, profile, isAdmin: userIsAdmin } = useAuth();
  const { createQuote, isCreating } = useQuotes();
  
  // Use isAdmin prop if passed, otherwise use the user's actual admin status
  const effectiveIsAdmin = isAdmin || userIsAdmin;

  const [quoteData, setQuoteData] = useState<QuoteData>(
    initialData || {
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
    }
  );

  // Pre-fill user data if logged in and not editing
  useEffect(() => {
    if (!initialData && profile && !quoteData.clientName) {
      setQuoteData(prev => ({
        ...prev,
        clientName: profile.full_name || prev.clientName,
        email: profile.email || prev.email,
        contactNo: profile.phone || prev.contactNo,
      }));
    }
  }, [profile]);

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

  const handleSubmit = async () => {
    // If callback provided, use it
    if (onSaveQuote) {
      onSaveQuote(quoteData, calculations);
      return;
    }

    // Otherwise, save to database
    if (!user || !profile) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to save your quote.",
        variant: "destructive",
      });
      return;
    }

    // Validate required fields
    if (!quoteData.clientName.trim() || !quoteData.email.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in at least your name and email.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createQuote({
        quoteData,
        calculations,
        clientProfileId: profile.id,
      });

      // Reset form after successful save
      setQuoteData({
        clientName: profile.full_name || "",
        contactNo: profile.phone || "",
        email: profile.email || "",
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

      navigate("/dashboard");
    } catch (error) {
      console.error("Error saving quote:", error);
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

            {/* Contextual Suggestions Banner */}
            {getContextualSuggestions(quoteData.equipment).length > 0 && (
              <Card variant="glow" className="border-secondary/50 bg-secondary/10">
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                    <div className="space-y-2">
                      <p className="font-semibold text-secondary text-sm">Pro Tips for Your Event</p>
                      {getContextualSuggestions(quoteData.equipment).map((suggestion, idx) => (
                        <p key={idx} className="text-sm text-muted-foreground">{suggestion.message}</p>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Equipment Selection */}
            {Object.entries(groupedEquipment).map(([category, items]) => {
              const categorySuggestion = CATEGORY_SUGGESTIONS[category];
              
              return (
              <Card key={category} variant="glass">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {categorySuggestion && <span className="text-xl">{categorySuggestion.icon}</span>}
                    {category}
                  </CardTitle>
                  {/* Category-level suggestion */}
                  {categorySuggestion && (
                    <div className="mt-3 p-4 rounded-lg bg-secondary/10 border border-secondary/30">
                      <div className="flex items-start gap-3">
                        <Lightbulb className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-secondary text-sm mb-1">{categorySuggestion.title}</p>
                          <p className="text-sm text-muted-foreground">{categorySuggestion.description}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {items.map((item) => {
                    const recommendation = EQUIPMENT_RECOMMENDATIONS[item.id];
                    const currentQty = quoteData.equipment[item.id] || 0;
                    const showRecommendation = recommendation && currentQty < recommendation.recommended;
                    
                    return (
                      <div key={item.id} className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
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
                              disabled={currentQty === 0}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="w-8 text-center font-medium">{currentQty}</span>
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
                        {showRecommendation && (
                          <div className="mt-2 flex items-start gap-2 p-2 rounded-md bg-primary/10 border border-primary/20">
                            <Lightbulb className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                            <div className="text-xs">
                              <Badge variant="secondary" className="mb-1 text-xs">
                                We recommend: {recommendation.recommended}
                              </Badge>
                              <p className="text-muted-foreground">{recommendation.reason}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
              );
            })}

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
            {effectiveIsAdmin && (
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

                  {user ? (
                    <Button 
                      variant="hero" 
                      className="w-full" 
                      size="lg" 
                      onClick={handleSubmit}
                      disabled={isCreating}
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          {editQuoteId ? "Update Quote" : "Save Quote"}
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <Button variant="hero" className="w-full" size="lg" asChild>
                        <Link to="/auth">
                          <LogIn className="w-4 h-4 mr-2" />
                          Sign In to Save Quote
                        </Link>
                      </Button>
                      <p className="text-xs text-center text-muted-foreground">
                        Create an account to save and track your quotes
                      </p>
                    </div>
                  )}

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
