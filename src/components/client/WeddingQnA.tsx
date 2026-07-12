import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, Loader2, Send, Sparkles, MessageSquare, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

/**
 * WeddingQnA
 * ────────────────────────────────────────────────────────────
 * A wedding & event Q&A page. Pre-populated common questions,
 * plus a free-text box where clients ask DJ (the AI) anything.
 * Powered by the `ask-wedding-ai` edge function.
 */

const COMMON_QUESTIONS: { icon: string; category: string; q: string }[] = [
  { icon: "⏰", category: "Timing", q: "How long does a typical wedding reception last?" },
  { icon: "💰", category: "Budget", q: "What's a realistic wedding budget in South Africa in 2026?" },
  { icon: "📅", category: "Planning", q: "How far in advance should I book my DJ and venue?" },
  { icon: "🎵", category: "Music", q: "How should I plan the music for ceremony, reception, and dance floor?" },
  { icon: "🥂", category: "Order", q: "What's the ideal running order for a wedding day?" },
  { icon: "🎤", category: "Speeches", q: "How long should speeches be and who should give them?" },
  { icon: "🍽️", category: "Catering", q: "How do I decide between plated dinner vs buffet vs food stations?" },
  { icon: "💃", category: "Dance floor", q: "How do I keep guests on the dance floor all night?" },
  { icon: "🌦️", category: "Weather", q: "Outdoor wedding — what's my backup plan for rain?" },
  { icon: "👰", category: "First dance", q: "How do I pick the perfect first-dance song?" },
  { icon: "📸", category: "Photos", q: "How much time should I schedule for wedding photos?" },
  { icon: "🎁", category: "Etiquette", q: "Do I have to invite plus-ones and children?" },
];

export function WeddingQnA() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{ q: string; a: string }[]>([]);

  const ask = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ask-wedding-ai", {
        body: { question: q.trim(), event_type: "wedding" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(typeof data.error === "string" ? data.error : "AI unavailable");
      setHistory((h) => [{ q: q.trim(), a: data.answer || "No answer" }, ...h]);
      setQuestion("");
    } catch (e: any) {
      toast({
        title: "DJ couldn't answer",
        description: e.message || "Please try again in a moment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-cyan-950/40 via-fuchsia-950/30 to-purple-950/40 p-4 sm:p-5 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <span className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-gradient-to-br from-cyan-400 via-fuchsia-500 to-purple-600 text-white shadow-[0_0_18px_hsl(280_95%_60%/0.55)]">
            <MessageSquare className="w-5 h-5" />
          </span>
          <div>
            <h3 className="font-display text-lg sm:text-xl font-bold">
              Ask DJ — <span className="gradient-text">Wedding & Event Q&A</span>
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Common questions people ask when planning a wedding, corporate event or party — plus a free
              text box to ask DJ anything about your own event.
            </p>
          </div>
        </div>
      </div>

      {/* Ask box */}
      <div className="rounded-xl border border-border/50 bg-card/50 p-3 space-y-2">
        <Textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask DJ anything — 'How do I plan a small backyard wedding?', 'What if my venue has no PA system?'…"
          rows={3}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              void ask(question);
            }
          }}
        />
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">Tip: press ⌘/Ctrl + Enter to send</span>
          <Button size="sm" onClick={() => ask(question)} disabled={loading || question.trim().length < 3}>
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Send className="w-3.5 h-3.5 mr-1" />}
            Ask DJ
          </Button>
        </div>
      </div>

      {/* Answers */}
      <AnimatePresence>
        {history.length > 0 && (
          <div className="space-y-3">
            {history.map((h, i) => (
              <motion.article
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-primary/20 bg-background/50 p-4 space-y-2"
              >
                <div className="flex items-start gap-2">
                  <span className="text-xs font-bold text-primary uppercase tracking-widest">You asked</span>
                </div>
                <p className="text-sm text-foreground/90 italic">"{h.q}"</p>
                <div className="pt-2 border-t border-border/40">
                  <div className="flex items-center gap-1 mb-1">
                    <Sparkles className="w-3 h-3 text-primary" />
                    <span className="text-xs font-bold text-primary uppercase tracking-widest">DJ answers</span>
                  </div>
                  <div className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed">
                    <ReactMarkdown>{h.a}</ReactMarkdown>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Common Q's */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-primary" /> Most-asked questions
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {COMMON_QUESTIONS.map((c) => (
            <button
              key={c.q}
              onClick={() => ask(c.q)}
              disabled={loading}
              className="group text-left rounded-lg border border-border/50 bg-card/40 hover:border-primary/50 hover:bg-primary/5 p-3 transition disabled:opacity-50"
            >
              <div className="flex items-start gap-2">
                <span className="text-lg leading-none">{c.icon}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] uppercase tracking-widest text-primary">{c.category}</span>
                  <p className="text-xs sm:text-sm text-foreground/90 leading-snug mt-0.5">{c.q}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition" />
              </div>
            </button>
          ))}
        </div>
      </div>

      <p className="text-[10px] text-center text-muted-foreground italic">
        Answers are AI-generated for guidance. Prices, dates and vendor availability are always confirmed by our team.
      </p>
    </div>
  );
}

export default WeddingQnA;
