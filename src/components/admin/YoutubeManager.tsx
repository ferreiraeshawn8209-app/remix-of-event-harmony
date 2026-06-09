import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, Youtube, ArrowUp, ArrowDown } from "lucide-react";
import { useYoutubeVideos, extractYoutubeId } from "@/hooks/useYoutubeVideos";
import { toast } from "@/hooks/use-toast";

export function YoutubeManager() {
  const { videos, isLoading, create, update, remove } = useYoutubeVideos();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const add = async () => {
    const youtube_id = extractYoutubeId(url);
    if (!title.trim() || !youtube_id) {
      toast({ title: "Title and a valid YouTube URL or ID are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await create({ title: title.trim(), youtube_id, description: description.trim() });
      setTitle(""); setUrl(""); setDescription("");
      toast({ title: "Video added", description: "Visible on the client dashboard." });
    } catch (e: any) {
      toast({ title: "Failed to add", description: e.message, variant: "destructive" });
    }
    setSaving(false);
  };

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Youtube className="w-5 h-5 text-primary" /> YouTube Showcase
        </CardTitle>
        <CardDescription>
          Promote your own music productions. Thumbnails auto-play muted on the client dashboard;
          clicking opens the full video with sound.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 border border-dashed border-border rounded-lg space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Video title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. DJ Shawn-E-Shawn — Summer Mix 2026" />
            </div>
            <div className="space-y-2">
              <Label>YouTube URL or video ID</Label>
              <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://youtu.be/abc123XYZ45" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Short caption (optional)</Label>
            <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Catchy one-liner shown under the thumbnail" />
          </div>
          <Button onClick={add} disabled={saving} variant="hero">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
            Add Video
          </Button>
        </div>

        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin mx-auto" />
        ) : videos.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No videos yet.</p>
        ) : (
          <div className="space-y-2">
            {videos.map((v, idx) => (
              <div key={v.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <img
                  src={`https://i.ytimg.com/vi/${v.youtube_id}/mqdefault.jpg`}
                  alt={v.title}
                  className="w-24 h-14 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{v.title}</p>
                  <p className="text-[11px] text-muted-foreground font-mono truncate">{v.youtube_id}</p>
                </div>
                <Button size="icon" variant="ghost" disabled={idx === 0}
                  onClick={() => update(v.id, { sort_order: (v.sort_order || 0) - 1 })}>
                  <ArrowUp className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost"
                  onClick={() => update(v.id, { sort_order: (v.sort_order || 0) + 1 })}>
                  <ArrowDown className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-2">
                  <Switch checked={v.is_active} onCheckedChange={(c) => update(v.id, { is_active: c })} />
                  <Badge variant={v.is_active ? "default" : "secondary"} className="text-[10px]">
                    {v.is_active ? "Live" : "Hidden"}
                  </Badge>
                </div>
                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => remove(v.id)}>
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
