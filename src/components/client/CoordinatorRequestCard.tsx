import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Users, Sparkles, Loader2, Send, Camera, DollarSign, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/**
 * CoordinatorRequestCard
 * ────────────────────────────────────────────────────────────
 * Marketing + request card for BeatKulture's wedding &
 * event-coordination service. Sits at the top of the client
 * dashboard under specials.
 *
 * When a client sends a request, we insert an
 * `admin_notifications` row (type = 'coordinator_request') so
 * the admin gets an instant signal to assign a coordinator.
 */

const BUDGET_EXAMPLES = [
  {
    tier: "Budget-friendly",
    price: "R50 000",
    guests: "100 guests",
    tagline: "Yes, a beautiful wedding on a real budget is possible.",
    highlights: ["DJ & basic uplighting", "Coordinated timeline", "Ceremony + reception flow", "Vendor sourcing"],
    color: "from-emerald-500 to-teal-500",
  },
  {
    tier: "Signature",
    price: "R120 000+",
    guests: "up to 150",
    tagline: "The full BeatKulture experience — sound, lights, coordination.",
    highlights: ["Premium DJ + light show", "Full-day coordinator", "MC option", "Photo/video partners"],
    color: "from-fuchsia-500 to-purple-600",
  },
  {
    tier: "Luxury",
    price: "R250 000+",
    guests: "any size",
    tagline: "White-glove coordination end to end.",
    highlights: ["Multi-stage production", "Lead + assistant coordinators", "Guest concierge", "Custom effects"],
    color: "from-amber-400 to-orange-500",
  },
];

export function CoordinatorRequestCard({
  clientName,
  email,
  clientCode,
  quoteId,
}: {
  clientName: string;
  email: string;
  clientCode?: string | null;
  quoteId?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    event_date: "",
    guest_count: "",
    budget_tier: "Signature",
    add_to_dj: true,
    notes: "",
  });

  const submit = async () => {
    setSaving(true);
    try {
      const summary = [
        `👰 ${clientName} needs a wedding/event coordinator`,
        form.event_date && `Date: ${form.event_date}`,
        form.guest_count && `Guests: ${form.guest_count}`,
        `Budget tier: ${form.budget_tier}`,
        form.add_to_dj ? "→ Bundle with DJ booking" : "→ Coordinator only",
        form.notes && `Notes: ${form.notes}`,
      ].filter(Boolean).join(" · ");

      const { error } = await supabase.from("admin_notifications").insert({
        type: "coordinator_request",
        title: "Wedding Coordinator Requested",
        message: summary,
        email,
        client_code: clientCode || null,
        quote_id: quoteId || null,
      });
      if (error) throw error;
      setSent(true);
      toast({ title: "Request sent 💌", description: "A coordinator will reach out shortly." });
    } catch (e: any) {
      toast({ title: "Couldn't send", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="relative overflow-hidden rounded-2xl border border-pink-500/40 bg-gradient-to-br from-rose-950/50 via-fuchsia-950/40 to-amber-950/30 p-4 sm:p-5 backdrop-blur-sm shadow-[0_0_35px_hsl(330_90%_60%/0.3)]">
      <div className="pointer-events-none absolute -top-20 -right-20 w-64 h-64 rounded-full bg-pink-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-amber-500/20 blur-3xl" />

      <div className="relative">
        <header className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Heart className="w-5 h-5 text-pink-400 animate-pulse" fill="currentColor" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-pink-300">Full-Service Coordination</span>
            </div>
            <h3 className="font-display text-lg sm:text-xl font-bold leading-tight">
              Do you need a <span className="bg-gradient-to-r from-pink-300 via-rose-300 to-amber-200 bg-clip-text text-transparent">wedding coordinator?</span>
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-prose">
              BeatKulture offers professional wedding & event coordinators — from a budget wedding for 100 guests
              to a full luxury production. We handle the timeline, the vendors, and the stress so you can enjoy the day.
            </p>
          </div>
          {!open && !sent && (
            <Button
              size="sm"
              onClick={() => setOpen(true)}
              className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white shadow-[0_0_18px_hsl(330_90%_60%/0.6)] whitespace-nowrap"
            >
              <Users className="w-3.5 h-3.5 mr-1" /> I need one
            </Button>
          )}
        </header>

        {/* Budget examples grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4">
          {BUDGET_EXAMPLES.map((b) => (
            <div
              key={b.tier}
              className="relative rounded-xl border border-border/50 bg-background/40 p-3 hover:border-primary/60 transition"
            >
              <div className={`inline-block text-[9px] font-bold uppercase tracking-widest bg-gradient-to-r ${b.color} bg-clip-text text-transparent`}>
                {b.tier}
              </div>
              <p className="font-display text-lg font-bold mt-0.5">
                {b.price}
                <span className="text-xs text-muted-foreground font-normal ml-1">/ {b.guests}</span>
              </p>
              <p className="text-[11px] text-muted-foreground leading-snug mt-1">{b.tagline}</p>
              <ul className="mt-2 space-y-0.5">
                {b.highlights.map((h) => (
                  <li key={h} className="text-[10px] flex items-start gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5 text-primary mt-0.5 flex-shrink-0" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-muted-foreground italic mt-2 flex items-center gap-1">
          <Camera className="w-3 h-3" /> Ask us for real-wedding photo examples from past budget & luxury events.
        </p>

        {/* Request form */}
        <AnimatePresence>
          {open && !sent && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 space-y-3 pt-4 border-t border-pink-500/20"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Event date (approx)</Label>
                  <Input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Estimated guests</Label>
                  <Input type="number" min={1} value={form.guest_count} onChange={(e) => setForm({ ...form, guest_count: e.target.value })} placeholder="e.g. 120" className="mt-1" />
                </div>
              </div>

              <div>
                <Label className="text-xs mb-1 block">Budget tier</Label>
                <div className="flex flex-wrap gap-1.5">
                  {BUDGET_EXAMPLES.map((b) => (
                    <button
                      key={b.tier}
                      onClick={() => setForm({ ...form, budget_tier: b.tier })}
                      className={`text-[11px] px-3 py-1 rounded-full border transition ${
                        form.budget_tier === b.tier
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border/60 text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {b.tier}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.add_to_dj}
                  onChange={(e) => setForm({ ...form, add_to_dj: e.target.checked })}
                  className="rounded"
                />
                <span>Bundle coordinator with my DJ booking</span>
              </label>

              <div>
                <Label className="text-xs">Anything specific? (optional)</Label>
                <Textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Venue name, vendors to source, cultural traditions to honour…"
                  className="mt-1"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
                <Button
                  size="sm"
                  disabled={saving}
                  onClick={submit}
                  className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Send className="w-3.5 h-3.5 mr-1" />}
                  Send request
                </Button>
              </div>
            </motion.div>
          )}

          {sent && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 flex items-start gap-2"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-emerald-200">Coordinator request sent 💌</p>
                <p className="text-xs text-emerald-100/80 mt-0.5">
                  Our admin has been notified and a coordinator will be in touch shortly to plan your event.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

export default CoordinatorRequestCard;
