import { useCallback, useEffect, useMemo, useState } from "react";
import { CloudSun, Loader2, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

interface EventWeatherCardProps {
  eventDate?: string | null;
  locationHint?: string | null;
}

type ForecastData = {
  name: string;
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
  };
};

const WEATHER_LABELS: Record<number, string> = {
  0: "Clear",
  1: "Mostly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  51: "Drizzle",
  61: "Rain",
  71: "Snow",
  80: "Showers",
  95: "Thunderstorm",
};

export function EventWeatherCard({ eventDate, locationHint }: EventWeatherCardProps) {
  const [location, setLocation] = useState(locationHint?.trim() || "Pretoria");
  const [loading, setLoading] = useState(false);
  const [forecast, setForecast] = useState<ForecastData | null>(null);

  useEffect(() => {
    if (locationHint?.trim()) {
      setLocation(locationHint.trim());
    }
  }, [locationHint]);

  const fetchForecast = useCallback(async () => {
    const target = location.trim();
    if (!target) return;
    setLoading(true);
    try {
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(target)}&count=1`,
      );
      const geo = await geoRes.json();
      if (!geo.results?.[0]) throw new Error("Location not found.");
      const { latitude, longitude, name } = geo.results[0];
      const forecastRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code&timezone=auto&forecast_days=16`,
      );
      const payload = await forecastRes.json();
      setForecast({ name, daily: payload.daily });
    } catch (error: any) {
      toast({
        title: "Weather unavailable",
        description: error?.message || "Unable to load weather right now.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [location]);

  useEffect(() => {
    void fetchForecast();
  }, [fetchForecast]);

  const eventIndex = useMemo(() => {
    if (!eventDate || !forecast?.daily?.time) return -1;
    return forecast.daily.time.indexOf(eventDate);
  }, [eventDate, forecast]);

  return (
    <Card variant="glass" className="border-primary/30 bg-gradient-to-br from-[#1a0933]/85 to-[#1a0d24]/70">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <CloudSun className="w-4 h-4 text-primary" />
          Event Day Weather
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Venue city"
            className="bg-background/40"
          />
          <Button onClick={fetchForecast} disabled={loading} size="sm">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
          </Button>
        </div>

        {forecast && (
          <>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-accent" />
              Forecast for <strong>{forecast.name}</strong>
            </p>

            {eventIndex >= 0 ? (
              <div className="rounded-xl border border-primary/30 p-3 bg-background/30">
                <p className="text-xs text-muted-foreground">Your event day</p>
                <p className="text-lg font-semibold text-primary">
                  {WEATHER_LABELS[forecast.daily.weather_code[eventIndex]] || "Forecast available"}
                </p>
                <p className="text-sm">
                  {Math.round(forecast.daily.temperature_2m_min[eventIndex])}°–{Math.round(forecast.daily.temperature_2m_max[eventIndex])}°C
                  {" • "}
                  {forecast.daily.precipitation_probability_max[eventIndex]}% rain
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-border p-3 bg-background/20 text-sm text-muted-foreground">
                The event date is outside the current forecast range. Check again closer to your date.
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
