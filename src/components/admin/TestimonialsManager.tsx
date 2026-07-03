import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Star, Plus, Trash2, MessageSquareQuote } from "lucide-react";
import { useTestimonials, Testimonial } from "@/hooks/useTestimonials";
import { toast } from "@/hooks/use-toast";

export function TestimonialsManager() {
  const { testimonials, create, update, remove } = useTestimonials();
  const [form, setForm] = useState({ client_name: "", event_type: "", rating: 5, message: "", photo_url: "" });

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
        sort_order: 0,
        is_live: true,
      });
      setForm({ client_name: "", event_type: "", rating: 5, message: "", photo_url: "" });
      toast({ title: "Testimonial added" });
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
  };

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><MessageSquareQuote className="w-5 h-5 text-primary" /> Testimonials</CardTitle>
        <CardDescription>Client reviews shown on the landing page</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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
                  <span className="flex">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-warning text-warning" />
                    ))}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">"{t.message}"</p>
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
