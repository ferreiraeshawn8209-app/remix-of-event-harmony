import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, Trophy, Users, Upload } from "lucide-react";
import { useCompetitions, useCompetitionEntries, Competition } from "@/hooks/useCompetitions";
import { uploadSiteImage } from "@/hooks/useBusinessSettings";
import { toast } from "@/hooks/use-toast";
import { ImageCropDialog } from "@/components/ImageCropDialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

function EntriesList({ competitionId }: { competitionId: string }) {
  const { entries, isLoading } = useCompetitionEntries(competitionId);
  if (isLoading) return <Loader2 className="w-4 h-4 animate-spin" />;
  if (entries.length === 0) return <p className="text-xs text-muted-foreground">No entries yet.</p>;
  return (
    <div className="space-y-1 max-h-60 overflow-y-auto">
      {entries.map((e) => (
        <div key={e.id} className="text-xs p-2 rounded bg-muted/30">
          <div className="flex justify-between">
            <span className="font-medium">{e.name}</span>
            <span className="text-muted-foreground">{new Date(e.created_at).toLocaleString("en-ZA")}</span>
          </div>
          <div className="text-muted-foreground">{e.email}{e.phone ? ` · ${e.phone}` : ""}</div>
          {e.message && <p className="mt-1 text-foreground">{e.message}</p>}
        </div>
      ))}
    </div>
  );
}

export function CompetitionsManager() {
  const { competitions, isLoading, create, update, remove } = useCompetitions();
  const [form, setForm] = useState({ title: "", description: "", prize: "", ends_at: "" });
  const [imageUrl, setImageUrl] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const doUpload = async (file: File) => {
    setBusy(true);
    try {
      const url = await uploadSiteImage(file, "competitions");
      setImageUrl(url);
      toast({ title: "Image ready" });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    }
    setBusy(false);
  };

  const handlePick = () => {
    const f = fileRef.current?.files?.[0];
    if (!f) { toast({ title: "Pick an image first", variant: "destructive" }); return; }
    setPendingFile(f);
  };

  const save = async () => {
    if (!form.title.trim()) { toast({ title: "Title required", variant: "destructive" }); return; }
    setBusy(true);
    try {
      await create({
        title: form.title.trim(),
        description: form.description,
        prize: form.prize,
        image_url: imageUrl || null,
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
        is_active: true,
      });
      setForm({ title: "", description: "", prize: "", ends_at: "" });
      setImageUrl("");
      if (fileRef.current) fileRef.current.value = "";
      toast({ title: "Competition created" });
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
    setBusy(false);
  };

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" /> Competitions
        </CardTitle>
        <CardDescription>
          Run competitions on the client dashboard hero. Signed-in clients can enter directly.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 border border-dashed border-border rounded-lg space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Win a Free Wedding DJ Set" />
            </div>
            <div className="space-y-2">
              <Label>Prize</Label>
              <Input value={form.prize} onChange={(e) => setForm(p => ({ ...p, prize: e.target.value }))} placeholder="e.g. 4-hour DJ + Lights bundle (R8,500)" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea rows={3} value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} placeholder="How to enter, T&Cs..." />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Closing date (optional)</Label>
              <Input type="datetime-local" value={form.ends_at} onChange={(e) => setForm(p => ({ ...p, ends_at: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Banner image (optional)</Label>
              <div className="flex gap-2">
                <input ref={fileRef} type="file" accept="image/*,image/gif" className="text-xs flex-1" />
                <Button size="sm" type="button" onClick={handlePick} disabled={busy}>
                  <Upload className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          {imageUrl && (
            <img src={imageUrl} alt="banner" className="w-full max-h-40 object-contain bg-muted/30 rounded" />
          )}
          <Button onClick={save} disabled={busy} variant="hero">
            {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
            Create Competition
          </Button>
          <ImageCropDialog
            file={pendingFile}
            open={!!pendingFile}
            onClose={() => setPendingFile(null)}
            onConfirm={doUpload}
            defaultAspect="16:9"
            title="Crop Competition Banner"
          />
        </div>

        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin mx-auto" />
        ) : competitions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No competitions yet.</p>
        ) : (
          <Accordion type="multiple" className="space-y-2">
            {competitions.map((c: Competition) => (
              <AccordionItem key={c.id} value={c.id} className="border rounded-lg bg-muted/20 px-3">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3 flex-1 text-left">
                    {c.image_url && <img src={c.image_url} alt="" className="w-14 h-9 object-cover rounded" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{c.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.prize}</p>
                    </div>
                    <Badge variant={c.is_active ? "default" : "secondary"} className="text-[10px] mr-2">
                      {c.is_active ? "Active" : "Hidden"}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-2">
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap">{c.description}</p>
                  {c.ends_at && (
                    <p className="text-xs">Closes: <span className="font-medium">{new Date(c.ends_at).toLocaleString("en-ZA")}</span></p>
                  )}
                  <div className="flex items-center gap-3">
                    <Switch checked={c.is_active} onCheckedChange={(checked) => update(c.id, { is_active: checked })} />
                    <span className="text-xs">{c.is_active ? "Visible to clients" : "Hidden"}</span>
                    <Button size="sm" variant="ghost" className="ml-auto text-destructive" onClick={() => remove(c.id)}>
                      <Trash2 className="w-4 h-4 mr-1" /> Delete
                    </Button>
                  </div>
                  <div className="border-t pt-3">
                    <p className="text-xs font-semibold mb-2 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> Entries
                    </p>
                    <EntriesList competitionId={c.id} />
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
