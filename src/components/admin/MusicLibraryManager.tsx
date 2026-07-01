import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Upload, Trash2, Music, Play, Pause } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useMusicTracks, uploadMusicFile } from "@/hooks/useMusicTracks";

export function MusicLibraryManager() {
  const { tracks, isLoading, create, update, remove } = useMusicTracks();
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [busy, setBusy] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const doUpload = async () => {
    const f = fileRef.current?.files?.[0];
    if (!f) return toast({ title: "Choose an MP3 or WAV first", variant: "destructive" });
    if (!/^audio\/(mpeg|mp3|wav|x-wav|wave)$/i.test(f.type) && !/\.(mp3|wav)$/i.test(f.name)) {
      return toast({ title: "MP3 or WAV only", variant: "destructive" });
    }
    if (f.size > 20 * 1024 * 1024) {
      return toast({ title: "File too large", description: "20 MB max per file.", variant: "destructive" });
    }
    setBusy(true);
    try {
      const url = await uploadMusicFile(f);
      await create({
        title: title.trim() || f.name.replace(/\.[^.]+$/, ""),
        artist: artist.trim() || null,
        file_url: url,
        mime_type: f.type || null,
        active: true,
        sort_order: tracks.length,
      });
      setTitle(""); setArtist("");
      if (fileRef.current) fileRef.current.value = "";
      toast({ title: "Track added" });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally { setBusy(false); }
  };

  const togglePlay = (id: string, url: string) => {
    if (!audioRef.current) audioRef.current = new Audio();
    if (playingId === id) {
      audioRef.current.pause();
      setPlayingId(null);
    } else {
      audioRef.current.src = url;
      audioRef.current.play().catch(() => {});
      setPlayingId(id);
    }
  };

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="w-5 h-5 text-primary" /> Music Library
        </CardTitle>
        <CardDescription>
          Upload MP3/WAV tracks. Active tracks autoplay in random order for signed-in clients (they can skip).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid sm:grid-cols-4 gap-2 items-end">
          <div className="space-y-1">
            <Label className="text-xs">Title</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Track name" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Artist</Label>
            <Input value={artist} onChange={e => setArtist(e.target.value)} placeholder="Artist" />
          </div>
          <div className="space-y-1 sm:col-span-1">
            <Label className="text-xs">File (MP3/WAV)</Label>
            <Input ref={fileRef} type="file" accept="audio/mpeg,audio/wav,audio/mp3,.mp3,.wav" />
          </div>
          <Button onClick={doUpload} disabled={busy}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
            Add Track
          </Button>
        </div>

        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : tracks.length === 0 ? (
          <p className="text-xs text-muted-foreground">No tracks yet. Upload your first MP3 above.</p>
        ) : (
          <div className="space-y-1">
            {tracks.map(t => (
              <div key={t.id} className="flex items-center gap-3 p-2 rounded border border-border/40 bg-card/40">
                <Button size="icon" variant="ghost" onClick={() => togglePlay(t.id, t.file_url)}>
                  {playingId === t.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{t.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{t.artist || "—"}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Active</span>
                  <Switch
                    checked={t.active}
                    onCheckedChange={(v) => update(t.id, { active: v })}
                  />
                </div>
                <Button size="icon" variant="ghost" onClick={() => remove(t.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
