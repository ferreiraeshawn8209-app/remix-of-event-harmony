import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AlarmOut {
  title: string;
  description: string;
  due_at: string; // ISO
  stage: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { category, quote_id, quote_request_id } = await req.json();
    if (!["followup_quoted", "followup_request", "event_prep"].includes(category)) {
      return new Response(JSON.stringify({ error: "invalid category" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Load context
    let ctx: any = {};
    let client_name = "";
    let client_email = "";
    if (quote_id) {
      const { data } = await supabase.from("quotes").select("*").eq("id", quote_id).maybeSingle();
      if (data) {
        ctx = data;
        client_name = data.client_name;
        client_email = data.email;
      }
    } else if (quote_request_id) {
      const { data } = await supabase.from("quote_requests").select("*").eq("id", quote_request_id).maybeSingle();
      if (data) {
        ctx = data;
        client_name = data.client_name;
        client_email = data.email;
      }
    }

    // Avoid duplicates: clear undone alarms for same context+category
    const delQuery = supabase.from("alarms").delete().eq("category", category).eq("is_done", false);
    if (quote_id) await delQuery.eq("quote_id", quote_id);
    else if (quote_request_id) await delQuery.eq("quote_request_id", quote_request_id);

    const nowIso = new Date().toISOString();
    const eventDate = ctx.event_date ?? null;

    const systemPrompt = `You are a sales-ops & event-production assistant for BeatKulture Entertainment (DJ/sound/lighting in South Africa). Generate scheduled reminders following proven sales follow-up cadences and event-production best practices. Output dates in ISO 8601 (UTC). Today is ${nowIso}.`;

    let userPrompt = "";
    if (category === "followup_quoted") {
      userPrompt = `A quote was sent to ${client_name} (${client_email}) for a ${ctx.event_type ?? "event"}${eventDate ? ` on ${eventDate}` : ""} totaling R${ctx.total ?? 0}. Generate a proven multi-touch follow-up cadence (typically 3-5 touches over ~14 days, front-loaded). Stop cadence before event date. Each item: short title, what to do/say, due_at ISO timestamp during business hours (09:00-17:00 SAST), stage 1..N.`;
    } else if (category === "followup_request") {
      userPrompt = `A quote REQUEST was received from ${client_name} (${client_email}) for ${ctx.event_type ?? "an event"}${eventDate ? ` on ${eventDate}` : ""}. They have NOT yet been quoted. Generate fast-response reminders so this lead is not forgotten: acknowledge within hours, send quote within 24h, then chase if no quote sent. Use SAST business hours.`;
    } else {
      // event_prep
      const equip = ctx.equipment ?? {};
      userPrompt = `A booked event for ${client_name} on ${eventDate ?? "TBD"} at ${ctx.venue ?? "TBD"}. Travel distance ${ctx.travel_distance ?? 0}km. Hours ${ctx.hours ?? 0}. Equipment: ${JSON.stringify(equip)}. Custom items: ${JSON.stringify(ctx.custom_items ?? [])}. Generate staged production-prep reminders working backwards from event date: e.g. confirm venue layout & power 14d out, cable/extension cord audit based on venue size, pack-list 3d, vehicle load 1d, final client confirmation 2d. Tailor each task to the actual equipment & travel. Each must be tickable. Use SAST business hours. Skip stages already in the past.`;
    }

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "create_alarms",
            description: "Create alarm reminders",
            parameters: {
              type: "object",
              properties: {
                reasoning: { type: "string", description: "Why this cadence/stages were chosen" },
                alarms: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      description: { type: "string" },
                      due_at: { type: "string", description: "ISO 8601 UTC timestamp" },
                      stage: { type: "number" },
                    },
                    required: ["title", "description", "due_at", "stage"],
                  },
                },
              },
              required: ["alarms", "reasoning"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "create_alarms" } },
      }),
    });

    if (!aiRes.ok) {
      const txt = await aiRes.text();
      console.error("AI gateway error", aiRes.status, txt);
      if (aiRes.status === 429) return new Response(JSON.stringify({ error: "Rate limit, try again shortly" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiRes.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: "AI error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiJson = await aiRes.json();
    const args = aiJson.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const parsed = typeof args === "string" ? JSON.parse(args) : args;
    const alarms: AlarmOut[] = parsed?.alarms ?? [];
    const reasoning: string = parsed?.reasoning ?? "";

    if (!alarms.length) {
      return new Response(JSON.stringify({ inserted: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const rows = alarms.map((a) => ({
      category,
      title: a.title,
      description: a.description,
      due_at: a.due_at,
      stage: a.stage ?? 1,
      quote_id: quote_id ?? null,
      quote_request_id: quote_request_id ?? null,
      client_name,
      client_email,
      ai_reasoning: reasoning,
    }));

    const { error: insErr, data: ins } = await supabase.from("alarms").insert(rows).select();
    if (insErr) throw insErr;

    return new Response(JSON.stringify({ inserted: ins?.length ?? 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-alarms error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
