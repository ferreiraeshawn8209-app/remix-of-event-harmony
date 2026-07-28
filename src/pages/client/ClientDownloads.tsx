import ClientLayout from "@/components/client/ClientLayout";
import { MusicPlayer } from "@/components/MusicPlayer";
import { Card } from "@/components/ui/card";

export default function ClientDownloads() {
  return (
    <ClientLayout title="Downloads" subtitle="BeatKulture mixes & event assets">
      <div className="space-y-4">
        <Card className="p-4 border-primary/20">
          <h2 className="font-semibold mb-3">BeatKulture Mixes</h2>
          <p className="text-xs text-muted-foreground mb-3">
            Stream any mix. Downloads are enabled per track by the admin.
          </p>
          <MusicPlayer />
        </Card>
      </div>
    </ClientLayout>
  );
}
