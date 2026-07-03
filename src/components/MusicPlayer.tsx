import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Music, Play, Pause, SkipForward, SkipBack, Shuffle, X, Volume2 } from "lucide-react";
import { useMusicTracks } from "@/hooks/useMusicTracks";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Global floating mini-player. Loads admin-uploaded music tracks and shuffles them
 * with continuous playback. Browsers block autoplay-with-sound until the user
 * interacts, so we show a "Tap to play" prompt on first load.
 */
export function MusicPlayer() {
  const { activeTracks, isLoading } = useMusicTracks();
  const [queue, setQueue] = useState<typeof activeTracks>([]);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [needsTap, setNeedsTap] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Build shuffled queue whenever the active list changes
  useEffect(() => {
    if (activeTracks.length === 0) return;
    setQueue(shuffle(activeTracks));
    setIdx(0);
  }, [activeTracks.length]);

  // Attempt autoplay muted so the queue starts even without a tap
  useEffect(() => {
    if (!audioRef.current || queue.length === 0) return;
    const a = audioRef.current;
    a.src = queue[idx].file_url;
    a.play().then(() => {
      setPlaying(true);
      setNeedsTap(false);
    }).catch(() => {
      setPlaying(false);
      setNeedsTap(true);
    });
  }, [queue, idx]);

  const skip = (delta: number) => {
    if (queue.length === 0) return;
    setIdx(i => (i + delta + queue.length) % queue.length);
  };

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play().then(() => { setPlaying(true); setNeedsTap(false); }).catch(() => {}); }
  };

  const shuffleNow = () => {
    setQueue(shuffle(activeTracks));
    setIdx(0);
  };

  if (isLoading || activeTracks.length === 0) return null;
  const current = queue[idx];

  return (
    <>
      <audio
        ref={audioRef}
        onEnded={() => skip(1)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-4 left-4 z-40 w-72 max-w-[90vw] rounded-2xl bg-card/95 backdrop-blur-xl border border-primary/30 shadow-xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-primary/15 to-accent/15">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <Music className="w-4 h-4 text-primary" />
                BeatKulture Radio
              </div>
              <button onClick={() => setCollapsed(true)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 space-y-3">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{current?.title}</p>
                <p className="text-xs text-muted-foreground truncate">{current?.artist || "BeatKulture"}</p>
              </div>
              {needsTap && (
                <p className="text-[11px] text-primary">Tap play to start the mix</p>
              )}
              <div className="flex items-center justify-between">
                <Button size="icon" variant="ghost" onClick={() => skip(-1)}>
                  <SkipBack className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="hero" onClick={toggle} className="rounded-full">
                  {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </Button>
                <Button size="icon" variant="ghost" onClick={() => skip(1)}>
                  <SkipForward className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={shuffleNow} title="Reshuffle">
                  <Shuffle className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="fixed bottom-4 left-4 z-40 w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent shadow-xl flex items-center justify-center"
          aria-label="Open music player"
        >
          <Volume2 className="w-5 h-5 text-primary-foreground" />
        </button>
      )}
    </>
  );
}
