import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Music, Save, Loader2, Plus, X, Send, Lock, Upload, Download, Play, FileAudio, FileText, Trash2 } from "lucide-react";

interface MusicPlanningFormProps {
  profileId: string;
  clientName: string;
  email: string;
  quoteId?: string | null;
}

interface MusicPlan {
  must_play_songs: string;
  do_not_play_songs: string;
  preferred_genres: string;
  artists_to_avoid: string;
  first_dance_song: string;
  first_dance_artist: string;
  father_daughter_song: string;
  father_daughter_artist: string;
  mother_son_song: string;
  mother_son_artist: string;
  cake_cutting_song: string;
  cake_cutting_artist: string;
  bouquet_toss_song: string;
  bouquet_toss_artist: string;
  last_song: string;
  last_song_artist: string;
  mc_notes: string;
  timeline_notes: string;
  additional_notes: string;
  color_scheme_primary: string;
  color_scheme_secondary: string;
  color_scheme_accent: string;
  dress_code: string;
  theme_notes: string;
  decor_notes: string;
  uplighting_color: string;
}

const DEFAULT_PLAN: MusicPlan = {
  must_play_songs: "", do_not_play_songs: "", preferred_genres: "", artists_to_avoid: "",
  first_dance_song: "", first_dance_artist: "", father_daughter_song: "", father_daughter_artist: "",
  mother_son_song: "", mother_son_artist: "", cake_cutting_song: "", cake_cutting_artist: "",
  bouquet_toss_song: "", bouquet_toss_artist: "", last_song: "", last_song_artist: "",
  mc_notes: "", timeline_notes: "", additional_notes: "",
};

interface Attachment {
  id: string;
  file_name: string;
  file_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
}

function SongPair({ label, songKey, artistKey, plan, update, disabled }: {
  label: string; songKey: keyof MusicPlan; artistKey: keyof MusicPlan;
  plan: MusicPlan; update: (k: keyof MusicPlan, v: string) => void; disabled: boolean;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/40 p-3 space-y-2">
      <p className="text-xs font-semibold text-primary uppercase tracking-wide">{label}</p>
      <div className="grid sm:grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Song title</Label>
          <Input disabled={disabled} value={plan[songKey]} onChange={(e) => update(songKey, e.target.value)} placeholder="e.g. Perfect" className="h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Artist</Label>
          <Input disabled={disabled} value={plan[artistKey]} onChange={(e) => update(artistKey, e.target.value)} placeholder="e.g. Ed Sheeran" className="h-8 text-sm" />
        </div>
      </div>
    </div>
  );
}

function formatBytes(b: number | null) {
  if (!b) return "";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

export function MusicPlanningForm({ profileId, clientName, email, quoteId }: MusicPlanningFormProps) {
  const [plan, setPlan] = useState<MusicPlan>(DEFAULT_PLAN);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [status, setStatus] = useState<"draft" | "submitted">("draft");
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [requestedSongs, setRequestedSongs] = useState<string[]>([""]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);

  const locked = status === "submitted" && !adminUnlocked;

  const loadAttachments = useCallback(async (planId: string | null) => {
    let q = supabase.from("plan_attachments").select("*").eq("client_id", profileId).order("created_at", { ascending: false });
    if (planId) q = supabase.from("plan_attachments").select("*").eq("plan_id", planId).order("created_at", { ascending: false });
    const { data } = await q;
    setAttachments((data as any) || []);
  }, [profileId]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      let q = supabase.from("event_plans").select("*").eq("client_id", profileId).order("created_at", { ascending: false }).limit(1);
      if (quoteId) q = supabase.from("event_plans").select("*").eq("quote_id", quoteId).limit(1);
      const { data } = await q;
      if (data && data[0]) {
        const row = data[0] as any;
        setExistingId(row.id);
        setStatus(row.status === "submitted" ? "submitted" : "draft");
        setAdminUnlocked(!!row.admin_unlocked);
        setPlan({
          must_play_songs: row.must_play_songs || "", do_not_play_songs: row.do_not_play_songs || "",
          preferred_genres: row.preferred_genres || "", artists_to_avoid: row.artists_to_avoid || "",
          first_dance_song: row.first_dance_song || "", first_dance_artist: row.first_dance_artist || "",
          father_daughter_song: row.father_daughter_song || "", father_daughter_artist: row.father_daughter_artist || "",
          mother_son_song: row.mother_son_song || "", mother_son_artist: row.mother_son_artist || "",
          cake_cutting_song: row.cake_cutting_song || "", cake_cutting_artist: row.cake_cutting_artist || "",
          bouquet_toss_song: row.bouquet_toss_song || "", bouquet_toss_artist: row.bouquet_toss_artist || "",
          last_song: row.last_song || "", last_song_artist: row.last_song_artist || "",
          mc_notes: row.mc_notes || "", timeline_notes: row.timeline_notes || "", additional_notes: row.additional_notes || "",
        });
        if (row.must_play_songs) {
          const songs = row.must_play_songs.split("\n").filter(Boolean);
          setRequestedSongs(songs.length > 0 ? songs : [""]);
        }
        await loadAttachments(row.id);
      } else {
        await loadAttachments(null);
      }
      setLoading(false);
    })();
  }, [profileId, quoteId, loadAttachments]);

  const update = (k: keyof MusicPlan, v: string) => setPlan((prev) => ({ ...prev, [k]: v }));
  const addSong = () => setRequestedSongs((prev) => [...prev, ""]);
  const removeSong = (i: number) => setRequestedSongs((prev) => prev.filter((_, idx) => idx !== i));
  const updateSong = (i: number, v: string) => setRequestedSongs((prev) => prev.map((s, idx) => (idx === i ? v : s)));

  const persist = async (nextStatus: "draft" | "submitted") => {
    const mustPlayText = requestedSongs.filter(Boolean).join("\n");
    const payload: any = {
      client_id: profileId, client_name: clientName, email, quote_id: quoteId || null,
      ...plan, must_play_songs: mustPlayText,
      status: nextStatus,
      submitted_at: nextStatus === "submitted" ? new Date().toISOString() : null,
    };
    if (existingId) {
      const { error } = await supabase.from("event_plans").update(payload).eq("id", existingId);
      if (error) throw error;
      return existingId;
    }
    const { data, error } = await supabase.from("event_plans").insert(payload).select("id").single();
    if (error) throw error;
    const newId = (data as any).id;
    setExistingId(newId);
    return newId;
  };

  const saveDraft = async () => {
    setSaving(true);
    try {
      await persist("draft");
      setStatus("draft");
      toast({ title: "Draft saved", description: "Your progress is saved. You can return anytime to keep editing." });
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const submitPlan = async () => {
    if (!confirm("Submit your music plan? You won't be able to edit it after unless an admin unlocks it.")) return;
    setSubmitting(true);
    try {
      await persist("submitted");
      setStatus("submitted");
      setAdminUnlocked(false);
      toast({ title: "Playlist submitted", description: "Sent to your DJ. Editing is now locked." });
    } catch (e: any) {
      toast({ title: "Submit failed", description: e.message, variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  const onUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      // Make sure a plan row exists so attachments link to it.
      let planId = existingId;
      if (!planId) planId = await persist("draft");

      const { data: userData } = await supabase.auth.getUser();
      for (const file of Array.from(files)) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
        const path = `plan-attachments/${profileId}/${Date.now()}-${safeName}`;
        const { error: upErr } = await supabase.storage.from("documents").upload(path, file, {
          contentType: file.type || undefined, upsert: false,
        });
        if (upErr) throw upErr;
        const { error: insErr } = await supabase.from("plan_attachments").insert({
          plan_id: planId, client_id: profileId, quote_id: quoteId || null,
          file_name: file.name, file_path: path,
          mime_type: file.type || null, size_bytes: file.size,
          uploaded_by: userData.user?.id || null,
        } as any);
        if (insErr) throw insErr;
      }
      await loadAttachments(planId);
      toast({ title: "Upload complete", description: `${files.length} file(s) attached to your profile.` });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally { setUploading(false); }
  };

  const downloadAttachment = async (att: Attachment) => {
    const { data, error } = await supabase.storage.from("documents").createSignedUrl(att.file_path, 3600);
    if (error) return toast({ title: "Download failed", description: error.message, variant: "destructive" });
    window.open(data.signedUrl, "_blank");
  };

  const deleteAttachment = async (att: Attachment) => {
    if (locked) return;
    if (!confirm(`Delete ${att.file_name}?`)) return;
    await supabase.storage.from("documents").remove([att.file_path]);
    await supabase.from("plan_attachments").delete().eq("id", att.id);
    setAttachments((prev) => prev.filter((a) => a.id !== att.id));
  };

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>;
  }

  const filledSongs = requestedSongs.filter(Boolean).length;
  const audioAttachments = attachments.filter((a) => (a.mime_type || "").startsWith("audio/") || /\.(mp3|wav|m4a|aac|ogg)$/i.test(a.file_name));

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="w-5 h-5 text-primary" />
          Music Planning
          {status === "submitted" && !adminUnlocked && (
            <Badge variant="outline" className="ml-2 border-warning/40 text-warning gap-1"><Lock className="w-3 h-3" />Submitted — Locked</Badge>
          )}
          {status === "submitted" && adminUnlocked && (
            <Badge variant="outline" className="ml-2 border-success/40 text-success">Unlocked by admin</Badge>
          )}
          {status === "draft" && existingId && (
            <Badge variant="outline" className="ml-2 border-primary/40 text-primary">Draft</Badge>
          )}
        </CardTitle>
        <CardDescription>
          Save drafts anytime. Submit when your playlist is ready — your DJ will be notified.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {locked && (
          <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-warning">
            This plan has been submitted. Contact your DJ if you need to make changes.
          </div>
        )}

        {/* Requested songs list */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Song requests ({filledSongs}/50 recommended)</Label>
            <Button size="sm" variant="outline" onClick={addSong} disabled={locked}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add song
            </Button>
          </div>
          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            {requestedSongs.map((song, i) => (
              <div key={i} className="flex gap-2">
                <Input disabled={locked} value={song} onChange={(e) => updateSong(i, e.target.value)}
                  placeholder={`Song ${i + 1} — e.g. "Blinding Lights - The Weeknd"`} className="h-8 text-sm" />
                {requestedSongs.length > 1 && (
                  <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => removeSong(i)} disabled={locked}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          {filledSongs < 35 && (
            <p className="text-xs text-muted-foreground">We recommend at least 35 songs to give your DJ enough variety.</p>
          )}
        </div>

        <Separator />

        {/* Uploads */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-1"><FileAudio className="w-4 h-4" />My uploads ({attachments.length})</Label>
            <div>
              <input id="plan-upload" type="file" multiple className="hidden"
                accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,application/pdf,image/*"
                onChange={(e) => { onUpload(e.target.files); e.currentTarget.value = ""; }}
                disabled={locked || uploading} />
              <Button size="sm" variant="outline" asChild disabled={locked || uploading}>
                <label htmlFor="plan-upload" className="cursor-pointer">
                  {uploading ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1" />}
                  Upload files
                </label>
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Attach music files (MP3/WAV), reference tracks, PDFs, or images. Files are stored on your profile and shared with your DJ.
          </p>
          {attachments.length > 0 && (
            <div className="space-y-1.5">
              {attachments.map((a) => {
                const isAudio = audioAttachments.includes(a);
                return (
                  <div key={a.id} className="flex items-center gap-2 rounded-md border border-border/50 bg-card/30 p-2 text-sm">
                    {isAudio ? <FileAudio className="w-4 h-4 text-primary shrink-0" /> : <FileText className="w-4 h-4 text-muted-foreground shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="truncate">{a.file_name}</p>
                      <p className="text-xs text-muted-foreground">{formatBytes(a.size_bytes)} · {new Date(a.created_at).toLocaleDateString()}</p>
                    </div>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => downloadAttachment(a)} title="Download">
                      <Download className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteAttachment(a)} disabled={locked} title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <Separator />

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Preferred genres</Label>
            <Textarea disabled={locked} rows={3} value={plan.preferred_genres} onChange={(e) => update("preferred_genres", e.target.value)} placeholder="e.g. Afrobeats, Amapiano, R&B, House, Pop..." />
          </div>
          <div className="space-y-2">
            <Label>Artists to avoid</Label>
            <Textarea disabled={locked} rows={3} value={plan.artists_to_avoid} onChange={(e) => update("artists_to_avoid", e.target.value)} placeholder="e.g. Artists you dislike..." />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Songs to avoid</Label>
          <Textarea disabled={locked} rows={2} value={plan.do_not_play_songs} onChange={(e) => update("do_not_play_songs", e.target.value)} placeholder="List any songs you do NOT want played..." />
        </div>

        <Separator />

        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">Wedding Moment Songs</p>
          <p className="text-xs text-muted-foreground">Leave blank if not applicable.</p>
          <div className="grid gap-3">
            <SongPair label="🥂 First Dance" songKey="first_dance_song" artistKey="first_dance_artist" plan={plan} update={update} disabled={locked} />
            <SongPair label="👨‍👧 Father & Daughter" songKey="father_daughter_song" artistKey="father_daughter_artist" plan={plan} update={update} disabled={locked} />
            <SongPair label="👩‍👦 Mother & Son" songKey="mother_son_song" artistKey="mother_son_artist" plan={plan} update={update} disabled={locked} />
            <SongPair label="🎂 Cake Cutting" songKey="cake_cutting_song" artistKey="cake_cutting_artist" plan={plan} update={update} disabled={locked} />
            <SongPair label="💐 Bouquet Toss" songKey="bouquet_toss_song" artistKey="bouquet_toss_artist" plan={plan} update={update} disabled={locked} />
            <SongPair label="🌙 Last Dance" songKey="last_song" artistKey="last_song_artist" plan={plan} update={update} disabled={locked} />
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Event timeline notes</Label>
            <Textarea disabled={locked} rows={3} value={plan.timeline_notes} onChange={(e) => update("timeline_notes", e.target.value)} placeholder="e.g. Ceremony 14:00, Reception 18:00..." />
          </div>
          <div className="space-y-2">
            <Label>DJ / MC notes</Label>
            <Textarea disabled={locked} rows={3} value={plan.mc_notes} onChange={(e) => update("mc_notes", e.target.value)} placeholder="Special announcements, name pronunciations, tone..." />
          </div>
          <div className="space-y-2">
            <Label>Additional notes</Label>
            <Textarea disabled={locked} rows={2} value={plan.additional_notes} onChange={(e) => update("additional_notes", e.target.value)} placeholder="Anything else your DJ should know..." />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={saveDraft} disabled={saving || submitting || locked} className="flex-1">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Draft
          </Button>
          <Button variant="hero" onClick={submitPlan} disabled={saving || submitting || locked} className="flex-1">
            {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            {status === "submitted" ? "Already Submitted" : "Submit Playlist"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
