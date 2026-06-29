import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music, SkipBack, SkipForward, Shuffle } from "lucide-react";
import { buildMixcloudEmbedSrc } from "@/lib/mixcloud";

/**
 * Curated rotating Mixcloud mixes for the client dashboard.
 * - Picks a random mix on each page load (luck of the draw across genres).
 * - Prev / Next / Shuffle buttons let the client cycle through the list.
 * Each entry uses Mixcloud's iframe widget so we don't need API keys.
 */
interface MixEntry {
  /** Mixcloud feed path, e.g. "/Beatkulture/amapiano-mix-vol-1/" */
  feed: string;
  label: string;
  genre: string;
}

interface MixcloudRotatorProps {
  /**
   * Changing this value forces a fresh autoplay attempt (for example on new sign-in).
   */
  autoplayTrigger?: string;
}

const MIXCLOUD_BACKUP_URL = "https://www.mixcloud.com/Beatkulture/uploads/";

/** Anything under the /Beatkulture/ profile works. Edit this list in code. */
const MIXES: MixEntry[] = [
  { feed: "/Beatkulture/",                              label: "Latest BeatKulture set",      genre: "Featured" },
  { feed: "/Beatkulture/playlists/amapiano/",           label: "Amapiano vibes",              genre: "Amapiano" },
  { feed: "/Beatkulture/playlists/house/",              label: "House classics",              genre: "House" },
  { feed: "/Beatkulture/playlists/afrikaans/",          label: "Afrikaans treffers",          genre: "Afrikaans" },
  { feed: "/Beatkulture/playlists/english/",            label: "English chart hits",          genre: "English" },
  { feed: "/Beatkulture/playlists/old-school/",         label: "Old-school throwbacks",       genre: "Old School" },
  { feed: "/Beatkulture/playlists/modern/",             label: "Modern dance floor",          genre: "Modern" },
  { feed: "/Beatkulture/playlists/wedding/",            label: "Wedding-day set",             genre: "Wedding" },
];

function randomIndex(len: number, exclude?: number) {
  if (len <= 1) return 0;
  let i = Math.floor(Math.random() * len);
  if (exclude !== undefined && i === exclude) i = (i + 1) % len;
  return i;
}

export function MixcloudRotator({ autoplayTrigger }: MixcloudRotatorProps) {
  // Pick a random starting mix each time the dashboard loads.
  const [index, setIndex] = useState<number>(() => randomIndex(MIXES.length));

  useEffect(() => {
    if (!autoplayTrigger) return;
    // Re-selecting a different feed remounts the iframe and retries autoplay.
    setIndex((currentIndex) => randomIndex(MIXES.length, currentIndex));
  }, [autoplayTrigger]);

  const current = MIXES[index];
  const src = useMemo(() => buildMixcloudEmbedSrc(current.feed), [current.feed]);

  const next = () => setIndex((i) => (i + 1) % MIXES.length);
  const prev = () => setIndex((i) => (i - 1 + MIXES.length) % MIXES.length);
  const shuffle = () => setIndex((i) => randomIndex(MIXES.length, i));

  return (
    <Card variant="glass" className="overflow-hidden border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Music className="w-4 h-4 text-primary" /> Have a listen to our mixes
        </CardTitle>
        <CardDescription className="text-xs leading-relaxed">
          A different BeatKulture mix every time you open this page — Amapiano, House, Afrikaans, English, Old
          School &amp; more.
          <span className="block mt-1">
            Mixcloud does not expose a reliable API for true random track selection inside one feed, so{" "}
            the player controls rotate to another BeatKulture feed and retry autoplay.
          </span>
          <span className="block mt-1 text-foreground/80">
            Now playing: <span className="text-primary font-semibold">{current.label}</span>{" "}
            <span className="text-muted-foreground">· {current.genre}</span>
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <iframe
          key={src}
          width="100%"
          height="120"
          src={src}
          frameBorder="0"
          allow="encrypted-media; fullscreen; autoplay; idle-detection; speaker-selection; web-share;"
          title={`BeatKulture Mixcloud — ${current.label}`}
        />
      </CardContent>
      <div className="px-3 py-2 text-xs text-muted-foreground border-t border-border/40 bg-muted/20">
        <a
          href={MIXCLOUD_BACKUP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Having trouble with the player? Open on Mixcloud
        </a>
      </div>
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-border/40 bg-muted/20">
        <Button size="sm" variant="ghost" onClick={prev} className="flex-1">
          <SkipBack className="w-4 h-4 mr-1" /> Previous
        </Button>
        <Button size="sm" variant="ghost" onClick={shuffle} className="flex-1">
          <Shuffle className="w-4 h-4 mr-1" /> Surprise me
        </Button>
        <Button size="sm" variant="ghost" onClick={next} className="flex-1">
          Next <SkipForward className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </Card>
  );
}
