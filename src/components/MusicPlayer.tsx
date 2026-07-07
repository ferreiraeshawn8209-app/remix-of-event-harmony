import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music, Loader2, Play, Pause, SkipBack, SkipForward, Shuffle, Volume2 } from "lucide-react";
import { useActiveTracks, Track } from "@/hooks/useTracks";
import { resolveMixcloudProfileUrl } from "@/lib/mixcloud";

function randomIndex(len: number, exclude?: number): number {
  if (len <= 1) return 0;
  let i = Math.floor(Math.random() * len);
  if (exclude !== undefined && i === exclude) i = (i + 1) % len;
  return i;
}

interface MusicPlayerProps {
  /**
   * Changing this value triggers a fresh autoplay attempt.
   * Typically set to the authenticated user's ID so it fires once on login.
   */
  autoplayTrigger?: string;
  mixcloudUrl?: string | null;
}

export function MusicPlayer({ autoplayTrigger, mixcloudUrl }: MusicPlayerProps) {
  const { tracks, isLoading } = useActiveTracks();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [index, setIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const mixcloudFallbackUrl = resolveMixcloudProfileUrl(mixcloudUrl);

  const ensureCurrentTrackLoaded = useCallback(() => {
    const audio = audioRef.current;
    const track = tracks[index];
    if (!audio || !track) return null;

    if (audio.src !== track.url) {
      audio.src = track.url;
      audio.load();
    } else if (audio.readyState === 0) {
      audio.load();
    }

    return audio;
  }, [index, tracks]);

  // Pick a random track once tracks are loaded
  useEffect(() => {
    if (tracks.length === 0) return;
    if (!initialized) {
      setIndex(randomIndex(tracks.length));
      setInitialized(true);
    }
  }, [tracks, initialized]);

  // When the trigger changes (e.g. user just logged in), pick a fresh random
  // track and attempt autoplay
  useEffect(() => {
    if (!autoplayTrigger || tracks.length === 0) return;
    const newIndex = randomIndex(tracks.length);
    setIndex(newIndex);
    setAutoplayBlocked(false);
  }, [autoplayTrigger, tracks.length]);

  // Attempt autoplay whenever the index changes (after init)
  useEffect(() => {
    if (!initialized || tracks.length === 0) return;
    const audio = ensureCurrentTrackLoaded();
    if (!audio) return;

    const attempt = audio.play();
    if (attempt !== undefined) {
      attempt
        .then(() => {
          setIsPlaying(true);
          setAutoplayBlocked(false);
        })
        .catch(() => {
          // Autoplay blocked by browser — show manual play button
          setIsPlaying(false);
          setAutoplayBlocked(true);
        });
    }
  }, [index, initialized, tracks, ensureCurrentTrackLoaded]);

  const play = useCallback(() => {
    const audio = ensureCurrentTrackLoaded();
    if (!audio) return;
    audio.play().then(() => {
      setIsPlaying(true);
      setAutoplayBlocked(false);
    }).catch((err) => {
      console.warn("MusicPlayer: play() rejected:", err);
    });
  }, [ensureCurrentTrackLoaded]);

  // If autoplay is blocked, retry as soon as the user interacts anywhere on the page.
  useEffect(() => {
    if (!autoplayBlocked) return;

    const unlockAndPlay = () => {
      play();
    };

    window.addEventListener("pointerdown", unlockAndPlay, { once: true });
    window.addEventListener("keydown", unlockAndPlay, { once: true });
    window.addEventListener("touchstart", unlockAndPlay, { once: true });

    return () => {
      window.removeEventListener("pointerdown", unlockAndPlay);
      window.removeEventListener("keydown", unlockAndPlay);
      window.removeEventListener("touchstart", unlockAndPlay);
    };
  }, [autoplayBlocked, play]);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    setIsPlaying(false);
  }, []);

  const next = useCallback(() => {
    if (tracks.length === 0) return;
    setIndex((i) => (i + 1) % tracks.length);
    setAutoplayBlocked(false);
  }, [tracks.length]);

  const previous = useCallback(() => {
    if (tracks.length === 0) return;
    setIndex((i) => (i - 1 + tracks.length) % tracks.length);
    setAutoplayBlocked(false);
  }, [tracks.length]);

  const shuffle = useCallback(() => {
    if (tracks.length === 0) return;
    setIndex((i) => randomIndex(tracks.length, i));
    setAutoplayBlocked(false);
  }, [tracks.length]);

  // Auto-advance when a track ends
  const handleEnded = useCallback(() => {
    if (tracks.length <= 1) {
      // Loop single track
      audioRef.current?.play().then(() => setIsPlaying(true)).catch((err) => {
        console.warn("MusicPlayer: loop play() rejected:", err);
      });
      return;
    }
    setIndex((i) => randomIndex(tracks.length, i));
  }, [tracks.length]);

  const currentTrack: Track | undefined = tracks[index];

  if (isLoading) {
    return (
      <Card variant="glass" className="overflow-hidden border-primary/20">
        <CardContent className="py-6 flex items-center justify-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading music…
        </CardContent>
      </Card>
    );
  }

  if (tracks.length === 0) {
    return (
      <Card variant="glass" className="overflow-hidden border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Music className="w-4 h-4 text-primary" /> BeatKulture Music Player
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-muted-foreground">
            No live portal tracks are loaded yet. You can still listen to our latest mixes below.
          </p>
          <a
            href={mixcloudFallbackUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-xs text-primary hover:underline"
          >
            Listen to more mixes on Mixcloud
          </a>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="glass" className="overflow-hidden border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Music className="w-4 h-4 text-primary" /> BeatKulture Music Player
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Hidden native audio element */}
        <audio
          ref={audioRef}
          aria-label="BeatKulture background music player"
          autoPlay
          onEnded={handleEnded}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />

        {/* Track info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 ${isPlaying ? "animate-pulse" : ""}`}>
            <Volume2 className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{currentTrack?.title}</p>
            <p className="text-xs text-muted-foreground">
              {isPlaying ? "Now playing" : autoplayBlocked ? "Tap play to start" : "Paused"}
              {tracks.length > 1 && ` · ${index + 1} of ${tracks.length}`}
            </p>
          </div>
        </div>

        {/* Autoplay-blocked nudge */}
        {autoplayBlocked && (
          <div className="text-xs text-muted-foreground bg-muted/40 rounded-md px-3 py-2">
            Your browser requires interaction before audio can start. Tap anywhere and playback will begin automatically.
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={isPlaying ? "outline" : "hero"}
            onClick={isPlaying ? pause : play}
            className="flex-1"
          >
            {isPlaying
              ? <><Pause className="w-4 h-4 mr-1" /> Pause</>
              : <><Play className="w-4 h-4 mr-1" /> Play</>}
          </Button>
          {tracks.length > 1 && (
            <Button size="sm" variant="ghost" onClick={previous} title="Previous track">
              <SkipBack className="w-4 h-4" />
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={shuffle} title="Shuffle">
            <Shuffle className="w-4 h-4" />
          </Button>
          {tracks.length > 1 && (
            <Button size="sm" variant="ghost" onClick={next} title="Next track">
              <SkipForward className="w-4 h-4" />
            </Button>
          )}
        </div>

        <a
          href={mixcloudFallbackUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-xs text-primary hover:underline"
        >
          Listen to more mixes on Mixcloud
        </a>
      </CardContent>
    </Card>
  );
}
