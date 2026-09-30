import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, ArrowLeft, Save, CheckCircle2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { HeroBand, HeroBandProgress } from "@/components/HeroBand";
import { btnOutline, btnPrimary, toArabicDigits } from "@/lib/athar";

const OPTIONS = [
  { value: "yes" as any, label: "نعم" },
  { value: "no" as any, label: "لا" },
];

const MIN_TIME_PER_QUESTION_MS = 5000;

export default function HollandAssessment() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [questions, setQuestions] = useState<{ id: string; text: string }[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeSpent, setTimeSpent] = useState<Record<string, number>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [isTimeAllowed, setIsTimeAllowed] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [hollandStepId, setHollandStepId] = useState<string | null>(null);

  const questionStartTimeRef = useRef(Date.now());

  // Load session & questions
  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { navigate("/auth"); return; }
        setUserId(session.user.id);

        // Fetch step UUID dynamically
        const { data: stepRow } = await supabase
          .from("journey_steps")
          .select("id")
          .eq("slug", "holland")
          .single();
        const stepId = stepRow?.id;
        setHollandStepId(stepId || null);

        // Fetch holland questions
        const { data: dbQuestions } = await supabase
          .from("questions")
          .select("id, text_ar")
          .eq("category", "holland")
          .order("order_index");

        const loaded = dbQuestions && dbQuestions.length > 0
          ? dbQuestions.map((q) => ({ id: q.id, text: q.text_ar }))
          : Array.from({ length: 42 }, (_, i) => ({ id: `q_${i + 1}`, text: `سؤال ${i + 1}: هل تفضل العمل في بيئة تتطلب هذا النوع من المهام؟` }));
        setQuestions(loaded);

        // Fetch existing answers for resume
        const { data: existingAnswers } = await supabase
          .from("answers")
          .select("question_id, answer_value")
          .eq("user_id", session.user.id);

        if (existingAnswers && existingAnswers.length > 0) {
          const answeredMap: Record<string, string> = {};
          existingAnswers.forEach((a) => {
            answeredMap[a.question_id] = a.answer_value;
          });
          setAnswers(answeredMap);

          // Check if already completed
          if (stepId) {
            const { data: progress } = await supabase
              .from("user_progress")
              .select("status")
              .eq("user_id", session.user.id)
              .eq("step_id", stepId)
              .maybeSingle();

            if (progress?.status === "completed") {
              setIsCompleted(true);
            } else {
              const firstUnanswered = loaded.findIndex((q) => !answeredMap[q.id]);
              setCurrentIndex(firstUnanswered !== -1 ? firstUnanswered : 0);
            }
          }
        }

        // Restore time spent from localStorage
        const savedTime = localStorage.getItem(`holland_time_${session.user.id}`);
        if (savedTime) {
          try { setTimeSpent(JSON.parse(savedTime)); } catch {}
        }
      } catch (error) {
        console.error("Error loading assessment:", error);
        toast.error("حدث خطأ في تحميل الاختبار");
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [navigate]);

  // Anti-guessing timer per question
  useEffect(() => {
    setIsTimeAllowed(false);
    questionStartTimeRef.current = Date.now();
    const timer = setTimeout(() => setIsTimeAllowed(true), MIN_TIME_PER_QUESTION_MS);
    return () => clearTimeout(timer);
  }, [currentIndex]);

  const saveAnswerToDb = async (questionId: string, value: string) => {
    if (!userId) return;
    setIsSaving(true);
    try {
      await supabase.from("answers").upsert(
        { user_id: userId, question_id: questionId, answer_value: value },
        { onConflict: "user_id,question_id" }
      );
    } catch {
      toast.error("حدث مشكلة في حفظ الإجابة");
    } finally {
      setIsSaving(false);
    }
  };

  const calculateAndSaveTime = () => {
    const currentQ = questions[currentIndex];
    const spent = Math.round((Date.now() - questionStartTimeRef.current) / 1000);
    const newTimeSpent = { ...timeSpent, [currentQ.id]: (timeSpent[currentQ.id] || 0) + spent };
    setTimeSpent(newTimeSpent);
    if (userId) localStorage.setItem(`holland_time_${userId}`, JSON.stringify(newTimeSpent));
    return newTimeSpent;
  };

  const handleSelectOption = async (value: string) => {
    const currentQ = questions[currentIndex];
    setAnswers((prev) => ({ ...prev, [currentQ.id]: value }));
    await saveAnswerToDb(currentQ.id, value);
  };

  const handleNext = async () => {
    calculateAndSaveTime();
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Complete assessment
      if (!userId || !hollandStepId) return;
      setIsSaving(true);
      try {
        // Calculate holland scores via DB functions
        const { data: scores } = await supabase.rpc("calculate_holland_scores", { _user_id: userId });
        const { data: topCode } = await supabase.rpc("get_holland_code", { _user_id: userId });

        await supabase.from("holland_results").upsert(
          { user_id: userId, scores: scores || {}, top_code: topCode || "" },
          { onConflict: "user_id" }
        );

        await supabase.from("user_progress").upsert(
          { user_id: userId, step_id: hollandStepId, status: "completed", completed_at: new Date().toISOString() },
          { onConflict: "user_id,step_id" }
        );

        await queryClient.invalidateQueries({ queryKey: ["user-journey-progress"] });

        toast.success("تم إكمال الاختبار بنجاح ✓");
        setIsCompleted(true);
      } catch {
        toast.error("حدث خطأ أثناء حفظ النتائج");
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handlePrev = () => {
    calculateAndSaveTime();
    if (currentIndex > 0) setCurrentIndex((prev) => prev - 1);
  };

  const handleSaveAndExit = async () => {
    calculateAndSaveTime();
    toast.success("تم حفظ تقدمك بنجاح");
    navigate("/dashboard");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const handleRetakeTest = async () => {
    if (!userId) return;
    setIsSaving(true);
    try {
      const questionIds = questions.map(q => q.id);
      for (const qId of questionIds) {
        await supabase.from("answers").delete().eq("user_id", userId).eq("question_id", qId);
      }
      setAnswers({});
      setTimeSpent({});
      setCurrentIndex(0);
      setIsCompleted(false);
      localStorage.removeItem(`holland_time_${userId}`);
      toast.success("تم إعادة تعيين الاختبار، يمكنك البدء من جديد");
    } catch {
      toast.error("حدث خطأ أثناء إعادة التعيين");
    } finally {
      setIsSaving(false);
    }
  };

  if (isCompleted) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="athar-page" dir="rtl">
        <HeroBand
          eyebrow="الفصل الثاني · اختبار الميول"
          title="تم الانتهاء من الاختبار"
          description="شكرًا لصراحتك. جمعنا إجاباتك بنجاح، ونحن الآن نحلّل ميولك المهنية."
        >
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => navigate("/dashboard/initial-report")} className={btnPrimary}>
              كمّل وشوف تقريرك المبدئي
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={handleRetakeTest}
              disabled={isSaving}
              className={`${btnOutline} border-hero-foreground/20 bg-hero-foreground/5 text-hero-foreground hover:bg-hero-foreground/10 hover:text-hero-foreground`}
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              إعادة الاختبار
            </Button>
          </div>
        </HeroBand>
      </motion.div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const hasAnsweredCurrent = answers[currentQuestion.id] !== undefined;
  const canProceed = hasAnsweredCurrent && isTimeAllowed;
  const progressPercent = ((Object.keys(answers).length) / questions.length) * 100;

  let nextBtnLabel = "التالي";
  if (!hasAnsweredCurrent) nextBtnLabel = "اختر إجابة للمتابعة";
  else if (!isTimeAllowed) nextBtnLabel = "لحظة...";
  else if (currentIndex === questions.length - 1) nextBtnLabel = "إنهاء الاختبار ✓";

  return (
    <div className="athar-page" dir="rtl">
      <HeroBand
        eyebrow="الفصل الثاني · اختبار الميول"
        title="ما الذي يشبهك؟"
        description="مواقف قصيرة؛ اختر الأقرب إليك. كل إجابة تضيف لمسة إلى صورتك."
      >
        <HeroBandProgress value={progressPercent} label={`${toArabicDigits(Math.round(progressPercent))}٪`} />
      </HeroBand>

      <div className="athar-card">
        {/* Header */}
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="flex items-center gap-1 text-sm font-bold text-muted-foreground">
            سؤال {toArabicDigits(currentIndex + 1)} من {toArabicDigits(questions.length)}
            {isSaving && <Loader2 className="h-3 w-3 animate-spin" />}
          </p>
          <Button variant="outline" size="sm" onClick={handleSaveAndExit} className="gap-1.5 rounded-[10px] font-bold">
            <Save className="h-4 w-4" />
            حفظ وخروج
          </Button>
        </div>

        {/* Question */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
          >
            <p className="mb-[22px] text-[clamp(1.3rem,3.4vw,1.6rem)] font-extrabold leading-normal">{currentQuestion.text}</p>

            {/* Options */}
            <div className="mb-5 flex flex-col gap-[11px]">
              {OPTIONS.map((option, idx) => {
                const isSelected = answers[currentQuestion.id] === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => handleSelectOption(option.value)}
                    data-selected={isSelected}
                    className="athar-option"
                  >
                    <span className="athar-tile">{["أ", "ب", "ج", "د", "هـ"][idx] ?? idx + 1}</span>
                    <span className="flex-1">{option.label}</span>
                    {isSelected && <CheckCircle2 className="h-5 w-5 text-accent" />}
                  </button>
                );
              })}
            </div>

            {/* Reassurance */}
            <div className="flex items-center gap-3 rounded-[14px] border border-success/25 bg-success/5 px-4 py-3.5 text-[0.92rem] font-semibold text-success">
              <ShieldCheck className="h-[18px] w-[18px] flex-none" />
              مفيش إجابة صح أو غلط… اختار اللي يشبهك.
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="athar-foot">
          <Button variant="outline" onClick={handlePrev} disabled={currentIndex === 0} className={btnOutline}>
            <ArrowRight className="h-4 w-4" />
            السابق
          </Button>
          <Button onClick={handleNext} disabled={!canProceed} className={btnPrimary}>
            {nextBtnLabel}
            {canProceed && <ArrowLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
