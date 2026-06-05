import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useEquipmentCatalog, EquipmentCatalogItem } from "@/hooks/useEquipmentCatalog";
import { Plus, Pencil, Trash2, Loader2, Save, X, Package, Upload, ImageIcon } from "lucide-react";
import { formatCurrency } from "@/lib/pricing";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ImageCropDialog } from "@/components/ImageCropDialog";
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

interface EditForm {
  id?: string;
  item_key: string;
  name: string;
  category: string;
  description: string;
  price: number;
  image_url: string;
  sort_order: number;
  is_active: boolean;
}

const emptyForm: EditForm = {
  item_key: "",
  name: "",
  category: "",
  description: "",
  price: 0,
  image_url: "",
  sort_order: 0,
  is_active: true,
};

export function EquipmentManager() {
  const { items, isLoading, saveItem, deleteItem, isSaving, isDeleting } = useEquipmentCatalog();
  const [editingItem, setEditingItem] = useState<EditForm | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = [...new Set(items.map((i) => i.category))];

  const handleEdit = (item: EquipmentCatalogItem) => {
    setEditingItem({
      id: item.id,
      item_key: item.item_key,
      name: item.name,
      category: item.category,
      description: item.description,
      price: item.price,
      image_url: item.image_url || "",
      sort_order: item.sort_order,
      is_active: item.is_active,
    });
  };

  const handleImageUpload = async (file: File) => {
    if (!editingItem) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const fileName = `${editingItem.item_key || Date.now()}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("equipment-images")
      .upload(fileName, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("equipment-images")
      .getPublicUrl(fileName);

    setEditingItem({ ...editingItem, image_url: urlData.publicUrl });
    setUploading(false);
    toast({ title: "Image uploaded", description: "Image ready to save." });
  };

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPendingFile(file);
    e.target.value = "";
  };


  const handleSave = async () => {
    if (!editingItem || !editingItem.name.trim() || !editingItem.item_key.trim()) return;
    await saveItem({
      ...(editingItem.id ? { id: editingItem.id } : {}),
      item_key: editingItem.item_key,
      name: editingItem.name,
      category: editingItem.category,
      description: editingItem.description,
      price: editingItem.price,
      image_url: editingItem.image_url || null,
      sort_order: editingItem.sort_order,
      is_active: editingItem.is_active,
    });
    setEditingItem(null);
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
      {/* Edit / Add Form */}
      {editingItem && (
        <Card variant="glow">
          <CardHeader>
            <CardTitle className="text-lg">
              {editingItem.id ? "Edit Item" : "Add New Item"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Item Key (unique ID)</Label>
                <Input
                  value={editingItem.item_key}
                  onChange={(e) => setEditingItem({ ...editingItem, item_key: e.target.value })}
                  placeholder="e.g. partyrocker"
                  disabled={!!editingItem.id}
                />
              </div>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  placeholder="Equipment name"
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input
                  value={editingItem.category}
                  onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                  placeholder="e.g. Speakers, Lighting"
                  list="categories"
                />
                <datalist id="categories">
                  {categories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-2">
                <Label>Price (ZAR)</Label>
                <Input
                  type="number"
                  value={editingItem.price || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, price: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Description</Label>
                <Input
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  placeholder="Brief description"
                />
              </div>

              {/* Image Upload */}
              <div className="space-y-2 md:col-span-2">
                <Label>Equipment Image</Label>
                <div className="flex items-start gap-4">
                  {editingItem.image_url ? (
                    <div className="relative w-32 h-24 rounded-lg overflow-hidden border border-border">
                      <img
                        src={editingItem.image_url}
                        alt="Equipment"
                        className="w-full h-full object-cover"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 bg-background/80"
                        onClick={() => setEditingItem({ ...editingItem, image_url: "" })}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="w-32 h-24 rounded-lg border border-dashed border-border flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,image/gif"
                      className="hidden"
                      onChange={handleImagePick}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Upload className="w-4 h-4 mr-2" />
                      )}
                      {uploading ? "Uploading..." : "Upload Image"}
                    </Button>
                    <p className="text-xs text-muted-foreground">Or paste a URL:</p>
                    <Input
                      value={editingItem.image_url}
                      onChange={(e) => setEditingItem({ ...editingItem, image_url: e.target.value })}
                      placeholder="https://..."
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={editingItem.sort_order}
                  onChange={(e) => setEditingItem({ ...editingItem, sort_order: Number(e.target.value) })}
                />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch
                  checked={editingItem.is_active}
                  onCheckedChange={(checked) => setEditingItem({ ...editingItem, is_active: checked })}
                />
                <Label>Active (visible to clients)</Label>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="hero" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span className="ml-2">Save</span>
              </Button>
              <Button variant="outline" onClick={() => setEditingItem(null)}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Item List grouped by category */}
      <Card variant="glass">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Equipment Catalog</CardTitle>
              <CardDescription>{items.length} items across {categories.length} categories</CardDescription>
            </div>
            <Button variant="hero" size="sm" onClick={() => setEditingItem({ ...emptyForm, sort_order: items.length + 1 })}>
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {categories.map((category) => (
            <div key={category}>
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                {category}
              </h3>
              <div className="space-y-2">
                {items
                  .filter((i) => i.category === category)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="w-10 h-10 rounded object-cover shrink-0" />
                        ) : (
                          <Package className="w-4 h-4 text-muted-foreground shrink-0" />
                        )}
                        <div className="min-w-0">
                          <div className="font-medium text-sm flex items-center gap-2">
                            {item.name}
                            {!item.is_active && (
                              <Badge variant="outline" className="text-xs text-muted-foreground">
                                Hidden
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">{item.description}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-semibold text-primary text-sm">
                          {formatCurrency(item.price)}
                        </span>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(item)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete {item.name}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently remove this item from the catalog. Existing quotes won't be affected.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteItem(item.id)} disabled={isDeleting}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
