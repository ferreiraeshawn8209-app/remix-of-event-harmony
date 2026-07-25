import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import {
  Loader2, Music, Lock, Unlock, Download, FileAudio, FileText,
  Play, Pause, Save, Printer, ChevronDown, ChevronRight, Search, User, Trash2, GripVertical,
} from "lucide-react";

interface PlanRow {
  id: string;
  client_id: string;
  client_name: string;
  email: string;
  quote_id: string | null;
  status: string | null;
  admin_unlocked: boolean | null;
  submitted_at: string | null;
  updated_at: string;
  admin_notes: string | null;
  must_play_songs: string | null;
  do_not_play_songs: string | null;
  preferred_genres: string | null;
  artists_to_avoid: string | null;
  first_dance_song: string | null; first_dance_artist: string | null;
  father_daughter_song: string | null; father_daughter_artist: string | null;
  mother_son_song: string | null; mother_son_artist: string | null;
  cake_cutting_song: string | null; cake_cutting_artist: string | null;
  bouquet_toss_song: string | null; bouquet_toss_artist: string | null;
  last_song: string | null; last_song_artist: string | null;
  mc_notes: string | null; timeline_notes: string | null; additional_notes: string | null;
}

interface Attachment {
  id: string; plan_id: string | null; client_id: string;
  file_name: string; file_path: string;
  mime_type: string | null; size_bytes: number | null; created_at: string;
}

function formatBytes(b: number | null) {
  if (!b) return "";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function isAudio(a: Attachment) {
  return (a.mime_type || "").startsWith("audio/") || /\.(mp3|wav|m4a|aac|ogg)$/i.test(a.file_name);
}

function PlanDetail({ plan, onChanged }: { plan: PlanRow; onChanged: () => void }) {
  const [songs, setSongs] = useState<string[]>(() => (plan.must_play_songs || "").split("\n").filter(Boolean));
  const [adminNotes, setAdminNotes] = useState(plan.admin_notes || "");
  const [saving, setSaving] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("plan_attachments").select("*")
        .or(`plan_id.eq.${plan.id},client_id.eq.${plan.client_id}`)
        .order("created_at", { ascending: false });
      const atts = (data as any as Attachment[]) || [];
      setAttachments(atts);
      // Pre-sign audio URLs so admin can play inline.
      const urls: Record<string, string> = {};
      await Promise.all(atts.filter(isAudio).map(async (a) => {
        const { data: s } = await supabase.storage.from("documents").createSignedUrl(a.file_path, 3600);
        if (s?.signedUrl) urls[a.id] = s.signedUrl;
      }));
      setSignedUrls(urls);
    })();
  }, [plan.id, plan.client_id]);

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= songs.length) return;
    const next = songs.slice();
    [next[i], next[j]] = [next[j], next[i]];
    setSongs(next);
  };

  const removeSong = (i: number) => setSongs(songs.filter((_, idx) => idx !== i));
  const updateSong = (i: number, v: string) => setSongs(songs.map((s, idx) => (idx === i ? v : s)));

  const save = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("event_plans").update({
        must_play_songs: songs.join("\n"),
        admin_notes: adminNotes,
      } as any).eq("id", plan.id);
      if (error) throw error;
      toast({ title: "Saved", description: "Playlist updates saved." });
      onChanged();
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const toggleLock = async () => {
    const nextUnlocked = !plan.admin_unlocked;
    const { error } = await supabase.from("event_plans").update({ admin_unlocked: nextUnlocked } as any).eq("id", plan.id);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    toast({ title: nextUnlocked ? "Unlocked for client" : "Locked", description: nextUnlocked ? "Client can edit again." : "Client editing locked." });
    onChanged();
  };

  const download = async (a: Attachment) => {
    const url = signedUrls[a.id] || (await supabase.storage.from("documents").createSignedUrl(a.file_path, 3600)).data?.signedUrl;
    if (url) window.open(url, "_blank");
  };

  const printPlan = () => {
    const w = window.open("", "_blank", "width=800,height=900");
    if (!w) return;
    const rows = [
      ["Client", plan.client_name], ["Email", plan.email],
      ["Status", plan.status || "draft"], ["Submitted", plan.submitted_at ? new Date(plan.submitted_at).toLocaleString() : "—"],
      ["Preferred genres", plan.preferred_genres || ""], ["Artists to avoid", plan.artists_to_avoid || ""],
      ["Do NOT play", plan.do_not_play_songs || ""],
      ["First dance", `${plan.first_dance_song || ""} — ${plan.first_dance_artist || ""}`],
      ["Father/Daughter", `${plan.father_daughter_song || ""} — ${plan.father_daughter_artist || ""}`],
      ["Mother/Son", `${plan.mother_son_song || ""} — ${plan.mother_son_artist || ""}`],
      ["Cake cutting", `${plan.cake_cutting_song || ""} — ${plan.cake_cutting_artist || ""}`],
      ["Bouquet toss", `${plan.bouquet_toss_song || ""} — ${plan.bouquet_toss_artist || ""}`],
      ["Last dance", `${plan.last_song || ""} — ${plan.last_song_artist || ""}`],
      ["Timeline", plan.timeline_notes || ""], ["MC notes", plan.mc_notes || ""], ["Additional", plan.additional_notes || ""],
      ["Admin notes", adminNotes],
    ];
    w.document.write(`<html><head><title>Playlist — ${plan.client_name}</title>
      <style>body{font-family:system-ui;padding:24px;color:#111}h1{margin:0 0 4px}h2{margin-top:24px;border-bottom:1px solid #ddd;padding-bottom:4px}ol{padding-left:20px}table{border-collapse:collapse;width:100%}td{padding:4px 8px;vertical-align:top;border-bottom:1px solid #eee}td:first-child{font-weight:600;width:180px;color:#555}</style>
      </head><body>
      <h1>Music Plan — ${plan.client_name}</h1>
      <p>${plan.email}</p>
      <h2>Song Requests (${songs.length})</h2>
      <ol>${songs.map((s) => `<li>${s.replace(/</g, "&lt;")}</li>`).join("")}</ol>
      <h2>Details</h2>
      <table>${rows.map(([k, v]) => `<tr><td>${k}</td><td>${(v || "").toString().replace(/</g, "&lt;").replace(/\n/g, "<br/>")}</td></tr>`).join("")}</table>
      </body></html>`);
    w.document.close(); w.focus(); w.print();
  };

  const audioAtts = attachments.filter(isAudio);
  const otherAtts = attachments.filter((a) => !isAudio(a));

  return (
    <div className="space-y-4 pt-3">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={save} disabled={saving}>
          {saving ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />} Save changes
        </Button>
        <Button size="sm" variant="outline" onClick={toggleLock}>
          {plan.admin_unlocked ? <Lock className="w-3.5 h-3.5 mr-1" /> : <Unlock className="w-3.5 h-3.5 mr-1" />}
          {plan.admin_unlocked ? "Lock client editing" : "Unlock for client"}
        </Button>
        <Button size="sm" variant="outline" onClick={printPlan}>
          <Printer className="w-3.5 h-3.5 mr-1" /> Print / Export
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card variant="glass">
          <CardHeader><CardTitle className="text-sm flex items-center gap-1"><Music className="w-4 h-4" />Songs ({songs.length})</CardTitle></CardHeader>
          <CardContent className="space-y-1.5 max-h-96 overflow-y-auto">
            {songs.length === 0 && <p className="text-xs text-muted-foreground">No songs entered.</p>}
            {songs.map((s, i) => (
              <div key={i} className="flex items-center gap-1">
                <div className="flex flex-col">
                  <button className="text-xs text-muted-foreground hover:text-primary" onClick={() => move(i, -1)}>▲</button>
                  <button className="text-xs text-muted-foreground hover:text-primary" onClick={() => move(i, 1)}>▼</button>
                </div>
                <span className="text-xs w-6 text-muted-foreground">{i + 1}.</span>
                <Input value={s} onChange={(e) => updateSong(i, e.target.value)} className="h-8 text-sm" />
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeSong(i)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card variant="glass">
          <CardHeader><CardTitle className="text-sm">Client notes & instructions</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {[
              ["Preferred genres", plan.preferred_genres],
              ["Artists to avoid", plan.artists_to_avoid],
              ["Do NOT play", plan.do_not_play_songs],
              ["Timeline", plan.timeline_notes],
              ["MC notes", plan.mc_notes],
              ["Additional notes", plan.additional_notes],
            ].map(([label, val]) => (
              <div key={label as string}>
                <p className="text-xs font-semibold text-primary uppercase">{label}</p>
                <p className="whitespace-pre-wrap text-muted-foreground">{val || "—"}</p>
              </div>
            ))}
            <Separator />
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                ["First dance", plan.first_dance_song, plan.first_dance_artist],
                ["Father/Daughter", plan.father_daughter_song, plan.father_daughter_artist],
                ["Mother/Son", plan.mother_son_song, plan.mother_son_artist],
                ["Cake cutting", plan.cake_cutting_song, plan.cake_cutting_artist],
                ["Bouquet toss", plan.bouquet_toss_song, plan.bouquet_toss_artist],
                ["Last dance", plan.last_song, plan.last_song_artist],
              ].map(([label, song, artist]) => (
                <div key={label as string}>
                  <p className="font-semibold text-primary">{label}</p>
                  <p className="text-muted-foreground">{song || "—"}{artist ? ` — ${artist}` : ""}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card variant="glass">
        <CardHeader><CardTitle className="text-sm">Private admin notes</CardTitle></CardHeader>
        <CardContent>
          <Textarea rows={4} value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="Internal notes for the DJ team (not visible to client)..." />
        </CardContent>
      </Card>

      <Card variant="glass">
        <CardHeader>
          <CardTitle className="text-sm">Uploaded files ({attachments.length})</CardTitle>
          <CardDescription className="text-xs">Attached to this client's profile.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {audioAtts.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-primary uppercase">Audio</p>
              {audioAtts.map((a) => (
                <div key={a.id} className="rounded-md border border-border/50 bg-card/30 p-2 space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <FileAudio className="w-4 h-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate">{a.file_name}</p>
                      <p className="text-xs text-muted-foreground">{a.mime_type || "audio"} · {formatBytes(a.size_bytes)} · {new Date(a.created_at).toLocaleDateString()}</p>
                    </div>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => download(a)}><Download className="w-3.5 h-3.5" /></Button>
                  </div>
                  {signedUrls[a.id] && (
                    <audio controls preload="none" className="w-full h-8" src={signedUrls[a.id]} />
                  )}
                </div>
              ))}
            </div>
          )}
          {otherAtts.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-primary uppercase">Other files</p>
              {otherAtts.map((a) => (
                <div key={a.id} className="flex items-center gap-2 rounded-md border border-border/50 bg-card/30 p-2 text-sm">
                  <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{a.file_name}</p>
                    <p className="text-xs text-muted-foreground">{a.mime_type || "file"} · {formatBytes(a.size_bytes)} · {new Date(a.created_at).toLocaleDateString()}</p>
                  </div>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => download(a)}><Download className="w-3.5 h-3.5" /></Button>
                </div>
              ))}
            </div>
          )}
          {attachments.length === 0 && <p className="text-xs text-muted-foreground">No uploads yet.</p>}
        </CardContent>
      </Card>
    </div>
  );
}

export function MusicPlansManager() {
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "submitted" | "draft">("all");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("event_plans").select("*").order("updated_at", { ascending: false });
    setPlans((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return plans.filter((p) => {
      if (statusFilter !== "all" && (p.status || "draft") !== statusFilter) return false;
      if (!search.trim()) return true;
      const s = search.toLowerCase();
      return (p.client_name || "").toLowerCase().includes(s) || (p.email || "").toLowerCase().includes(s);
    });
  }, [plans, search, statusFilter]);

  return (
    <div className="space-y-4">
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Music className="w-5 h-5 text-primary" />Client Music Plans</CardTitle>
          <CardDescription>Every playlist saved or submitted by a client, attached to their profile.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by client name or email..." className="pl-8" />
            </div>
            <div className="flex gap-1">
              {(["all", "submitted", "draft"] as const).map((s) => (
                <Button key={s} size="sm" variant={statusFilter === s ? "default" : "outline"} onClick={() => setStatusFilter(s)}>
                  {s === "all" ? "All" : s === "submitted" ? "Submitted" : "Drafts"}
                </Button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No plans found.</p>
          ) : (
            <div className="space-y-2">
              {filtered.map((p) => {
                const open = openId === p.id;
                const status = p.status || "draft";
                return (
                  <div key={p.id} className="rounded-lg border border-border/60 bg-card/30 overflow-hidden">
                    <button className="w-full flex items-center gap-2 p-3 text-left hover:bg-card/50" onClick={() => setOpenId(open ? null : p.id)}>
                      {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      <User className="w-4 h-4 text-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{p.client_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                      </div>
                      {status === "submitted" ? (
                        <Badge variant="outline" className={p.admin_unlocked ? "border-success/40 text-success" : "border-warning/40 text-warning"}>
                          {p.admin_unlocked ? "Unlocked" : "Submitted"}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-primary/40 text-primary">Draft</Badge>
                      )}
                      <span className="text-xs text-muted-foreground hidden sm:inline">Updated {new Date(p.updated_at).toLocaleDateString()}</span>
                    </button>
                    {open && <div className="p-3 border-t border-border/60"><PlanDetail plan={p} onChanged={load} /></div>}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
