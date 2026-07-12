import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Plus, Trash2, Save, Loader2, Upload, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { uploadSiteImage } from "@/hooks/useBusinessSettings";
import { toast } from "@/hooks/use-toast";
import { useStaff, type StaffMember } from "@/hooks/useStaff";

const EMPTY: Omit<StaffMember, "id"> = {
  name: "", role: "", category: "dj", bio: "", photo_url: "",
  whatsapp_number: "", email: "", specialties: [], years_experience: 0,
  is_bookable: true, is_active: true, sort_order: 0,
};

const CATEGORIES = [
  { value: "dj", label: "DJ" },
  { value: "coordinator", label: "Event Coordinator" },
  { value: "management", label: "Management" },
  { value: "sound", label: "Sound Engineer" },
  { value: "lighting", label: "Lighting Tech" },
  { value: "mc", label: "MC / Host" },
  { value: "photo", label: "Photo / Video" },
  { value: "staff", label: "Other Staff" },
];

export function StaffManager() {
  const { staff, loading, refresh } = useStaff();
  const [draft, setDraft] = useState<Omit<StaffMember, "id">>(EMPTY);
  const [saving, setSaving] = useState(false);

  const create = async () => {
    if (!draft.name.trim() || !draft.role.trim()) return toast({ title: "Name and role required", variant: "destructive" });
    setSaving(true);
    const payload: any = { ...draft, specialties: draft.specialties?.length ? draft.specialties : null };
    const { error } = await (supabase as any).from("staff_members").insert(payload);
    setSaving(false);
    if (error) return toast({ title: "Save failed", description: error.message, variant: "destructive" });
    toast({ title: "Staff member added" });
    setDraft(EMPTY);
    void refresh();
  };

  const update = async (id: string, patch: Partial<StaffMember>) => {
    const { error } = await (supabase as any).from("staff_members").update(patch).eq("id", id);
    if (error) return toast({ title: "Update failed", description: error.message, variant: "destructive" });
    void refresh();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this staff member?")) return;
    const { error } = await (supabase as any).from("staff_members").delete().eq("id", id);
    if (error) return toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    toast({ title: "Deleted" });
    void refresh();
  };

  const handleImage = async (file: File, target: "draft" | string) => {
    try {
      const url = await uploadSiteImage(file, "staff");
      if (target === "draft") setDraft((d) => ({ ...d, photo_url: url }));
      else await update(target, { photo_url: url });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    }
  };

  const parseSpecialties = (raw: string): string[] =>
    raw.split(",").map((s) => s.trim()).filter(Boolean);

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" /> Staff & DJs
        </CardTitle>
        <CardDescription>
          Manage DJ, coordinator, and team profiles. Bookable staff appear as options for clients on the Meet the Team page.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 border border-primary/30 rounded-lg space-y-3 bg-primary/5">
          <p className="text-sm font-semibold flex items-center gap-2"><Plus className="w-4 h-4" /> Add a team member</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Field label="Name *"><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="DJ Nova" /></Field>
            <Field label="Role / Title *"><Input value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })} placeholder="Lead Wedding DJ" /></Field>
            <Field label="Category">
              <Select value={draft.category} onValueChange={(v) => setDraft({ ...draft, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Years experience"><Input type="number" value={draft.years_experience || 0} onChange={(e) => setDraft({ ...draft, years_experience: Number(e.target.value) || 0 })} /></Field>
            <Field label="WhatsApp number"><Input value={draft.whatsapp_number || ""} onChange={(e) => setDraft({ ...draft, whatsapp_number: e.target.value })} placeholder="+27 65 555 5555" /></Field>
            <Field label="Email"><Input type="email" value={draft.email || ""} onChange={(e) => setDraft({ ...draft, email: e.target.value })} /></Field>
            <Field label="Specialties (comma separated)"><Input value={(draft.specialties || []).join(", ")} onChange={(e) => setDraft({ ...draft, specialties: parseSpecialties(e.target.value) })} placeholder="Weddings, Amapiano, House" /></Field>
            <Field label="Sort order"><Input type="number" value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) || 0 })} /></Field>
          </div>
          <Field label="Bio"><Textarea rows={3} value={draft.bio || ""} onChange={(e) => setDraft({ ...draft, bio: e.target.value })} placeholder="Short bio for the client-facing profile card" /></Field>
          <div className="flex items-center gap-3 flex-wrap">
            <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleImage(e.target.files[0], "draft")} className="text-xs" />
            {draft.photo_url && <img src={draft.photo_url} className="h-12 w-12 object-cover rounded-full border" alt="preview" />}
            <label className="flex items-center gap-2 text-xs">
              <Switch checked={draft.is_bookable} onCheckedChange={(c) => setDraft({ ...draft, is_bookable: c })} />
              Bookable by clients
            </label>
            <label className="flex items-center gap-2 text-xs">
              <Switch checked={draft.is_active} onCheckedChange={(c) => setDraft({ ...draft, is_active: c })} />
              Active
            </label>
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={create} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-1" />} Add member
            </Button>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : staff.length === 0 ? (
          <p className="text-sm text-muted-foreground">No staff yet — add one above.</p>
        ) : (
          <div className="space-y-2">
            {staff.map((m) => (
              <div key={m.id} className="flex items-center gap-3 p-3 border border-border/50 rounded-lg">
                {m.photo_url ? (
                  <img src={m.photo_url} className="h-12 w-12 object-cover rounded-full" alt={m.name} />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-muted/40 flex items-center justify-center text-lg font-bold text-muted-foreground">
                    {m.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{m.name} <span className="text-xs text-muted-foreground">· {m.role}</span></p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {m.category} {m.whatsapp_number && <><MessageCircle className="w-3 h-3 inline mx-1" />{m.whatsapp_number}</>}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Switch checked={m.is_bookable} onCheckedChange={(c) => update(m.id, { is_bookable: c })} />
                    <span className="text-[10px] text-muted-foreground">Book</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Switch checked={m.is_active} onCheckedChange={(c) => update(m.id, { is_active: c })} />
                    <span className="text-[10px] text-muted-foreground">{m.is_active ? "Live" : "Hidden"}</span>
                  </div>
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleImage(e.target.files[0], m.id)} />
                    <span className="text-xs text-primary hover:underline"><Upload className="w-3 h-3 inline" /></span>
                  </label>
                  <Button size="sm" variant="ghost" onClick={() => remove(m.id)}>
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

export default StaffManager;
