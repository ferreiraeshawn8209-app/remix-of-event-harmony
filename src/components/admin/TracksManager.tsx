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
import { TrackUploadError, resolveMaxTrackUploadBytes, uploadTrackFile, validateFallbackTrackUrl } from "@/lib/trackUpload";

export function TracksManager() {
  const { tracks, isLoading, update, remove, refetch, create } = useTracks();
  const [title, setTitle] = useState("");
  const [fallbackUrl, setFallbackUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const maxUploadMb = Math.round((resolveMaxTrackUploadBytes() / (1024 * 1024)) * 100) / 100;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const trackTitle = title.trim() || file.name.replace(/\.[^.]+$/, "");

    setUploading(true);
    try {
      const result = await uploadTrackFile(
        file,
        trackTitle,
        {
          storage: supabase.storage.from("tracks"),
          findTrackByUrl: async (url) => {
            const { data } = await supabase
              .from("tracks")
              .select("id")
              .eq("url", url)
              .maybeSingle();
            return data;
          },
          insertTrack: async (resolvedTitle, url) => {
            const { error } = await supabase.from("tracks").insert({ title: resolvedTitle, url });
            if (error) throw error;
          },
        },
      );

      await refetch();
      setTitle("");
      if (result.status === "existing") {
        toast({ title: "Track already uploaded", description: "This MP3 already exists and was not duplicated." });
      } else {
        toast({ title: "Track uploaded", description: `"${result.title}" is now available to clients.` });
      }
    } catch (err: any) {
      const uploadError = err instanceof TrackUploadError ? err : new TrackUploadError("unknown", err?.message || "Upload failed");
      const description = uploadError.adminDetails
        ? `${uploadError.message} (${uploadError.adminDetails})`
        : uploadError.message;
      const fallbackHint = uploadError.kind === "missing_bucket" || uploadError.kind === "permission_or_config"
        ? " Use the fallback URL field below to add a direct MP3 link while storage is being fixed."
        : "";
      toast({ title: "Upload failed", description: `${description}${fallbackHint}`, variant: "destructive" });
    }
    setUploading(false);
  };

  const handleFallbackCreate = async () => {
    const fallbackTitle = title.trim() || "External MP3 track";

    try {
      const safeUrl = validateFallbackTrackUrl(fallbackUrl);
      await create(fallbackTitle, safeUrl);
      setTitle("");
      setFallbackUrl("");
      toast({
        title: "Fallback track added",
        description: "Clients can play this direct MP3 link even when storage uploads are unavailable.",
      });
    } catch (err: any) {
      const uploadError = err instanceof TrackUploadError ? err : new TrackUploadError("unknown", err?.message || "Could not add fallback track");
      toast({ title: "Fallback add failed", description: uploadError.message, variant: "destructive" });
    }
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
                : <><Upload className="w-4 h-4 mr-2" /> Choose MP3</>}
            </Button>
            <span className="text-xs text-muted-foreground">Max {maxUploadMb} MB · MP3 only</span>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".mp3,audio/mpeg,audio/mp3"
            className="hidden"
            onChange={handleUpload}
          />
          <div className="pt-3 border-t border-border/50 space-y-2">
            <Label>Fallback direct MP3 URL (when storage upload is unavailable)</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={fallbackUrl}
                onChange={(e) => setFallbackUrl(e.target.value)}
                placeholder="https://example.com/path/to/track.mp3"
              />
              <Button variant="outline" disabled={uploading} onClick={handleFallbackCreate}>
                Add by URL
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Use this backup path if bucket permissions/config are broken. The link must point directly to an MP3 file.
            </p>
          </div>
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
