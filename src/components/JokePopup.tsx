import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Laugh, X, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const HIDDEN_PREFIXES = ["/admin", "/dj-queue", "/event-day", "/request/", "/auth", "/reset-password"];
const CYCLE_MS = 90_000; // fetch a fresh joke every 90s
const VISIBLE_MS = 22_000; // keep on screen for 22s
const INITIAL_DELAY_MS = 12_000; // don't blast the user on first load

export function JokePopup() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [joke, setJoke] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [muted, setMuted] = useState<boolean>(() => sessionStorage.getItem("joke_popup_muted") === "1");
  const timers = useRef<number[]>([]);

  const hidden = HIDDEN_PREFIXES.some((p) => pathname.startsWith(p));

  const fetchJoke = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("random-joke", { body: {} });
      if (error) return;
      const j = (data as any)?.joke as string | undefined;
      if (j && j.length > 4) {
        setJoke(j);
        setVisible(true);
        const t = window.setTimeout(() => setVisible(false), VISIBLE_MS);
        timers.current.push(t);
      }
    } catch { /* silent */ }
  };

  useEffect(() => {
    if (muted || hidden) return;
    const first = window.setTimeout(() => { void fetchJoke(); }, INITIAL_DELAY_MS);
    const iv = window.setInterval(() => { void fetchJoke(); }, CYCLE_MS);
    timers.current.push(first, iv);
    return () => {
      timers.current.forEach((t) => { clearTimeout(t); clearInterval(t); });
      timers.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [muted, hidden]);

  if (muted || hidden || !visible || !joke) return null;

  const openAi = () => {
    setVisible(false);
    navigate("/client?section=ai#humor");
  };

  const dismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setVisible(false);
  };

  const muteForSession = (e: React.MouseEvent) => {
    e.stopPropagation();
    sessionStorage.setItem("joke_popup_muted", "1");
    setMuted(true);
  };

  return (
    <div
      onClick={openAi}
      role="button"
      tabIndex={0}
      className="fixed left-2 right-2 sm:left-4 sm:right-auto top-20 z-40 sm:max-w-xs mx-auto sm:mx-0 animate-in slide-in-from-top-4 fade-in duration-500 cursor-pointer"
    >
      <div className="rounded-xl border border-primary/40 bg-gradient-to-br from-background/95 to-primary/10 backdrop-blur-md shadow-2xl p-3 hover:border-primary/70 transition group">
        <div className="flex items-start gap-2">
          <div className="p-1.5 rounded-md bg-primary/20 text-primary shrink-0">
            <Laugh className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-primary/80 mb-0.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Joke of the moment
            </p>
            <p className="text-xs text-foreground leading-snug">{joke}</p>
            <p className="text-[10px] text-primary mt-1.5 opacity-80 group-hover:opacity-100">
              Tap → craft a speech or icebreaker with AI →
            </p>
          </div>
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            className="p-1 text-muted-foreground hover:text-foreground shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <button
          onClick={muteForSession}
          className="text-[9px] text-muted-foreground/70 hover:text-muted-foreground mt-1 ml-8"
        >
          Mute jokes for this session
        </button>
      </div>
    </div>
  );
}

export default JokePopup;
