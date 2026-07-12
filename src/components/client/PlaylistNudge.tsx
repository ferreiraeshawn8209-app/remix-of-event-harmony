import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music, Sparkles, X, Loader2, Plus, ListMusic } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface AcceptedQuote {
  id: string;
  event_type?: string | null;
  event_date?: string | null;
}

interface Props {
  acceptedQuote: AcceptedQuote | null;
  playlistProgress?: number; // 0-100, once form is meaningfully filled we hide the pulse
}

interface SongSuggestion {
  title: string;
  artist: string;
  year?: number;
  why?: string;
}

/**
 * Persistent, deliberately attention-grabbing nudge that appears ONLY when the
 * client has an accepted quote and hasn't built their playlist yet. Opens a
 * quick-panel with AI song suggestions by genre + event moment.
 */
export default function PlaylistNudge({ acceptedQuote, playlistProgress = 0 }: Props) {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [genres, setGenres] = useState("");
  const [moment, setMoment] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SongSuggestion[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  // Re-open on every session even if dismissed once — the point is to nag politely
  useEffect(() => {
    const key = `bk:playlist-nudge-dismissed:${acceptedQuote?.id ?? ""}`;
    setDismissed(sessionStorage.getItem(key) === "1");
  }, [acceptedQuote?.id]);

  // Hide on kiosk-style pages (DJ queue, song request page)
  if (/^\/(request|dj-queue|admin)\b/.test(location.pathname)) return null;

  // Only show once the quote is accepted
  if (!acceptedQuote) return null;

  // If they've mostly finished the playlist, don't nag
  const almostDone = playlistProgress >= 70;

  const handleDismiss = () => {
    const key = `bk:playlist-nudge-dismissed:${acceptedQuote.id}`;
    sessionStorage.setItem(key, "1");
    setDismissed(true);
    setOpen(false);
  };

  const generate = async () => {
    setLoading(true);
    setSuggestions([]);
    try {
      const { data, error } = await supabase.functions.invoke("suggest-songs", {
        body: {
          event_type: acceptedQuote.event_type || "party",
          genres,
          moment,
          count: 12,
        },
      });
      if (error) throw error;
      const list = Array.isArray(data?.songs) ? (data.songs as SongSuggestion[]) : [];
      setSuggestions(list);
      if (!list.length) {
        toast({ title: "No suggestions", description: "Try a different genre or moment.", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "AI unavailable", description: e?.message || "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const addToPlaylist = (s: SongSuggestion) => {
    const line = `${s.title} — ${s.artist}`;
    const bucket = JSON.parse(localStorage.getItem("bk:playlist-picks") || "[]");
    bucket.push(line);
    localStorage.setItem("bk:playlist-picks", JSON.stringify(bucket));
    toast({ title: "Added to your picks", description: line });
  };

  const goToPlaylistForm = () => {
    handleDismiss();
    navigate("/client?section=ai");
    setTimeout(() => {
      document.querySelector("[data-music-planning]")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 300);
  };

  return (
    <>
      {/* Floating pulsing action button — bottom-left so it doesn't clash with WhatsApp button */}
      <AnimatePresence>
        {!open && !almostDone && (
          <motion.div
            key="playlist-fab"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-4 left-4 z-[65] flex items-end gap-2"
          >
            {!dismissed && (
              <div className="hidden sm:block max-w-[220px] rounded-xl bg-background/95 backdrop-blur border border-primary/40 shadow-[0_0_20px_hsl(280_95%_60%/0.45)] px-3 py-2 text-xs">
                <p className="font-bold text-primary">🎧 Build your playlist!</p>
                <p className="text-muted-foreground leading-snug">AI suggests songs for every moment of your event.</p>
              </div>
            )}
            <motion.button
              type="button"
              onClick={() => setOpen(true)}
              animate={{ boxShadow: [
                "0 0 0 0 hsl(280 95% 60% / 0.55)",
                "0 0 0 12px hsl(280 95% 60% / 0)",
              ] }}
              transition={{ duration: 1.6, repeat: Infinity }}
              className="relative flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-br from-fuchsia-500 via-purple-500 to-cyan-500 text-white hover:scale-105 active:scale-95 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              aria-label="Build your playlist"
            >
              <Music className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-5 min-w-[20px] rounded-full bg-red-500 text-white text-[10px] font-bold ring-2 ring-background px-1">!</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="playlist-panel"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            className="fixed bottom-4 left-4 right-4 sm:right-auto z-[65] w-auto sm:w-[min(92vw,420px)] rounded-2xl border border-primary/40 bg-background/95 backdrop-blur-xl shadow-2xl overflow-hidden"
          >
            <div className="bg-gradient-to-r from-fuchsia-600 via-purple-600 to-cyan-600 px-4 py-3 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListMusic className="w-4 h-4" />
                <p className="text-sm font-bold">Playlist Concierge</p>
              </div>
              <button onClick={() => setOpen(false)} className="opacity-80 hover:opacity-100" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your quote is <span className="text-primary font-semibold">accepted</span> 🎉 Let's build your playlist.
                Tell the AI what you're feeling and it'll suggest songs — add any you like, then finish in the full form.
              </p>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-semibold text-muted-foreground">Genres</label>
                  <Input
                    value={genres}
                    onChange={(e) => setGenres(e.target.value)}
                    placeholder="Afrobeats, Amapiano, R&B..."
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-semibold text-muted-foreground">Moment</label>
                  <Input
                    value={moment}
                    onChange={(e) => setMoment(e.target.value)}
                    placeholder="First dance, peak floor..."
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <Button
                onClick={generate}
                disabled={loading}
                className="w-full bg-gradient-to-r from-fuchsia-500 via-purple-500 to-cyan-500 text-white font-semibold hover:opacity-95"
                size="sm"
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                {loading ? "Curating..." : "Suggest songs with AI"}
              </Button>

              {suggestions.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {suggestions.map((s, i) => (
                    <div key={i} className="flex items-start justify-between gap-2 rounded-lg border border-border/60 bg-card/60 px-2.5 py-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold truncate">{s.title}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{s.artist}{s.year ? ` · ${s.year}` : ""}</p>
                        {s.why && <p className="text-[10px] text-muted-foreground italic mt-0.5 line-clamp-2">{s.why}</p>}
                      </div>
                      <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => addToPlaylist(s)} aria-label="Add song">
                        <Plus className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-2 border-t border-border/60">
                <Button size="sm" variant="outline" className="flex-1" onClick={goToPlaylistForm}>
                  <ListMusic className="w-3.5 h-3.5 mr-1.5" /> Open full form
                </Button>
                <Button size="sm" variant="ghost" onClick={handleDismiss}>Later</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
