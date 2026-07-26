import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, Sparkles, Loader2, Download, Camera } from "lucide-react";
import { CinematicAmbient } from "@/components/CinematicAmbient";

const STYLE_PRESETS = [
  "Classic A-line lace ball gown with cathedral train",
  "Modern mermaid silhouette in silk crepe, deep V neckline",
  "Bohemian off-shoulder chiffon with floral appliqués",
  "Ballgown princess dress with beaded bodice and tulle skirt",
  "Sleek satin sheath, low back, minimalist elegance",
  "Traditional African wedding attire with beaded details in ivory & gold",
  "Vintage 1920s art-deco flapper wedding dress",
  "Two-piece crop top + high-waist tulle skirt",
];

function fileToBase64(file: File): Promise<{ data: string; mime: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ data: String(reader.result), mime: file.type || "image/png" });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function WeddingDressFitter() {
  const [photo, setPhoto] = useState<{ data: string; mime: string; preview: string } | null>(null);
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<"fit" | "design">("fit");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const onPick = async (f: File | null) => {
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) {
      toast({ title: "Photo too large", description: "Please choose an image under 8MB.", variant: "destructive" });
      return;
    }
    const { data, mime } = await fileToBase64(f);
    setPhoto({ data, mime, preview: data });
    setResult(null);
  };

  const generate = async () => {
    if (!photo) return toast({ title: "Upload a photo first", variant: "destructive" });
    if (!prompt.trim()) return toast({ title: "Describe a dress style", variant: "destructive" });
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("wedding-dress-fitter", {
        body: { image_base64: photo.data, mime_type: photo.mime, style_prompt: prompt, mode },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      const b64 = (data as any).image_base64;
      setResult(`data:image/png;base64,${b64}`);
      toast({ title: "Your look is ready!", description: "Save it or try another style." });
    } catch (e: any) {
      toast({ title: "Fitting failed", description: e.message || "Please try again", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    if (!result) return;
    const a = document.createElement("a");
    a.href = result;
    a.download = `beatkulture-dress-fitting-${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="cinematic-shell min-h-screen">
      <CinematicAmbient intensity="soft" />
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/70 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/client"><ArrowLeft className="w-4 h-4 mr-2" />Back to dashboard</Link>
          </Button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-display gradient-text font-bold">AI Wedding Dress Studio</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="border-primary/40 text-primary">Powered by AI</Badge>
          <h1 className="font-display text-3xl md:text-4xl font-bold gradient-text">Try on & Design Your Dress</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Upload a full-body photo of yourself and let our AI stylist show you what different wedding dress
            styles look like — or design a completely bespoke gown from your description.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Camera className="w-5 h-5 text-primary" />Your photo</CardTitle>
              <CardDescription>Best results: full-body shot, plain background, arms visible, good lighting.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => onPick(e.target.files?.[0] || null)} />
              {photo ? (
                <img src={photo.preview} alt="You" className="w-full rounded-lg border border-border/50 max-h-[420px] object-contain bg-black/20" />
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full aspect-[3/4] rounded-lg border-2 border-dashed border-border/50 hover:border-primary/60 hover:bg-primary/5 transition-colors flex flex-col items-center justify-center text-muted-foreground gap-2"
                >
                  <Upload className="w-8 h-8" />
                  <span className="text-sm">Tap to upload your photo</span>
                </button>
              )}
              <Button variant="outline" onClick={() => fileRef.current?.click()} className="w-full">
                <Upload className="w-4 h-4 mr-2" />{photo ? "Choose a different photo" : "Upload photo"}
              </Button>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" />Dress style</CardTitle>
              <CardDescription>Describe the dress, or pick a preset to get started.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="fit">Try on a style</TabsTrigger>
                  <TabsTrigger value="design">Design new</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="space-y-2">
                <Label>Describe your dream dress</Label>
                <Textarea
                  rows={4}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. Ivory lace mermaid gown with long sleeves, sweetheart neckline, chapel train..."
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Quick presets</Label>
                <div className="flex flex-wrap gap-1.5">
                  {STYLE_PRESETS.map((p) => (
                    <button key={p} onClick={() => setPrompt(p)}
                      className="text-xs px-2.5 py-1 rounded-full border border-border/50 hover:border-primary/60 hover:bg-primary/10 transition-colors text-left">
                      {p.split(",")[0]}
                    </button>
                  ))}
                </div>
              </div>

              <Button variant="hero" onClick={generate} disabled={loading || !photo} className="w-full">
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Styling you...</> : <><Sparkles className="w-4 h-4 mr-2" />Generate my look</>}
              </Button>
            </CardContent>
          </Card>
        </div>

        {(loading || result) && (
          <Card variant="glow">
            <CardHeader>
              <CardTitle>Your look</CardTitle>
              <CardDescription>AI-generated preview — not a real photograph.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading && (
                <div className="aspect-[3/4] max-w-md mx-auto rounded-lg bg-muted/30 flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
                    <p className="text-sm text-muted-foreground">Styling your dress — ~20 seconds</p>
                  </div>
                </div>
              )}
              {result && !loading && (
                <>
                  <img src={result} alt="Your generated look" className="max-w-md mx-auto rounded-lg border border-primary/30 shadow-[0_0_40px_hsl(280_95%_60%/0.4)]" />
                  <div className="flex justify-center gap-2">
                    <Button variant="outline" onClick={download}><Download className="w-4 h-4 mr-2" />Save image</Button>
                    <Button variant="hero" onClick={generate}><Sparkles className="w-4 h-4 mr-2" />Try another</Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
