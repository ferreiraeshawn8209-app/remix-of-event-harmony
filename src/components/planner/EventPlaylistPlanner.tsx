import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Loader2, Plus, Sparkles, Trash2, Lock } from "lucide-react";
import { useEventPlaylist, MOMENT_LABELS, Moment, PlaylistItem } from "@/hooks/useEventPlaylist";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function EventPlaylistPlanner({
  quoteId,
  accepted,
  eventType,
  eventDate,
}: {
  quoteId?: string;
  accepted: boolean;
  eventType?: string | null;
  eventDate?: string | null;
}) {
  const { items, addItem, updateItem, removeItem, isLoading } = useEventPlaylist(quoteId);
  const [moment, setMoment] = useState<Moment>("party");
  const [song, setSong] = useState("");
  const [artist, setArtist] = useState("");
  const [cue, setCue] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [aiBusy, setAiBusy] = useState(false);

  if (!accepted || !quoteId) {
    return (
      <div className="p-6 rounded-lg border border-dashed border-border/60 bg-muted/20 text-center space-y-2">
        <Lock className="w-6 h-6 mx-auto text-muted-foreground" />
        <p className="text-sm font-medium">Event Playlist unlocks once your quote is accepted</p>
        <p className="text-xs text-muted-foreground">
          Accept your quote to plan every song by moment — arrival, ceremony, first dance, party and more.
        </p>
      </div>
    );
  }

  const add = async () => {
    if (!song.trim()) return toast({ title: "Song title required", variant: "destructive" });
    try {
      await addItem({
        moment,
        song_title: song.trim(),
        artist: artist.trim() || null,
        cue_time_seconds: cue ? Number(cue) : null,
        notes: notes.trim() || null,
      });
      setSong(""); setArtist(""); setCue(""); setNotes("");
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
  };

  const aiSuggest = async () => {
    setAiBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("plan-playlist", {
        body: { moment, event_type: eventType, event_date: eventDate },
      });
      if (error) throw error;
      const suggestions: { song_title: string; artist?: string; notes?: string; cue_time_seconds?: number }[] =
        (data as any)?.suggestions || [];
      for (const s of suggestions.slice(0, 5)) {
        await addItem({
          moment,
          song_title: s.song_title,
          artist: s.artist || null,
          cue_time_seconds: s.cue_time_seconds || null,
          notes: s.notes || "AI suggested",
        });
      }
      toast({ title: `${suggestions.length} AI picks added` });
    } catch (e: any) {
      toast({ title: "AI unavailable", description: e.message, variant: "destructive" });
    } finally { setAiBusy(false); }
  };

  const grouped: Record<string, PlaylistItem[]> = {};
  items.forEach(i => { (grouped[i.moment] ??= []).push(i); });

  return (
    <div className="space-y-4">
      <Card variant="glass" className="p-4 space-y-3">
        <div className="grid sm:grid-cols-3 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">Moment</Label>
            <Select value={moment} onValueChange={(v) => setMoment(v as Moment)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(MOMENT_LABELS) as Moment[]).map(m => (
                  <SelectItem key={m} value={m}>{MOMENT_LABELS[m]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Song</Label>
            <Input value={song} onChange={e => setSong(e.target.value)} placeholder="Song title" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Artist</Label>
            <Input value={artist} onChange={e => setArtist(e.target.value)} placeholder="Artist" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Cue point (seconds)</Label>
            <Input value={cue} onChange={e => setCue(e.target.value)} type="number" placeholder="e.g. 45" />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-xs">Notes</Label>
            <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Fade in, walk-in cue, etc." />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={add}><Plus className="w-4 h-4 mr-1" /> Add to Playlist</Button>
          <Button variant="glass" onClick={aiSuggest} disabled={aiBusy}>
            {aiBusy ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Sparkles className="w-4 h-4 mr-1" />}
            AI Suggest for {MOMENT_LABELS[moment]}
          </Button>
        </div>
      </Card>

      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : items.length === 0 ? (
        <p className="text-xs text-muted-foreground">No songs yet. Add your first pick above or let Kulture AI suggest a starter set.</p>
      ) : (
        <div className="space-y-4">
          {(Object.keys(MOMENT_LABELS) as Moment[]).filter(m => grouped[m]?.length).map(m => (
            <div key={m} className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">{MOMENT_LABELS[m]}</p>
              <div className="space-y-1">
                {grouped[m].map(it => (
                  <div key={it.id} className="flex items-start gap-2 p-2 rounded border border-border/40 bg-card/40">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{it.song_title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {it.artist || "—"}
                        {it.cue_time_seconds != null && ` · cue @ ${it.cue_time_seconds}s`}
                        {it.notes && ` · ${it.notes}`}
                      </p>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => removeItem(it.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
