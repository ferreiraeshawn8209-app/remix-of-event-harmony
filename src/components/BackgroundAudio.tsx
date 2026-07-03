import { useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

const MIXCLOUD_USERNAME = "beatkulture";
const MIXCLOUD_EMBED_URL = `https://www.mixcloud.com/widget/iframe/?hide_cover=1&mini=1&autoplay=1&feed=%2F${MIXCLOUD_USERNAME}%2F`;

export function BackgroundAudio() {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center">
      {/* Mixcloud mini player - visible when playing */}
      {playing && (
        <div className="flex-1 bg-card/95 backdrop-blur border-t border-border">
          <iframe
            src={MIXCLOUD_EMBED_URL}
            width="100%"
            height="60"
            allow="autoplay"
            title="BeatKulture Mixcloud"
            style={{ border: 0 }}
          />
        </div>
      )}

      {/* Toggle button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setPlaying((p) => !p)}
        className={`${playing ? "m-2" : "fixed bottom-4 right-4"} rounded-full w-10 h-10 bg-card/80 backdrop-blur border border-border shadow-lg hover:bg-primary/20 hover:text-primary transition-all shrink-0`}
        title={playing ? "Close player" : "Play music"}
      >
        {playing ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </Button>
    </div>
  );
}
