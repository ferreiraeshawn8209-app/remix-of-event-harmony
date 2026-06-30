import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Music2, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTracks } from "@/hooks/useTracks";
import { toast } from "@/hooks/use-toast";

export function TracksManager() {
  const { tracks, isLoading, create, update, remove } = useTracks();
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const allowed = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/aac"];
    if (!allowed.includes(file.type)) {
      toast({ title: "Invalid file type", description: "Please upload an MP3, WAV, OGG, or AAC file.", variant: "destructive" });
      return;
    }

    const trackTitle = title.trim() || file.name.replace(/\.[^.]+$/, "");

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("tracks")
        .upload(path, file, { upsert: false, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("tracks").getPublicUrl(path);

      await create(trackTitle, urlData.publicUrl);
      setTitle("");
      toast({ title: "Track uploaded", description: `"${trackTitle}" is now available to clients.` });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    }
    setUploading(false);
  };

  const handleDelete = async (id: string, url: string) => {
    try {
      await remove(id, url);
      toast({ title: "Track deleted" });
    } catch (err: any) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    }
  };

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music2 className="w-5 h-5 text-primary" /> Client Music Player
        </CardTitle>
        <CardDescription>
          Upload MP3 tracks that play automatically and randomly for clients when they log in.
          Clients hear a shuffled mix from all active tracks.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload form */}
        <div className="p-4 border border-dashed border-border rounded-lg space-y-3">
          <div className="space-y-2">
            <Label>Track title (optional — defaults to filename)</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. BeatKulture — Amapiano Set Vol. 3"
            />
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="hero"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              {uploading
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading…</>
                : <><Upload className="w-4 h-4 mr-2" /> Choose MP3 / WAV</>}
            </Button>
            <span className="text-xs text-muted-foreground">Max 50 MB · MP3, WAV, OGG, AAC</span>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/aac"
            className="hidden"
            onChange={handleUpload}
          />
        </div>

        {/* Track list */}
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin mx-auto" />
        ) : tracks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No tracks uploaded yet. Upload your first MP3 above.
          </p>
        ) : (
          <div className="space-y-2">
            {tracks.map((track) => (
              <div key={track.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <Music2 className="w-8 h-8 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{track.title}</p>
                  <audio
                    src={track.url}
                    controls
                    preload="none"
                    className="w-full h-8 mt-1"
                    style={{ height: "32px" }}
                  />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch
                    checked={track.is_active}
                    onCheckedChange={(checked) => update(track.id, { is_active: checked })}
                  />
                  <Badge variant={track.is_active ? "default" : "secondary"} className="text-[10px]">
                    {track.is_active ? "Live" : "Hidden"}
                  </Badge>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-destructive shrink-0"
                  onClick={() => handleDelete(track.id, track.url)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
