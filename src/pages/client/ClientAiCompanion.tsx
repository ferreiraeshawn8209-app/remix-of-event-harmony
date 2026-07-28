import ClientLayout from "@/components/client/ClientLayout";
import { AiConciergeServices } from "@/components/client/AiConciergeServices";
import { GuardianAngelsReading } from "@/components/client/GuardianAngelsReading";
import { WeddingQnA } from "@/components/client/WeddingQnA";
import { JokePopup } from "@/components/JokePopup";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function ClientAiCompanion() {
  return (
    <ClientLayout title="AI Companion" subtitle="Concierge, readings, jokes & Q&A">
      <Tabs defaultValue="concierge" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="concierge">Concierge</TabsTrigger>
          <TabsTrigger value="qna">Wedding Q&A</TabsTrigger>
          <TabsTrigger value="angels">Guardian Angels</TabsTrigger>
          <TabsTrigger value="fun">Fun & Jokes</TabsTrigger>
        </TabsList>
        <TabsContent value="concierge">
          <AiConciergeServices />
        </TabsContent>
        <TabsContent value="qna">
          <WeddingQnA />
        </TabsContent>
        <TabsContent value="angels">
          <GuardianAngelsReading />
        </TabsContent>
        <TabsContent value="fun">
          <JokePopup />
        </TabsContent>
      </Tabs>
    </ClientLayout>
  );
}
