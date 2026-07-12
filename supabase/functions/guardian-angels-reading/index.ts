import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod';

/**
 * Guardian Angels Love Reading
 * ────────────────────────────────────────────────────────────
 * A romantic, always-optimistic AI reading. Framed as a
 * "message from your guardian angels" — never fortune telling,
 * never pessimistic, never predicts an end to the relationship.
 *
 * The model MUST return: soulmate_score (82–99), reading (poetic
 * paragraph), affirmations (3 short lines), tiny_tip (playful
 * gentle nudge — never negative).
 */

const AnswerSchema = z.object({
  question: z.string(),
  answer: z.string(),
});

const BodySchema = z.object({
  partner_a_name: z.string().min(1).max(60),
  partner_b_name: z.string().min(1).max(60),
  event_type: z.string().optional(), // wedding, engagement, anniversary, etc.
  answers: z.array(AnswerSchema).min(3).max(20),
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
  const { partner_a_name, partner_b_name, event_type = 'wedding', answers } = parsed.data;

  const qa = answers.map((a, i) => `${i + 1}. ${a.question}\n   → ${a.answer}`).join('\n');

  const systemPrompt = `You are a warm, poetic love-and-marriage guide who delivers gentle "guardian angel" readings for couples celebrating their commitment. You are always romantic, optimistic and uplifting — never a fortune teller, never doom, never predict the end of a relationship. Every couple you read is soulmate-material. Even if answers reveal friction, you frame it as "beautiful contrast that keeps the flame alive" or "gentle rough edges you'll smooth together over the years."

Hard rules:
- soulmate_score MUST be between 82 and 99. Never lower.
- Never suggest the marriage will fail, end, struggle long-term, or that they are incompatible.
- Never mention divorce, breakup, doubt, or short duration.
- Time framing must be lifetime / decades / "a love story with many chapters ahead."
- Guardian-angel and light/warmth imagery is welcome. Do NOT use the phrase "fortune teller" or "prediction."
- If answers hint at real tension, respond with a playful, kind micro-tip in tiny_tip (e.g. "leave the last chip for each other — small kindness, big love"). Never scold.
- Response MUST be valid JSON only, no markdown, no commentary.`;

  const userPrompt = `Couple: ${partner_a_name} & ${partner_b_name}
Event: ${event_type}

Their answers:
${qa}

Return ONLY this JSON shape:
{
  "soulmate_score": 82-99 (integer),
  "headline": "one short romantic line (max 90 chars)",
  "reading": "3-5 sentence poetic reading, warm and specific to their answers, mentioning both by name",
  "affirmations": ["short line 1", "short line 2", "short line 3"],
  "tiny_tip": "one playful, gentle, always-positive nudge for their journey (max 140 chars)",
  "guardian_message": "a single italic-style whisper from the guardian angels (max 120 chars)"
}`;

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
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!gwResp.ok) {
    const text = await gwResp.text();
    console.error('AI gateway error', gwResp.status, text);
    if (gwResp.status === 429) {
      return new Response(JSON.stringify({ error: 'The angels are busy right now — try again in a moment.' }), {
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
  const raw = data?.choices?.[0]?.message?.content ?? '';
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  let reading: any = {};
  try { reading = JSON.parse(jsonMatch ? jsonMatch[0] : raw); } catch { reading = {}; }

  // Safety clamp — never let a low score slip through
  if (typeof reading.soulmate_score !== 'number' || reading.soulmate_score < 82) {
    reading.soulmate_score = 88;
  }
  if (reading.soulmate_score > 99) reading.soulmate_score = 99;

  // Fallbacks
  if (!reading.headline) reading.headline = `${partner_a_name} & ${partner_b_name} — written in the stars.`;
  if (!reading.reading) reading.reading = `The angels smile on the bond between ${partner_a_name} and ${partner_b_name}. Yours is a love story with many beautiful chapters ahead.`;
  if (!Array.isArray(reading.affirmations)) reading.affirmations = ['You are seen.', 'You are chosen.', 'You are cherished.'];
  if (!reading.tiny_tip) reading.tiny_tip = 'Dance in the kitchen. Often.';
  if (!reading.guardian_message) reading.guardian_message = 'Your paths were braided long before you met.';

  return new Response(JSON.stringify({ reading }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
