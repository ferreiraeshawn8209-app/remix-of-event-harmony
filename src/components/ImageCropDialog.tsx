import { useState, useCallback, useEffect } from "react";
import Cropper, { Area } from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const ASPECTS: Record<string, number | undefined> = {
  free: undefined,
  "1:1": 1,
  "4:3": 4 / 3,
  "3:4": 3 / 4,
  "16:9": 16 / 9,
  "9:16": 9 / 16,
  "3:2": 3 / 2,
  "21:9": 21 / 9,
};

type AspectKey = keyof typeof ASPECTS;

interface Props {
  file: File | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (file: File) => void;
  defaultAspect?: AspectKey;
  title?: string;
}

async function getCroppedFile(
  imageSrc: string,
  crop: Area,
  originalName: string,
  mimeType: string
): Promise<File> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  ctx.drawImage(
    image,
    crop.x, crop.y, crop.width, crop.height,
    0, 0, crop.width, crop.height
  );

  // Use jpeg for opaque, png for transparent-capable sources
  const outType = mimeType === "image/png" || mimeType === "image/webp" ? mimeType : "image/jpeg";
  const ext = outType.split("/")[1];
  const base = originalName.replace(/\.[^.]+$/, "");

  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob(b => b ? resolve(b) : reject(new Error("toBlob failed")), outType, 0.92)
  );
  return new File([blob], `${base}-cropped.${ext}`, { type: outType });
}

export function ImageCropDialog({ file, open, onClose, onConfirm, defaultAspect = "free", title = "Crop Image" }: Props) {
  const [src, setSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspectKey, setAspectKey] = useState<AspectKey>(defaultAspect);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!file) { setSrc(null); return; }
    const url = URL.createObjectURL(file);
    setSrc(url);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setAspectKey(defaultAspect);
    return () => URL.revokeObjectURL(url);
  }, [file, defaultAspect]);

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const isGif = file?.type === "image/gif";

  const handleConfirm = async () => {
    if (!file) return;
    if (isGif) {
      // Preserve animation — upload original
      onConfirm(file);
      onClose();
      return;
    }
    if (!src || !croppedAreaPixels) return;
    setProcessing(true);
    try {
      const cropped = await getCroppedFile(src, croppedAreaPixels, file.name, file.type);
      onConfirm(cropped);
      onClose();
    } finally {
      setProcessing(false);
    }
  };

  const handleSkip = () => {
    if (file) onConfirm(file);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {isGif
              ? "Animated GIFs are uploaded as-is to preserve motion. Cropping is disabled."
              : "Adjust the crop area and zoom. Choose an aspect ratio that suits where the image will be used."}
          </DialogDescription>
        </DialogHeader>

        {src && (
          <div className="space-y-4">
            <div className="relative w-full h-[360px] bg-muted/40 rounded-lg overflow-hidden">
              {!isGif ? (
                <Cropper
                  image={src}
                  crop={crop}
                  zoom={zoom}
                  aspect={ASPECTS[aspectKey]}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                  objectFit="contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <img src={src} alt="GIF preview" className="max-w-full max-h-full" />
                </div>
              )}
            </div>

            {!isGif && (
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Aspect Ratio</Label>
                  <Select value={aspectKey} onValueChange={(v) => setAspectKey(v as AspectKey)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="1:1">Square (1:1)</SelectItem>
                      <SelectItem value="4:3">Standard (4:3)</SelectItem>
                      <SelectItem value="3:4">Portrait (3:4)</SelectItem>
                      <SelectItem value="16:9">Wide (16:9)</SelectItem>
                      <SelectItem value="9:16">Story (9:16)</SelectItem>
                      <SelectItem value="3:2">Photo (3:2)</SelectItem>
                      <SelectItem value="21:9">Cinema (21:9)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Zoom</Label>
                  <Slider value={[zoom]} min={1} max={4} step={0.05} onValueChange={(v) => setZoom(v[0])} />
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          {!isGif && <Button variant="outline" onClick={handleSkip}>Upload Original</Button>}
          <Button onClick={handleConfirm} disabled={processing || (!isGif && !croppedAreaPixels)}>
            {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {isGif ? "Upload GIF" : "Crop & Use"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
