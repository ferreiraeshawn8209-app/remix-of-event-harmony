import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { MapPin, Plus, Trash2, Save, Loader2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { uploadSiteImage } from "@/hooks/useBusinessSettings";
import { toast } from "@/hooks/use-toast";

type Venue = {
  id: string;
  name: string;
  area: string | null;
  city: string | null;
  province: string | null;
  event_type: string | null;
  description: string | null;
  link_url: string | null;
  image_url: string | null;
  contact_phone: string | null;
  is_active: boolean;
  sort_order: number;
};

const EMPTY: Omit<Venue, "id"> = {
  name: "",
  area: "",
  city: "",
  province: "",
  event_type: "",
  description: "",
  link_url: "",
  image_url: "",
  contact_phone: "",
  is_active: true,
  sort_order: 0,
};

export function RecommendedVenuesManager() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Omit<Venue, "id">>(EMPTY);
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    const { data, error } = await supabase
      .from("recommended_venues")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (error) {
      toast({ title: "Load failed", description: error.message, variant: "destructive" });
    } else {
      setVenues((data || []) as Venue[]);
    }
    setLoading(false);
  };

  useEffect(() => { void refresh(); }, []);

  const create = async () => {
    if (!draft.name.trim()) return toast({ title: "Name is required", variant: "destructive" });
    setSaving(true);
    const { error } = await supabase.from("recommended_venues").insert(draft);
    setSaving(false);
    if (error) return toast({ title: "Save failed", description: error.message, variant: "destructive" });
    toast({ title: "Venue added" });
    setDraft(EMPTY);
    void refresh();
  };

  const update = async (id: string, patch: Partial<Venue>) => {
    const { error } = await supabase.from("recommended_venues").update(patch).eq("id", id);
    if (error) return toast({ title: "Update failed", description: error.message, variant: "destructive" });
    void refresh();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this venue?")) return;
    const { error } = await supabase.from("recommended_venues").delete().eq("id", id);
    if (error) return toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    toast({ title: "Deleted" });
    void refresh();
  };

  const handleImage = async (file: File, target: "draft" | string) => {
    try {
      const url = await uploadSiteImage(file, "venue");
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
          <MapPin className="w-5 h-5 text-primary" /> Recommended Venues
        </CardTitle>
        <CardDescription>
          Curate venues where BeatKulture has personally DJ'd. Clients see these under
          "Need an Event? Let us help you" — filterable by area.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add new */}
        <div className="p-4 border border-primary/30 rounded-lg space-y-3 bg-primary/5">
          <p className="text-sm font-semibold flex items-center gap-2"><Plus className="w-4 h-4" /> Add a venue</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Field label="Name *"><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Oakfield Farm" /></Field>
            <Field label="Event type"><Input value={draft.event_type || ""} onChange={(e) => setDraft({ ...draft, event_type: e.target.value })} placeholder="Wedding / Corporate / Party" /></Field>
            <Field label="Area"><Input value={draft.area || ""} onChange={(e) => setDraft({ ...draft, area: e.target.value })} placeholder="e.g. Muldersdrift" /></Field>
            <Field label="City"><Input value={draft.city || ""} onChange={(e) => setDraft({ ...draft, city: e.target.value })} placeholder="e.g. Johannesburg" /></Field>
            <Field label="Province"><Input value={draft.province || ""} onChange={(e) => setDraft({ ...draft, province: e.target.value })} placeholder="e.g. Gauteng" /></Field>
            <Field label="Contact phone"><Input value={draft.contact_phone || ""} onChange={(e) => setDraft({ ...draft, contact_phone: e.target.value })} placeholder="+27 …" /></Field>
            <Field label="Website / link"><Input value={draft.link_url || ""} onChange={(e) => setDraft({ ...draft, link_url: e.target.value })} placeholder="https://…" /></Field>
            <Field label="Sort order"><Input type="number" value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) || 0 })} /></Field>
          </div>
          <Field label="Description">
            <Textarea rows={2} value={draft.description || ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="One-line pitch" />
          </Field>
          <div className="flex items-center gap-2">
            <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImage(e.target.files[0], "draft")} className="text-xs" />
            {draft.image_url && <img src={draft.image_url} className="h-10 w-16 object-cover rounded border" alt="preview" />}
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={create} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
              Add venue
            </Button>
          </div>
        </div>

        {/* Existing list */}
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : venues.length === 0 ? (
          <p className="text-sm text-muted-foreground">No venues yet — add one above.</p>
        ) : (
          <div className="space-y-2">
            {venues.map((v) => (
              <div key={v.id} className="flex items-center gap-3 p-3 border border-border/50 rounded-lg">
                {v.image_url ? (
                  <img src={v.image_url} className="h-12 w-16 object-cover rounded" alt={v.name} />
                ) : (
                  <div className="h-12 w-16 rounded bg-muted/40 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{v.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {[v.area, v.city, v.event_type].filter(Boolean).join(" • ") || "—"}
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

export default RecommendedVenuesManager;
