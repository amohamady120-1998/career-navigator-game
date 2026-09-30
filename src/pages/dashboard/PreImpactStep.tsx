import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { BarChart3, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { HeroBand } from "@/components/HeroBand";
import { LikertScale, QuestionBlock } from "@/components/LikertScale";
import { btnOutline, btnPrimary, toArabicDigits } from "@/lib/athar";

const PRE_IMPACT_QUESTIONS = [
  { id: "iq1", text: "أفهم ما الذي يحمّسني دراسيًا وما الذي لا يناسبني" },
  { id: "iq2", text: "أعرف من أين أبدأ عمليًا عندما أفكر في اختيار تخصصي الجامعي" },
  { id: "iq3", text: "أستطيع تحديد 2–3 مجالات أو مسارات دراسية تبدو مناسبة لي مبدئيًا" },
  { id: "iq4", text: "أعرف كيف أوازن بين (الرغبة + القدرة + الفرصة) عند اختيار التخصص" },
  { id: "iq5", text: "أستطيع شرح سبب تفضيلي لمسار معيّن بشكل منطقي لعائلتي" },
  { id: "iq6", text: "أفهم نوع ميولي المهنية وما الذي يناسب شخصيتي دراسيًا بشكل عام" },
  { id: "iq7", text: "أشعر بثقة في قدرتي على اتخاذ قرار مناسب بخصوص تخصصي الجامعي" },
  { id: "iq8", text: "لديّ خطوات واضحة يمكن أن أقوم بها لاستكشاف تخصصي بشكل أعمق" },
];

const LIKERT_OPTIONS = [
  { value: "1", label: "لا أوافق" },
  { value: "2", label: "أوافق قليلًا" },
  { value: "3", label: "محايد" },
  { value: "4", label: "أوافق" },
  { value: "5", label: "أوافق بشدة" },
];

export default function PreImpactStep() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  const pageSize = 4;
  const totalPages = Math.ceil(PRE_IMPACT_QUESTIONS.length / pageSize);
  const pageQuestions = PRE_IMPACT_QUESTIONS.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const allAnswered = PRE_IMPACT_QUESTIONS.every((q) => answers[q.id]);
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
        .eq("assessment_type", "pre")
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
        assessment_type: "pre",
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
    const maxScore = PRE_IMPACT_QUESTIONS.length * 5;
    const scoreJson = {
      total: totalScore,
      max: maxScore,
      percentage: Math.round((totalScore / maxScore) * 100),
    };

    await supabase.from("impact_assessments").upsert({
      user_id: session.user.id,
      assessment_type: "pre",
      answers,
      score_json: scoreJson,
    }, { onConflict: "user_id,assessment_type" });

    // Mark journey step completed
    const { data: step } = await supabase
      .from("journey_steps")
      .select("id")
      .eq("slug", "pre-impact")
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
    setTimeout(() => navigate("/dashboard/orientation"), 1500);
  };

  if (completed) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="athar-page">
        <div className="athar-card py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <BarChart3 className="h-8 w-8 text-success" />
          </div>
          <h2 className="text-2xl font-extrabold">اكتمل قياس الأثر القبلي</h2>
          <p className="mt-2 text-muted-foreground">جارٍ الانتقال إلى المرحلة التالية...</p>
        </div>
      </motion.div>
    );
  }

  const progressPct = Math.round((Object.keys(answers).length / PRE_IMPACT_QUESTIONS.length) * 100);

  return (
    <div className="athar-page">
      <HeroBand
        eyebrow="الفصل الأول · قبل أن نبدأ"
        title="أين أنت الآن؟"
        description="أجب بصدق؛ سنطرح الأسئلة نفسها بعد رحلتك لنُريك مقدار ما تغيّر."
      />

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
