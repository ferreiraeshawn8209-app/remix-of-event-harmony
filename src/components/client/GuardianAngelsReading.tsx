import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Sparkles, Loader2, RefreshCw, Feather } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/**
 * GuardianAngelsReading
 * ────────────────────────────────────────────────────────────
 * A romantic AI-powered "Guardian Angels" reading for couples.
 * NOT fortune telling — always optimistic, always uplifting.
 * Never predicts an end to the relationship.
 */

type Reading = {
  soulmate_score: number;
  headline: string;
  reading: string;
  affirmations: string[];
  tiny_tip: string;
  guardian_message: string;
};

const QUESTIONS: { key: string; q: string; placeholder: string }[] = [
  { key: "met", q: "How did you two first meet?", placeholder: "At a coffee shop, through friends, online…" },
  { key: "quirk", q: "One quirk of theirs you secretly love?", placeholder: "The way they sing off-key in the car…" },
  { key: "value", q: "One value you both share deeply?", placeholder: "Family, adventure, kindness, faith…" },
  { key: "song", q: "A song that already means 'us' to you both?", placeholder: "Artist — Title" },
  { key: "dream", q: "One dream you want to build together?", placeholder: "A little farm, travel the world, raise kids…" },
  { key: "little", q: "The smallest thing they do that makes your day?", placeholder: "Morning coffee, that one look, silly texts…" },
];

export function GuardianAngelsReading() {
  const [open, setOpen] = useState(false);
  const [partnerA, setPartnerA] = useState("");
  const [partnerB, setPartnerB] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [reading, setReading] = useState<Reading | null>(null);

  const canSubmit =
    partnerA.trim().length > 0 &&
    partnerB.trim().length > 0 &&
    Object.values(answers).filter((v) => v.trim().length > 0).length >= 3;

  const submit = async () => {
    if (!canSubmit) {
      toast({ title: "Fill in your names and at least 3 answers", variant: "destructive" });
      return;
    }
    setLoading(true);
    setReading(null);
    try {
      const payload = {
        partner_a_name: partnerA.trim(),
        partner_b_name: partnerB.trim(),
        event_type: "wedding",
        answers: QUESTIONS
          .filter((q) => (answers[q.key] || "").trim().length > 0)
          .map((q) => ({ question: q.q, answer: answers[q.key].trim() })),
      };
      const { data, error } = await supabase.functions.invoke("guardian-angels-reading", { body: payload });
      if (error) throw error;
      if (data?.error) throw new Error(typeof data.error === "string" ? data.error : "Reading unavailable");
      setReading(data.reading as Reading);
    } catch (e: any) {
      toast({ title: "Angels are quiet right now", description: e.message || "Try again shortly", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setReading(null);
    setAnswers({});
  };

  return (
    <section className="relative overflow-hidden rounded-2xl border border-pink-500/40 bg-gradient-to-br from-rose-950/50 via-pink-950/40 to-purple-950/40 p-4 sm:p-5 backdrop-blur-sm shadow-[0_0_35px_hsl(330_90%_60%/0.3)]">
      <div className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full bg-pink-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-rose-500/20 blur-3xl" />

      <div className="relative">
        <header className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-lg sm:text-xl font-bold flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-400 animate-pulse" fill="currentColor" />
              <span className="bg-gradient-to-r from-pink-300 via-rose-300 to-amber-200 bg-clip-text text-transparent">
                Guardian Angels Love Reading
              </span>
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-prose">
              A gentle, romantic reading whispered by your guardian angels. Answer a few questions about your love story
              and receive a keepsake reading — for weddings, engagements, or just because.
            </p>
          </div>
          {!open && (
            <Button
              size="sm"
              onClick={() => setOpen(true)}
              className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white shadow-[0_0_18px_hsl(330_90%_60%/0.6)] whitespace-nowrap"
            >
              <Feather className="w-3.5 h-3.5 mr-1" /> Begin
            </Button>
          )}
        </header>

        <AnimatePresence>
          {open && !reading && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Your name</Label>
                  <Input value={partnerA} onChange={(e) => setPartnerA(e.target.value)} placeholder="e.g. Sarah" className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Partner's name</Label>
                  <Input value={partnerB} onChange={(e) => setPartnerB(e.target.value)} placeholder="e.g. Michael" className="mt-1" />
                </div>
              </div>

              <div className="space-y-2">
                {QUESTIONS.map((q) => (
                  <div key={q.key}>
                    <Label className="text-xs text-muted-foreground">{q.q}</Label>
                    <Input
                      value={answers[q.key] || ""}
                      onChange={(e) => setAnswers((a) => ({ ...a, [q.key]: e.target.value }))}
                      placeholder={q.placeholder}
                      className="mt-1"
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <p className="text-[10px] text-muted-foreground italic">
                  For entertainment & love — always optimistic, never a prediction.
                </p>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button
                    size="sm"
                    disabled={!canSubmit || loading}
                    onClick={submit}
                    className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white"
                  >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Sparkles className="w-3.5 h-3.5 mr-1" />}
                    Receive our reading
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {reading && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 space-y-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-pink-500/40 blur-xl animate-pulse" />
                    <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-pink-400 via-rose-500 to-amber-400 flex items-center justify-center text-white font-display font-bold text-lg shadow-[0_0_25px_hsl(330_90%_60%/0.7)]">
                      {reading.soulmate_score}%
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-pink-300">Soulmate reading</p>
                    <p className="font-semibold text-sm leading-tight">{reading.headline}</p>
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={reset}>
                  <RefreshCw className="w-3.5 h-3.5 mr-1" /> New
                </Button>
              </div>

              <p className="text-sm leading-relaxed text-foreground/90 bg-background/30 rounded-lg p-3 border border-pink-500/20">
                {reading.reading}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {reading.affirmations.slice(0, 3).map((a, i) => (
                  <div key={i} className="text-xs text-center px-3 py-2 rounded-lg bg-pink-500/10 border border-pink-500/30 text-pink-100">
                    ✨ {a}
                  </div>
                ))}
              </div>

              <div className="text-xs italic text-amber-200/90 bg-amber-500/5 border-l-2 border-amber-400/60 pl-3 py-2 rounded-r">
                <span className="not-italic font-semibold text-amber-200">Guardian whisper:</span> {reading.guardian_message}
              </div>

              <div className="text-xs text-muted-foreground bg-background/30 rounded-lg p-2 border border-border/40">
                <span className="text-primary font-semibold">💌 Tiny tip: </span>{reading.tiny_tip}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

export default GuardianAngelsReading;
