import "npm:@supabase/supabase-js@2";
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const CATEGORIES = [
  "wedding one-liner",
  "reception toast icebreaker",
  "father-of-the-bride pun",
  "best-man playful roast (clean)",
  "DJ / dance floor joke",
  "corporate event icebreaker",
  "romantic pun for a couple",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You are a warm South African wedding & event MC. Reply with ONE short, clean, family-safe joke (max 2 short sentences, under 220 chars). No preamble, no quotes, no emojis, no hashtags. Never offensive.",
          },
          { role: "user", content: `Give me a fresh ${category}. Make it punchy.` },
        ],
        temperature: 1.0,
        max_tokens: 120,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return new Response(JSON.stringify({ error: "AI error", status: res.status, details: body }), {
        status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const joke = (data?.choices?.[0]?.message?.content || "").trim().replace(/^["']|["']$/g, "");
    return new Response(JSON.stringify({ joke, category }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
