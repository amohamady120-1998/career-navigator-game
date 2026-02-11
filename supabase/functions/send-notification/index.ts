import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const eventKey = payload.event_key;

    if (!eventKey) {
      return new Response(JSON.stringify({ error: "Missing event_key" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch notification settings for this event
    const { data: settings } = await supabase
      .from("notification_settings")
      .select("*")
      .eq("key", eventKey)
      .maybeSingle();

    if (!settings || !settings.is_enabled) {
      // Log as skipped
      await supabase.from("notifications_log").insert({
        event_key: eventKey,
        payload,
        sent_email: false,
        sent_webhook: false,
        error: settings ? "Notification disabled" : "No settings found",
      });
      return new Response(JSON.stringify({ status: "skipped" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sentEmail = false;
    let sentWebhook = false;
    let error: string | null = null;

    // Send webhook if configured
    if (settings.webhook_url) {
      try {
        const webhookPayload = {
          event: eventKey,
          timestamp: new Date().toISOString(),
          data: payload,
        };

        const res = await fetch(settings.webhook_url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(webhookPayload),
        });

        sentWebhook = res.ok;
        if (!res.ok) {
          error = `Webhook failed: ${res.status} ${res.statusText}`;
        }
      } catch (e) {
        error = `Webhook error: ${e.message}`;
      }
    }

    // Send email if configured and Resend key available
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (settings.email_to && resendKey) {
      try {
        const subject = eventKey === "consultation_new"
          ? `🔔 طلب استشارة جديد — ${payload.user_name || "طالب"}`
          : `🏫 تفعيل كود مدرسي — ${payload.school_name || "مدرسة"}`;

        const body = eventKey === "consultation_new"
          ? `<div dir="rtl" style="font-family:sans-serif;">
              <h2>طلب استشارة جديد</h2>
              <p><strong>الاسم:</strong> ${payload.user_name || "—"}</p>
              <p><strong>واتساب:</strong> ${payload.whatsapp || "—"}</p>
              <p><strong>النوع:</strong> ${payload.consultation_type || "—"}</p>
              <p><strong>ملاحظات:</strong> ${payload.notes || "لا يوجد"}</p>
              <p><strong>الوقت:</strong> ${payload.created_at || "—"}</p>
            </div>`
          : `<div dir="rtl" style="font-family:sans-serif;">
              <h2>تفعيل كود مدرسي</h2>
              <p><strong>المدرسة:</strong> ${payload.school_name || "—"}</p>
              <p><strong>معرّف الطالب:</strong> ${(payload.user_id || "").slice(0, 8)}...</p>
              <p><strong>الكود:</strong> ${payload.code ? payload.code.slice(0, 3) + "***" : "—"}</p>
              <p><strong>وقت التفعيل:</strong> ${payload.activated_at || "—"}</p>
            </div>`;

        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: "Athar Notifications <notifications@resend.dev>",
            to: settings.email_to.split(",").map((e: string) => e.trim()),
            subject,
            html: body,
          }),
        });

        sentEmail = emailRes.ok;
        if (!emailRes.ok) {
          const errText = await emailRes.text();
          error = (error ? error + "; " : "") + `Email failed: ${errText}`;
        }
      } catch (e) {
        error = (error ? error + "; " : "") + `Email error: ${e.message}`;
      }
    } else if (settings.email_to && !resendKey) {
      error = (error ? error + "; " : "") + "RESEND_API_KEY not configured";
    }

    // Log result
    await supabase.from("notifications_log").insert({
      event_key: eventKey,
      payload,
      sent_email: sentEmail,
      sent_webhook: sentWebhook,
      error,
    });

    return new Response(
      JSON.stringify({ sent_email: sentEmail, sent_webhook: sentWebhook, error }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
