import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Image as ImageIcon, Upload, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface EventPhoto {
  id: string;
  photo_url: string;
  caption: string | null;
  created_at: string;
  uploaded_by: string | null;
}

export function ClientPhotoGallery({ quoteId }: { quoteId: string }) {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<EventPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("event_photos")
      .select("*")
      .eq("quote_id", quoteId)
      .order("created_at", { ascending: false });
    setPhotos((data as EventPhoto[]) || []);
    setLoading(false);
  }, [quoteId]);

  useEffect(() => { load(); }, [load]);

  const onUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !user) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const safe = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
        const path = `${quoteId}/${Date.now()}-${safe}`;
        const { error: upErr } = await supabase.storage.from("event-photos").upload(path, file, {
          contentType: file.type, upsert: false,
        });
        if (upErr) throw upErr;
        const photo_url = supabase.storage.from("event-photos").getPublicUrl(path).data.publicUrl;
        const { error: insErr } = await supabase.from("event_photos").insert({
          quote_id: quoteId, client_code: "", photo_url, uploaded_by: user.id,
        } as any);
        if (insErr) throw insErr;
      }
      toast({ title: "Photos uploaded", description: `${files.length} photo(s) added.` });
      load();
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally { setUploading(false); }
  };

  const remove = async (photo: EventPhoto) => {
    if (photo.uploaded_by !== user?.id) return;
    if (!confirm("Delete this photo?")) return;
    await supabase.from("event_photos").delete().eq("id", photo.id);
    setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
  };

  if (loading) return <Loader2 className="w-5 h-5 animate-spin mx-auto my-8" />;

  return (
    <Card variant="glass">
      <CardHeader>
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2"><ImageIcon className="w-5 h-5 text-primary" /> Event Photos</CardTitle>
            <CardDescription>Photos captured during your event — plus any inspiration you'd like to share with your DJ.</CardDescription>
          </div>
          <label htmlFor={`photo-upload-${quoteId}`} className={`inline-flex items-center gap-1 h-9 px-3 rounded-md text-sm font-medium border border-input bg-background hover:bg-accent transition ${uploading ? "opacity-50 pointer-events-none" : "cursor-pointer"}`}>
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {uploading ? "Uploading…" : "Upload photos"}
          </label>
          <input id={`photo-upload-${quoteId}`} type="file" multiple accept="image/*" className="hidden"
            onChange={(e) => { onUpload(e.target.files); e.currentTarget.value = ""; }} disabled={uploading} />
        </div>
      </CardHeader>
      <CardContent>
        {photos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No photos yet. Upload inspiration or wait for photos from your event.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photos.map((photo) => (
                <div key={photo.id} className="relative group rounded-lg overflow-hidden border border-border">
                  <img src={photo.photo_url} alt="Event moment" className="w-full aspect-square object-cover cursor-pointer"
                    onClick={() => setSelectedPhoto(photo.photo_url)} />
                  {photo.uploaded_by === user?.id && (
                    <button onClick={() => remove(photo)}
                      className="absolute top-1 right-1 bg-black/70 rounded-full p-1 opacity-0 group-hover:opacity-100 transition">
                      <Trash2 className="w-3.5 h-3.5 text-white" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-3">{photos.length} photo(s)</p>
          </>
        )}

        {selectedPhoto && (
          <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setSelectedPhoto(null)}>
            <img src={selectedPhoto} alt="Event" className="max-w-full max-h-[90vh] object-contain rounded-lg" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
