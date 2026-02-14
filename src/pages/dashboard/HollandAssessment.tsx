import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, ArrowLeft, Save, CheckCircle2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const HOLLAND_STEP_ID = "0b586437-03db-40c4-8cdc-4f889a322c49";

const OPTIONS = [
  { value: "yes" as any, label: "نعم" },
  { value: "no" as any, label: "لا" },
];

const MIN_TIME_PER_QUESTION_MS = 5000;

export default function HollandAssessment() {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [questions, setQuestions] = useState<{ id: string; text: string }[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeSpent, setTimeSpent] = useState<Record<string, number>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [isTimeAllowed, setIsTimeAllowed] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const questionStartTimeRef = useRef(Date.now());

  // Load session & questions
  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { navigate("/auth"); return; }
        setUserId(session.user.id);

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
          const { data: progress } = await supabase
            .from("user_progress")
            .select("status")
            .eq("user_id", session.user.id)
            .eq("step_id", HOLLAND_STEP_ID)
            .maybeSingle();

          if (progress?.status === "completed") {
            setIsCompleted(true);
          } else {
            // Resume at first unanswered
            const questionIds = new Set(loaded.map((q) => q.id));
            const firstUnanswered = loaded.findIndex((q) => !answeredMap[q.id]);
            setCurrentIndex(firstUnanswered !== -1 ? firstUnanswered : 0);
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
      if (!userId) return;
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
          { user_id: userId, step_id: HOLLAND_STEP_ID, status: "completed", completed_at: new Date().toISOString() },
          { onConflict: "user_id,step_id" }
        );

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
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleRetakeTest = async () => {
    if (!userId) return;
    setIsSaving(true);
    try {
      // Delete existing answers for holland questions
      const questionIds = questions.map(q => q.id);
      for (const qId of questionIds) {
        await supabase.from("answers").delete().eq("user_id", userId).eq("question_id", qId);
      }
      // Reset local state
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
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4"
      >
        <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-success" />
        </div>
        <h2 className="text-2xl font-bold mb-3">تم الانتهاء من الاختبار</h2>
        <p className="text-muted-foreground mb-8 max-w-md">
          شكرًا لصراحتك. لقد تم جمع إجاباتك بنجاح ونحن الآن نقوم بتحليل ميولك المهنية.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={() => navigate("/dashboard/initial-report")} className="btn-gradient rounded-xl h-12 px-10 text-base">
            كمّل وشوف تقريرك المبدئي
          </Button>
          <Button
            variant="outline"
            onClick={handleRetakeTest}
            disabled={isSaving}
            className="rounded-xl h-12 px-8 text-base gap-2"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            إعادة الاختبار
          </Button>
        </div>
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
    <div className="max-w-2xl mx-auto py-6 px-4" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold">اختبار الميول المهنية</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            سؤال {currentIndex + 1} من {questions.length}
            {isSaving && <Loader2 className="w-3 h-3 animate-spin" />}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleSaveAndExit} className="gap-1.5 rounded-xl">
          <Save className="w-4 h-4" />
          حفظ وخروج
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="h-2 rounded-full bg-secondary mb-8 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-accent"
          initial={false}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.4 }}
        />
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
          <div className="card-premium p-6 mb-6">
            <p className="text-sm text-muted-foreground mb-1">
              سؤال {currentIndex + 1} من {questions.length}
            </p>
            <p className="text-xl font-semibold leading-relaxed">{currentQuestion.text}</p>
          </div>

          {/* Options */}
          <div className="space-y-3 mb-6">
            {OPTIONS.map((option) => {
              const isSelected = answers[currentQuestion.id] === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => handleSelectOption(option.value)}
                  className={`w-full p-4 rounded-xl border-2 text-right transition-all duration-200 flex items-center justify-between ${
                    isSelected
                      ? "border-accent bg-accent/10 shadow-sm"
                      : "border-border bg-card hover:border-accent/40 hover:bg-secondary/50"
                  }`}
                >
                  <span className={`text-base font-medium ${isSelected ? "text-accent-foreground" : "text-foreground"}`}>
                    {option.label}
                  </span>
                  {isSelected && <CheckCircle2 className="w-5 h-5 text-accent" />}
                </button>
              );
            })}
          </div>

          {/* Reassurance */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center mb-8">
            <ShieldCheck className="w-4 h-4" />
            مفيش إجابة صح أو غلط… اختار اللي يشبهك.
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="gap-2 rounded-xl h-11"
        >
          <ArrowRight className="w-4 h-4" />
          السابق
        </Button>
        <Button
          onClick={handleNext}
          disabled={!canProceed}
          className="gap-2 btn-gradient rounded-xl h-11 px-8"
        >
          {nextBtnLabel}
          {canProceed && <ArrowLeft className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}
