import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Image as ImageIcon } from "lucide-react";

interface EventPhoto {
  id: string;
  photo_url: string;
  caption: string | null;
  created_at: string;
}

export function ClientPhotoGallery({ quoteId }: { quoteId: string }) {
  const [photos, setPhotos] = useState<EventPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("event_photos")
        .select("*")
        .eq("quote_id", quoteId)
        .order("created_at", { ascending: false });
      setPhotos((data as EventPhoto[]) || []);
      setLoading(false);
    })();
  }, [quoteId]);

  if (loading) return <Loader2 className="w-5 h-5 animate-spin mx-auto my-8" />;

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ImageIcon className="w-5 h-5 text-primary" /> Event Photos</CardTitle>
        <CardDescription>Photos captured during your event by BeatKulture</CardDescription>
      </CardHeader>
      <CardContent>
        {photos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No photos yet. Photos taken during your event will appear here.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="rounded-lg overflow-hidden border border-border cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                  onClick={() => setSelectedPhoto(photo.photo_url)}
                >
                  <img src={photo.photo_url} alt="Event moment" className="w-full aspect-square object-cover" />
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-3">{photos.length} photo(s)</p>
          </>
        )}

        {/* Lightbox */}
        {selectedPhoto && (
          <div
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <img src={selectedPhoto} alt="Event" className="max-w-full max-h-[90vh] object-contain rounded-lg" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
