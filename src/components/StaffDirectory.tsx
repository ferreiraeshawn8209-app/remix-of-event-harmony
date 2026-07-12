import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Mail, CalendarHeart, Sparkles, Users, Loader2 } from "lucide-react";
import { useStaff, buildWhatsAppLink, type StaffMember } from "@/hooks/useStaff";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Props {
  category?: string;
  title?: string;
  subtitle?: string;
  compact?: boolean;
}

export function StaffDirectory({ category, title, subtitle, compact }: Props) {
  const { staff, loading } = useStaff({ activeOnly: true, category });
  const [booking, setBooking] = useState<StaffMember | null>(null);

  const grouped = category ? { [category]: staff } : staff.reduce((acc, m) => {
    const key = m.category || "team";
    (acc[key] = acc[key] || []).push(m);
    return acc;
  }, {} as Record<string, StaffMember[]>);

  return (
    <div className="space-y-6">
      {(title || subtitle) && (
        <div className="text-center space-y-1.5">
          {title && <h2 className="text-2xl sm:text-3xl font-bold gradient-text">{title}</h2>}
          {subtitle && <p className="text-sm text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : staff.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground">
          <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
          Staff profiles coming soon.
        </div>
      ) : (
        Object.entries(grouped).map(([cat, members]) => (
          <div key={cat} className="space-y-3">
            {!category && (
              <h3 className="text-lg font-semibold capitalize gradient-text-secondary flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-secondary" /> {cat === "dj" ? "DJs" : cat}
              </h3>
            )}
            <div className={`grid gap-4 ${compact ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}>
              {members.map((m, i) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-background/95 to-primary/5 hover:shadow-[0_0_32px_hsl(280_95%_60%/0.4)] transition-all group h-full">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardContent className="relative p-4 space-y-3">
                      <div className="relative">
                        <div className="aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20 ring-2 ring-primary/30 shadow-[0_0_24px_hsl(40_96%_58%/0.35)]">
                          {m.photo_url ? (
                            <img src={m.photo_url} alt={m.name} className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-primary/40">
                              {m.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        {m.is_bookable && (
                          <Badge className="absolute top-2 right-2 bg-gradient-to-r from-primary to-accent text-primary-foreground border-0 shadow-lg">
                            Bookable
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-bold text-base leading-tight">{m.name}</h4>
                        <p className="text-xs text-primary font-semibold">{m.role}</p>
                        {m.years_experience ? (
                          <p className="text-[10px] text-muted-foreground">{m.years_experience}+ years experience</p>
                        ) : null}
                      </div>

                      {m.bio && (
                        <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">{m.bio}</p>
                      )}

                      {m.specialties && m.specialties.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {m.specialties.slice(0, 3).map((s) => (
                            <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/20 text-secondary border border-secondary/30">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-col gap-1.5 pt-1">
                        {m.whatsapp_number && (
                          <Button
                            asChild
                            size="sm"
                            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 shadow-[0_0_16px_rgba(16,185,129,0.4)] text-white"
                          >
                            <a
                              href={buildWhatsAppLink(m.whatsapp_number, `Hi ${m.name}, I'd like to chat about booking BeatKulture for my event.`)!}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <MessageCircle className="w-3.5 h-3.5 mr-1.5" /> WhatsApp {m.name.split(" ")[0]}
                            </a>
                          </Button>
                        )}
                        {m.is_bookable && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full border-primary/50 hover:bg-primary/10 hover:shadow-[0_0_16px_hsl(40_96%_58%/0.4)]"
                            onClick={() => setBooking(m)}
                          >
                            <CalendarHeart className="w-3.5 h-3.5 mr-1.5" /> Request this DJ
                          </Button>
                        )}
                        {m.email && !m.whatsapp_number && (
                          <Button asChild size="sm" variant="ghost" className="w-full">
                            <a href={`mailto:${m.email}`}><Mail className="w-3.5 h-3.5 mr-1.5" /> Email</a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        ))
      )}

      <BookingDialog staff={booking} onClose={() => setBooking(null)} />
    </div>
  );
}

function BookingDialog({ staff, onClose }: { staff: StaffMember | null; onClose: () => void }) {
  const [form, setForm] = useState({ client_name: "", client_email: "", client_phone: "", event_date: "", message: "" });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!staff) return;
    if (!form.client_name || !form.client_email) {
      toast({ title: "Name and email required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await (supabase as any).from("dj_booking_requests").insert({
      staff_id: staff.id,
      client_name: form.client_name,
      client_email: form.client_email,
      client_phone: form.client_phone || null,
      event_date: form.event_date || null,
      message: form.message || null,
    });
    setSaving(false);
    if (error) return toast({ title: "Request failed", description: error.message, variant: "destructive" });
    toast({ title: "Request sent!", description: `We'll get back to you about booking ${staff.name}.` });
    setForm({ client_name: "", client_email: "", client_phone: "", event_date: "", message: "" });
    onClose();
  };

  return (
    <Dialog open={!!staff} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="gradient-text">Request {staff?.name}</DialogTitle>
          <DialogDescription>Tell us about your event and we'll check availability.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div><Label>Your name *</Label><Input value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} /></div>
          <div><Label>Email *</Label><Input type="email" value={form.client_email} onChange={(e) => setForm({ ...form, client_email: e.target.value })} /></div>
          <div><Label>Phone</Label><Input value={form.client_phone} onChange={(e) => setForm({ ...form, client_phone: e.target.value })} /></div>
          <div><Label>Event date</Label><Input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} /></div>
          <div><Label>Message</Label><Textarea rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Venue, event type, hours…" /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={saving} className="bg-gradient-to-r from-primary to-secondary">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
