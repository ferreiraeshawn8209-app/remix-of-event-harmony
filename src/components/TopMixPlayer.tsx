import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Play, Pause, SkipBack, SkipForward, Shuffle, Music, List, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useMusicTracks } from "@/hooks/useMusicTracks";
import { cn } from "@/lib/utils";

function shuffleArr<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function fmt(sec: number) {
  if (!isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Premium top-of-portal mix player. Streams admin-uploaded tracks with
 * prev/next/shuffle, scrub bar, volume, and a full mix picker.
 */
export function TopMixPlayer({ className }: { className?: string }) {
  const { activeTracks, isLoading } = useMusicTracks();
  const [order, setOrder] = useState<string[]>([]);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const queue = useMemo(
    () => order.map(id => activeTracks.find(t => t.id === id)).filter(Boolean) as typeof activeTracks,
    [order, activeTracks]
  );
  const current = queue[idx];

  // (Re)build a shuffled order whenever the source list changes
  useEffect(() => {
    if (activeTracks.length === 0) { setOrder([]); return; }
    setOrder(shuffleArr(activeTracks.map(t => t.id)));
    setIdx(0);
  }, [activeTracks.length]);

  // Load current track src when it changes
  useEffect(() => {
    const a = audioRef.current;
    if (!a || !current) return;
    a.src = current.file_url;
    a.volume = muted ? 0 : volume;
    if (playing) a.play().catch(() => setPlaying(false));
  }, [current?.id]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = muted ? 0 : volume;
  }, [volume, muted]);

  const skip = (delta: number) => {
    if (queue.length === 0) return;
    setIdx(i => (i + delta + queue.length) % queue.length);
    setPlaying(true);
  };
  const toggle = () => {
    const a = audioRef.current; if (!a || !current) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { a.play().then(() => setPlaying(true)).catch(() => {}); }
  };
  const reshuffle = () => {
    setOrder(shuffleArr(activeTracks.map(t => t.id)));
    setIdx(0);
    setPlaying(true);
  };
  const jumpTo = (id: string) => {
    const i = order.indexOf(id);
    if (i >= 0) { setIdx(i); setPlaying(true); }
  };

  if (isLoading || activeTracks.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative rounded-2xl overflow-hidden border border-primary/30",
        "bg-gradient-to-r from-primary/15 via-accent/10 to-primary/15 backdrop-blur-xl",
        "shadow-[0_8px_40px_-12px_hsl(var(--primary)/0.5)]",
        className
      )}
    >
      <audio
        ref={audioRef}
        onEnded={() => skip(1)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={e => setProgress((e.target as HTMLAudioElement).currentTime)}
        onLoadedMetadata={e => setDuration((e.target as HTMLAudioElement).duration || 0)}
      />

      <div className="flex items-center gap-3 p-3 sm:p-4">
        <motion.div
          animate={playing ? { rotate: 360 } : { rotate: 0 }}
          transition={playing ? { repeat: Infinity, duration: 6, ease: "linear" } : { duration: 0.3 }}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 shadow-lg"
        >
          <Music className="w-6 h-6 text-primary-foreground" />
        </motion.div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[10px] uppercase tracking-widest text-primary font-bold">Now Spinning</p>
            {playing && (
              <span className="flex gap-0.5">
                {[0, 1, 2].map(i => (
                  <motion.span key={i}
                    className="w-0.5 bg-primary rounded-full"
                    animate={{ height: ["4px", "12px", "4px"] }}
                    transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                  />
                ))}
              </span>
            )}
          </div>
          <p className="text-sm sm:text-base font-semibold truncate">{current?.title}</p>
          <p className="text-xs text-muted-foreground truncate">{current?.artist || "BeatKulture"}</p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button size="icon" variant="ghost" onClick={() => skip(-1)} title="Previous mix">
            <SkipBack className="w-5 h-5" />
          </Button>
          <Button size="icon" variant="hero" onClick={toggle} className="rounded-full w-11 h-11" title={playing ? "Pause" : "Play"}>
            {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </Button>
          <Button size="icon" variant="ghost" onClick={() => skip(1)} title="Next mix">
            <SkipForward className="w-5 h-5" />
          </Button>
          <Button size="icon" variant="ghost" onClick={reshuffle} className="hidden sm:inline-flex" title="Shuffle">
            <Shuffle className="w-4 h-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" title="All mixes">
                <List className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-80 overflow-y-auto w-64">
              <DropdownMenuLabel>All Mixes ({queue.length})</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {queue.map((t, i) => (
                <DropdownMenuItem
                  key={t.id}
                  onClick={() => jumpTo(t.id)}
                  className={cn("flex flex-col items-start gap-0", i === idx && "bg-primary/10")}
                >
                  <span className="text-xs font-medium truncate w-full">
                    {i === idx && playing ? "▶ " : ""}{t.title}
                  </span>
                  {t.artist && <span className="text-[10px] text-muted-foreground truncate w-full">{t.artist}</span>}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="px-4 pb-3 flex items-center gap-3">
        <span className="text-[10px] text-muted-foreground tabular-nums w-9 text-right">{fmt(progress)}</span>
        <Slider
          value={[duration ? (progress / duration) * 100 : 0]}
          onValueChange={([v]) => {
            const a = audioRef.current;
            if (!a || !duration) return;
            a.currentTime = (v / 100) * duration;
          }}
          max={100}
          step={0.1}
          className="flex-1"
        />
        <span className="text-[10px] text-muted-foreground tabular-nums w-9">{fmt(duration)}</span>
        <button onClick={() => setMuted(m => !m)} className="text-muted-foreground hover:text-foreground hidden sm:block">
          {muted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
        <Slider
          value={[muted ? 0 : volume * 100]}
          onValueChange={([v]) => { setMuted(false); setVolume(v / 100); }}
          max={100}
          step={1}
          className="w-20 hidden sm:flex"
        />
      </div>
    </motion.div>
  );
}
