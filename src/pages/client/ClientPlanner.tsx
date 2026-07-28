import { useMemo } from "react";
import ClientLayout from "@/components/client/ClientLayout";
import { MusicPlanningForm } from "@/components/client/MusicPlanningForm";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useQuotes } from "@/hooks/useQuotes";

export default function ClientPlanner() {
  const { profile } = useAuth();
  const { quotes } = useQuotes();
  const activeQuote = useMemo(
    () =>
      quotes.find((q) => ["accepted", "paid"].includes(q.status || "")) || quotes[0],
    [quotes]
  );

  return (
    <ClientLayout title="Music Planner" subtitle="Timeline, song list, uploads">
      {!profile ? null : !activeQuote ? (
        <Card className="p-6 text-center text-muted-foreground">
          Music Planner unlocks after your quote is accepted.
        </Card>
      ) : (
        <MusicPlanningForm
          profileId={profile.id}
          clientName={profile.full_name}
          email={profile.email}
          quoteId={activeQuote.id}
        />
      )}
    </ClientLayout>
  );
}
