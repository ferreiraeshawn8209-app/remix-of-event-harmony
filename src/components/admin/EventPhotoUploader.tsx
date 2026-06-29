import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Camera, Loader2, Trash2, Image as ImageIcon } from "lucide-react";

interface EventPhoto {
  id: string;
  photo_url: string;
  caption: string | null;
  created_at: string;
}

export function EventPhotoUploader({ quoteId, clientCode }: { quoteId: string; clientCode: string }) {
  const [photos, setPhotos] = useState<EventPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchPhotos = useCallback(async () => {
    const { data } = await supabase
      .from("event_photos")
      .select("*")
      .eq("quote_id", quoteId)
      .order("created_at", { ascending: false });
    setPhotos((data as EventPhoto[]) || []);
    setLoading(false);
  }, [quoteId]);

  useEffect(() => { fetchPhotos(); }, [fetchPhotos]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop();
        const path = `${quoteId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: uploadErr } = await supabase.storage.from("event-photos").upload(path, file);
        if (uploadErr) throw uploadErr;

        const { data: { publicUrl } } = supabase.storage.from("event-photos").getPublicUrl(path);

        await supabase.from("event_photos").insert({
          quote_id: quoteId,
          client_code: clientCode,
          photo_url: publicUrl,
          uploaded_by: user?.id || null,
        });
      }

      toast({ title: "Photos Uploaded", description: `${files.length} photo(s) added to the client gallery.` });
      fetchPhotos();
    } catch (err: any) {
      toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
    }
    setUploading(false);
  };

  const handleDelete = async (photo: EventPhoto) => {
    // Extract path from URL
    const urlParts = photo.photo_url.split("/event-photos/");
    if (urlParts.length > 1) {
      await supabase.storage.from("event-photos").remove([urlParts[1]]);
    }
    await supabase.from("event_photos").delete().eq("id", photo.id);
    setPhotos(prev => prev.filter(p => p.id !== photo.id));
    toast({ title: "Photo Deleted" });
  };

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Camera className="w-5 h-5 text-primary" /> Event Photos</CardTitle>
        <CardDescription>Take or upload photos during the event. Clients can view these in their portal.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />
          <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Camera className="w-4 h-4 mr-2" />}
            {uploading ? "Uploading..." : "Take / Upload Photos"}
          </Button>
        </div>

        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin mx-auto" />
        ) : photos.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No photos yet. Capture moments during the event!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {photos.map((photo) => (
              <div key={photo.id} className="relative group rounded-lg overflow-hidden border border-border">
                <img src={photo.photo_url} alt="Event" className="w-full aspect-square object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDelete(photo)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground p-1 truncate">
                  {new Date(photo.created_at).toLocaleString("en-ZA")}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
