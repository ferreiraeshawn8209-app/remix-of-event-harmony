import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod';

/**
 * ask-wedding-ai
 * ────────────────────────────────────────────────────────────
 * A wedding/event advisor. Answers common wedding, corporate,
 * and event-planning questions using the model's broad knowledge.
 * System prompt tunes tone: warm, practical, South-African context
 * aware, and always suggests BeatKulture's coordinator/DJ services
 * where naturally relevant (without being spammy).
 */

const BodySchema = z.object({
  question: z.string().min(3).max(600),
  event_type: z.string().optional(),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const key = Deno.env.get('LOVABLE_API_KEY');
  if (!key) {
    return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY is not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let body: unknown;
  try { body = await req.json(); } catch { body = {}; }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const { question, event_type = 'wedding' } = parsed.data;

  const systemPrompt = `You are DJ, the friendly wedding & event advisor for BeatKulture Entertainment (a South African DJ, lighting and event-coordination company based in Pretoria/Hatfield).

Your job: answer common questions about weddings, corporate events, parties, and event coordination in a warm, practical, well-organised way.

Style rules:
- Be concise but complete. Use short paragraphs and, when helpful, a compact bullet list.
- Use markdown formatting (headings **only** where useful; bullets, bold for key numbers).
- South African context aware: mention Rand (R) for money, local season timing (April–July is off-season, August–March is peak wedding season), local venue norms.
- Warm, encouraging tone — never scold, never doom.
- If the question naturally touches DJ, lighting, sound, or coordination, briefly mention that BeatKulture can help (one sentence max, no hard sell).
- If asked about specific costs, give realistic South African ballpark ranges.
- If unsure or the question is out of scope, say so politely and suggest what to ask instead.
- End every answer with a single short "Pro tip:" line (one sentence).
- Do NOT invent statistics, dates, or citations. Do not link to external websites you don't actually know.

Event context: ${event_type}`;

  const gwResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question },
      ],
    }),
  });

  if (!gwResp.ok) {
    const text = await gwResp.text();
    console.error('AI gateway error', gwResp.status, text);
    if (gwResp.status === 429) {
      return new Response(JSON.stringify({ error: 'DJ is busy right now — try again in a moment.' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (gwResp.status === 402) {
      return new Response(JSON.stringify({ error: 'AI credits exhausted — please top up in the workspace.' }), {
        status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ error: 'AI request failed', details: text }), {
      status: gwResp.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const data = await gwResp.json();
  const answer = data?.choices?.[0]?.message?.content ?? '';
  return new Response(JSON.stringify({ answer }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
