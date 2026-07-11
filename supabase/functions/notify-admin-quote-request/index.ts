import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function parseFallbackEmails(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
}

function parseFallbackPhones(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function parseList(input: unknown): string[] {
  if (Array.isArray(input)) return input.map((item) => String(item || "").trim()).filter(Boolean);
  if (typeof input === "string") return input.split(",").map((item) => item.trim()).filter(Boolean);
  return [];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("ADMIN_NOTIFY_FROM_EMAIL") || "BeatKulture Entertainment <onboarding@resend.dev>";
    const fallbackEmails = parseFallbackEmails(Deno.env.get("ADMIN_NOTIFICATION_EMAILS"));
    const whatsappWebhookUrl = Deno.env.get("ADMIN_WHATSAPP_WEBHOOK_URL") || "";
    const fallbackWhatsAppNumbers = parseFallbackPhones(Deno.env.get("ADMIN_NOTIFICATION_WHATSAPP_TO"));

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Supabase service configuration missing" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = await req.json();
    const requestId = String(payload?.requestId || "");
    const clientName = String(payload?.clientName || "Client");
    const clientEmail = String(payload?.clientEmail || "");
    const clientPhone = payload?.clientPhone ? String(payload.clientPhone) : "";
    const eventType = String(payload?.eventType || "Event");
    const eventDate = payload?.eventDate ? String(payload.eventDate) : "";
    const venueName = payload?.venueName ? String(payload.venueName) : "";
    const packageName = payload?.packageName ? String(payload.packageName) : "";
    const payloadFallbackEmails = parseList(payload?.fallbackEmails).map((item) => item.toLowerCase());
    const payloadFallbackWhatsAppTo = parseList(payload?.fallbackWhatsAppTo);

    if (!requestId) {
      return new Response(JSON.stringify({ error: "requestId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: roleRows, error: roleError } = await adminClient
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (roleError) throw roleError;

    const adminUserIds = [...new Set((roleRows || []).map((row: any) => row.user_id).filter(Boolean))];

    let recipientEmails: string[] = [];
    if (adminUserIds.length > 0) {
      const { data: profileRows, error: profileError } = await adminClient
        .from("profiles")
        .select("email")
        .in("user_id", adminUserIds);

      if (profileError) throw profileError;

      recipientEmails = (profileRows || [])
        .map((row: any) => String(row.email || "").trim().toLowerCase())
        .filter(Boolean);
    }

    if (recipientEmails.length === 0) {
      recipientEmails = [...payloadFallbackEmails, ...fallbackEmails];
    }

    recipientEmails = [...new Set(recipientEmails)];

    if (recipientEmails.length === 0) {
      return new Response(JSON.stringify({ sent: 0, reason: "No admin recipient emails found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const packageLine = packageName
      ? `<p><strong>Package:</strong> ${packageName}</p>`
      : `<p><strong>Quote type:</strong> Custom quote request</p>`;
    const eventDateLine = eventDate ? `<p><strong>Event date:</strong> ${eventDate}</p>` : "";
    const venueLine = venueName ? `<p><strong>Venue:</strong> ${venueName}</p>` : "";
    const clientPhoneLine = clientPhone ? `<p><strong>Contact:</strong> ${clientPhone}</p>` : "";
    const safeClientEmail = clientEmail || "Not provided";

    const subject = `New quote request: ${clientName} (${eventType})`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
        <h2 style="margin: 0 0 12px;">BeatKulture Entertainment — New Quote Request</h2>
        <p>A new quote request has been submitted and pushed to the admin portal.</p>
        <p><strong>Request ID:</strong> ${requestId}</p>
        <p><strong>Client:</strong> ${clientName}</p>
        <p><strong>Client email:</strong> ${safeClientEmail}</p>
        ${clientPhoneLine}
        <p><strong>Event type:</strong> ${eventType}</p>
        ${eventDateLine}
        ${venueLine}
        ${packageLine}
        <p style="margin-top: 16px;">Open the admin portal to review and action this request.</p>
      </div>
    `;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: recipientEmails,
        subject,
        html,
      }),
    });

    if (!resendResponse.ok) {
      const text = await resendResponse.text();
      return new Response(JSON.stringify({ error: `Resend error: ${text}` }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resendPayload = await resendResponse.json();

    let whatsappSent = false;
    let whatsappResponse: any = null;
    if (whatsappWebhookUrl) {
      const plainMessage = [
        "New BeatKulture quote request",
        `Request ID: ${requestId}`,
        `Client: ${clientName}`,
        `Email: ${safeClientEmail}`,
        clientPhone ? `Phone: ${clientPhone}` : "",
        `Event: ${eventType}`,
        eventDate ? `Date: ${eventDate}` : "",
        venueName ? `Venue: ${venueName}` : "",
        packageName ? `Package: ${packageName}` : "Package: Custom quote",
      ]
        .filter(Boolean)
        .join("\n");

      const whatsappRecipients = [...new Set([...payloadFallbackWhatsAppTo, ...fallbackWhatsAppNumbers])];

      const whatsappRes = await fetch(whatsappWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "quote_request",
          to: whatsappRecipients,
          message: plainMessage,
          request: {
            requestId,
            clientName,
            clientEmail: safeClientEmail,
            clientPhone,
            eventType,
            eventDate,
            venueName,
            packageName: packageName || null,
          },
        }),
      });

      if (whatsappRes.ok) {
        whatsappSent = true;
        whatsappResponse = await whatsappRes.text();
      } else {
        const text = await whatsappRes.text();
        console.error("WhatsApp webhook failed", text);
      }
    }

    return new Response(JSON.stringify({
      sent: recipientEmails.length,
      recipients: recipientEmails,
      resend: resendPayload,
      whatsappSent,
      whatsappResponse,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
