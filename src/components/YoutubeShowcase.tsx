import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Youtube, Play } from "lucide-react";
import { useYoutubeVideos, YoutubeVideo } from "@/hooks/useYoutubeVideos";

export function YoutubeShowcase() {
  const { activeVideos, isLoading } = useYoutubeVideos();
  const [open, setOpen] = useState<YoutubeVideo | null>(null);

  if (isLoading || activeVideos.length === 0) return null;

  return (
    <Card variant="glass" className="overflow-hidden border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Youtube className="w-4 h-4 text-primary" /> BeatKulture Videos
        </CardTitle>
        <CardDescription className="text-xs leading-relaxed">
          listen to our locally produced tracks and view example videos of lighting and effects descriptions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {activeVideos.map((v) => (
            <button
              key={v.id}
              onClick={() => setOpen(v)}
              className="group relative aspect-video rounded-lg overflow-hidden border border-border/50 hover:border-primary/60 transition focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {/* Muted auto-playing preview */}
              <iframe
                className="absolute inset-0 w-full h-full pointer-events-none scale-150"
                src={`https://www.youtube.com/embed/${v.youtube_id}?autoplay=1&mute=1&controls=0&showinfo=0&modestbranding=1&loop=1&playlist=${v.youtube_id}&playsinline=1&rel=0`}
                title={v.title}
                allow="autoplay; encrypted-media"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center">
                  <Play className="w-6 h-6 text-primary-foreground fill-current" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-2 text-left">
                <p className="text-[11px] font-semibold text-white truncate">{v.title}</p>
                {v.description && (
                  <p className="text-[10px] text-white/70 truncate">{v.description}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      </CardContent>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>{open?.title}</DialogTitle>
          </DialogHeader>
          {open && (
            <div className="aspect-video w-full bg-black">
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${open.youtube_id}?autoplay=1&rel=0`}
                title={open.title}
                allow="autoplay; encrypted-media; fullscreen"
                allowFullScreen
              />
            </div>
          )}
          {open?.title && (
            <div className="p-4">
              <h3 className="font-semibold">{open.title}</h3>
              {open.description && <p className="text-xs text-muted-foreground mt-1">{open.description}</p>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
