import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { DatabaseQuote } from "@/hooks/useQuotes";
import { formatCurrency } from "@/lib/pricing";
import { Calendar as CalendarIcon, Clock, MapPin, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarBookingsProps {
  quotes: DatabaseQuote[];
}

const statusCardColors: Record<string, string> = {
  accepted: "border-l-4 border-l-success bg-success/5",
  paid: "border-l-4 border-l-primary bg-primary/5",
  "deposit-paid": "border-l-4 border-l-secondary bg-secondary/5",
  sent: "border-l-4 border-l-blue-400 bg-blue-400/5",
};

export function CalendarBookings({ quotes }: CalendarBookingsProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  // Booked = accepted, paid, or deposit paid
  const bookedQuotes = useMemo(
    () => quotes.filter(q => q.event_date && (q.status === "accepted" || q.status === "paid" || q.deposit_paid)),
    [quotes]
  );

  const eventDates = useMemo(() => {
    const dates: Date[] = [];
    bookedQuotes.forEach(q => {
      if (q.event_date) dates.push(new Date(q.event_date + "T00:00:00"));
    });
    return dates;
  }, [bookedQuotes]);

  const selectedDateStr = selectedDate?.toISOString().split("T")[0];
  const eventsForDate = selectedDate
    ? bookedQuotes.filter(q => q.event_date === selectedDateStr)
    : [];

  // All upcoming events sorted
  const upcomingEvents = useMemo(
    () => bookedQuotes
      .filter(q => new Date(q.event_date!) >= new Date(new Date().toDateString()))
      .sort((a, b) => new Date(a.event_date!).getTime() - new Date(b.event_date!).getTime()),
    [bookedQuotes]
  );

  const modifiers = { booked: eventDates };
  const modifiersStyles = {
    booked: { backgroundColor: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))", borderRadius: "50%" },
  };

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Calendar */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary" />
              Event Calendar
            </CardTitle>
            <CardDescription>Click a highlighted date to see bookings</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
              className={cn("p-3 pointer-events-auto")}
            />
          </CardContent>
        </Card>

        {/* Selected Date Details */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle>
              {selectedDate
                ? `Events on ${selectedDate.toLocaleDateString("en-ZA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`
                : "Select a Date"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedDate ? (
              <p className="text-muted-foreground text-sm py-8 text-center">Click a date on the calendar to view events.</p>
            ) : eventsForDate.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">No events booked for this date.</p>
            ) : (
              <div className="space-y-3">
                {eventsForDate.map(q => (
                  <div key={q.id} className={cn("p-4 rounded-lg", statusCardColors[q.deposit_paid ? "deposit-paid" : q.status || "sent"])}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{q.client_name}</span>
                      <Badge variant="outline">{q.event_type || "Event"}</Badge>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {q.venue && <div className="flex items-center gap-1"><MapPin className="w-3 h-3" />{q.venue}</div>}
                      {q.start_time && <div className="flex items-center gap-1"><Clock className="w-3 h-3" />{q.start_time.slice(0, 5)} - {q.end_time?.slice(0, 5)}</div>}
                      {q.dj_name && <div className="flex items-center gap-1"><User className="w-3 h-3" />{q.dj_name}</div>}
                    </div>
                    <div className="mt-2 font-semibold text-primary">{formatCurrency(Number(q.total))}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events List */}
      <Card variant="glass">
        <CardHeader>
          <CardTitle>Upcoming Bookings</CardTitle>
          <CardDescription>{upcomingEvents.length} confirmed events coming up</CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingEvents.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No upcoming bookings.</p>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map(q => (
                <div key={q.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[50px]">
                      <div className="text-2xl font-bold text-primary">{new Date(q.event_date!).getDate()}</div>
                      <div className="text-xs text-muted-foreground uppercase">
                        {new Date(q.event_date!).toLocaleDateString("en-ZA", { month: "short" })}
                      </div>
                    </div>
                    <div>
                      <p className="font-medium">{q.client_name}</p>
                      <p className="text-sm text-muted-foreground">{q.event_type} • {q.venue || "TBD"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary">{formatCurrency(Number(q.total))}</p>
                    <Badge variant="outline" className={q.deposit_paid ? "text-success border-success/30" : "text-warning border-warning/30"}>
                      {q.deposit_paid ? "Deposit Paid" : q.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
