import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, BarChart3, CheckCircle2 } from "lucide-react";
import { CourseVideo } from "@/components/CourseVideo";

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
  { value: "2", label: "أوافق قليلاً" },
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

    await queryClient.invalidateQueries({ queryKey: ["user-progress-slugs"] });
    await queryClient.invalidateQueries({ queryKey: ["step-guard-progress"] });

    toast({ title: "تم الحفظ ✓", description: "تم حفظ إجاباتك بنجاح" });
    setCompleted(true);
    setTimeout(() => navigate("/dashboard/final-report"), 1500);
  };

  if (completed) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-success" />
        </div>
        <h2 className="text-2xl font-bold">تم إكمال قياس الأثر البعدي!</h2>
        <p className="text-muted-foreground mt-2">جاري الانتقال للتقرير النهائي...</p>
      </motion.div>
    );
  }

  const progressPct = Math.round((Object.keys(answers).length / IMPACT_QUESTIONS.length) * 100);

  return (
    <div className="max-w-3xl mx-auto">
      <CourseVideo
        title="نصائح ذهبية لاختيار مسارك"
        description="قبل أن ترى نتيجتك، تذكر هذه القواعد السريعة. والآن، دعنا نقيس مدى تطور وعيك."
        videoUrl=""
        className="mb-8"
      />

      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold mb-2">قياس الأثر البعدي</h2>
        <p className="text-muted-foreground">ده بيقيس التغير في وعيك بعد الرحلة</p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span className="font-medium">الصفحة {currentPage + 1} من {totalPages}</span>
          <span className="font-bold text-accent">{progressPct}%</span>
        </div>
        <div className="progress-premium">
          <motion.div
            initial={false}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.3 }}
          className="space-y-5"
        >
          {pageQuestions.map((q, idx) => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="card-premium p-6"
            >
              <p className="text-lg font-medium mb-4">
                <span className="text-gradient font-extrabold ml-2">
                  {currentPage * pageSize + idx + 1}.
                </span>
                {q.text}
              </p>
              <div className="flex gap-2">
                {LIKERT_OPTIONS.map((opt) => {
                  const isSelected = answers[q.id] === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: opt.value }))}
                      className={`
                        flex-1 py-3 px-1 rounded-xl border-2 text-xs sm:text-sm font-medium
                        transition-all duration-200 leading-tight
                        ${isSelected
                          ? "border-accent bg-accent/10 text-accent shadow-sm"
                          : "border-border hover:border-accent/40 hover:bg-secondary/50"
                        }
                      `}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={() => setCurrentPage((p) => p - 1)}
          disabled={currentPage === 0}
          className="gap-2 rounded-xl h-11"
        >
          <ChevronRight className="w-4 h-4" />
          السابق
        </Button>
        {currentPage < totalPages - 1 ? (
          <Button
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={!pageAllAnswered}
            className="gap-2 btn-gradient rounded-xl h-11 px-8"
          >
            التالي
            <ChevronLeft className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!allAnswered || submitting}
            className="gap-2 btn-gradient rounded-xl h-11 px-8"
          >
            {submitting ? "جاري الحفظ..." : "إنهاء ✓"}
          </Button>
        )}
      </div>
    </div>
  );
}
