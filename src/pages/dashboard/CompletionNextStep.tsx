import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, BookOpen, ListChecks, ArrowLeft, Download, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function CompletionNextStep() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [shortlistNames, setShortlistNames] = useState<string[]>([]);
  const [journeySummary, setJournalSummary] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }

      // Mark "next-step" as completed
      const { data: stepRow } = await supabase
        .from("journey_steps")
        .select("id")
        .eq("slug", "next-step")
        .maybeSingle();

      if (stepRow) {
        await supabase.from("user_progress").upsert({
          user_id: session.user.id,
          step_id: stepRow.id,
          status: "completed",
          completed_at: new Date().toISOString(),
        }, { onConflict: "user_id,step_id" });
        queryClient.invalidateQueries({ queryKey: ["user-journey-progress"] });
      }

      // Try to get shortlist major names
      const { data: shortlist } = await supabase
        .from("student_shortlist")
        .select("major_ids")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (shortlist?.major_ids && Array.isArray(shortlist.major_ids) && shortlist.major_ids.length > 0) {
        const ids = (shortlist.major_ids as string[]).slice(0, 3);
        const { data: majors } = await supabase
          .from("majors")
          .select("name_ar")
          .in("id", ids);
        if (majors) setShortlistNames(majors.map(m => m.name_ar));
      }

      // Try to read meta_data from report or certificate step for summary/pdf
      const { data: steps } = await supabase
        .from("journey_steps")
        .select("id, slug")
        .in("slug", ["report", "certificate"]);

      if (steps && steps.length > 0) {
        const stepIds = steps.map(s => s.id);
        const { data: progressRows } = await supabase
          .from("user_progress")
          .select("meta_data")
          .eq("user_id", session.user.id)
          .in("step_id", stepIds);

        if (progressRows) {
          for (const row of progressRows) {
            const meta = row.meta_data as Record<string, any> | null;
            if (meta?.journey_summary) setJournalSummary(meta.journey_summary);
            if (meta?.pdf_url) setPdfUrl(meta.pdf_url);
          }
        }
      }

      setLoading(false);
    })();
  }, [navigate, queryClient]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const cards = [
    {
      icon: <BookOpen className="w-6 h-6 text-primary" />,
      title: "ملخص رحلتك",
      body: journeySummary || "لقد أكملت رحلة أثر البداية بنجاح — اختبارات، محاكاة، وتقرير شامل يوضّح ميولك وقدراتك.",
    },
    {
      icon: <ListChecks className="w-6 h-6 text-primary" />,
      title: "اختياراتك الحالية",
      body: shortlistNames.length > 0
        ? shortlistNames.join("  •  ")
        : "لم يتم تحديد تخصصات بعد — يمكنك استكشاف التخصصات أو حجز استشارة لمساعدتك.",
    },
    {
      icon: <ArrowLeft className="w-6 h-6 text-primary" />,
      title: "الخطوة القادمة",
      body: "الاستشارة تساعدك على ترتيب اختياراتك النهائية مع مختص. أو يمكنك استكشاف التخصصات بنفسك.",
    },
  ];

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-3"
      >
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <Sparkles className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-2xl font-extrabold">المرحلة الأولى انتهت… والقرار يبدأ الآن</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          أنت الآن أقرب لفهم نفسك. لو تحتاج ترتيب اختياراتك النهائية، الاستشارة هتختصر عليك الطريق.
        </p>
      </motion.div>

      <div className="grid gap-4">
        {cards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * (i + 1) }}
          >
            <Card>
              <CardContent className="flex items-start gap-4 p-5">
                <div className="mt-1 shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  {card.icon}
                </div>
                <div>
                  <h3 className="font-bold mb-1">{card.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{card.body}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="space-y-3 pt-2"
      >
        <Button onClick={() => navigate("/dashboard/consultation")} className="w-full h-12 text-base font-bold rounded-xl">
          احجز استشارة
        </Button>
        <Button onClick={() => navigate("/dashboard/shortlist")} variant="outline" className="w-full h-11 rounded-xl">
          استكشف التخصصات
        </Button>
        {pdfUrl && (
          <Button asChild variant="ghost" className="w-full rounded-xl">
            <a href={pdfUrl} target="_blank" rel="noreferrer" className="gap-2">
              <Download className="w-4 h-4" />
              تحميل التقرير
            </a>
          </Button>
        )}
      </motion.div>
    </div>
  );
}
