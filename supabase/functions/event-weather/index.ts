import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

// Free Open-Meteo forecast + geocoding — no API key required
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { venue, date } = await req.json();
    if (!venue) {
      return new Response(JSON.stringify({ error: "venue required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Geocode
    const geo = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(venue)}&count=1&language=en&format=json`
    );
    const geoJson = await geo.json();
    const loc = geoJson?.results?.[0];
    if (!loc) {
      return new Response(JSON.stringify({ error: "location_not_found" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const targetDate = date ? new Date(date) : new Date();
    const daysAhead = Math.round((targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    const forecast = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code&timezone=auto&forecast_days=${Math.min(Math.max(daysAhead + 1, 1), 16)}`
    );
    const fc = await forecast.json();

    const idx = Math.min(Math.max(daysAhead, 0), (fc?.daily?.time?.length || 1) - 1);
    const result = {
      location: `${loc.name}${loc.admin1 ? ", " + loc.admin1 : ""}`,
      date: fc?.daily?.time?.[idx] || null,
      tempMax: fc?.daily?.temperature_2m_max?.[idx] ?? null,
      tempMin: fc?.daily?.temperature_2m_min?.[idx] ?? null,
      precipitation: fc?.daily?.precipitation_probability_max?.[idx] ?? null,
      weatherCode: fc?.daily?.weather_code?.[idx] ?? null,
      isForecastAvailable: daysAhead >= 0 && daysAhead <= 15,
      daysAhead,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
