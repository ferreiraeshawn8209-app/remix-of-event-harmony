import { useMemo } from "react";
import ClientLayout from "@/components/client/ClientLayout";
import { RecommendedVenues } from "@/components/client/RecommendedVenues";
import WeddingIdeasBoard from "@/components/WeddingIdeasBoard";
import { ClientPhotoGallery } from "@/components/ClientPhotoGallery";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useQuotes } from "@/hooks/useQuotes";

export default function ClientTools() {
  const { quotes } = useQuotes();
  const activeQuote = useMemo(
    () => quotes.find((q) => ["accepted", "paid"].includes(q.status || "")),
    [quotes]
  );
  return (
    <ClientLayout title="Event Tools" subtitle="Venues, ideas & event photos">
      <Tabs defaultValue="venues" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="venues">Venues</TabsTrigger>
          <TabsTrigger value="ideas">Wedding Ideas</TabsTrigger>
          <TabsTrigger value="photos">Event Photos</TabsTrigger>
        </TabsList>
        <TabsContent value="venues">
          <RecommendedVenues />
        </TabsContent>
        <TabsContent value="ideas">
          <WeddingIdeasBoard />
        </TabsContent>
        <TabsContent value="photos">
          {activeQuote ? (
            <ClientPhotoGallery quoteId={activeQuote.id} />
          ) : (
            <Card className="p-6 text-center text-muted-foreground">
              Event photos unlock once your quote is accepted.
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </ClientLayout>
  );
}
