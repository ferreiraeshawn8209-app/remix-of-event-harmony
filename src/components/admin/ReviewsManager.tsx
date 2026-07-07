import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Star, Trash2, Share2, MessageCircle } from "lucide-react";
import { useClientReviews } from "@/hooks/useClientReviews";

const ADMIN_WHATSAPP = "27655285528";

export function ReviewsManager() {
  const { reviews, isLoading, update, remove } = useClientReviews();

  const share = (text: string) => {
    const url = `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><MessageCircle className="w-5 h-5 text-primary" /> Guest Reviews</CardTitle>
        <CardDescription>4★ and 5★ reviews unlock the song-request page for that guest. Track which you've posted publicly.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!isLoading && reviews.length === 0 && <p className="text-sm text-muted-foreground">No reviews yet.</p>}
        {reviews.map((r) => (
          <div key={r.id} className="p-3 rounded-lg bg-muted/30 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">{r.guest_name || "Anonymous guest"}</span>
              <span className="flex">
                {Array.from({ length: r.rating }).map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-warning text-warning" />
                ))}
              </span>
              <Badge variant={r.rating >= 4 ? "default" : "secondary"}>{r.rating >= 4 ? "Unlocks songs" : "Below gate"}</Badge>
              <span className="text-xs text-muted-foreground ml-auto">
                {new Date(r.created_at).toLocaleString("en-ZA")}
              </span>
            </div>
            {r.message && <p className="text-sm text-muted-foreground">"{r.message}"</p>}
            <div className="flex items-center gap-4 flex-wrap text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={r.posted_to_facebook} onCheckedChange={(v) => update(r.id, { posted_to_facebook: !!v })} />
                Posted to Facebook
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={r.posted_to_bark} onCheckedChange={(v) => update(r.id, { posted_to_bark: !!v })} />
                Posted to Bark.com
              </label>
              <Button size="sm" variant="ghost" onClick={() => share(`⭐ ${r.rating}/5 from ${r.guest_name || "a guest"}:\n"${r.message || ""}"`)}>
                <Share2 className="w-4 h-4 mr-1" /> WhatsApp
              </Button>
              <Button size="sm" variant="ghost" className="text-destructive ml-auto" onClick={() => remove(r.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
