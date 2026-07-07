import { useParams, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { EngagementAnalyticsDashboard } from '@/components/analytics/EngagementAnalyticsDashboard';
import { Loader2 } from 'lucide-react';

export function EventAnalyticsPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-muted-foreground">Please sign in to view analytics.</p>
        </div>
      </div>
    );
  }

  if (!eventId) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-muted-foreground">Event ID not found.</p>
        </div>
      </div>
    );
  }

  return <EngagementAnalyticsDashboard eventId={eventId} />;
}
