import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Clock, AlertTriangle, ArrowLeft, LogOut, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

// --- Types & Data ---

type Scenario = {
  id: string;
  stage: number;
  role: string;
  text: string;
  options: string[];
  requiresReasoning: boolean;
  timeLimitMs?: number;
};

const SCENARIOS: Scenario[] = [
  {
    id: "s1_1", stage: 1, role: "متدرب في شركة",
    text: "طلب منك مديرك إنجاز مهمة لا تعرف كيف تقوم بها، وموعد التسليم غداً. ماذا تفعل؟",
    options: ["أبحث في الإنترنت وأحاول إنجازها بنفسي", "أصارح مديري فوراً بأنني أحتاج مساعدة", "أطلب من زميلي أن ينجزها بدلاً مني"],
    requiresReasoning: false,
  },
  {
    id: "s2_1", stage: 2, role: "مدير مشروع تقني",
    text: "العميل يطالب بتسليم المشروع غداً، ولكن هناك خطأ برمجي بسيط قد يسبب مشكلة لاحقاً. العميل لا يعرف عن الخطأ. ماذا تقرر؟",
    options: ["أسلم المشروع في وقته وأصلح الخطأ لاحقاً دون إخباره", "أؤجل التسليم وأخبر العميل بالحقيقة", "أتجاهل الخطأ تماماً إذا لم يكن يؤثر على الشكل العام"],
    requiresReasoning: true,
  },
  {
    id: "s3_1", stage: 3, role: "طبيب طوارئ",
    text: "وصل مريضان في نفس اللحظة: طفل يعاني من كسر مؤلم جداً، ورجل مسن يعاني من ضيق تنفس صامت. لديك سرير واحد فارغ الآن.",
    options: ["أعالج الطفل أولاً لأن ألمه واضح وصوته عالٍ", "أعالج المسن أولاً لأن حالته قد تكون حرجة وغير ظاهرة", "أطلب من الممرض تقييمهما قبل أن أتدخل"],
    requiresReasoning: true,
    timeLimitMs: 45000,
  },
];

const TOTAL_STAGES = 4;

// --- Component ---

export default function SimulationStep() {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { choice: number; reasoning: string; timeSpent: number }>>({});

  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [reasoning, setReasoning] = useState("");

  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const startTimeRef = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawalReason, setWithdrawalReason] = useState("");

  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    setIsLoading(false);
    startTimer(SCENARIOS[0]);
    return () => clearTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Timer ---
  const clearTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const startTimer = (scenario: Scenario) => {
    clearTimer();
    startTimeRef.current = Date.now();
    if (scenario.timeLimitMs) {
      setTimeLeft(scenario.timeLimitMs / 1000);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev !== null && prev <= 1) {
            clearTimer();
            handleTimeout();
            return 0;
          }
          return prev !== null ? prev - 1 : null;
        });
      }, 1000);
    } else {
      setTimeLeft(null);
    }
  };

  const handleTimeout = () => {
    toast.error("انتهى الوقت! يجب عليك اتخاذ قرار سريع في المواقف الحرجة.", { icon: <AlertTriangle className="w-4 h-4" /> });
    saveAndNext(true);
  };

  // --- Save & Navigate ---
  const saveAndNext = async (isTimeout = false) => {
    const currentQ = SCENARIOS[currentIndex];
    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);

    const updatedAnswers = {
      ...answers,
      [currentQ.id]: {
        choice: isTimeout ? -1 : (selectedChoice ?? -1),
        reasoning,
        timeSpent,
      },
    };
    setAnswers(updatedAnswers);

    setSelectedChoice(null);
    setReasoning("");

    if (currentIndex < SCENARIOS.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      startTimer(SCENARIOS[nextIndex]);
    } else {
      await finishSimulation(updatedAnswers);
    }
  };

  const finishSimulation = async (finalAnswers: typeof answers, withdrawalMeta?: string) => {
    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: step } = await supabase
          .from("journey_steps")
          .select("id")
          .eq("slug", "simulation")
          .single();

        if (step) {
          await supabase.from("user_progress").upsert(
            {
              user_id: session.user.id,
              step_id: step.id,
              status: withdrawalMeta ? "completed" : "completed",
              completed_at: new Date().toISOString(),
            },
            { onConflict: "user_id,step_id" }
          );
        }
      }
      setIsCompleted(true);
    } catch {
      toast.error("حدث خطأ أثناء حفظ البيانات.");
      setIsSaving(false);
    }
  };

  const confirmWithdrawal = () => {
    if (withdrawalReason.trim().length < 10) {
      toast.error("يرجى كتابة سبب واضح للانسحاب (10 أحرف على الأقل).");
      return;
    }
    finishSimulation(answers, withdrawalReason);
  };

  // --- Renders ---

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" dir="rtl">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-5">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">أحسنت! أكملت المحاكاة</h2>
          <p className="text-muted-foreground">شكرًا لصراحتك. لقد تم جمع إجاباتك بنجاح.</p>
          <Button onClick={() => navigate("/dashboard/report")} className="font-bold">
            اعرض التقرير
          </Button>
        </motion.div>
      </div>
    );
  }

  // Withdrawal screen
  if (isWithdrawing) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4" dir="rtl">
        <Card className="max-w-lg w-full p-8 text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <LogOut className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-bold">طلب انسحاب</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            الانسحاب من المواقف الصعبة هو قرار يحترم في بيئة العمل. لكن لمعرفة كيف تفكر، يرجى توضيح سبب انسحابك من هذه المحاكاة.
          </p>
          <Textarea
            placeholder="اكتب سبب الانسحاب هنا..."
            rows={4}
            value={withdrawalReason}
            onChange={(e) => setWithdrawalReason(e.target.value)}
          />
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setIsWithdrawing(false)}>
              تراجع، سأكمل
            </Button>
            <Button variant="destructive" className="flex-1" onClick={confirmWithdrawal}>
              تأكيد الانسحاب
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const currentQ = SCENARIOS[currentIndex];
  const isNextDisabled =
    selectedChoice === null ||
    (currentQ.requiresReasoning && reasoning.trim().length < 5) ||
    isSaving;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col" dir="rtl">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-extrabold text-lg text-primary">أثر ستارت</span>
            <span className="text-sm font-bold text-muted-foreground bg-secondary px-3 py-1 rounded-full">
              المرحلة {currentQ.stage} من {TOTAL_STAGES}
            </span>
          </div>
          <Button
            variant="ghost"
            className="text-destructive hover:text-destructive hover:bg-destructive/10 font-bold"
            onClick={() => setIsWithdrawing(true)}
          >
            <LogOut className="w-4 h-4 ml-2" />
            انسحاب
          </Button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-grow flex flex-col items-center py-8 px-4 max-w-3xl mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full space-y-6"
          >
            {/* Timer */}
            {timeLeft !== null && currentQ.timeLimitMs && (
              <div className="w-full">
                <div className="flex justify-between text-sm font-bold mb-2">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="w-4 h-4" /> الوقت المتبقي للموقف
                  </span>
                  <span className={timeLeft < 10 ? "text-destructive animate-pulse" : "text-primary"}>
                    {timeLeft} ثانية
                  </span>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ${timeLeft < 10 ? "bg-destructive" : "bg-primary"}`}
                    style={{ width: `${(timeLeft / (currentQ.timeLimitMs / 1000)) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Scenario Card */}
            <Card className="w-full border-2 border-border p-6 md:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-1 bg-primary h-full" />
              <span className="inline-block px-3 py-1 bg-accent/10 text-accent font-bold text-xs rounded-md mb-4">
                أنت الآن: {currentQ.role}
              </span>
              <h2 className="text-xl md:text-2xl font-bold leading-relaxed">{currentQ.text}</h2>
            </Card>

            {/* Options */}
            <div className="space-y-3">
              {currentQ.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedChoice(idx)}
                  className={`w-full text-right p-4 rounded-xl border-2 transition-all font-medium ${
                    selectedChoice === idx
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>

            {/* Reasoning */}
            {currentQ.requiresReasoning && (
              <div>
                <label className="block text-sm font-bold mb-2">لماذا اتخذت هذا القرار؟ (اختصار)</label>
                <Textarea
                  placeholder="اكتب تبريرك باختصار (حد أقصى 200 حرف)..."
                  className={`resize-none border-2 ${reasoning.length > 200 ? "border-destructive" : "border-border"}`}
                  maxLength={200}
                  rows={3}
                  value={reasoning}
                  onChange={(e) => setReasoning(e.target.value)}
                />
                <div className={`text-xs mt-1 font-medium text-left ${reasoning.length >= 200 ? "text-destructive" : "text-muted-foreground"}`}>
                  {reasoning.length}/200
                </div>
              </div>
            )}

            {/* Next Button */}
            <Button
              size="lg"
              className="w-full h-14 text-lg font-bold rounded-xl"
              disabled={isNextDisabled}
              onClick={() => saveAndNext(false)}
            >
              {isSaving ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  اتخاذ القرار والتالي
                  <ArrowLeft className="w-5 h-5 mr-2" />
                </>
              )}
            </Button>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
