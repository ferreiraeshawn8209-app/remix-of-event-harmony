import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Trophy, Loader2, Trash2, Plus } from "lucide-react";

interface Winner {
  id: string;
  month_label: string;
  winner_name: string;
  prize: string | null;
  message: string | null;
  photo_url: string | null;
  is_published: boolean;
  sort_order: number;
}

const EMPTY: Partial<Winner> = { month_label: "", winner_name: "", prize: "", message: "", photo_url: "", is_published: true, sort_order: 0 };

export function CompetitionWinnersManager() {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Partial<Winner>>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("competition_winners" as any).select("*")
      .order("sort_order", { ascending: true }).order("created_at", { ascending: false });
    setWinners(((data as unknown) as Winner[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!draft.month_label || !draft.winner_name) {
      toast({ title: "Missing fields", description: "Month & winner name are required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("competition_winners" as any).insert(draft as any);
    setSaving(false);
    if (error) return toast({ title: "Save failed", description: error.message, variant: "destructive" });
    setDraft(EMPTY);
    toast({ title: "Winner added" });
    load();
  };

  const toggle = async (id: string, next: boolean) => {
    await supabase.from("competition_winners" as any).update({ is_published: next }).eq("id", id);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this winner?")) return;
    await supabase.from("competition_winners" as any).delete().eq("id", id);
    load();
  };

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Trophy className="w-5 h-5 text-warning" /> Monthly Winner Spotlight</CardTitle>
        <CardDescription>Featured on the landing page and client dashboard beneath the competition banner.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-2">
          <div><Label>Month label</Label><Input value={draft.month_label || ""} placeholder="e.g. November 2026" onChange={(e) => setDraft({ ...draft, month_label: e.target.value })} /></div>
          <div><Label>Winner name</Label><Input value={draft.winner_name || ""} onChange={(e) => setDraft({ ...draft, winner_name: e.target.value })} /></div>
          <div><Label>Prize</Label><Input value={draft.prize || ""} onChange={(e) => setDraft({ ...draft, prize: e.target.value })} /></div>
          <div><Label>Photo URL</Label><Input value={draft.photo_url || ""} onChange={(e) => setDraft({ ...draft, photo_url: e.target.value })} /></div>
          <div className="sm:col-span-2"><Label>Congratulations message</Label><Textarea rows={2} value={draft.message || ""} onChange={(e) => setDraft({ ...draft, message: e.target.value })} /></div>
        </div>
        <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}Add winner</Button>

        <div className="space-y-2 pt-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : winners.map((w) => (
            <div key={w.id} className="flex items-center gap-3 p-2 rounded border border-border/50">
              {w.photo_url && <img src={w.photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{w.winner_name} <span className="text-xs text-muted-foreground">— {w.month_label}</span></p>
                {w.prize && <p className="text-xs text-primary">{w.prize}</p>}
              </div>
              <Switch checked={w.is_published} onCheckedChange={(v) => toggle(w.id, v)} />
              <Button size="icon" variant="ghost" onClick={() => remove(w.id)}><Trash2 className="w-4 h-4" /></Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
