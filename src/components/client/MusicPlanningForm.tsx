import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Music, Save, Loader2, Plus, X } from "lucide-react";

/** Target playlist size — enough variety for a full event set */
const RECOMMENDED_SONG_COUNT = 50;
/** Minimum playlist size to ensure the DJ has sufficient options */
const MIN_SONG_COUNT = 35;

interface MusicPlanningFormProps {
  profileId: string;
  clientName: string;
  email: string;
  quoteId?: string | null;
}

interface MusicPlan {
  must_play_songs: string;
  do_not_play_songs: string;
  preferred_genres: string;
  artists_to_avoid: string;
  // Wedding timeline songs
  first_dance_song: string;
  first_dance_artist: string;
  father_daughter_song: string;
  father_daughter_artist: string;
  mother_son_song: string;
  mother_son_artist: string;
  cake_cutting_song: string;
  cake_cutting_artist: string;
  bouquet_toss_song: string;
  bouquet_toss_artist: string;
  last_song: string;
  last_song_artist: string;
  // DJ notes / timeline
  mc_notes: string;
  timeline_notes: string;
  additional_notes: string;
}

const DEFAULT_PLAN: MusicPlan = {
  must_play_songs: "",
  do_not_play_songs: "",
  preferred_genres: "",
  artists_to_avoid: "",
  first_dance_song: "",
  first_dance_artist: "",
  father_daughter_song: "",
  father_daughter_artist: "",
  mother_son_song: "",
  mother_son_artist: "",
  cake_cutting_song: "",
  cake_cutting_artist: "",
  bouquet_toss_song: "",
  bouquet_toss_artist: "",
  last_song: "",
  last_song_artist: "",
  mc_notes: "",
  timeline_notes: "",
  additional_notes: "",
};

function SongPair({ label, songKey, artistKey, plan, update }: {
  label: string;
  songKey: keyof MusicPlan;
  artistKey: keyof MusicPlan;
  plan: MusicPlan;
  update: (k: keyof MusicPlan, v: string) => void;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/40 p-3 space-y-2">
      <p className="text-xs font-semibold text-primary uppercase tracking-wide">{label}</p>
      <div className="grid sm:grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Song title</Label>
          <Input
            value={plan[songKey]}
            onChange={(e) => update(songKey, e.target.value)}
            placeholder="e.g. Perfect"
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Artist</Label>
          <Input
            value={plan[artistKey]}
            onChange={(e) => update(artistKey, e.target.value)}
            placeholder="e.g. Ed Sheeran"
            className="h-8 text-sm"
          />
        </div>
      </div>
    </div>
  );
}

export function MusicPlanningForm({ profileId, clientName, email, quoteId }: MusicPlanningFormProps) {
  const [plan, setPlan] = useState<MusicPlan>(DEFAULT_PLAN);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [requestedSongs, setRequestedSongs] = useState<string[]>([""]);

  // Load existing plan
  useEffect(() => {
    (async () => {
      setLoading(true);
      let q = supabase.from("event_plans").select("*").eq("client_id", profileId).order("created_at", { ascending: false }).limit(1);
      if (quoteId) q = supabase.from("event_plans").select("*").eq("quote_id", quoteId).limit(1);
      const { data } = await q;
      if (data && data[0]) {
        const row = data[0] as any;
        setExistingId(row.id);
        setPlan({
          must_play_songs: row.must_play_songs || "",
          do_not_play_songs: row.do_not_play_songs || "",
          preferred_genres: row.preferred_genres || "",
          artists_to_avoid: row.artists_to_avoid || "",
          first_dance_song: row.first_dance_song || "",
          first_dance_artist: row.first_dance_artist || "",
          father_daughter_song: row.father_daughter_song || "",
          father_daughter_artist: row.father_daughter_artist || "",
          mother_son_song: row.mother_son_song || "",
          mother_son_artist: row.mother_son_artist || "",
          cake_cutting_song: row.cake_cutting_song || "",
          cake_cutting_artist: row.cake_cutting_artist || "",
          bouquet_toss_song: row.bouquet_toss_song || "",
          bouquet_toss_artist: row.bouquet_toss_artist || "",
          last_song: row.last_song || "",
          last_song_artist: row.last_song_artist || "",
          mc_notes: row.mc_notes || "",
          timeline_notes: row.timeline_notes || "",
          additional_notes: row.additional_notes || "",
        });
        // Parse must_play_songs as list
        if (row.must_play_songs) {
          const songs = row.must_play_songs.split("\n").filter(Boolean);
          setRequestedSongs(songs.length > 0 ? songs : [""]);
        }
      }
      setLoading(false);
    })();
  }, [profileId, quoteId]);

  const update = (k: keyof MusicPlan, v: string) => setPlan((prev) => ({ ...prev, [k]: v }));

  const addSong = () => setRequestedSongs((prev) => [...prev, ""]);
  const removeSong = (i: number) => setRequestedSongs((prev) => prev.filter((_, idx) => idx !== i));
  const updateSong = (i: number, v: string) => setRequestedSongs((prev) => prev.map((s, idx) => (idx === i ? v : s)));

  const save = async () => {
    setSaving(true);
    try {
      const mustPlayText = requestedSongs.filter(Boolean).join("\n");
      const payload = {
        client_id: profileId,
        client_name: clientName,
        email,
        quote_id: quoteId || null,
        ...plan,
        must_play_songs: mustPlayText,
      };

      let error: any;
      if (existingId) {
        ({ error } = await supabase.from("event_plans").update(payload as any).eq("id", existingId));
      } else {
        const result = await supabase.from("event_plans").insert(payload as any).select("id").single();
        error = result.error;
        if (!error && result.data) setExistingId((result.data as any).id);
      }

      if (error) {
        toast({ title: "Save failed", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Music plan saved", description: "Your music preferences have been sent to admin." });
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  const filledSongs = requestedSongs.filter(Boolean).length;

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="w-5 h-5 text-primary" />
          Music Planning
        </CardTitle>
        <CardDescription>
          Share your music preferences, song requests, and wedding moment songs with your DJ.
          {existingId && <Badge variant="outline" className="ml-2 text-success border-success/30">Saved</Badge>}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">

        {/* Requested songs list */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Song requests ({filledSongs}/{RECOMMENDED_SONG_COUNT} recommended)</Label>
            <Button size="sm" variant="outline" onClick={addSong}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add song
            </Button>
          </div>
          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            {requestedSongs.map((song, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={song}
                  onChange={(e) => updateSong(i, e.target.value)}
                  placeholder={`Song ${i + 1} — e.g. "Blinding Lights - The Weeknd"`}
                  className="h-8 text-sm"
                />
                {requestedSongs.length > 1 && (
                  <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => removeSong(i)}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          {filledSongs < MIN_SONG_COUNT && (
            <p className="text-xs text-muted-foreground">
              We recommend at least {MIN_SONG_COUNT} songs to give your DJ enough variety for your event.
            </p>
          )}
        </div>

        <Separator />

        {/* Preferences */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Preferred genres</Label>
            <Textarea
              rows={3}
              value={plan.preferred_genres}
              onChange={(e) => update("preferred_genres", e.target.value)}
              placeholder="e.g. Afrobeats, Amapiano, R&B, House, Pop..."
            />
          </div>
          <div className="space-y-2">
            <Label>Artists to avoid</Label>
            <Textarea
              rows={3}
              value={plan.artists_to_avoid}
              onChange={(e) => update("artists_to_avoid", e.target.value)}
              placeholder="e.g. Artists you dislike or that don't fit the vibe..."
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Songs to avoid</Label>
          <Textarea
            rows={2}
            value={plan.do_not_play_songs}
            onChange={(e) => update("do_not_play_songs", e.target.value)}
            placeholder="List any songs you do NOT want played at your event..."
          />
        </div>

        <Separator />

        {/* Wedding timeline songs */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">Wedding Moment Songs</p>
          <p className="text-xs text-muted-foreground">
            Leave blank if not applicable (e.g. non-wedding events).
          </p>
          <div className="grid gap-3">
            <SongPair label="🥂 First Dance" songKey="first_dance_song" artistKey="first_dance_artist" plan={plan} update={update} />
            <SongPair label="👨‍👧 Father & Daughter" songKey="father_daughter_song" artistKey="father_daughter_artist" plan={plan} update={update} />
            <SongPair label="👩‍👦 Mother & Son" songKey="mother_son_song" artistKey="mother_son_artist" plan={plan} update={update} />
            <SongPair label="🎂 Cake Cutting" songKey="cake_cutting_song" artistKey="cake_cutting_artist" plan={plan} update={update} />
            <SongPair label="💐 Bouquet Toss" songKey="bouquet_toss_song" artistKey="bouquet_toss_artist" plan={plan} update={update} />
            <SongPair label="🌙 Last Dance" songKey="last_song" artistKey="last_song_artist" plan={plan} update={update} />
          </div>
        </div>

        <Separator />

        {/* DJ notes */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Event timeline notes</Label>
            <Textarea
              rows={3}
              value={plan.timeline_notes}
              onChange={(e) => update("timeline_notes", e.target.value)}
              placeholder="e.g. Ceremony 14:00, Cocktails 16:00, Reception 18:00, Dancing 20:00..."
            />
          </div>
          <div className="space-y-2">
            <Label>DJ / MC notes</Label>
            <Textarea
              rows={3}
              value={plan.mc_notes}
              onChange={(e) => update("mc_notes", e.target.value)}
              placeholder="Special announcements, how to pronounce names, jokes to avoid, tone of the event..."
            />
          </div>
          <div className="space-y-2">
            <Label>Additional notes</Label>
            <Textarea
              rows={2}
              value={plan.additional_notes}
              onChange={(e) => update("additional_notes", e.target.value)}
              placeholder="Anything else your DJ should know..."
            />
          </div>
        </div>

        <Button variant="hero" onClick={save} disabled={saving} className="w-full">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {existingId ? "Update Music Plan" : "Save Music Plan"}
        </Button>
      </CardContent>
    </Card>
  );
}
