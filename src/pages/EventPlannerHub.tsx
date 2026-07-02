// Event Planner Hub - Phase 1, 2, 3 integrated experience
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AiEventPlannerWithAvatar } from "@/components/planner/AiEventPlannerWithAvatar";
import { Loader2 } from "lucide-react";

/**
 * Route: /event-planner/:quoteId
 * Integrated AI event planning with avatar, voice, and chat
 */
export function EventPlannerHub() {
  const { quoteId } = useParams<{ quoteId: string }>();
  const { user, profile, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Require authentication
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?redirect=/event-planner");
    }
  }, [authLoading, user, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-muted-foreground">Loading planner...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile?.id || !quoteId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="text-center text-muted-foreground">
          <p>Invalid session or quote</p>
        </div>
      </div>
    );
  }

  return <AiEventPlannerWithAvatar eventId={quoteId} clientId={profile.id} />;
}

export default EventPlannerHub;
