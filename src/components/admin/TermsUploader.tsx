import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Upload, FileText, Loader2, Trash2, Download } from "lucide-react";

const TC_FILE_PATH = "terms-and-conditions.pdf";

export function TermsUploader() {
  const [uploading, setUploading] = useState(false);
  const [existing, setExisting] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkExisting();
  }, []);

  const checkExisting = async () => {
    setChecking(true);
    const { data } = await supabase.storage
      .from("documents")
      .list("", { search: "terms-and-conditions" });

    if (data && data.length > 0) {
      const { data: urlData } = supabase.storage
        .from("documents")
        .getPublicUrl(TC_FILE_PATH);
      setExisting(urlData.publicUrl);
    } else {
      setExisting(null);
    }
    setChecking(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast({ title: "Invalid file", description: "Please upload a PDF document.", variant: "destructive" });
      return;
    }

    setUploading(true);
    const { error } = await supabase.storage
      .from("documents")
      .upload(TC_FILE_PATH, file, { upsert: true });

    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "T&Cs uploaded", description: "Your Terms & Conditions will be attached to all PDF quotes and invoices." });
      await checkExisting();
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleDelete = async () => {
    const { error } = await supabase.storage
      .from("documents")
      .remove([TC_FILE_PATH]);

    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Removed", description: "T&Cs document has been removed." });
      setExisting(null);
    }
  };

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Terms & Conditions
        </CardTitle>
        <CardDescription>
          Upload a PDF of your T&Cs. It will be automatically appended to every quote and invoice PDF.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {checking ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Checking for existing document...
          </div>
        ) : existing ? (
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary" />
              <div>
                <p className="font-medium text-sm">Terms & Conditions PDF</p>
                <p className="text-xs text-muted-foreground">Currently attached to all quotes & invoices</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={existing} target="_blank" rel="noopener noreferrer">
                  <Download className="w-4 h-4 mr-1" />
                  View
                </a>
              </Button>
              <Button variant="ghost" size="sm" className="text-destructive" onClick={handleDelete}>
                <Trash2 className="w-4 h-4 mr-1" />
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground p-4 rounded-lg border border-dashed border-border text-center">
            No T&Cs document uploaded yet. Upload a PDF below.
          </div>
        )}

        <div>
          <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={handleUpload} />
          <Button
            variant="outline"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
            {uploading ? "Uploading..." : existing ? "Replace T&Cs PDF" : "Upload T&Cs PDF"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
