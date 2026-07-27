import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Lightbulb, Heart, Plus, Loader2, Upload, Trash2, X } from "lucide-react";
import { motion } from "framer-motion";

interface Idea {
  id: string;
  user_id: string;
  author_name: string | null;
  title: string;
  description: string | null;
  image_url: string | null;
  category: string | null;
  likes: number;
  created_at: string;
}

const CATEGORIES = ["Décor", "Cake", "Dress", "Venue", "Theme", "Colors", "Ceremony", "Music", "Other"];

export function WeddingIdeasBoard() {
  const { user, profile } = useAuth();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Décor");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<string>("All");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("wedding_ideas" as any).select("*")
      .eq("is_published", true).order("created_at", { ascending: false }).limit(100);
    setIdeas(((data as unknown) as Idea[]) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!user) return toast({ title: "Please sign in", variant: "destructive" });
    if (!title.trim()) return toast({ title: "Title required", variant: "destructive" });
    setSaving(true);
    try {
      let image_url: string | null = null;
      if (file) {
        const path = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]+/g, "_")}`;
        const { error: upErr } = await supabase.storage.from("wedding-ideas").upload(path, file, { upsert: false, contentType: file.type });
        if (upErr) throw upErr;
        image_url = supabase.storage.from("wedding-ideas").getPublicUrl(path).data.publicUrl;
      }
      const { error } = await supabase.from("wedding_ideas" as any).insert({
        user_id: user.id, author_name: profile?.full_name || null,
        title, description, category, image_url,
      } as any);
      if (error) throw error;
      setTitle(""); setDescription(""); setFile(null); setShowForm(false);
      toast({ title: "Idea shared", description: "Other couples can now see your inspiration." });
      load();
    } catch (e: any) {
      toast({ title: "Couldn't share idea", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const like = async (idea: Idea) => {
    await supabase.from("wedding_ideas" as any).update({ likes: (idea.likes || 0) + 1 } as any).eq("id", idea.id);
    setIdeas((prev) => prev.map((i) => i.id === idea.id ? { ...i, likes: i.likes + 1 } : i));
  };

  const remove = async (idea: Idea) => {
    if (!confirm("Delete your idea?")) return;
    await supabase.from("wedding_ideas" as any).delete().eq("id", idea.id);
    setIdeas((prev) => prev.filter((i) => i.id !== idea.id));
  };

  const filtered = filter === "All" ? ideas : ideas.filter((i) => i.category === filter);

  return (
    <Card variant="glass">
      <CardHeader>
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2"><Lightbulb className="w-5 h-5 text-warning" /> Community Wedding Ideas</CardTitle>
            <CardDescription>Share your inspiration — décor, cakes, dresses, themes. Others can borrow ideas they love.</CardDescription>
          </div>
          <Button size="sm" variant="hero" onClick={() => setShowForm((s) => !s)}>
            {showForm ? <><X className="w-4 h-4 mr-1" />Close</> : <><Plus className="w-4 h-4 mr-1" />Share idea</>}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && user && (
          <div className="space-y-2 p-3 rounded-lg border border-primary/30 bg-primary/5">
            <div className="grid sm:grid-cols-2 gap-2">
              <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Gold & blush palette" /></div>
              <div>
                <Label>Category</Label>
                <select className="w-full h-10 px-3 rounded-md bg-background border border-input text-sm" value={category} onChange={(e) => setCategory(e.target.value)}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div><Label>Describe your idea</Label><Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Colors, vendors, tips…" /></div>
            <div>
              <Label className="flex items-center gap-1"><Upload className="w-3.5 h-3.5" />Photo (optional)</Label>
              <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </div>
            <Button onClick={submit} disabled={saving} className="w-full">
              {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}Share with community
            </Button>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5">
          {["All", ...CATEGORIES].map((c) => (
            <Badge key={c} variant={filter === c ? "default" : "outline"} className="cursor-pointer" onClick={() => setFilter(c)}>{c}</Badge>
          ))}
        </div>

        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin mx-auto my-6 text-primary" />
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No ideas yet. Be the first to share!</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((idea) => (
              <motion.div key={idea.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <Card variant="glass" className="overflow-hidden h-full flex flex-col">
                  {idea.image_url && (
                    <img src={idea.image_url} alt={idea.title} className="w-full aspect-video object-cover" />
                  )}
                  <CardContent className="p-3 flex-1 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{idea.title}</p>
                        {idea.category && <Badge variant="outline" className="text-[10px] mt-1">{idea.category}</Badge>}
                      </div>
                      {user?.id === idea.user_id && (
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => remove(idea)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                    {idea.description && <p className="text-xs text-muted-foreground line-clamp-3">{idea.description}</p>}
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <span className="text-[10px] text-muted-foreground">{idea.author_name || "Anonymous"}</span>
                      <Button size="sm" variant="ghost" className="h-7 gap-1 text-pink-400" onClick={() => like(idea)}>
                        <Heart className="w-3.5 h-3.5 fill-current" /> {idea.likes}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
