import { PageBackground } from "@/components/PageBackground";
import { WeddingIdeasBoard } from "@/components/WeddingIdeasBoard";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function WeddingIdeasPage() {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <PageBackground pageKey="bg_client_portal" opacity={0.25} />
      <div className="container mx-auto px-4 py-6 relative z-10 max-w-6xl">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to="/client"><ArrowLeft className="w-4 h-4 mr-1" />Back to Dashboard</Link>
        </Button>
        <h1 className="font-display text-2xl sm:text-3xl font-bold mb-4 gradient-text">Wedding Ideas Board</h1>
        <WeddingIdeasBoard />
      </div>
    </div>
  );
}
