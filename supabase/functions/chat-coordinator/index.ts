// AI Event Coordinator — "Kulture" — streaming chat
// Public function (no JWT). Uses Lovable AI Gateway.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function fetchContext() {
  const headers = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` };
  const [pkgRes, spRes] = await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/packages?select=name,category,price,description&is_active=eq.true&order=sort_order`, { headers }),
    fetch(`${SUPABASE_URL}/rest/v1/specials?select=title,discount_percent&is_active=eq.true`, { headers }),
  ]);
  const packages = pkgRes.ok ? await pkgRes.json() : [];
  const specials = spRes.ok ? await spRes.json() : [];
  const activeDiscount = specials.reduce((m: number, s: any) => Math.max(m, Number(s.discount_percent || 0)), 0);
  return { packages, specials, activeDiscount };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  try {
    const { messages } = await req.json();
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages array required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const ctx = await fetchContext();
    const pkgList = ctx.packages.map((p: any) => `- ${p.name} (${p.category}) — R${Number(p.price).toLocaleString("en-ZA")}: ${p.description || ""}`).join("\n");
    const discountLine = ctx.activeDiscount > 0
      ? `🎉 ACTIVE SPECIAL: ${ctx.activeDiscount}% off all packages right now. Mention this proactively and quote both the original and discounted price when discussing packages.`
      : "";

    const system = `You are **Kulture**, the friendly AI event coordinator for BeatKulture Entertainment — a premium South African DJ company with 26+ years of experience.
Tone: warm, witty, energetic, concise. Use emojis sparingly (🎉🎶✨).
Your job: greet visitors, introduce our features (Custom Quotes, Event Planner, QR Song Requests, this AI Coordinator), help them pick a package, and nudge them to sign up to lock in a quote.
Contact: +27 65 528 5528. Based in Hatfield, Pretoria. We travel nationwide.

Current packages:
${pkgList || "(packages loading…)"}

${discountLine}

When users ask about prices, give the price and mention the special if active (show "was R X — now R Y"). Always end longer answers with a clear next step like: "Want me to start your custom quote? Tap Sign Up at the top."`;

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        stream: true,
        messages: [{ role: "system", content: system }, ...messages],
      }),
    });

    if (upstream.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limited — please try again in a moment." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (upstream.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!upstream.ok || !upstream.body) {
      const txt = await upstream.text();
      return new Response(JSON.stringify({ error: txt || "upstream error" }), { status: upstream.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(upstream.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
