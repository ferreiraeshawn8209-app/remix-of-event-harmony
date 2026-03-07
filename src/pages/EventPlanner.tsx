import { useEffect, useState } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Music, Loader2, Save, Heart, Mic, PartyPopper, ListMusic } from "lucide-react";

interface EventPlanData {
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
}

const defaultPlan: EventPlanData = {
  first_dance_song: "", first_dance_artist: "",
  entrance_song: "", entrance_artist: "",
  cake_cutting_song: "", cake_cutting_artist: "",
  bouquet_toss_song: "", bouquet_toss_artist: "",
  last_song: "", last_song_artist: "",
  mc_notes: "", special_announcements: "",
  must_play_songs: "", do_not_play_songs: "",
  uplighting_color: "", timeline_notes: "",
  dietary_notes: "", guest_count: 0, additional_notes: "",
};

export default function EventPlanner() {
  const { quoteId } = useParams<{ quoteId: string }>();
  const navigate = useNavigate();
  const { user, profile, isLoading: authLoading } = useAuth();
  const [plan, setPlan] = useState<EventPlanData>(defaultPlan);
  const [planId, setPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
        setPlan({
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
        });
      }
      setLoading(false);
    })();
  }, [profile, quoteId]);

  const handleSave = async () => {
    if (!profile || !quoteId) return;
    setSaving(true);
    try {
      // Get quote details for client info
      const { data: quote } = await supabase.from("quotes").select("client_id, client_name, email, event_date, venue, event_type").eq("id", quoteId).single();
      if (!quote) throw new Error("Quote not found");

      const record = {
        ...plan,
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

  const update = (field: keyof EventPlanData, value: string | number) =>
    setPlan(prev => ({ ...prev, [field]: value }));

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Music className="w-6 h-6 text-primary" />
            <span className="font-display text-xl font-bold gradient-text">BEATKULTURE</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div>
            <h1 className="font-display text-3xl font-bold mb-2">
              Event <span className="gradient-text">Planner</span>
            </h1>
            <p className="text-muted-foreground">Fill in the details below to help us plan your perfect event.</p>
          </div>

          {/* Key Moment Songs */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Heart className="w-5 h-5 text-primary" /> Key Moment Songs</CardTitle>
              <CardDescription>Tell us what songs you'd like for these special moments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {([
                ["First Dance", "first_dance_song", "first_dance_artist"],
                ["Grand Entrance", "entrance_song", "entrance_artist"],
                ["Cake Cutting", "cake_cutting_song", "cake_cutting_artist"],
                ["Bouquet Toss", "bouquet_toss_song", "bouquet_toss_artist"],
                ["Last Song of the Night", "last_song", "last_song_artist"],
              ] as const).map(([label, songKey, artistKey]) => (
                <div key={songKey} className="grid sm:grid-cols-3 gap-3 items-end">
                  <div>
                    <Label className="text-xs text-muted-foreground">{label}</Label>
                  </div>
                  <Input placeholder="Song title" value={plan[songKey]} onChange={(e) => update(songKey, e.target.value)} />
                  <Input placeholder="Artist" value={plan[artistKey]} onChange={(e) => update(artistKey, e.target.value)} />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Playlist Preferences */}
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

          {/* MC & Announcements */}
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Mic className="w-5 h-5 text-primary" /> MC & Announcements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>MC Notes</Label>
                <Textarea placeholder="Notes for the MC — introductions, pronunciations, etc." value={plan.mc_notes} onChange={(e) => update("mc_notes", e.target.value)} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Special Announcements</Label>
                <Textarea placeholder="Any special announcements during the event" value={plan.special_announcements} onChange={(e) => update("special_announcements", e.target.value)} rows={3} />
              </div>
            </CardContent>
          </Card>

          {/* Event Details */}
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
                  <Label>Uplighting Color</Label>
                  <Input placeholder="e.g. Warm white, Blush pink" value={plan.uplighting_color} onChange={(e) => update("uplighting_color", e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Event Timeline / Schedule Notes</Label>
                <Textarea placeholder="e.g. 17:00 - Guests arrive, 18:00 - Ceremony starts..." value={plan.timeline_notes} onChange={(e) => update("timeline_notes", e.target.value)} rows={4} />
              </div>
              <div className="space-y-2">
                <Label>Dietary Requirements</Label>
                <Textarea placeholder="Any dietary needs we should be aware of" value={plan.dietary_notes} onChange={(e) => update("dietary_notes", e.target.value)} rows={2} />
              </div>
              <div className="space-y-2">
                <Label>Additional Notes</Label>
                <Textarea placeholder="Anything else you'd like us to know" value={plan.additional_notes} onChange={(e) => update("additional_notes", e.target.value)} rows={3} />
              </div>
            </CardContent>
          </Card>

          <Button variant="hero" size="lg" className="w-full" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Event Plan
          </Button>
        </motion.div>
      </main>
    </div>
  );
}
