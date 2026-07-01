import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Pencil, Trash2, Save, X, Star } from "lucide-react";
import { usePackages, DbPackage } from "@/hooks/usePackages";
import { formatCurrency } from "@/lib/pricing";
import { toast } from "@/hooks/use-toast";
import { ImageCropDialog } from "@/components/ImageCropDialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const CATEGORIES = [
  { value: "wedding", label: "Wedding" },
  { value: "corporate", label: "Corporate" },
  { value: "party", label: "Party" },
];

function PackageForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: DbPackage;
  onSave: (data: Omit<DbPackage, "id">) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name || "");
  const [category, setCategory] = useState(initial?.category || "wedding");
  const [description, setDescription] = useState(initial?.description || "");
  const [price, setPrice] = useState(String(initial?.price || 0));
  const [popular, setPopular] = useState(initial?.popular || false);
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [sortOrder, setSortOrder] = useState(String(initial?.sort_order || 0));
  const [includesText, setIncludesText] = useState((initial?.includes || []).join("\n"));
  const [imageUrl, setImageUrl] = useState(initial?.image_url || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const { uploadSiteImage } = await import("@/hooks/useBusinessSettings");
      const url = await uploadSiteImage(file, "packages");
      setImageUrl(url);
      toast({ title: "Image uploaded" });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    }
    setUploading(false);
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        category,
        description: description.trim(),
        price: Number(price),
        popular,
        is_active: isActive,
        sort_order: Number(sortOrder),
        includes: includesText.split("\n").map(s => s.trim()).filter(Boolean),
        image_url: imageUrl || null,
      });
      toast({ title: "Saved", description: `Package "${name}" saved.` });
    } catch {
      toast({ title: "Error", description: "Failed to save package.", variant: "destructive" });
    }
    setSaving(false);
  };

  return (
    <Card variant="glass" className="border-primary/30">
      <CardContent className="pt-6 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Package Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Premium Wedding" />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Price (R)</Label>
            <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} min={0} step={500} />
          </div>
          <div className="space-y-2">
            <Label>Sort Order</Label>
            <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} min={0} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
        </div>
        <div className="space-y-2">
          <Label>Includes (one item per line)</Label>
          <Textarea value={includesText} onChange={(e) => setIncludesText(e.target.value)} rows={6} placeholder="5 hours DJ service&#10;Professional sound system&#10;Basic lighting package" />
        </div>
        <div className="space-y-2">
          <Label>Package Image</Label>
          {imageUrl && (
            <div className="w-full aspect-[16/9] bg-muted/40 flex items-center justify-center rounded mb-2 overflow-hidden">
              <img src={imageUrl} alt="Package" className="w-full h-full object-contain" />
            </div>
          )}
          <div className="flex gap-2 items-center">
            <input
              type="file"
              accept="image/*,image/gif"
              className="text-xs flex-1"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) setPendingFile(f); e.target.value = ""; }}
            />
            {imageUrl && (
              <Button variant="ghost" size="sm" type="button" onClick={() => setImageUrl("")}>Remove</Button>
            )}
          </div>
          {uploading && <p className="text-xs text-muted-foreground">Uploading…</p>}
          <p className="text-[11px] text-muted-foreground">GIFs are uploaded as-is to preserve animation.</p>
        </div>
        <ImageCropDialog
          file={pendingFile}
          open={!!pendingFile}
          onClose={() => setPendingFile(null)}
          onConfirm={handleImageUpload}
          defaultAspect="16:9"
          title="Crop Package Image"
        />
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Switch checked={popular} onCheckedChange={setPopular} />
            <Label className="text-sm">Most Popular</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <Label className="text-sm">Active</Label>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSubmit} disabled={saving || !name.trim()}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            {initial ? "Update" : "Create"} Package
          </Button>
          <Button variant="ghost" onClick={onCancel}><X className="w-4 h-4 mr-2" />Cancel</Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function PackageManager() {
  const { packages, isLoading, updatePackage, createPackage, deletePackage } = usePackages();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [activeCategory, setActiveCategory] = useState("wedding");

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  const filtered = packages.filter(p => p.category === activeCategory);

  return (
    <div className="space-y-6">
      <Card variant="glass">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Package Management</CardTitle>
              <CardDescription>Edit pricing, descriptions, and inclusions for all event packages</CardDescription>
            </div>
            <Button variant="hero" onClick={() => { setShowCreate(true); setEditingId(null); }}>
              <Plus className="w-4 h-4 mr-2" />Add Package
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="mb-4">
              {CATEGORIES.map(c => (
                <TabsTrigger key={c.value} value={c.value}>
                  {c.label} ({packages.filter(p => p.category === c.value).length})
                </TabsTrigger>
              ))}
            </TabsList>

            {CATEGORIES.map(c => (
              <TabsContent key={c.value} value={c.value}>
                <div className="space-y-3">
                  {filtered.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No packages in this category.</p>
                  )}
                  {filtered.map(pkg => (
                    editingId === pkg.id ? (
                      <PackageForm
                        key={pkg.id}
                        initial={pkg}
                        onSave={async (data) => { await updatePackage(pkg.id, data); setEditingId(null); }}
                        onCancel={() => setEditingId(null)}
                      />
                    ) : (
                      <div key={pkg.id} className="flex items-center justify-between gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                          <div className="w-40 h-24 rounded-lg overflow-hidden bg-muted/50 shrink-0 border border-border/60">
                            {pkg.image_url ? (
                              <img src={pkg.image_url} alt={pkg.name} className="w-full h-full object-cover" loading="lazy" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[11px] text-muted-foreground">
                                No image
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{pkg.name}</span>
                              {pkg.popular && <Badge variant="default" className="text-xs"><Star className="w-3 h-3 mr-1" />Popular</Badge>}
                              {!pkg.is_active && <Badge variant="secondary" className="text-xs">Hidden</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{pkg.description}</p>
                            <p className="text-sm text-primary font-semibold mt-1">{formatCurrency(pkg.price)}</p>
                            <p className="text-xs text-muted-foreground mt-1">{pkg.includes.length} items included</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => { setEditingId(pkg.id); setShowCreate(false); }}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete "{pkg.name}"?</AlertDialogTitle>
                                <AlertDialogDescription>This will permanently remove this package.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deletePackage(pkg.id)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {showCreate && (
        <PackageForm
          onSave={async (data) => { await createPackage(data); setShowCreate(false); }}
          onCancel={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}
