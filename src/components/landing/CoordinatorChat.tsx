import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface Msg { role: "user" | "assistant"; content: string }

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
const INTRO = "Hey there! 👋 I'm **Kulture**, your AI event coordinator at BeatKulture. I can help you pick the perfect package, build a custom quote, plan your timeline or set up QR song requests for your guests. What kind of event are you planning?";

export function CoordinatorChat() {
  const [messages, setMessages] = useState<Msg[]>([{ role: "assistant", content: INTRO }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, busy]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setError(null);
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages([...next, { role: "assistant", content: "" }]);
    setBusy(true);

    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/chat-coordinator`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${PUBLISHABLE_KEY}` },
        body: JSON.stringify({ messages: next }),
      });
      if (res.status === 429) throw new Error("Too many messages right now — try again in a moment.");
      if (res.status === 402) throw new Error("AI credits exhausted — please contact BeatKulture directly.");
      if (!res.ok || !res.body) throw new Error("Coordinator is offline right now.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split("\n");
        buf = parts.pop() || "";
        for (const line of parts) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data:")) continue;
          const payload = trimmed.slice(5).trim();
          if (payload === "[DONE]") continue;
          try {
            const json = JSON.parse(payload);
            const delta = json?.choices?.[0]?.delta?.content || "";
            if (delta) {
              acc += delta;
              setMessages((m) => {
                const copy = [...m];
                copy[copy.length - 1] = { role: "assistant", content: acc };
                return copy;
              });
            }
          } catch { /* ignore */ }
        }
      }
    } catch (e: any) {
      setError(e?.message || "Something went wrong.");
      setMessages((m) => m.slice(0, -1));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card variant="glow" className="overflow-hidden border-primary/40">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40 bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <div className="font-display font-bold leading-tight">Kulture</div>
          <div className="text-xs text-muted-foreground">AI Event Coordinator · usually replies instantly</div>
        </div>
        <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-success/20 text-success border border-success/30">Online</span>
      </div>
      <CardContent className="p-0">
        <div className="max-h-[320px] overflow-y-auto p-4 space-y-3">
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted/50 text-foreground rounded-bl-sm"
                }`}
              >
                {m.content || (busy && i === messages.length - 1 ? <Loader2 className="w-4 h-4 animate-spin" /> : null)}
              </div>
            </motion.div>
          ))}
          {error && <p className="text-xs text-destructive text-center">{error}</p>}
          <div ref={endRef} />
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); send(); }}
          className="flex items-center gap-2 p-3 border-t border-border/40 bg-background/40"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Kulture anything about your event…"
            disabled={busy}
            autoFocus
          />
          <Button type="submit" size="icon" disabled={busy || !input.trim()}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
