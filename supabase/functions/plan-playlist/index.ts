import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { moment, event_type, event_date } = await req.json();

    const prompt = `Suggest 5 song picks for the "${moment}" moment of a ${event_type || "wedding/event"}${event_date ? ` on ${event_date}` : ""}. Return STRICT JSON only:
{"suggestions":[{"song_title":"...","artist":"...","cue_time_seconds":30,"notes":"why this fits"}]}
Mix classics and 2020s hits. Keep notes short (max 12 words). Reflect BeatKulture's South African wedding + party style.`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are Kulture, a South African wedding & event DJ from BeatKulture. Respond with JSON only." },
          { role: "user", content: prompt },
        ],
        temperature: 0.8,
      }),
    });

    if (resp.status === 429) return new Response(JSON.stringify({ error: "Rate limit" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (resp.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!resp.ok) return new Response(JSON.stringify({ error: `AI error ${resp.status}` }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const raw = await resp.json();
    const text: string = raw?.choices?.[0]?.message?.content || "";
    const match = text.match(/\{[\s\S]*\}/);
    let parsed: any = { suggestions: [] };
    if (match) { try { parsed = JSON.parse(match[0]); } catch { /* ignore */ } }
    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message || e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
