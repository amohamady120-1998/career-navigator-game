import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, PlayCircle, CheckCircle2, Lock, AlertCircle, RefreshCw, Play, ChevronLeft } from "lucide-react";
import { HeroBand, HeroBandProgress } from "@/components/HeroBand";
import { btnOutline, btnPrimary, toArabicDigits } from "@/lib/athar";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

// ─── Data Models ───

type QuizQuestion = {
  question: string;
  options: string[];
  correctAnswerIndex: number;
};

type ModuleData = {
  id: string;
  title: string;
  videoSrc: string;
  quiz: QuizQuestion[];
};

const MODULES: ModuleData[] = [
  {
    id: "mod_1",
    title: "ليه اختيار التخصص مهم؟",
    videoSrc: "", // Placeholder — no real video yet
    quiz: [
      {
        question: "الهدف الأساسي من اختيار التخصص بدقة هو...",
        options: [
          "إرضاء توقعات المجتمع والأسرة",
          "إيجاد مسار يطابق ميولك وقدراتك لتبدع فيه",
          "اختيار أسهل طريق للحصول على شهادة",
        ],
        correctAnswerIndex: 1,
      },
      {
        question: "التخصص المناسب لشخصيتك يؤدي في المستقبل إلى...",
        options: [
          "الشعور بالملل السريع",
          "زيادة الضغط النفسي",
          "الإبداع والاستقرار المهني",
        ],
        correctAnswerIndex: 2,
      },
    ],
  },
  {
    id: "mod_2",
    title: "ليه بنحتار وإحنا بنختار؟",
    videoSrc: "",
    quiz: [
      {
        question: "من أهم أسباب الحيرة عند اختيار التخصص الجامعي...",
        options: [
          "كثرة الخيارات وعدم معرفة الذات بشكل كافي",
          "قلة التخصصات المتاحة في الجامعات",
          "سهولة وبساطة اتخاذ القرار",
        ],
        correctAnswerIndex: 0,
      },
      {
        question: "لحل مشكلة الحيرة والتردد يجب علينا...",
        options: [
          "الاعتماد على الحظ والصدفة",
          "استخدام أدوات القياس العلمية لمعرفة ميولنا",
          "التقديم العشوائي على أي تخصص",
        ],
        correctAnswerIndex: 1,
      },
    ],
  },
  {
    id: "mod_3",
    title: "أخطاء شائعة بتخلّي الاختيار غلط",
    videoSrc: "",
    quiz: [
      {
        question: "من الأخطاء الشائعة والخطيرة في اختيار التخصص...",
        options: [
          "البحث والقراءة المتعمقة",
          "استشارة الخبراء والمرشدين",
          "الاختيار بناءً على المسمى أو الرأي السائد فقط",
        ],
        correctAnswerIndex: 2,
      },
      {
        question: "هل يجب اختيار التخصص لمجرد أنه 'مشهور' أو عليه طلب حالي؟",
        options: [
          "نعم، الشهرة تضمن النجاح دائماً",
          "لا، الأهم أن يتناسب مع قدراتي وميولي الحقيقية",
          "نعم، إذا كان العائد المادي المتوقع كبيراً جداً",
        ],
        correctAnswerIndex: 1,
      },
    ],
  },
];

const PASSING_SCORE_PERCENT = 70;
const REQUIRED_WATCH_PERCENT = 90;

// Will be fetched dynamically
let ORIENTATION_STEP_ID: string | null = null;

// ─── Component ───

export default function OrientationStep() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Progress
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [currentMode, setCurrentMode] = useState<"video" | "quiz">("video");

  // Video
  const [maxWatchedTime, setMaxWatchedTime] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);
  const [isVideoFinished, setIsVideoFinished] = useState(false);
  const [playing, setPlaying] = useState(false);

  // Quiz
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<(number | undefined)[]>([]);
  const [quizResult, setQuizResult] = useState<{ passed: boolean; score: number } | null>(null);

  // ── Init ──
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth", { replace: true }); return; }
      setUserId(session.user.id);

      // Fetch the orientation step UUID dynamically
      const { data: stepData } = await supabase
        .from("journey_steps")
        .select("id")
        .eq("slug", "orientation")
        .single();
      
      if (stepData) {
        ORIENTATION_STEP_ID = stepData.id;
      }

      // Check if orientation step already completed
      if (ORIENTATION_STEP_ID) {
        const { data: progress } = await supabase
          .from("user_progress")
          .select("status")
          .eq("user_id", session.user.id)
          .eq("step_id", ORIENTATION_STEP_ID)
          .maybeSingle();

        if (progress?.status === "completed") {
          setCompletedModules(MODULES.map((m) => m.id));
          setActiveModuleIndex(MODULES.length);
        } else {
          // Restore partial progress from localStorage
          const saved = localStorage.getItem(`orientation_progress_${session.user.id}`);
          if (saved) {
            try {
              const arr = JSON.parse(saved) as string[];
              setCompletedModules(arr);
              const next = MODULES.findIndex((m) => !arr.includes(m.id));
              setActiveModuleIndex(next !== -1 ? next : MODULES.length);
            } catch { /* ignore */ }
          }
        }
      }
      setIsLoading(false);
    })();
  }, [navigate]);

  // ── Video handlers ──
  const handleVideoLoaded = useCallback(() => {
    if (!videoRef.current || !userId) return;
    const mod = MODULES[activeModuleIndex];
    if (!mod) return;
    const saved = localStorage.getItem(`or_vid_${mod.id}_${userId}`);
    if (saved) {
      const t = parseFloat(saved);
      setMaxWatchedTime(t);
      videoRef.current.currentTime = t;
    } else {
      setMaxWatchedTime(0);
      setVideoProgress(0);
    }
    setIsVideoFinished(false);
  }, [activeModuleIndex, userId]);

  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (!v || !v.duration || !userId) return;
    const current = v.currentTime;

    if (current > maxWatchedTime + 2) {
      v.currentTime = maxWatchedTime;
      return;
    }

    const newMax = Math.max(maxWatchedTime, current);
    setMaxWatchedTime(newMax);
    localStorage.setItem(`or_vid_${MODULES[activeModuleIndex].id}_${userId}`, newMax.toString());

    const pct = (newMax / v.duration) * 100;
    setVideoProgress(pct);
    if (pct >= REQUIRED_WATCH_PERCENT && !isVideoFinished) setIsVideoFinished(true);
  }, [maxWatchedTime, activeModuleIndex, userId, isVideoFinished]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) v.pause(); else v.play();
  };

  // ── Quiz handlers ──
  const handleAnswerSelect = (idx: number) => {
    const a = [...selectedAnswers];
    a[currentQuestionIndex] = idx;
    setSelectedAnswers(a);
  };

  const submitQuiz = async () => {
    const mod = MODULES[activeModuleIndex];
    let correct = 0;
    mod.quiz.forEach((q, i) => { if (selectedAnswers[i] === q.correctAnswerIndex) correct++; });
    const score = (correct / mod.quiz.length) * 100;
    const passed = score >= PASSING_SCORE_PERCENT;
    setQuizResult({ passed, score });

    if (passed && userId) {
      const newCompleted = [...completedModules, mod.id];
      setCompletedModules(newCompleted);
      localStorage.setItem(`orientation_progress_${userId}`, JSON.stringify(newCompleted));

      // If all modules done, mark the orientation step completed in DB
      if (newCompleted.length === MODULES.length && ORIENTATION_STEP_ID) {
        await supabase.from("user_progress").upsert(
          { user_id: userId, step_id: ORIENTATION_STEP_ID, status: "completed", completed_at: new Date().toISOString() },
          { onConflict: "user_id,step_id" },
        );
        localStorage.removeItem(`orientation_progress_${userId}`);
        await queryClient.invalidateQueries({ queryKey: ["user-journey-progress"] });

        toast.success("أكملت مرحلة التهيئة بنجاح!");
      }
    }
  };

  const handleNextModule = () => {
    setQuizResult(null);
    setSelectedAnswers([]);
    setCurrentQuestionIndex(0);
    setCurrentMode("video");
    setVideoProgress(0);
    setMaxWatchedTime(0);
    setIsVideoFinished(false);
    setActiveModuleIndex((p) => p + 1);
  };

  const handleRetryQuiz = () => {
    setQuizResult(null);
    setSelectedAnswers([]);
    setCurrentQuestionIndex(0);
  };

  const handleCompleteAll = () => {
    console.log("[OrientationStep] NEXT_CLICKED → navigating to /dashboard/holland");
    navigate("/dashboard/holland");
  };

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const allCompleted = completedModules.length === MODULES.length;
  const activeModule = MODULES[activeModuleIndex];
  const hasVideo = !!activeModule?.videoSrc;

  return (
    <div className="athar-page" dir="rtl">
      <HeroBand
        eyebrow="الفصل الأول · التهيئة"
        title="قبل اختبار ميولك"
        description="ثلاثة مقاطع قصيرة واختبارات سريعة تؤسّس وعيك قبل أن تختار مسارك."
      >
        <HeroBandProgress
          value={(completedModules.length / MODULES.length) * 100}
          label={`${toArabicDigits(completedModules.length)} من ${toArabicDigits(MODULES.length)}`}
        />
      </HeroBand>

      {/* Module cards */}
      <div className="space-y-3.5">
        {MODULES.map((mod, index) => {
          const isCompleted = completedModules.includes(mod.id);
          const isActive = index === activeModuleIndex && !allCompleted;
          const isLocked = index > activeModuleIndex && !allCompleted;

          return (
            <div
              key={mod.id}
              className={`athar-card overflow-hidden p-0 md:p-0 transition-all duration-300 ${isActive ? "border-accent/50" : ""} ${isLocked ? "opacity-60" : ""}`}
            >
              {/* Card header */}
              <div className="flex items-center gap-[13px] px-5 py-4">
                <span
                  className={`grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[10px] text-sm font-extrabold ${
                    isCompleted
                      ? "bg-success/15 text-success"
                      : isActive
                      ? "btn-gradient"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="h-[18px] w-[18px]" /> : isLocked ? <Lock className="h-4 w-4" /> : toArabicDigits(index + 1)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[0.95rem] font-bold text-foreground">{mod.title}</p>
                  {isCompleted && <p className="text-xs font-bold text-success">مكتمل</p>}
                  {isActive && <p className="text-xs font-bold text-[hsl(var(--gradient-end))]">قيد التنفيذ</p>}
                </div>
                {isActive && <PlayCircle className="h-5 w-5 text-accent" />}
              </div>

              {/* Active module content */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-4 border-t border-border/60 p-5">
                      {/* VIDEO MODE */}
                      {currentMode === "video" && (
                        <div className="space-y-4">
                          {/* Video player */}
                          <div
                            className="relative w-full overflow-hidden rounded-[15px] [background:radial-gradient(120%_120%_at_30%_20%,hsl(var(--hero-from)),hsl(var(--hero-to)))]"
                            style={{ aspectRatio: "16/9" }}
                          >
                            {hasVideo ? (
                              <>
                                <video
                                  ref={videoRef}
                                  src={mod.videoSrc}
                                  className="h-full w-full object-cover"
                                  onLoadedData={handleVideoLoaded}
                                  onTimeUpdate={handleTimeUpdate}
                                  onPlay={() => setPlaying(true)}
                                  onPause={() => setPlaying(false)}
                                  onEnded={() => { setPlaying(false); setIsVideoFinished(true); }}
                                  playsInline
                                  controlsList="nodownload nofullscreen"
                                  disablePictureInPicture
                                />
                                <button
                                  onClick={togglePlay}
                                  className={`absolute inset-0 flex items-center justify-center transition-opacity ${
                                    playing ? "opacity-0 hover:opacity-100" : "opacity-100 bg-hero-to/30"
                                  }`}
                                  aria-label={playing ? "إيقاف" : "تشغيل"}
                                >
                                  <PlayBadge />
                                </button>
                              </>
                            ) : (
                              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                                <PlayBadge />
                                <span className="text-sm font-semibold text-hero-muted">الفيديو قريبًا...</span>
                              </div>
                            )}
                            <span className="absolute bottom-[13px] text-[0.84rem] font-semibold text-hero-muted [inset-inline-end:15px]">
                              {toArabicDigits(index + 1)} · {mod.title}
                            </span>
                          </div>

                          {/* Progress info */}
                          {hasVideo && (
                            <>
                              <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
                                <span>نسبة المشاهدة المطلوبة: {toArabicDigits(REQUIRED_WATCH_PERCENT)}٪</span>
                                <span className="text-foreground">{toArabicDigits(Math.round(videoProgress))}٪</span>
                              </div>
                              <div className="athar-track">
                                <i style={{ width: `${Math.min(videoProgress, 100)}%` }} />
                              </div>
                            </>
                          )}

                          <Button
                            onClick={() => {
                              if (!hasVideo) setIsVideoFinished(true);
                              setCurrentMode("quiz");
                            }}
                            disabled={hasVideo && !isVideoFinished}
                            className={`${btnPrimary} w-full`}
                          >
                            {isVideoFinished || !hasVideo ? "انتقل للاختبار السريع" : "يجب مشاهدة المقطع للمتابعة"}
                          </Button>
                        </div>
                      )}

                      {/* QUIZ MODE */}
                      {currentMode === "quiz" && !quizResult && (
                        <div className="space-y-5">
                          <p className="text-sm font-bold text-muted-foreground">
                            اختبار الفهم · السؤال {toArabicDigits(currentQuestionIndex + 1)} من {toArabicDigits(mod.quiz.length)}
                          </p>
                          <p className="text-[clamp(1.15rem,3vw,1.35rem)] font-extrabold leading-normal text-foreground">
                            {mod.quiz[currentQuestionIndex].question}
                          </p>
                          <div className="flex flex-col gap-[11px]">
                            {mod.quiz[currentQuestionIndex].options.map((opt, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleAnswerSelect(idx)}
                                data-selected={selectedAnswers[currentQuestionIndex] === idx}
                                className="athar-option"
                              >
                                <span className="athar-tile">{OPTION_LETTERS[idx] ?? idx + 1}</span>
                                {opt}
                              </button>
                            ))}
                          </div>

                          <div className="flex flex-wrap justify-between gap-3 pt-2">
                            {currentQuestionIndex > 0 ? (
                              <Button variant="outline" className={btnOutline} onClick={() => setCurrentQuestionIndex((p) => p - 1)}>
                                السابق
                              </Button>
                            ) : <span />}
                            <Button
                              className={btnPrimary}
                              disabled={selectedAnswers[currentQuestionIndex] === undefined}
                              onClick={() => {
                                if (currentQuestionIndex < mod.quiz.length - 1) setCurrentQuestionIndex((p) => p + 1);
                                else submitQuiz();
                              }}
                            >
                              {currentQuestionIndex < mod.quiz.length - 1 ? "التالي" : "تأكيد الإجابات"}
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* QUIZ RESULT */}
                      {currentMode === "quiz" && quizResult && (
                        <div className="space-y-4 py-4 text-center">
                          {quizResult.passed ? (
                            <>
                              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
                                <CheckCircle2 className="h-8 w-8 text-success" />
                              </div>
                              <p className="text-lg font-extrabold text-foreground">ممتاز! اجتزت الاختبار</p>
                              <p className="text-sm text-muted-foreground">النتيجة: {toArabicDigits(Math.round(quizResult.score))}٪</p>
                              <Button
                                className={btnPrimary}
                                onClick={activeModuleIndex === MODULES.length - 1 ? handleCompleteAll : handleNextModule}
                              >
                                {activeModuleIndex === MODULES.length - 1 ? "إنهاء التهيئة" : "انتقل للمقطع التالي"}
                              </Button>
                            </>
                          ) : (
                            <>
                              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/15">
                                <AlertCircle className="h-8 w-8 text-destructive" />
                              </div>
                              <p className="text-lg font-extrabold text-foreground">لم تجتز الاختبار</p>
                              <p className="text-sm text-muted-foreground">
                                النتيجة: {toArabicDigits(Math.round(quizResult.score))}٪ (المطلوب {toArabicDigits(PASSING_SCORE_PERCENT)}٪)
                              </p>
                              <div className="flex flex-wrap justify-center gap-3">
                                <Button variant="outline" className={btnOutline} onClick={() => setCurrentMode("video")}>
                                  إعادة المقطع
                                </Button>
                                <Button variant="outline" className={btnOutline} onClick={handleRetryQuiz}>
                                  <RefreshCw className="h-4 w-4" />
                                  إعادة الاختبار
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Final CTA */}
      {allCompleted && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="athar-card mt-6 space-y-4 text-center"
        >
          <p className="text-xl font-extrabold text-foreground">أنت الآن جاهز!</p>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            لقد أتممت مرحلة التهيئة بنجاح. عقليتك الآن مستعدة لاتخاذ قرارات مبنية على أسس صحيحة.
          </p>
          <Button type="button" className={btnPrimary} onClick={handleCompleteAll}>
            ابدأ اختبار هولند
            <ChevronLeft className="h-[17px] w-[17px]" />
          </Button>
        </motion.div>
      )}
    </div>
  );
}

const OPTION_LETTERS = ["أ", "ب", "ج", "د", "هـ"];

function PlayBadge() {
  return (
    <span className="btn-gradient grid h-[60px] w-[60px] place-items-center rounded-full shadow-premium-lg">
      <Play className="h-6 w-6 fill-current [margin-inline-start:3px]" />
    </span>
  );
}
