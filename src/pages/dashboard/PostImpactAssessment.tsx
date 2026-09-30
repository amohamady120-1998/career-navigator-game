import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, BarChart3, CheckCircle2 } from "lucide-react";
import { CourseVideo } from "@/components/CourseVideo";
import { HeroBand } from "@/components/HeroBand";
import { LikertScale, QuestionBlock } from "@/components/LikertScale";
import { btnOutline, btnPrimary, toArabicDigits } from "@/lib/athar";

const IMPACT_QUESTIONS = [
  { id: "iq1", text: "أشعر أنني أعرف نفسي بشكل أوضح بعد هذه التجربة" },
  { id: "iq2", text: "أستطيع تحديد نقاط قوتي المهنية بسهولة" },
  { id: "iq3", text: "لدي صورة واضحة عن التخصصات المناسبة لي" },
  { id: "iq4", text: "أشعر بثقة أكبر في قدرتي على اتخاذ القرار المهني" },
  { id: "iq5", text: "أعرف الفرق بين اهتماماتي وقدراتي الفعلية" },
  { id: "iq6", text: "أستطيع شرح أسباب اختياري لتخصص معين" },
  { id: "iq7", text: "أشعر أن لدي خطة واضحة للخطوة القادمة" },
  { id: "iq8", text: "تغيّرت نظرتي لبعض التخصصات بعد التجربة التفاعلية" },
  { id: "iq9", text: "أشعر بارتياح أكبر تجاه مستقبلي المهني" },
  { id: "iq10", text: "أنصح زملائي بخوض هذه التجربة" },
  { id: "iq11", text: "ساعدتني المحاكاة على فهم طبيعة العمل في التخصص" },
  { id: "iq12", text: "أصبحت أقل تردداً في اختياراتي المهنية" },
];

const LIKERT_OPTIONS = [
  { value: "1", label: "لا أوافق" },
  { value: "2", label: "أوافق قليلًا" },
  { value: "3", label: "محايد" },
  { value: "4", label: "أوافق" },
  { value: "5", label: "أوافق بشدة" },
];

export default function PostImpactAssessment() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  const pageSize = 4;
  const totalPages = Math.ceil(IMPACT_QUESTIONS.length / pageSize);
  const pageQuestions = IMPACT_QUESTIONS.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const allAnswered = IMPACT_QUESTIONS.every((q) => answers[q.id]);
  const pageAllAnswered = pageQuestions.every((q) => answers[q.id]);

  // Load existing answers
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase
        .from("impact_assessments")
        .select("answers")
        .eq("user_id", session.user.id)
        .eq("assessment_type", "post")
        .maybeSingle();
      if (data?.answers && typeof data.answers === "object" && !Array.isArray(data.answers)) {
        setAnswers(data.answers as Record<string, string>);
      }
    })();
  }, []);

  // Autosave on answer change
  useEffect(() => {
    if (Object.keys(answers).length === 0) return;
    const timeout = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      await supabase.from("impact_assessments").upsert({
        user_id: session.user.id,
        assessment_type: "post",
        answers,
      }, { onConflict: "user_id,assessment_type" });
    }, 800);
    return () => clearTimeout(timeout);
  }, [answers]);

  const handleSubmit = async () => {
    if (!allAnswered) return;
    setSubmitting(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Compute score summary
    const totalScore = Object.values(answers).reduce((sum, v) => sum + parseInt(v, 10), 0);
    const maxScore = IMPACT_QUESTIONS.length * 5;
    const scoreJson = {
      total: totalScore,
      max: maxScore,
      percentage: Math.round((totalScore / maxScore) * 100),
    };

    await supabase.from("impact_assessments").upsert({
      user_id: session.user.id,
      assessment_type: "post",
      answers,
      score_json: scoreJson,
    }, { onConflict: "user_id,assessment_type" });

    // Mark journey step completed
    const { data: step } = await supabase
      .from("journey_steps")
      .select("id")
      .eq("slug", "post-impact")
      .single();

    if (step) {
      await supabase.from("user_progress").upsert({
        user_id: session.user.id,
        step_id: step.id,
        status: "completed",
        completed_at: new Date().toISOString(),
      }, { onConflict: "user_id,step_id" });
    }

    await queryClient.invalidateQueries({ queryKey: ["user-journey-progress"] });


    toast({ title: "تم الحفظ ✓", description: "تم حفظ إجاباتك بنجاح" });
    setCompleted(true);
    setTimeout(() => navigate("/dashboard/final-report"), 1500);
  };

  if (completed) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="athar-page">
        <div className="athar-card py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <h2 className="text-2xl font-extrabold">تم إكمال قياس الأثر البعدي!</h2>
          <p className="mt-2 text-muted-foreground">جارٍ الانتقال للتقرير النهائي...</p>
        </div>
      </motion.div>
    );
  }

  const progressPct = Math.round((Object.keys(answers).length / IMPACT_QUESTIONS.length) * 100);

  return (
    <div className="athar-page">
      <HeroBand
        eyebrow="الفصل الرابع · بعد رحلتك"
        title="هل تغيّر شيء؟"
        description="ده بيقيس التغير في وعيك بعد الرحلة. نفس أسئلة البداية؛ أجب بصدق مرة أخرى."
      />

      <div className="athar-card mb-4">
        <CourseVideo
          title="نصائح ذهبية لاختيار مسارك"
          description="قبل أن ترى نتيجتك، تذكر هذه القواعد السريعة. والآن، دعنا نقيس مدى تطور وعيك."
          videoUrl=""
        />
      </div>

      <div className="athar-card">
        <div className="athar-track mb-[18px]">
          <motion.i initial={false} animate={{ width: `${progressPct}%` }} transition={{ duration: 0.4 }} />
        </div>
        <p className="mb-5 flex justify-between text-sm font-bold text-muted-foreground">
          <span>
            الصفحة {toArabicDigits(currentPage + 1)} من {toArabicDigits(totalPages)}
          </span>
          <span className="text-[hsl(var(--gradient-end))]">{toArabicDigits(progressPct)}٪</span>
        </p>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
          >
            {pageQuestions.map((q, idx) => (
              <QuestionBlock
                key={q.id}
                title={
                  <>
                    <span className="ml-2 font-extrabold text-[hsl(var(--gradient-end))]">
                      {toArabicDigits(currentPage * pageSize + idx + 1)}.
                    </span>
                    {q.text}
                  </>
                }
              >
                <LikertScale
                  aria-label={q.text}
                  options={LIKERT_OPTIONS}
                  value={answers[q.id]}
                  onChange={(v) => setAnswers((prev) => ({ ...prev, [q.id]: v }))}
                />
              </QuestionBlock>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="athar-foot">
          <Button
            variant="outline"
            onClick={() => setCurrentPage((p) => p - 1)}
            disabled={currentPage === 0}
            className={btnOutline}
          >
            <ChevronRight className="h-4 w-4" />
            السابق
          </Button>
          {currentPage < totalPages - 1 ? (
            <Button onClick={() => setCurrentPage((p) => p + 1)} disabled={!pageAllAnswered} className={btnPrimary}>
              التالي
              <ChevronLeft className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!allAnswered || submitting} className={btnPrimary}>
              {submitting ? "جارٍ الحفظ..." : "إنهاء"}
              {!submitting && <CheckCircle2 className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
