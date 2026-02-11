import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const { messages } = await req.json();
    if (!messages?.length) throw new Error("No messages provided");

    // Fetch student context in parallel
    const [profileRes, hollandRes, progressRes] = await Promise.all([
      supabase.from("profiles").select("full_name, grade_level, school_name, user_type").eq("user_id", user.id).maybeSingle(),
      supabase.from("holland_results").select("top_code, scores").eq("user_id", user.id).maybeSingle(),
      supabase.from("user_progress").select("step_id, status, completed_at").eq("user_id", user.id),
    ]);

    const profile = profileRes.data;
    const holland = hollandRes.data;

    // Build personalized system prompt
    const contextParts: string[] = [
      "أنت 'مستشار أثر' — مستشار مهني ذكي متخصص في توجيه الطلاب السعوديين لاختيار تخصصاتهم الجامعية.",
      "تحدث بالعربية الفصحى البسيطة. كن ودودًا ومشجعًا. أجب بإيجاز (3-5 جمل) ما لم يُطلب تفصيل.",
      "لا تقدم نصائح طبية أو قانونية. ركّز فقط على التوجيه المهني والأكاديمي.",
    ];

    if (profile) {
      contextParts.push(`\nمعلومات الطالب:`);
      if (profile.full_name) contextParts.push(`- الاسم: ${profile.full_name}`);
      if (profile.grade_level) contextParts.push(`- المرحلة الدراسية: ${profile.grade_level}`);
      if (profile.school_name) contextParts.push(`- المدرسة: ${profile.school_name}`);
    }

    if (holland) {
      const riasecLabels: Record<string, string> = {
        R: "واقعي", I: "بحثي", A: "فني", S: "اجتماعي", E: "مبادر", C: "تقليدي",
      };
      contextParts.push(`\nنتائج اختبار هولاند:`);
      contextParts.push(`- الكود الأعلى: ${holland.top_code}`);
      if (holland.scores && typeof holland.scores === "object") {
        const scoresStr = Object.entries(holland.scores as Record<string, number>)
          .map(([k, v]) => `${riasecLabels[k] ?? k}: ${v}`)
          .join(", ");
        contextParts.push(`- الدرجات: ${scoresStr}`);
      }
      contextParts.push("استخدم هذه النتائج لتقديم نصائح مخصصة حول التخصصات والمسارات المهنية المناسبة.");
    } else {
      contextParts.push("\nالطالب لم يكمل اختبار هولاند بعد. شجّعه على إكماله للحصول على توصيات دقيقة.");
    }

    const systemPrompt = contextParts.join("\n");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.slice(-20), // Keep last 20 messages for context window
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "تم تجاوز حد الطلبات. يرجى المحاولة لاحقًا." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "يرجى إضافة رصيد للمتابعة." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "خطأ في خدمة الذكاء الاصطناعي" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-counselor error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
