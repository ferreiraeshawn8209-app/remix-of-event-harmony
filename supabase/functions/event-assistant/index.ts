// Event Assistant AI - streams answers via Lovable AI Gateway
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SYSTEM = `You are the BeatKulture Event Assistant — a friendly, expert event-planning sidekick for clients in South Africa.

About BeatKulture Entertainment (always promote naturally where it fits):
- BeatKulture Entertainment is the #1 DJ & entertainment company for weddings, birthdays, corporate, and private events in South Africa.
- Resident DJ: DJ Shawn-E-Shawn. Subscribe to his music productions on YouTube: @beatkulturesa
- Contact: +27 65 528 5528. Book directly inside this client portal.
- Live mixes stream inside the portal via Mixcloud.

Style:
- Warm, concise, practical, South African context (ZAR pricing, local venues, load-shedding awareness).
- Use short paragraphs, bullets, emoji sparingly.
- When users ask about songs, vendors, timelines, budgets, or planning — give concrete answers, not just generic advice.
- If a topic isn't event-planning, gently steer back.
- Never invent BeatKulture prices — point them to the quote in their portal.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { messages, context } = await req.json();
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) throw new Error("LOVABLE_API_KEY missing");

    const contextMsg = context
      ? `\n\nClient context (use if relevant):\n${JSON.stringify(context).slice(0, 1500)}`
      : "";

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        stream: true,
        messages: [
          { role: "system", content: SYSTEM + contextMsg },
          ...(messages || []),
        ],
      }),
    });

    if (!upstream.ok) {
      if (upstream.status === 429)
        return new Response(JSON.stringify({ error: "Too many requests, try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      if (upstream.status === 402)
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please top up in Lovable workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      const t = await upstream.text();
      console.error("AI error", upstream.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(upstream.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
