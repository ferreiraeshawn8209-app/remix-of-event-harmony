import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { CalendarDays, Plus, Trash2, Save, Loader2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { uploadSiteImage } from "@/hooks/useBusinessSettings";
import { toast } from "@/hooks/use-toast";
import type { WeddingExpo } from "@/hooks/useWeddingExpos";

const EMPTY: Omit<WeddingExpo, "id"> = {
  name: "", tagline: "", description: "", venue: "", city: "", province: "",
  start_date: "", end_date: "", start_time: "", ticket_url: "", website_url: "",
  image_url: "", contact_phone: "", is_active: true, sort_order: 0,
};

export function WeddingExposManager() {
  const [rows, setRows] = useState<WeddingExpo[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Omit<WeddingExpo, "id">>(EMPTY);
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    const { data, error } = await supabase.from("wedding_expos" as any).select("*").order("sort_order").order("start_date");
    if (error) toast({ title: "Load failed", description: error.message, variant: "destructive" });
    else setRows((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { void refresh(); }, []);

  const create = async () => {
    if (!draft.name.trim()) return toast({ title: "Expo name is required", variant: "destructive" });
    setSaving(true);
    const payload: any = { ...draft };
    if (!payload.start_date) payload.start_date = null;
    if (!payload.end_date) payload.end_date = null;
    const { error } = await supabase.from("wedding_expos" as any).insert(payload);
    setSaving(false);
    if (error) return toast({ title: "Save failed", description: error.message, variant: "destructive" });
    toast({ title: "Expo added" });
    setDraft(EMPTY);
    void refresh();
  };

  const update = async (id: string, patch: Partial<WeddingExpo>) => {
    const { error } = await supabase.from("wedding_expos" as any).update(patch as any).eq("id", id);
    if (error) return toast({ title: "Update failed", description: error.message, variant: "destructive" });
    void refresh();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this expo?")) return;
    const { error } = await supabase.from("wedding_expos" as any).delete().eq("id", id);
    if (error) return toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    toast({ title: "Deleted" });
    void refresh();
  };

  const handleImage = async (file: File, target: "draft" | string) => {
    try {
      const url = await uploadSiteImage(file, "expo");
      if (target === "draft") setDraft((d) => ({ ...d, image_url: url }));
      else await update(target, { image_url: url });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    }
  };

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-primary" /> Wedding Expos
        </CardTitle>
        <CardDescription>
          Promote upcoming expos across the landing page and client portal. Past expos auto-hide after their end date.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 border border-primary/30 rounded-lg space-y-3 bg-primary/5">
          <p className="text-sm font-semibold flex items-center gap-2"><Plus className="w-4 h-4" /> Add an expo</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Field label="Name *"><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. SA Wedding Expo 2026" /></Field>
            <Field label="Tagline"><Input value={draft.tagline || ""} onChange={(e) => setDraft({ ...draft, tagline: e.target.value })} placeholder="Meet 100+ vendors under one roof" /></Field>
            <Field label="Start date"><Input type="date" value={draft.start_date || ""} onChange={(e) => setDraft({ ...draft, start_date: e.target.value })} /></Field>
            <Field label="End date"><Input type="date" value={draft.end_date || ""} onChange={(e) => setDraft({ ...draft, end_date: e.target.value })} /></Field>
            <Field label="Start time"><Input value={draft.start_time || ""} onChange={(e) => setDraft({ ...draft, start_time: e.target.value })} placeholder="09:00" /></Field>
            <Field label="Venue"><Input value={draft.venue || ""} onChange={(e) => setDraft({ ...draft, venue: e.target.value })} placeholder="e.g. Ticketpro Dome" /></Field>
            <Field label="City"><Input value={draft.city || ""} onChange={(e) => setDraft({ ...draft, city: e.target.value })} placeholder="Johannesburg" /></Field>
            <Field label="Province"><Input value={draft.province || ""} onChange={(e) => setDraft({ ...draft, province: e.target.value })} placeholder="Gauteng" /></Field>
            <Field label="Ticket URL"><Input value={draft.ticket_url || ""} onChange={(e) => setDraft({ ...draft, ticket_url: e.target.value })} placeholder="https://…" /></Field>
            <Field label="Website URL"><Input value={draft.website_url || ""} onChange={(e) => setDraft({ ...draft, website_url: e.target.value })} placeholder="https://…" /></Field>
            <Field label="Contact phone"><Input value={draft.contact_phone || ""} onChange={(e) => setDraft({ ...draft, contact_phone: e.target.value })} placeholder="+27 …" /></Field>
            <Field label="Sort order"><Input type="number" value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) || 0 })} /></Field>
          </div>
          <Field label="Description"><Textarea rows={2} value={draft.description || ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Short pitch — what makes it worth visiting" /></Field>
          <div className="flex items-center gap-2">
            <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImage(e.target.files[0], "draft")} className="text-xs" />
            {draft.image_url && <img src={draft.image_url} className="h-10 w-16 object-cover rounded border" alt="preview" />}
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={create} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />} Add expo
            </Button>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No expos yet — add one above.</p>
        ) : (
          <div className="space-y-2">
            {rows.map((v) => (
              <div key={v.id} className="flex items-center gap-3 p-3 border border-border/50 rounded-lg">
                {v.image_url ? (
                  <img src={v.image_url} className="h-12 w-16 object-cover rounded" alt={v.name} />
                ) : (
                  <div className="h-12 w-16 rounded bg-muted/40 flex items-center justify-center">
                    <CalendarDays className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{v.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {[v.start_date, v.venue || v.city].filter(Boolean).join(" • ") || "—"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Switch checked={v.is_active} onCheckedChange={(c) => update(v.id, { is_active: c })} />
                    <span className="text-[10px] text-muted-foreground">{v.is_active ? "Live" : "Hidden"}</span>
                  </div>
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleImage(e.target.files[0], v.id)} />
                    <span className="text-xs text-primary hover:underline"><Upload className="w-3 h-3 inline" /></span>
                  </label>
                  <Button size="sm" variant="ghost" onClick={() => remove(v.id)}>
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

export default WeddingExposManager;
