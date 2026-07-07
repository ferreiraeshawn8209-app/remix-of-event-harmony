import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Trophy, Loader2, Sparkles, CalendarClock } from "lucide-react";
import { useCompetitions, Competition } from "@/hooks/useCompetitions";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

export function CompetitionsBanner() {
  const { activeCompetitions, enter } = useCompetitions();
  const { user, profile } = useAuth();
  const [open, setOpen] = useState<Competition | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  if (activeCompetitions.length === 0) return null;

  const openDialog = (c: Competition) => {
    setForm({
      name: profile?.full_name || "",
      email: profile?.email || user?.email || "",
      phone: "",
      message: "",
    });
    setOpen(c);
  };

  const submit = async () => {
    if (!user || !open) return;
    if (!form.name.trim() || !form.email.trim()) {
      toast({ title: "Name and email required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await enter({
        competition_id: open.id,
        user_id: user.id,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        message: form.message.trim() || undefined,
      });
      toast({ title: "You're in!", description: "Good luck — we'll be in touch if you win." });
      setOpen(null);
    } catch (e: any) {
      toast({ title: "Could not enter", description: e.message, variant: "destructive" });
    }
    setSubmitting(false);
  };

  return (
    <>
      <section className="space-y-3">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Trophy className="w-4 h-4 text-primary" /> Competitions
        </h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {activeCompetitions.map((c) => (
            <Card key={c.id} variant="glass" className="overflow-hidden border-primary/30">
              {c.image_url && (
                <div className="aspect-[16/9] bg-muted/40 flex items-center justify-center">
                  <img src={c.image_url} alt={c.title} className="w-full h-full object-contain" />
                </div>
              )}
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" /> {c.title}
                  </CardTitle>
                  <Badge className="bg-primary/20 text-primary text-[10px] border-primary/40">Live</Badge>
                </div>
                {c.prize && <CardDescription className="text-xs">Prize: <span className="text-foreground font-medium">{c.prize}</span></CardDescription>}
              </CardHeader>
              <CardContent className="space-y-3">
                {c.description && <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-3">{c.description}</p>}
                {c.ends_at && (
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <CalendarClock className="w-3 h-3" /> Closes {new Date(c.ends_at).toLocaleString("en-ZA")}
                  </p>
                )}
                <Button variant="hero" size="sm" className="w-full" onClick={() => openDialog(c)}>
                  Enter Competition
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter: {open?.title}</DialogTitle>
            <DialogDescription>Fill in your details to enter. One entry per person.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Full name</Label>
              <Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Phone (optional)</Label>
              <Input value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Message (optional)</Label>
              <Textarea rows={2} value={form.message} onChange={(e) => setForm(p => ({ ...p, message: e.target.value }))} placeholder="Tell us about your event..." /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(null)}>Cancel</Button>
            <Button variant="hero" onClick={submit} disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Submit Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
