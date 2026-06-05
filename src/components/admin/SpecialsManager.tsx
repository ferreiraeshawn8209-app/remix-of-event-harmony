import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useSpecials } from "@/hooks/useSpecials";
import { toast } from "@/hooks/use-toast";
import { Image as ImageIcon, Upload, Trash2, Loader2, Sparkles } from "lucide-react";
import { ImageCropDialog } from "@/components/ImageCropDialog";

export function SpecialsManager() {
  const { specials, isLoading, uploadSpecial, toggleSpecial, deleteSpecial } = useSpecials();
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const doUpload = async (file: File) => {
    setUploading(true);
    try {
      await uploadSpecial(file, title);
      toast({ title: "Special uploaded!", description: "It's now visible on the client portal." });
      setTitle("");
      if (fileRef.current) fileRef.current.value = "";
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    }
    setUploading(false);
  };

  const handlePick = () => {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast({ title: "No file selected", variant: "destructive" });
      return;
    }
    setPendingFile(file);
  };


  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" /> Specials / Promotions
        </CardTitle>
        <CardDescription>
          Upload promotional images that will appear as a banner on the client portal
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Form */}
        <div className="p-4 border border-dashed border-border rounded-lg space-y-3">
          <div className="space-y-2">
            <Label>Title (optional)</Label>
            <Input
              placeholder="e.g. January Special - 20% Off Weddings"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Special Image</Label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,image/gif"
              className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
            />
            <p className="text-[11px] text-muted-foreground">You can crop on the next step. Animated GIFs upload as-is.</p>
          </div>
          <Button onClick={handlePick} disabled={uploading}>
            {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
            Upload Special
          </Button>
          <ImageCropDialog
            file={pendingFile}
            open={!!pendingFile}
            onClose={() => setPendingFile(null)}
            onConfirm={doUpload}
            defaultAspect="16:9"
            title="Crop Special Banner"
          />
        </div>

        {/* Existing Specials */}
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : specials.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No specials uploaded yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {specials.map((s) => (
              <div key={s.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
                <img
                  src={s.image_url}
                  alt={s.title || "Special"}
                  className="w-20 h-14 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{s.title || "Untitled Special"}</p>
                  <p className="text-xs text-muted-foreground">
                    Added {new Date(s.created_at).toLocaleDateString("en-ZA")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={s.is_active}
                      onCheckedChange={(checked) => toggleSpecial(s.id, checked)}
                    />
                    <Badge variant={s.is_active ? "default" : "secondary"} className="text-xs">
                      {s.is_active ? "Active" : "Hidden"}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => deleteSpecial(s.id)}
                  >
                    <Trash2 className="w-4 h-4" />
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
