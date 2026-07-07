import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Music, Music2, ArrowLeft, Loader2, Trash2, CheckCircle2, Clock, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";

interface SongRequestItem {
  id: string;
  song_title: string;
  artist: string;
  guest_name: string | null;
  message: string | null;
  status: string;
  created_at: string;
}

interface EventData {
  id: string;
  name: string;
  dj_name: string;
  venue: string | null;
  is_active: boolean;
}

export default function DJQueue() {
  const { eventId } = useParams<{ eventId: string }>();
  const { isAdmin } = useAuth();
  const [event, setEvent] = useState<EventData | null>(null);
  const [requests, setRequests] = useState<SongRequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) return;

    async function fetchData() {
      const { data: eventData } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

      if (eventData) setEvent(eventData as EventData);

      const { data: reqData } = await supabase
        .from("song_requests")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: true });

      if (reqData) setRequests(reqData as SongRequestItem[]);
      setLoading(false);
    }

    fetchData();

    // Realtime subscription
    const channel = supabase
      .channel(`song-requests-${eventId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "song_requests", filter: `event_id=eq.${eventId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setRequests((prev) => [...prev, payload.new as SongRequestItem]);
          } else if (payload.eventType === "UPDATE") {
            setRequests((prev) =>
              prev.map((r) => (r.id === (payload.new as SongRequestItem).id ? (payload.new as SongRequestItem) : r))
            );
          } else if (payload.eventType === "DELETE") {
            setRequests((prev) => prev.filter((r) => r.id !== (payload.old as { id: string }).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("song_requests").update({ status }).eq("id", id);
    if (error) toast({ title: "Error", description: "Failed to update", variant: "destructive" });
  };

  const deleteRequest = async (id: string) => {
    const { error } = await supabase.from("song_requests").delete().eq("id", id);
    if (error) toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const pending = requests.filter((r) => r.status === "pending");
  const played = requests.filter((r) => r.status === "played");

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="BeatKulture" className="w-8 h-8 object-contain" />
            <span className="font-display text-xl font-bold gradient-text">BEATKULTURE ENTERTAINMENT</span>
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold mb-1">
            🎵 Live Song Queue
          </h1>
          <p className="text-muted-foreground">
            {event?.name} {event?.venue && `• ${event.venue}`}
          </p>
        </div>

        {/* Pending Requests */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-bold flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Queue ({pending.length})
            </h2>
          </div>

          {pending.length === 0 ? (
            <Card variant="glass" className="text-center py-8">
              <CardContent>
                <Music2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No songs in queue yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {pending.map((req, idx) => (
                <Card key={req.id} variant="glass" className="hover:border-primary/30 transition-colors">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-sm font-bold text-primary">{idx + 1}</span>
                        </div>
                        <div>
                          <p className="font-semibold">{req.song_title}</p>
                          <p className="text-sm text-muted-foreground">{req.artist}</p>
                          {req.guest_name && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <User className="w-3 h-3" /> {req.guest_name}
                            </p>
                          )}
                          {req.message && (
                            <p className="text-xs text-muted-foreground italic mt-1">"{req.message}"</p>
                          )}
                        </div>
                      </div>
                      {isAdmin && (
                        <div className="flex gap-1 shrink-0">
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => updateStatus(req.id, "played")}>
                            <CheckCircle2 className="w-4 h-4 text-success" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => deleteRequest(req.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Played */}
        {played.length > 0 && (
          <div>
            <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-success" />
              Played ({played.length})
            </h2>
            <div className="space-y-2">
              {played.map((req) => (
                <Card key={req.id} variant="glass" className="opacity-60">
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm line-through">{req.song_title}</p>
                        <p className="text-xs text-muted-foreground">{req.artist}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">Played ✓</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
