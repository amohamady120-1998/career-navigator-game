import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Brain, Target, ShieldCheck, ArrowRight, ArrowLeft, Lock } from "lucide-react";
import { motion } from "framer-motion";

// Journey step UUIDs
const INTRO_STEP_ID = "0101d638-a9fd-4100-b24d-9e2c676a79ba"; // intro (orientation)
const HOLLAND_STEP_ID = "0b586437-03db-40c4-8cdc-4f889a322c49"; // holland

const INFO_CARDS = [
  {
    icon: Brain,
    title: "ليه الاختبار ده مهم؟",
    body: "علشان نحدد ميولك المهنية بشكل علمي ونطلع لك 2–3 اختيارات قوية تناسبك وتمثل شخصيتك.",
  },
  {
    icon: Target,
    title: "إزاي تجاوب صح؟",
    bullets: [
      "مافيش إجابة صح أو غلط.",
      "اختار اللي يشبهك فعلًا.",
      "ما تحاولش تجاوب بالطريقة اللي تعجب الناس.",
    ],
  },
  {
    icon: ShieldCheck,
    title: "اطمّن…",
    bullets: [
      "إجاباتك بتتحفظ تلقائيًا.",
      "تقدر توقف وترجع تكمل في أي وقت.",
      "خد وقتك في كل سؤال.",
    ],
  },
];

export default function PreAssessmentIntro() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isOrientationCompleted, setIsOrientationCompleted] = useState(false);
  const [hasExistingSession, setHasExistingSession] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth", { replace: true }); return; }

      // Check orientation (intro step) completion
      const { data: orientationProgress } = await supabase
        .from("user_progress")
        .select("status")
        .eq("user_id", session.user.id)
        .eq("step_id", INTRO_STEP_ID)
        .maybeSingle();

      setIsOrientationCompleted(orientationProgress?.status === "completed");

      // Check Holland progress
      const { data: hollandProgress } = await supabase
        .from("user_progress")
        .select("status")
        .eq("user_id", session.user.id)
        .eq("step_id", HOLLAND_STEP_ID)
        .maybeSingle();

      if (hollandProgress?.status === "completed") {
        navigate("/dashboard/simulation", { replace: true });
        return;
      }

      if (hollandProgress?.status === "in_progress") {
        setHasExistingSession(true);
      }

      // Also check if user has any existing answers for holland questions
      const { count } = await supabase
        .from("answers")
        .select("id", { count: "exact", head: true })
        .eq("user_id", session.user.id);

      if (count && count > 0) {
        setHasExistingSession(true);
      }

      setIsLoading(false);
    })();
  }, [navigate]);

  const handleStart = async () => {
    if (!isOrientationCompleted) return;
    setStarting(true);
    navigate("/dashboard/holland");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8" dir="rtl">
      {/* Header */}
      <div className="text-center space-y-3">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto"
        >
          <Brain className="w-8 h-8 text-accent" />
        </motion.div>
        <motion.h1
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="text-2xl md:text-3xl font-extrabold text-foreground"
        >
          قبل ما نبدأ الاختبار…
        </motion.h1>
        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="text-muted-foreground text-sm md:text-base max-w-md mx-auto"
        >
          دقائق بسيطة تفصلك عن اكتشاف ميولك الحقيقية.
        </motion.p>
      </div>

      {/* Info cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {INFO_CARDS.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={i}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25 + i * 0.1, duration: 0.4 }}
            >
              <Card className="p-5 h-full space-y-3 border-border/60">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-accent" />
                </div>
                <h3 className="font-bold text-foreground text-sm">{card.title}</h3>
                {card.body && (
                  <p className="text-xs text-muted-foreground leading-relaxed">{card.body}</p>
                )}
                {card.bullets && (
                  <div className="space-y-1.5">
                    {card.bullets.map((b, j) => (
                      <div key={j} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <span className="text-accent mt-0.5">•</span>
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Tip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center"
      >
        <p className="text-xs text-muted-foreground bg-muted/50 inline-block px-4 py-2 rounded-full">
          💡 الاختبار ده جزء من رحلة متكاملة… مش خطوة لوحدها.
        </p>
      </motion.div>

      {/* CTA section */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="space-y-4 text-center"
      >
        {!isOrientationCompleted && (
          <div className="flex items-center justify-center gap-2 text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3">
            <Lock className="w-4 h-4 shrink-0" />
            <span>أكمل مرحلة التهيئة أولًا لفتح الاختبار</span>
          </div>
        )}

        <Button
          onClick={handleStart}
          disabled={!isOrientationCompleted || starting}
          className={`w-full max-w-sm mx-auto h-14 text-lg font-bold rounded-xl transition-all duration-300 ${
            isOrientationCompleted ? "btn-gradient shadow-lg hover:shadow-xl" : ""
          }`}
        >
          {starting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin ml-2" />
              جاري التحميل...
            </>
          ) : (
            <>
              {hasExistingSession ? "تابع الاختبار" : "ابدأ الاختبار"}
              <ArrowLeft className="w-5 h-5 mr-2" />
            </>
          )}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={() => navigate("/dashboard/orientation")}
        >
          <ArrowRight className="w-4 h-4 ml-1" />
          أرجع للتهيئة
        </Button>
      </motion.div>
    </div>
  );
}
