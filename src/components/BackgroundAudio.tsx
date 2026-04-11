import { useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

const MIXCLOUD_USERNAME = "beatkulture";
const MIXCLOUD_FEED_URL = `https://www.mixcloud.com/widget/iframe/?hide_cover=1&mini=1&autoplay=1&feed=%2F${MIXCLOUD_USERNAME}%2F`;

export function BackgroundAudio() {
  const [playing, setPlaying] = useState(false);

  return (
    <>
      {/* Hidden Mixcloud iframe — only mounted when playing */}
      {playing && (
        <iframe
          src={MIXCLOUD_FEED_URL}
          width="0"
          height="0"
          className="fixed bottom-0 left-0 pointer-events-none opacity-0"
          allow="autoplay"
          title="BeatKulture Mixcloud"
          style={{ border: 0 }}
        />
      )}

      <Button
        variant="ghost"
        size="icon"
        onClick={() => setPlaying((p) => !p)}
        className="fixed bottom-4 right-4 z-50 rounded-full w-10 h-10 bg-card/80 backdrop-blur border border-border shadow-lg hover:bg-primary/20 hover:text-primary transition-all"
        title={playing ? "Mute" : "Play music"}
      >
        {playing ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
      </Button>
    </>
  );
}
