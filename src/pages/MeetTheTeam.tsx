import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users } from "lucide-react";
import { StaffDirectory } from "@/components/StaffDirectory";
import { PageBackground } from "@/components/PageBackground";

export default function MeetTheTeam() {
  return (
    <div className="min-h-screen relative">
      <PageBackground page="landing" />
      <div className="relative z-10 container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <Button asChild variant="ghost" size="sm">
            <Link to="/"><ArrowLeft className="w-4 h-4 mr-1" /> Home</Link>
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="w-4 h-4 text-primary" /> BeatKulture Team
          </div>
        </div>

        <div className="text-center space-y-2 mb-8">
          <h1 className="text-3xl sm:text-5xl font-bold gradient-text drop-shadow-[0_0_24px_hsl(280_95%_60%/0.6)]">
            Meet the BeatKulture Family
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            The DJs, coordinators, and crew behind every unforgettable BeatKulture event. Pick your favourite DJ, chat with them directly on WhatsApp, or request them for your booking.
          </p>
        </div>

        <StaffDirectory />
      </div>
    </div>
  );
}
