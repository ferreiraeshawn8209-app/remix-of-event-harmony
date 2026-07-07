import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Star, ExternalLink, MessageSquare, Loader2 } from "lucide-react";
import { useTestimonials } from "@/hooks/useTestimonials";
import { submitClientReview } from "@/hooks/useClientReviews";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { REVIEW_LINKS } from "@/lib/reviewPlatforms";

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          className={`text-xl transition ${n <= value ? "text-yellow-400" : "text-muted-foreground/30"} ${onChange ? "hover:text-yellow-300 cursor-pointer" : "cursor-default"}`}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export function TestimonialsSection({ quoteId }: { quoteId?: string }) {
  const { testimonials, isLoading } = useTestimonials(true);
  const { profile, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    rating: 5,
    name: "",
    email: "",
    message: "",
  });

  const handleOpen = () => {
    setForm({
      rating: 5,
      name: profile?.full_name || "",
      email: profile?.email || user?.email || "",
      message: "",
    });
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.message.trim()) {
      toast({ title: "Please write a review message", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await submitClientReview({
        eventId: quoteId || null,
        rating: form.rating,
        guestName: form.name.trim() || undefined,
        guestEmail: form.email.trim() || undefined,
        message: form.message.trim(),
      });
      toast({
        title: "Review submitted! 🙏",
        description: "Thank you for your feedback — it means the world to us.",
      });
      setOpen(false);
    } catch (e: any) {
      toast({ title: "Could not submit review", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <section className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Star className="w-4 h-4 text-primary fill-primary" /> Testimonials &amp; Reviews
          </h2>
          <Button variant="outline" size="sm" onClick={handleOpen}>
            <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Leave a Review
          </Button>
        </div>

        {/* External review platforms */}
        <div className="grid grid-cols-3 gap-2">
          {REVIEW_LINKS.map((r) => (
            <a
              key={r.label}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition ${r.color}`}
            >
              <span className="text-2xl">{r.emoji}</span>
              <span className={`text-xs font-semibold ${r.textColor}`}>{r.label}</span>
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                Review us <ExternalLink className="w-2.5 h-2.5" />
              </span>
            </a>
          ))}
        </div>

        {/* In-app testimonials */}
        {!isLoading && testimonials.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-3">
            {testimonials.map((t) => (
              <Card key={t.id} variant="glass" className="border-primary/10">
                <CardContent className="py-4 space-y-2">
                  <div className="flex items-start gap-3">
                    {t.photo_url ? (
                      <img src={t.photo_url} alt={t.client_name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-sm font-bold text-primary">
                        {t.client_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{t.client_name}</p>
                      <div className="flex items-center gap-2">
                        <StarRating value={t.rating} />
                        {t.event_type && (
                          <Badge variant="outline" className="text-[10px]">{t.event_type}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed italic">"{t.message}"</p>
                  {(t.source_platform || t.source_url) && (
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      {t.source_platform && (
                        <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                          {t.source_platform}
                        </Badge>
                      )}
                      {t.source_url && (
                        <a
                          href={t.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          View original <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && testimonials.length === 0 && (
          <Card variant="glass" className="border-primary/10">
            <CardContent className="py-6 text-center">
              <p className="text-xs text-muted-foreground">
                Be the first to share your BeatKulture experience — your review helps future clients!
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Review dialog */}
      <Dialog open={open} onOpenChange={(o) => !o && setOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Your Experience</DialogTitle>
            <CardDescription className="text-xs mt-1">
              You can also drop us a review on{" "}
              {REVIEW_LINKS.map((r, i) => (
                <span key={r.label}>
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="underline text-primary">{r.label}</a>
                  {i < REVIEW_LINKS.length - 1 ? ", " : ""}
                </span>
              ))}.
            </CardDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Rating</Label>
              <StarRating value={form.rating} onChange={(v) => setForm((p) => ({ ...p, rating: v }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Your name</Label>
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Full name" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Email (optional)</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="email@example.com" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Your review</Label>
              <Textarea
                rows={3}
                value={form.message}
                onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                placeholder="Tell us about your event experience with BeatKulture…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="hero" onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Submit Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
