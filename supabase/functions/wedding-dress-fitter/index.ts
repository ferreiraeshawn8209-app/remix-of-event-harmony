import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod';

/**
 * wedding-dress-fitter
 * Takes a client photo (base64) + a style prompt and returns an AI-generated
 * try-on / dress-design image via the Lovable AI Gateway.
 */

const BodySchema = z.object({
  image_base64: z.string().min(50), // data URL or raw base64
  mime_type: z.string().default('image/png'),
  style_prompt: z.string().min(3).max(1000),
  mode: z.enum(['fit', 'design']).default('fit'),
});

function stripDataUrl(b64: string): string {
  const idx = b64.indexOf('base64,');
  return idx === -1 ? b64 : b64.slice(idx + 'base64,'.length);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const key = Deno.env.get('LOVABLE_API_KEY');
  if (!key) {
    return new Response(JSON.stringify({ error: 'AI is not configured' }), {
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
  const { image_base64, mime_type, style_prompt, mode } = parsed.data;
  const clean = stripDataUrl(image_base64);

  const instruction = mode === 'design'
    ? `Design a bespoke wedding dress on the person in this photo. ${style_prompt}. Preserve the person's face, skin tone, hair and pose exactly. Photorealistic, high fashion editorial lighting, full body if possible.`
    : `Digitally try on this wedding dress style on the person in the photo: ${style_prompt}. Keep the person's face, skin tone, hair and pose exactly the same. Only replace the clothing with the described wedding dress. Photorealistic, boutique lighting.`;

  const gw = await fetch('https://ai.gateway.lovable.dev/v1/images/generations', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'google/gemini-3.1-flash-image',
      messages: [
        { role: 'user', content: [
          { type: 'text', text: instruction },
          { type: 'image_url', image_url: { url: `data:${mime_type};base64,${clean}` } },
        ]},
      ],
      modalities: ['image', 'text'],
    }),
  });

  if (!gw.ok) {
    const text = await gw.text();
    console.error('dress-fitter gateway error', gw.status, text);
    const status = gw.status === 429 ? 429 : gw.status === 402 ? 402 : 500;
    const msg = status === 429 ? 'AI is busy, try again in a moment'
      : status === 402 ? 'AI credits exhausted' : 'Image generation failed';
    return new Response(JSON.stringify({ error: msg }), {
      status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const data = await gw.json();
  const b64 = data?.data?.[0]?.b64_json;
  if (!b64) {
    return new Response(JSON.stringify({ error: 'No image returned', debug: data }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  return new Response(JSON.stringify({ image_base64: b64, mime_type: 'image/png' }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
