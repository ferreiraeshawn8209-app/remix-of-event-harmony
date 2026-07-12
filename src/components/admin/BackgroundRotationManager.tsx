import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, Images, Trash2, GripVertical } from "lucide-react";
import { useBusinessSettings, uploadSiteImage, BusinessSettingKey } from "@/hooks/useBusinessSettings";
import { toast } from "@/hooks/use-toast";

/**
 * BackgroundRotationManager
 * ────────────────────────────────────────────────────────────
 * Upload multiple images (or GIFs) for a page background. They
 * cross-fade in rotation on the target page every ~7 seconds.
 *
 * Storage: newline-separated URL list in business_settings under
 * the given rotationKey (e.g. `bg_client_portal_rotation`).
 */
function RotationRow({
  label,
  description,
  rotationKey,
}: {
  label: string;
  description: string;
  rotationKey: BusinessSettingKey;
}) {
  const { get, setSetting } = useBusinessSettings();
  const [urls, setUrls] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const raw = get(rotationKey);
    setUrls(raw ? raw.split(/\r?\n/).map((s) => s.trim()).filter(Boolean) : []);
  }, [get(rotationKey)]);

  const persist = async (next: string[]) => {
    await setSetting(rotationKey, next.join("\n"));
    setUrls(next);
  };

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      const uploaded: string[] = [];
      for (const f of Array.from(files)) {
        const publicUrl = await uploadSiteImage(f, rotationKey);
        uploaded.push(publicUrl);
      }
      await persist([...urls, ...uploaded]);
      toast({ title: `${uploaded.length} image${uploaded.length > 1 ? "s" : ""} added` });
      if (fileRef.current) fileRef.current.value = "";
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    }
    setBusy(false);
  };

  const remove = async (i: number) => {
    setBusy(true);
    try {
      await persist(urls.filter((_, j) => j !== i));
      toast({ title: "Removed" });
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
    setBusy(false);
  };

  const move = async (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= urls.length) return;
    const next = urls.slice();
    [next[i], next[j]] = [next[j], next[i]];
    await persist(next);
  };

  return (
    <div className="p-4 border border-border/50 rounded-lg space-y-3">
      <div>
        <Label className="text-base">{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      {urls.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {urls.map((u, i) => (
            <div key={`${u}-${i}`} className="relative group rounded-md overflow-hidden border border-border/60">
              <img src={u} alt="" className="w-full h-24 object-cover" />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/60 text-white text-[10px] px-1.5 py-1 opacity-0 group-hover:opacity-100 transition">
                <div className="flex gap-1">
                  <button onClick={() => move(i, -1)} disabled={busy || i === 0} className="disabled:opacity-30">◀</button>
                  <button onClick={() => move(i, 1)} disabled={busy || i === urls.length - 1} className="disabled:opacity-30">▶</button>
                </div>
                <span className="opacity-70">#{i + 1}</span>
                <button onClick={() => remove(i)} disabled={busy} className="text-red-300 hover:text-red-100">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="w-full h-24 rounded bg-muted/30 flex items-center justify-center text-muted-foreground text-xs gap-2">
          <Images className="w-4 h-4" /> No rotation images yet — upload a few
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*,image/gif"
          multiple
          className="text-xs flex-1"
          onChange={(e) => void onFiles(e.target.files)}
        />
        <Button size="sm" disabled={busy} onClick={() => fileRef.current?.click()}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
          Add image(s)
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Upload 3–5 images or GIFs. They'll cross-fade every ~7 seconds. Drag order with the ◀ ▶ buttons on each tile.
      </p>
    </div>
  );
}

export function BackgroundRotationManager() {
  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Images className="w-5 h-5 text-primary" /> Rotating Backgrounds
        </CardTitle>
        <CardDescription>
          Upload multiple images (JPG, PNG, or GIF) — the page background will cycle through them
          automatically. Leave empty to use the single background image instead.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <RotationRow
          label="Client dashboard rotation"
          description="Rotates behind the signed-in client portal (/client)."
          rotationKey="bg_client_portal_rotation"
        />
        <RotationRow
          label="Landing page rotation"
          description="Rotates behind the public landing page (/)."
          rotationKey="bg_landing_rotation"
        />
      </CardContent>
    </Card>
  );
}
