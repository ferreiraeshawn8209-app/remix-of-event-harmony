import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CalendarClock,
  CheckCircle2,
  Cloud,
  CloudRain,
  Sun,
  CloudSun,
  Music2,
  CreditCard,
  Sparkles,
  ArrowRight,
  ListChecks,
  Bell,
} from "lucide-react";
import ClientLayout from "@/components/client/ClientLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useQuotes } from "@/hooks/useQuotes";
import { supabase } from "@/integrations/supabase/client";

interface Weather {
  location: string;
  date: string | null;
  tempMax: number | null;
  tempMin: number | null;
  precipitation: number | null;
  weatherCode: number | null;
  isForecastAvailable: boolean;
  daysAhead: number;
  error?: string;
}

interface Alarm {
  id: string;
  title: string;
  due_at: string;
  is_done: boolean;
  category: string;
}

const weatherIcon = (code: number | null) => {
  if (code === null) return CloudSun;
  if (code === 0) return Sun;
  if (code < 50) return CloudSun;
  if (code < 70) return CloudRain;
  return Cloud;
};

export default function ClientDashboard() {
  const { profile } = useAuth();
  const { quotes } = useQuotes();
  const [weather, setWeather] = useState<Weather | null>(null);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [planStatus, setPlanStatus] = useState<string | null>(null);

  const activeQuote = useMemo(
    () =>
      quotes.find((q) => ["accepted", "paid"].includes(q.status || "")) ||
      quotes.find((q) => !["declined", "rejected", "cancelled"].includes(q.status || "")),
    [quotes]
  );

  const eventDate = activeQuote?.event_date || profile?.event_date || null;
  const venue = activeQuote?.venue || profile?.venue_name || profile?.venue_address || null;

  // Weather
  useEffect(() => {
    if (!venue) return;
    supabase.functions
      .invoke("event-weather", { body: { venue, date: eventDate } })
      .then(({ data }) => setWeather(data as Weather))
      .catch(() => {});
  }, [venue, eventDate]);

  // Alarms + plan status
  useEffect(() => {
    if (!activeQuote?.id) return;
    supabase
      .from("alarms" as any)
      .select("id,title,due_at,is_done,category")
      .eq("quote_id", activeQuote.id)
      .eq("is_done", false)
      .order("due_at")
      .limit(5)
      .then(({ data }) => setAlarms((data as unknown as Alarm[]) || []));
    supabase
      .from("event_plans" as any)
      .select("status")
      .eq("quote_id", activeQuote.id)
      .maybeSingle()
      .then(({ data }) => setPlanStatus((data as any)?.status || null));
  }, [activeQuote?.id]);

  // Countdown
  const countdown = useMemo(() => {
    if (!eventDate) return null;
    const diff = new Date(eventDate).getTime() - Date.now();
    if (isNaN(diff)) return null;
    const days = Math.floor(diff / 86_400_000);
    const hours = Math.floor((diff % 86_400_000) / 3_600_000);
    return { days, hours, past: diff < 0 };
  }, [eventDate]);

  // Progress: 25 quote accepted + 25 deposit + 30 planner submitted + 20 songs (we approximate)
  const progress = useMemo(() => {
    let p = 0;
    if (activeQuote && ["accepted", "paid"].includes(activeQuote.status || "")) p += 25;
    if (activeQuote?.deposit_paid) p += 25;
    if (planStatus === "submitted") p += 30;
    else if (planStatus === "draft") p += 10;
    if (activeQuote?.balance_paid) p += 20;
    return p;
  }, [activeQuote, planStatus]);

  const tasks: { label: string; href: string; done: boolean }[] = [
    { label: "Accept your quote", href: activeQuote ? `/quote/${activeQuote.id}` : "/client/event-hub", done: !!activeQuote && ["accepted", "paid"].includes(activeQuote.status || "") },
    { label: "Pay 30% deposit", href: activeQuote ? `/quote/${activeQuote.id}` : "/client/payments", done: !!activeQuote?.deposit_paid },
    { label: "Complete Music Planner", href: "/client/planner", done: planStatus === "submitted" },
    { label: "Add song selections (min 50)", href: "/client/planner", done: false },
    { label: "Settle balance", href: "/client/payments", done: !!activeQuote?.balance_paid },
  ];

  const WIcon = weatherIcon(weather?.weatherCode ?? null);

  return (
    <ClientLayout
      title={`Welcome back${profile?.full_name ? ", " + profile.full_name.split(" ")[0] : ""}`}
      subtitle="Your event command centre"
    >
      <div className="space-y-4">
        {/* Top row: countdown + status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-4 border-primary/30 bg-gradient-to-br from-primary/10 via-background to-accent/10">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <CalendarClock className="w-4 h-4" /> Event countdown
              </div>
              {countdown ? (
                countdown.past ? (
                  <p className="text-2xl font-bold text-gradient-neon">Event day passed 🎉</p>
                ) : (
                  <p className="text-3xl font-bold text-gradient-neon">
                    {countdown.days}d <span className="text-lg text-muted-foreground">{countdown.hours}h</span>
                  </p>
                )
              ) : (
                <p className="text-sm text-muted-foreground">Set your event date to see countdown.</p>
              )}
              {eventDate && (
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(eventDate).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </p>
              )}
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card className="p-4 border-primary/30">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <CheckCircle2 className="w-4 h-4" /> Event status
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant={activeQuote ? "default" : "outline"}>
                  Quote {activeQuote?.status || "none"}
                </Badge>
                {activeQuote?.deposit_paid && <Badge className="bg-success text-success-foreground">Deposit paid</Badge>}
                {activeQuote?.balance_paid && <Badge className="bg-success text-success-foreground">Balance paid</Badge>}
                {planStatus && <Badge variant="secondary">Planner {planStatus}</Badge>}
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Completion</span>
                  <span className="font-semibold">{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="p-4 border-accent/30 bg-gradient-to-br from-accent/10 to-background">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <WIcon className="w-4 h-4" /> Weather forecast
              </div>
              {!venue ? (
                <p className="text-sm text-muted-foreground">Add a venue to see forecast.</p>
              ) : weather?.error || (weather && !weather.date) ? (
                <p className="text-sm text-muted-foreground">Couldn't locate venue for forecast.</p>
              ) : weather?.isForecastAvailable === false ? (
                <p className="text-sm text-muted-foreground">Forecast available closer to date.</p>
              ) : weather ? (
                <div>
                  <p className="text-2xl font-bold">
                    {weather.tempMax}° / {weather.tempMin}°
                  </p>
                  <p className="text-xs text-muted-foreground">{weather.location}</p>
                  <p className="text-xs text-muted-foreground">
                    {weather.precipitation}% chance of rain
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Loading…</p>
              )}
            </Card>
          </motion.div>
        </div>

        {/* Tasks + Reminders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card className="p-4 border-primary/20">
            <div className="flex items-center gap-2 mb-3">
              <ListChecks className="w-4 h-4 text-primary" />
              <h2 className="font-semibold">Outstanding tasks</h2>
            </div>
            <ul className="space-y-2">
              {tasks.filter((t) => !t.done).slice(0, 5).map((t) => (
                <li key={t.label}>
                  <Link
                    to={t.href}
                    className="flex items-center justify-between text-sm rounded-md px-2 py-2 hover:bg-primary/10 transition"
                  >
                    <span>{t.label}</span>
                    <ArrowRight className="w-3 h-3 text-primary" />
                  </Link>
                </li>
              ))}
              {tasks.every((t) => t.done) && (
                <li className="text-sm text-muted-foreground">All caught up 🎉</li>
              )}
            </ul>
          </Card>

          <Card className="p-4 border-primary/20">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="w-4 h-4 text-primary" />
              <h2 className="font-semibold">Upcoming reminders</h2>
            </div>
            {alarms.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming reminders.</p>
            ) : (
              <ul className="space-y-2">
                {alarms.map((a) => (
                  <li key={a.id} className="text-sm border-l-2 border-primary/50 pl-2">
                    <p className="font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(a.due_at).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* Quick actions */}
        <Card className="p-4 border-accent/30">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" /> Quick actions
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Button asChild variant="outline" className="h-auto py-3 flex-col gap-1">
              <Link to="/client/event-hub">
                <CalendarClock className="w-5 h-5" />
                <span className="text-xs">View quote</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-3 flex-col gap-1">
              <Link to="/client/planner">
                <Music2 className="w-5 h-5" />
                <span className="text-xs">Music planner</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-3 flex-col gap-1">
              <Link to="/client/payments">
                <CreditCard className="w-5 h-5" />
                <span className="text-xs">Payments</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-3 flex-col gap-1">
              <Link to="/client/ai">
                <Sparkles className="w-5 h-5" />
                <span className="text-xs">AI companion</span>
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </ClientLayout>
  );
}
