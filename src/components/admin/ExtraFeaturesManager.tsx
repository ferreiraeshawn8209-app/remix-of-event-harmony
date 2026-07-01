import { useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ImageCropDialog } from "@/components/ImageCropDialog";
import { ExtraFeature, useExtraFeatures } from "@/hooks/useExtraFeatures";
import { uploadSiteImage } from "@/hooks/useBusinessSettings";
import { formatCurrency } from "@/lib/pricing";
import { Loader2, Pencil, Plus, Save, Sparkles, Trash2, Upload, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface EditForm {
  id?: string;
  title: string;
  description: string;
  image_url: string;
  price: number;
  sort_order: number;
  is_active: boolean;
}

const emptyForm: EditForm = {
  title: "",
  description: "",
  image_url: "",
  price: 0,
  sort_order: 0,
  is_active: true,
};

export function ExtraFeaturesManager() {
  const { features, isLoading, saveFeature, deleteFeature, isSaving, isDeleting } = useExtraFeatures();
  const [editing, setEditing] = useState<EditForm | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleEdit = (feature: ExtraFeature) => {
    setEditing({
      id: feature.id,
      title: feature.title,
      description: feature.description,
      image_url: feature.image_url || "",
      price: feature.price,
      sort_order: feature.sort_order,
      is_active: feature.is_active,
    });
  };

  const handleImageUpload = async (file: File) => {
    if (!editing) return;
    setUploading(true);
    try {
      const url = await uploadSiteImage(file, "extra-features");
      setEditing({ ...editing, image_url: url });
      toast({ title: "Image uploaded", description: "Feature image ready to save." });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!editing || !editing.title.trim()) return;
    await saveFeature({
      ...(editing.id ? { id: editing.id } : {}),
      title: editing.title.trim(),
      description: editing.description.trim(),
      image_url: editing.image_url || null,
      price: Number(editing.price || 0),
      sort_order: Number(editing.sort_order || 0),
      is_active: editing.is_active,
    });
    setEditing(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {editing && (
        <Card variant="glow">
          <CardHeader>
            <CardTitle>{editing.id ? "Edit extra feature" : "Add extra feature"}</CardTitle>
            <CardDescription>
              Market services like Kids Corner, Human Jukebox, QR Songs, and Event Planning with images or GIFs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Price (ZAR)</Label>
                <Input
                  type="number"
                  min={0}
                  value={editing.price}
                  onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Description</Label>
                <Textarea
                  rows={3}
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Sort order</Label>
                <Input
                  type="number"
                  min={0}
                  value={editing.sort_order}
                  onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="h-10 flex items-center gap-2">
                  <Switch checked={editing.is_active} onCheckedChange={(checked) => setEditing({ ...editing, is_active: checked })} />
                  <span className="text-sm">{editing.is_active ? "Active" : "Hidden"}</span>
                </div>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Feature image / GIF</Label>
                {editing.image_url && (
                  <div className="w-full h-36 rounded-lg overflow-hidden border border-border/60 bg-muted/20">
                    <img src={editing.image_url} alt={editing.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*,image/gif"
                    className="text-xs flex-1"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setPendingFile(file);
                      e.target.value = "";
                    }}
                  />
                  {editing.image_url && (
                    <Button variant="outline" onClick={() => setEditing({ ...editing, image_url: "" })}>
                      Remove image
                    </Button>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">GIFs are supported and stay animated after upload.</p>
                <ImageCropDialog
                  file={pendingFile}
                  open={!!pendingFile}
                  onClose={() => setPendingFile(null)}
                  onConfirm={handleImageUpload}
                  defaultAspect="16:9"
                  title="Crop Extra Feature Image"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="hero" onClick={handleSave} disabled={isSaving || uploading}>
                {isSaving || uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save Feature
              </Button>
              <Button variant="outline" onClick={() => setEditing(null)}>
                <X className="w-4 h-4 mr-2" /> Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card variant="glass">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" /> Extra Features Marketing
              </CardTitle>
              <CardDescription>Manage services shown on landing and the client portal scrolling banner.</CardDescription>
            </div>
            <Button variant="hero" size="sm" onClick={() => setEditing({ ...emptyForm, sort_order: features.length + 1 })}>
              <Plus className="w-4 h-4 mr-2" /> Add Feature
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {features.map((feature) => (
            <div key={feature.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <div className="w-20 h-12 rounded overflow-hidden bg-muted/20 shrink-0 border border-border/60">
                {feature.image_url ? (
                  <img src={feature.image_url} alt={feature.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">No image</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{feature.title}</p>
                  <Badge variant={feature.is_active ? "default" : "secondary"}>{feature.is_active ? "Active" : "Hidden"}</Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">{feature.description}</p>
              </div>
              <p className="text-sm font-semibold text-primary">{formatCurrency(Number(feature.price || 0))}</p>
              <Button variant="ghost" size="icon" onClick={() => handleEdit(feature)}>
                <Pencil className="w-4 h-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete feature?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This removes <strong>{feature.title}</strong> from landing and client banners.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction disabled={isDeleting} onClick={() => deleteFeature(feature.id)}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
          {features.length === 0 && (
            <p className="text-sm text-muted-foreground py-6 text-center">No extra features added yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
