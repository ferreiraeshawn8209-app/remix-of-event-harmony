import { useEffect, useState } from "react";
import ClientLayout from "@/components/client/ClientLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { FileText, Download } from "lucide-react";

interface Attachment {
  id: string;
  file_name: string;
  file_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
}

export default function ClientDocuments() {
  const { profile } = useAuth();
  const [items, setItems] = useState<Attachment[]>([]);

  useEffect(() => {
    if (!profile?.id) return;
    supabase
      .from("plan_attachments" as any)
      .select("*")
      .eq("client_id", profile.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setItems((data as unknown as Attachment[]) || []));
  }, [profile?.id]);

  const download = async (path: string, name: string) => {
    const { data } = await supabase.storage.from("documents").createSignedUrl(path, 60);
    if (data?.signedUrl) {
      const a = document.createElement("a");
      a.href = data.signedUrl;
      a.download = name;
      a.click();
    }
  };

  return (
    <ClientLayout title="Documents" subtitle="Uploaded files & attachments">
      <div className="space-y-2">
        {items.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground">
            No documents uploaded yet. Add music files or references via the Music Planner.
          </Card>
        ) : (
          items.map((f) => (
            <Card key={f.id} className="p-3 flex items-center gap-3 border-primary/20">
              <FileText className="w-5 h-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{f.file_name}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(f.created_at).toLocaleDateString()} • {f.size_bytes ? `${(f.size_bytes / 1024 / 1024).toFixed(1)} MB` : "—"}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => download(f.file_path, f.file_name)}>
                <Download className="w-4 h-4" />
              </Button>
            </Card>
          ))
        )}
      </div>
    </ClientLayout>
  );
}
