import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Star, Plus, Trash2, MessageSquareQuote, Download, Loader2, ExternalLink } from "lucide-react";
import { useTestimonials, Testimonial } from "@/hooks/useTestimonials";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { REVIEW_LINKS, inferReviewPlatform } from "@/lib/reviewPlatforms";

type ImportedReview = {
  externalId?: string;
  author?: string;
  message?: string;
  rating?: number;
  sourceUrl?: string;
};

export function TestimonialsManager() {
  const { testimonials, create, update, remove, upsertImported } = useTestimonials();
  const [form, setForm] = useState({ client_name: "", event_type: "", rating: 5, message: "", photo_url: "" });
  const [importLink, setImportLink] = useState(REVIEW_LINKS[0].url);
  const [isImporting, setIsImporting] = useState(false);

  const normalizeImportedRows = (reviews: ImportedReview[], platform: string, fallbackUrl: string) =>
    reviews
      .map((review) => {
        const message = String(review.message || "").trim();
        if (!message) return null;

        const rawRating = Number(review.rating || 5);
        const rating = Math.max(1, Math.min(5, Number.isFinite(rawRating) ? Math.round(rawRating) : 5));
        const author = String(review.author || "").trim() || "Verified Client";
        const sourceReviewId = String(review.externalId || "").trim();

        return {
          client_name: author,
          event_type: `${platform.charAt(0).toUpperCase()}${platform.slice(1)} Review`,
          rating,
          message,
          photo_url: null,
          source_platform: platform,
          source_review_id: sourceReviewId || null,
          source_url: String(review.sourceUrl || fallbackUrl).trim() || fallbackUrl,
          sort_order: 0,
          is_live: true,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

  const submit = async () => {
    if (!form.client_name || !form.message) {
      toast({ title: "Name and message required", variant: "destructive" });
      return;
    }
    try {
      await create({
        client_name: form.client_name,
        event_type: form.event_type || null,
        rating: form.rating,
        message: form.message,
        photo_url: form.photo_url || null,
        source_platform: null,
        source_review_id: null,
        source_url: null,
        sort_order: 0,
        is_live: true,
      });
      setForm({ client_name: "", event_type: "", rating: 5, message: "", photo_url: "" });
      toast({ title: "Testimonial added" });
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
  };

  const importFromPlatform = async () => {
    const normalizedLink = importLink.trim();
    if (!normalizedLink) {
      toast({ title: "Paste a platform review link first", variant: "destructive" });
      return;
    }

    const platform = inferReviewPlatform(normalizedLink);
    if (!platform) {
      toast({ title: "Unsupported platform link", description: "Use Bark, Facebook, or Google review links.", variant: "destructive" });
      return;
    }

    setIsImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke("import-platform-reviews", {
        body: { url: normalizedLink, platform },
      });

      if (error) {
        throw new Error(error.message);
      }

      const reviews = Array.isArray(data?.reviews) ? (data.reviews as ImportedReview[]) : [];
      const rows = normalizeImportedRows(reviews, platform, normalizedLink);

      if (rows.length === 0) {
        toast({ title: "No reviews were found to import", variant: "destructive" });
        return;
      }

      await upsertImported(rows);
      toast({ title: "Platform reviews imported", description: `${rows.length} review${rows.length === 1 ? "" : "s"} synced from ${platform}.` });
    } catch (e: any) {
      toast({ title: "Import failed", description: e.message, variant: "destructive" });
    } finally {
      setIsImporting(false);
    }
  };

  const importAllPlatforms = async () => {
    setIsImporting(true);
    try {
      let imported = 0;
      const failed: string[] = [];

      for (const item of REVIEW_LINKS) {
        try {
          const { data, error } = await supabase.functions.invoke("import-platform-reviews", {
            body: { url: item.url, platform: item.platform },
          });

          if (error) throw new Error(error.message);

          const reviews = Array.isArray(data?.reviews) ? (data.reviews as ImportedReview[]) : [];
          const rows = normalizeImportedRows(reviews, item.platform, item.url);
          if (rows.length > 0) {
            await upsertImported(rows);
            imported += rows.length;
          } else {
            failed.push(item.label);
          }
        } catch {
          failed.push(item.label);
        }
      }

      if (imported === 0) {
        toast({
          title: "No platform reviews imported",
          description: failed.length ? `No data found from: ${failed.join(", ")}` : "No public reviews found.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Platform reviews imported",
        description: failed.length
          ? `${imported} review${imported === 1 ? "" : "s"} imported. Could not pull from: ${failed.join(", ")}.`
          : `${imported} review${imported === 1 ? "" : "s"} imported from Bark, Facebook, and Google.`,
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><MessageSquareQuote className="w-5 h-5 text-primary" /> Testimonials</CardTitle>
        <CardDescription>Client reviews shown on the landing page</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 border rounded-lg space-y-3 bg-muted/20">
          <Label>Import existing reviews from a platform link</Label>
          <div className="flex flex-wrap gap-2">
            {REVIEW_LINKS.map((item) => (
              <Button key={item.label} type="button" variant="outline" size="sm" onClick={() => setImportLink(item.url)}>
                {item.label}
              </Button>
            ))}
            <Button type="button" variant="secondary" size="sm" onClick={importAllPlatforms} disabled={isImporting}>
              Import all platforms
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={importLink}
              onChange={(e) => setImportLink(e.target.value)}
              placeholder="Paste Bark/Facebook/Google review page URL"
            />
            <Button type="button" onClick={importFromPlatform} disabled={isImporting}>
              {isImporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Import reviews
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            This downloads public comments from the link and adds them to your live testimonials.
          </p>
        </div>

        <div className="p-4 border border-dashed rounded-lg grid sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Client name</Label>
            <Input value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Event type</Label>
            <Input value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value })} placeholder="Wedding, Corporate..." />
          </div>
          <div className="space-y-1">
            <Label>Rating (1-5)</Label>
            <Input type="number" min={1} max={5} value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} />
          </div>
          <div className="space-y-1">
            <Label>Photo URL (optional)</Label>
            <Input value={form.photo_url} onChange={(e) => setForm({ ...form, photo_url: e.target.value })} />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label>Quote</Label>
            <Textarea rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <Button onClick={submit}><Plus className="w-4 h-4 mr-2" /> Add testimonial</Button>
          </div>
        </div>

        <div className="space-y-3">
          {testimonials.map((t: Testimonial) => (
            <div key={t.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{t.client_name}</span>
                  {t.event_type && <Badge variant="secondary">{t.event_type}</Badge>}
                  {t.source_platform && <Badge variant="outline">{t.source_platform}</Badge>}
                  <span className="flex">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-warning text-warning" />
                    ))}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">"{t.message}"</p>
                {t.source_url && (
                  <a
                    href={t.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-1"
                  >
                    Source <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <Switch checked={t.is_live} onCheckedChange={(v) => update(t.id, { is_live: v })} />
                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => remove(t.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          {testimonials.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-6">No testimonials yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
