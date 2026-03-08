import { useState, useRef, useEffect, useCallback } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BackgroundAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const audio = new Audio("/audio/ambient-loop.mp3");
    audio.loop = true;
    audio.volume = 0.15;
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().then(() => {
        setPlaying(true);
        setStarted(true);
      }).catch(() => {});
    }
  }, [playing]);

  // Auto-play on first user interaction
  useEffect(() => {
    if (started) return;
    const handler = () => {
      const audio = audioRef.current;
      if (audio && !started) {
        audio.play().then(() => {
          setPlaying(true);
          setStarted(true);
        }).catch(() => {});
      }
      document.removeEventListener("click", handler);
      document.removeEventListener("touchstart", handler);
    };
    document.addEventListener("click", handler, { once: true });
    document.addEventListener("touchstart", handler, { once: true });
    return () => {
      document.removeEventListener("click", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [started]);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      className="fixed bottom-4 right-4 z-50 rounded-full w-10 h-10 bg-card/80 backdrop-blur border border-border shadow-lg hover:bg-primary/20 hover:text-primary transition-all"
      title={playing ? "Mute" : "Play music"}
    >
      {playing ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
    </Button>
  );
}
