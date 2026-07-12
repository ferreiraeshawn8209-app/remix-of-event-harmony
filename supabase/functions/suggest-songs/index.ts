import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod';

const BodySchema = z.object({
  event_type: z.string().optional(),
  genres: z.string().optional(),
  moment: z.string().optional(), // e.g. "first dance", "dinner", "peak dance floor"
  vibe: z.string().optional(),
  count: z.number().min(1).max(30).optional(),
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
  const { event_type = 'party', genres = '', moment = '', vibe = '', count = 12 } = parsed.data;

  const prompt = `You are a professional DJ curating a playlist for a ${event_type}.
${genres ? `Preferred genres: ${genres}.` : ''}
${moment ? `This is for this moment of the event: ${moment}.` : ''}
${vibe ? `Overall vibe: ${vibe}.` : ''}
Suggest ${count} popular, dance-floor-tested songs that fit. Mix classic crowd-pleasers with some fresh picks.
Return ONLY a JSON array (no markdown, no commentary) of objects with shape:
[{"title":"Song Title","artist":"Artist Name","year":2020,"why":"one short reason"}]`;

  const gwResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [
        { role: 'system', content: 'You are an expert DJ. You reply with valid JSON only.' },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!gwResp.ok) {
    const text = await gwResp.text();
    console.error('AI gateway error', gwResp.status, text);
    if (gwResp.status === 429) {
      return new Response(JSON.stringify({ error: 'AI is busy — try again in a few seconds.' }), {
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
  // Try to isolate JSON array
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  let songs: unknown = [];
  try { songs = JSON.parse(jsonMatch ? jsonMatch[0] : raw); } catch { songs = []; }

  return new Response(JSON.stringify({ songs }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
