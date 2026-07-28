import { useMemo } from "react";
import ClientLayout from "@/components/client/ClientLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useQuotes } from "@/hooks/useQuotes";
import { CalendarHeart, MapPin, Users, Clock, Pencil } from "lucide-react";

export default function ClientEventDetails() {
  const { profile } = useAuth();
  const { quotes } = useQuotes();
  const q = useMemo(
    () => quotes.find((x) => ["accepted", "paid"].includes(x.status || "")) || quotes[0],
    [quotes]
  );

  const fields = [
    { icon: CalendarHeart, label: "Event type", value: q?.event_type || profile?.event_type },
    { icon: CalendarHeart, label: "Date", value: q?.event_date || profile?.event_date },
    { icon: Clock, label: "Time", value: q?.start_time ? `${q.start_time} – ${q.end_time || "?"}` : profile?.start_time ? `${profile.start_time} – ${profile.end_time || "?"}` : null },
    { icon: MapPin, label: "Venue", value: q?.venue || profile?.venue_name },
    { icon: MapPin, label: "Address", value: profile?.venue_address },
    { icon: Users, label: "Guests", value: profile?.guest_count },
  ];

  return (
    <ClientLayout title="Event Details" subtitle="Everything we've captured for your event">
      <Card className="p-4 border-primary/20">
        <div className="flex justify-between items-start mb-4">
          <h2 className="font-semibold">Booking snapshot</h2>
          <Button size="sm" variant="outline" asChild>
            <Link to="/profile">
              <Pencil className="w-4 h-4 mr-1" /> Edit
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {fields.map((f) => (
            <div key={f.label} className="flex items-start gap-2 text-sm">
              <f.icon className="w-4 h-4 text-primary mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">{f.label}</p>
                <p className="font-medium">{f.value || <span className="text-muted-foreground">—</span>}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </ClientLayout>
  );
}
