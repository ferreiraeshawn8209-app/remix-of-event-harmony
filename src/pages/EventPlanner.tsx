import { useEffect, useState } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Music, Loader2, Save, Heart, Mic, PartyPopper, ListMusic,
  Clock, Plus, Trash2, GripVertical, Briefcase, Gem
} from "lucide-react";
import { PageBackground } from "@/components/PageBackground";

// ─── Types ───────────────────────────────────────────────
interface ScheduleItem {
  id: string;
  time: string;
  moment: string;
  song: string;
  artist: string;
  notes: string;
  type: "ceremony" | "reception" | "corporate" | "general";
}

interface EventPlanData {
  event_style: string;
  first_dance_song: string;
  first_dance_artist: string;
  entrance_song: string;
  entrance_artist: string;
  cake_cutting_song: string;
  cake_cutting_artist: string;
  bouquet_toss_song: string;
  bouquet_toss_artist: string;
  last_song: string;
  last_song_artist: string;
  mc_notes: string;
  special_announcements: string;
  must_play_songs: string;
  do_not_play_songs: string;
  uplighting_color: string;
  timeline_notes: string;
  dietary_notes: string;
  guest_count: number;
  additional_notes: string;
  schedule_items: ScheduleItem[];
}

const defaultPlan: EventPlanData = {
  event_style: "general",
  first_dance_song: "", first_dance_artist: "",
  entrance_song: "", entrance_artist: "",
  cake_cutting_song: "", cake_cutting_artist: "",
  bouquet_toss_song: "", bouquet_toss_artist: "",
  last_song: "", last_song_artist: "",
  mc_notes: "", special_announcements: "",
  must_play_songs: "", do_not_play_songs: "",
  uplighting_color: "", timeline_notes: "",
  dietary_notes: "", guest_count: 0, additional_notes: "",
  schedule_items: [],
};

const uid = () => crypto.randomUUID();

// ─── Wedding ceremony cue presets ───────────────────────
const WEDDING_PRESETS: Omit<ScheduleItem, "id">[] = [
  { time: "", moment: "Seating of Guests", song: "", artist: "", notes: "Soft background music as guests are seated", type: "ceremony" },
  { time: "", moment: "Bridal Party Entrance", song: "", artist: "", notes: "Bridesmaids & groomsmen walk in", type: "ceremony" },
  { time: "", moment: "Bride's Entrance", song: "", artist: "", notes: "The big moment — bride walks down the aisle", type: "ceremony" },
  { time: "", moment: "Signing of Register", song: "", artist: "", notes: "Soft background during signing", type: "ceremony" },
  { time: "", moment: "Exit / Recessional", song: "", artist: "", notes: "Couple exits as married", type: "ceremony" },
  { time: "", moment: "Cocktail Hour", song: "", artist: "", notes: "Background lounge / jazz set", type: "reception" },
  { time: "", moment: "MC Welcome & Introductions", song: "", artist: "", notes: "", type: "reception" },
  { time: "", moment: "Couple's Grand Entrance", song: "", artist: "", notes: "Energetic entrance into reception", type: "reception" },
  { time: "", moment: "First Dance", song: "", artist: "", notes: "", type: "reception" },
  { time: "", moment: "Father-Daughter Dance", song: "", artist: "", notes: "", type: "reception" },
  { time: "", moment: "Mother-Son Dance", song: "", artist: "", notes: "", type: "reception" },
  { time: "", moment: "Speeches & Toasts", song: "", artist: "", notes: "Background fades out during speeches", type: "reception" },
  { time: "", moment: "Dinner Service", song: "", artist: "", notes: "Easy listening / soft background", type: "reception" },
  { time: "", moment: "Cake Cutting", song: "", artist: "", notes: "", type: "reception" },
  { time: "", moment: "Bouquet Toss", song: "", artist: "", notes: "", type: "reception" },
  { time: "", moment: "Garter Toss", song: "", artist: "", notes: "", type: "reception" },
  { time: "", moment: "Open Dance Floor", song: "", artist: "", notes: "DJ set begins — party time!", type: "reception" },
  { time: "", moment: "Last Song", song: "", artist: "", notes: "Final song of the evening", type: "reception" },
];

const CORPORATE_PRESETS: Omit<ScheduleItem, "id">[] = [
  { time: "", moment: "Guest Arrival & Registration", song: "", artist: "", notes: "Ambient background music", type: "corporate" },
  { time: "", moment: "Welcome & Opening", song: "", artist: "", notes: "MC or host introduction", type: "corporate" },
  { time: "", moment: "Keynote / Presentation", song: "", artist: "", notes: "Walk-on music for speaker", type: "corporate" },
  { time: "", moment: "Award Ceremony", song: "", artist: "", notes: "Triumphant walk-up music per winner", type: "corporate" },
  { time: "", moment: "Tea / Coffee Break", song: "", artist: "", notes: "Light background music", type: "corporate" },
  { time: "", moment: "Networking Session", song: "", artist: "", notes: "Upbeat lounge music", type: "corporate" },
  { time: "", moment: "Dinner Service", song: "", artist: "", notes: "Elegant background music", type: "corporate" },
  { time: "", moment: "Entertainment / DJ Set", song: "", artist: "", notes: "Party set begins", type: "corporate" },
  { time: "", moment: "Closing Remarks", song: "", artist: "", notes: "", type: "corporate" },
];

const GENERAL_PRESETS: Omit<ScheduleItem, "id">[] = [
  { time: "", moment: "Guest Arrival", song: "", artist: "", notes: "Background music as guests arrive", type: "general" },
  { time: "", moment: "Welcome / MC Introduction", song: "", artist: "", notes: "", type: "general" },
  { time: "", moment: "Special Entrance", song: "", artist: "", notes: "Walk-in song for guest of honour", type: "general" },
  { time: "", moment: "Speeches / Toasts", song: "", artist: "", notes: "", type: "general" },
  { time: "", moment: "Cake Cutting / Special Moment", song: "", artist: "", notes: "", type: "general" },
  { time: "", moment: "Open Dance Floor", song: "", artist: "", notes: "DJ set starts", type: "general" },
  { time: "", moment: "Last Song", song: "", artist: "", notes: "", type: "general" },
];

// ─── Component ──────────────────────────────────────────
export default function EventPlanner() {
  const { quoteId } = useParams<{ quoteId: string }>();
  const navigate = useNavigate();
  const { user, profile, isLoading: authLoading } = useAuth();
  const [plan, setPlan] = useState<EventPlanData>(defaultPlan);
  const [planId, setPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("schedule");

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!profile || !quoteId) return;
    (async () => {
      const { data } = await supabase
        .from("event_plans")
        .select("*")
        .eq("quote_id", quoteId)
        .maybeSingle();

      if (data) {
        setPlanId(data.id);
        const items = Array.isArray(data.schedule_items) ? data.schedule_items as unknown as ScheduleItem[] : [];
        setPlan({
          event_style: (data as any).event_style || "general",
          first_dance_song: data.first_dance_song || "",
          first_dance_artist: data.first_dance_artist || "",
          entrance_song: data.entrance_song || "",
          entrance_artist: data.entrance_artist || "",
          cake_cutting_song: data.cake_cutting_song || "",
          cake_cutting_artist: data.cake_cutting_artist || "",
          bouquet_toss_song: data.bouquet_toss_song || "",
          bouquet_toss_artist: data.bouquet_toss_artist || "",
          last_song: data.last_song || "",
          last_song_artist: data.last_song_artist || "",
          mc_notes: data.mc_notes || "",
          special_announcements: data.special_announcements || "",
          must_play_songs: data.must_play_songs || "",
          do_not_play_songs: data.do_not_play_songs || "",
          uplighting_color: data.uplighting_color || "",
          timeline_notes: data.timeline_notes || "",
          dietary_notes: data.dietary_notes || "",
          guest_count: data.guest_count || 0,
          additional_notes: data.additional_notes || "",
          schedule_items: items,
        });
      }
      setLoading(false);
    })();
  }, [profile, quoteId]);

  const handleSave = async () => {
    if (!profile || !quoteId) return;
    setSaving(true);
    try {
      const { data: quote } = await supabase.from("quotes").select("client_id, client_name, email, event_date, venue, event_type").eq("id", quoteId).single();
      if (!quote) throw new Error("Quote not found");

      const record = {
        ...plan,
        schedule_items: plan.schedule_items as any,
        quote_id: quoteId,
        client_id: quote.client_id,
        client_name: quote.client_name,
        email: quote.email,
        event_date: quote.event_date,
        venue: quote.venue,
        event_type: quote.event_type,
      };

      if (planId) {
        const { error } = await supabase.from("event_plans").update(record).eq("id", planId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("event_plans").insert(record as any).select().single();
        if (error) throw error;
        setPlanId(data.id);
      }

      toast({ title: "Event Plan Saved", description: "Your event details have been saved successfully." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const update = (field: keyof EventPlanData, value: any) =>
    setPlan(prev => ({ ...prev, [field]: value }));

  // ─── Schedule helpers ─────────────────────────────────
  const addCueItem = () => {
    const type = plan.event_style === "wedding" ? "reception" : plan.event_style === "corporate" ? "corporate" : "general";
    update("schedule_items", [...plan.schedule_items, { id: uid(), time: "", moment: "", song: "", artist: "", notes: "", type }]);
  };

  const updateCueItem = (id: string, field: keyof ScheduleItem, value: string) => {
    update("schedule_items", plan.schedule_items.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const removeCueItem = (id: string) => {
    update("schedule_items", plan.schedule_items.filter(item => item.id !== id));
  };

  const loadPreset = () => {
    const presets = plan.event_style === "wedding" ? WEDDING_PRESETS
      : plan.event_style === "corporate" ? CORPORATE_PRESETS
      : GENERAL_PRESETS;
    const items = presets.map(p => ({ ...p, id: uid() }));
    update("schedule_items", items);
    toast({ title: "Template Loaded", description: `${items.length} cue points loaded. Customise times and songs below.` });
  };

  const isWedding = plan.event_style === "wedding";

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      <PageBackground pageKey="bg_planner" />
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Music className="w-6 h-6 text-primary" />
            <span className="font-display text-xl font-bold gradient-text">BEATKULTURE</span>
          </Link>
          <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
            Save
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold mb-1">
                {isWedding ? "Wedding" : plan.event_style === "corporate" ? "Corporate" : "Event"}{" "}
                <span className="gradient-text">Planner</span>
              </h1>
              <p className="text-muted-foreground text-sm">Plan every detail — music cues, schedule, and special moments.</p>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">Event Type:</Label>
              <Select value={plan.event_style} onValueChange={(v) => update("event_style", v)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wedding"><Gem className="w-3 h-3 inline mr-1" />Wedding</SelectItem>
                  <SelectItem value="corporate"><Briefcase className="w-3 h-3 inline mr-1" />Corporate</SelectItem>
                  <SelectItem value="general"><PartyPopper className="w-3 h-3 inline mr-1" />General Event</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="schedule"><Clock className="w-3 h-3 mr-1" />Schedule</TabsTrigger>
              <TabsTrigger value="songs"><Music className="w-3 h-3 mr-1" />Music</TabsTrigger>
              <TabsTrigger value="mc"><Mic className="w-3 h-3 mr-1" />MC</TabsTrigger>
              <TabsTrigger value="details"><PartyPopper className="w-3 h-3 mr-1" />Details</TabsTrigger>
            </TabsList>

            {/* ─── SCHEDULE / CUE SHEET TAB ─── */}
            <TabsContent value="schedule" className="space-y-4 mt-4">
              <Card variant="glass">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-primary" />
                        DJ Cue Sheet & Event Schedule
                      </CardTitle>
                      <CardDescription>
                        Set the time, moment, and song for each cue point. The DJ will follow this sheet on the day.
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={loadPreset}>
                        Load {isWedding ? "Wedding" : plan.event_style === "corporate" ? "Corporate" : "Event"} Template
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {plan.schedule_items.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg">
                      <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No cue points yet. Load a template or add items manually.</p>
                    </div>
                  )}

                  {plan.schedule_items.map((item, idx) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="group relative grid gap-2 p-3 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors"
                    >
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <GripVertical className="w-3 h-3" />
                        <span className="font-mono font-semibold text-primary">#{idx + 1}</span>
                        {item.type === "ceremony" && <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px]">CEREMONY</span>}
                        {item.type === "reception" && <span className="bg-secondary/20 text-secondary-foreground px-1.5 py-0.5 rounded text-[10px]">RECEPTION</span>}
                        {item.type === "corporate" && <span className="bg-accent/20 text-accent-foreground px-1.5 py-0.5 rounded text-[10px]">CORPORATE</span>}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="ml-auto w-6 h-6 opacity-0 group-hover:opacity-100 text-destructive"
                          onClick={() => removeCueItem(item.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="grid sm:grid-cols-[80px_1fr_1fr_1fr] gap-2">
                        <Input
                          type="time"
                          value={item.time}
                          onChange={(e) => updateCueItem(item.id, "time", e.target.value)}
                          className="font-mono text-sm"
                          placeholder="Time"
                        />
                        <Input
                          value={item.moment}
                          onChange={(e) => updateCueItem(item.id, "moment", e.target.value)}
                          placeholder="Moment (e.g. Bride's Entrance)"
                          className="text-sm"
                        />
                        <Input
                          value={item.song}
                          onChange={(e) => updateCueItem(item.id, "song", e.target.value)}
                          placeholder="🎵 Song"
                          className="text-sm"
                        />
                        <Input
                          value={item.artist}
                          onChange={(e) => updateCueItem(item.id, "artist", e.target.value)}
                          placeholder="Artist"
                          className="text-sm"
                        />
                      </div>
                      <Input
                        value={item.notes}
                        onChange={(e) => updateCueItem(item.id, "notes", e.target.value)}
                        placeholder="DJ notes (e.g. fade in slowly, wait for MC signal)"
                        className="text-xs text-muted-foreground"
                      />
                    </motion.div>
                  ))}

                  <Button variant="outline" className="w-full mt-2" onClick={addCueItem}>
                    <Plus className="w-4 h-4 mr-1" /> Add Cue Point
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── MUSIC TAB ─── */}
            <TabsContent value="songs" className="space-y-4 mt-4">
              {/* Key Moment Songs (wedding-specific shortcuts) */}
              {isWedding && (
                <Card variant="glass">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Heart className="w-5 h-5 text-primary" /> Key Wedding Songs</CardTitle>
                    <CardDescription>Quick reference for your most important songs (also on the cue sheet)</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {([
                      ["First Dance", "first_dance_song", "first_dance_artist"],
                      ["Grand Entrance", "entrance_song", "entrance_artist"],
                      ["Cake Cutting", "cake_cutting_song", "cake_cutting_artist"],
                      ["Bouquet Toss", "bouquet_toss_song", "bouquet_toss_artist"],
                      ["Last Song", "last_song", "last_song_artist"],
                    ] as const).map(([label, songKey, artistKey]) => (
                      <div key={songKey} className="grid sm:grid-cols-[140px_1fr_1fr] gap-2 items-center">
                        <Label className="text-xs text-muted-foreground">{label}</Label>
                        <Input placeholder="Song title" value={(plan as any)[songKey]} onChange={(e) => update(songKey, e.target.value)} className="text-sm" />
                        <Input placeholder="Artist" value={(plan as any)[artistKey]} onChange={(e) => update(artistKey, e.target.value)} className="text-sm" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Playlist */}
              <Card variant="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><ListMusic className="w-5 h-5 text-primary" /> Playlist Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Must-Play Songs</Label>
                    <Textarea placeholder="List songs you absolutely want played (one per line)" value={plan.must_play_songs} onChange={(e) => update("must_play_songs", e.target.value)} rows={4} />
                  </div>
                  <div className="space-y-2">
                    <Label>Do NOT Play</Label>
                    <Textarea placeholder="Songs or genres you don't want (one per line)" value={plan.do_not_play_songs} onChange={(e) => update("do_not_play_songs", e.target.value)} rows={3} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── MC TAB ─── */}
            <TabsContent value="mc" className="space-y-4 mt-4">
              <Card variant="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Mic className="w-5 h-5 text-primary" /> MC & Announcements</CardTitle>
                  <CardDescription>Provide notes for the MC or host</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>MC Notes</Label>
                    <Textarea placeholder="Introductions, name pronunciations, order of events..." value={plan.mc_notes} onChange={(e) => update("mc_notes", e.target.value)} rows={4} />
                  </div>
                  <div className="space-y-2">
                    <Label>Special Announcements</Label>
                    <Textarea placeholder="Any announcements during the event" value={plan.special_announcements} onChange={(e) => update("special_announcements", e.target.value)} rows={3} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ─── DETAILS TAB ─── */}
            <TabsContent value="details" className="space-y-4 mt-4">
              <Card variant="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><PartyPopper className="w-5 h-5 text-primary" /> Event Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Number of Guests</Label>
                      <Input type="number" value={plan.guest_count || ""} onChange={(e) => update("guest_count", parseInt(e.target.value) || 0)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Uplighting / Décor Color</Label>
                      <Input placeholder="e.g. Warm white, Blush pink" value={plan.uplighting_color} onChange={(e) => update("uplighting_color", e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>General Timeline Notes</Label>
                    <Textarea placeholder="Any additional timing notes not on the cue sheet" value={plan.timeline_notes} onChange={(e) => update("timeline_notes", e.target.value)} rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label>Dietary Requirements</Label>
                    <Textarea placeholder="Any dietary needs for catering awareness" value={plan.dietary_notes} onChange={(e) => update("dietary_notes", e.target.value)} rows={2} />
                  </div>
                  <div className="space-y-2">
                    <Label>Additional Notes</Label>
                    <Textarea placeholder="Anything else you'd like us to know" value={plan.additional_notes} onChange={(e) => update("additional_notes", e.target.value)} rows={3} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Save button */}
          <Button variant="hero" size="lg" className="w-full" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Event Plan
          </Button>
        </motion.div>
      </main>
    </div>
  );
}
