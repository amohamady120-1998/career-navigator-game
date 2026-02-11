import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, PlayCircle, CheckCircle2, Lock, AlertCircle, RefreshCw, Play } from "lucide-react";
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
        await queryClient.invalidateQueries({ queryKey: ["user-progress-slugs"] });
        await queryClient.invalidateQueries({ queryKey: ["step-guard-progress"] });
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

  const handleCompleteAll = () => navigate("/dashboard/pre-impact");

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
    <div className="max-w-3xl mx-auto space-y-8" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">التهيئة</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {completedModules.length}/{MODULES.length} مكتمل
          </p>
        </div>
        <div className="progress-premium w-28 h-2">
          <div style={{ width: `${(completedModules.length / MODULES.length) * 100}%`, transition: "width 0.4s ease" }} />
        </div>
      </div>

      {/* Description */}
      <div className="text-center space-y-2">
        <h2 className="text-lg md:text-xl font-bold text-foreground">
          خلّينا نبدأ نفهم الصورة كاملة
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          3 مقاطع فيديو قصيرة واختبارات سريعة لتأسيس وعيك قبل اختيار مسارك.
        </p>
      </div>

      {/* Module cards */}
      <div className="space-y-4">
        {MODULES.map((mod, index) => {
          const isCompleted = completedModules.includes(mod.id);
          const isActive = index === activeModuleIndex && !allCompleted;
          const isLocked = index > activeModuleIndex && !allCompleted;

          return (
            <Card key={mod.id} className={`overflow-hidden transition-all duration-300 ${isActive ? "ring-2 ring-accent shadow-lg" : ""} ${isLocked ? "opacity-50" : ""}`}>
              {/* Card header */}
              <div className="flex items-center gap-3 p-4 border-b border-border/50">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  isCompleted ? "bg-[hsl(var(--success))]/15" : isActive ? "bg-accent/15" : "bg-muted"
                }`}>
                  {isCompleted ? <CheckCircle2 className="w-5 h-5 text-[hsl(var(--success))]" /> :
                   isLocked ? <Lock className="w-5 h-5 text-muted-foreground" /> :
                   <PlayCircle className="w-5 h-5 text-accent" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground text-sm">
                    {index + 1}. {mod.title}
                  </p>
                  {isCompleted && <p className="text-xs text-[hsl(var(--success))]">مكتمل</p>}
                  {isActive && <p className="text-xs text-accent">قيد التنفيذ...</p>}
                </div>
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
                    <div className="p-4 space-y-4">
                      {/* VIDEO MODE */}
                      {currentMode === "video" && (
                        <div className="space-y-4">
                          {/* Video player */}
                          <div className="w-full rounded-xl overflow-hidden border border-border bg-muted relative" style={{ aspectRatio: "16/9" }}>
                            {hasVideo ? (
                              <>
                                <video
                                  ref={videoRef}
                                  src={mod.videoSrc}
                                  className="w-full h-full object-cover"
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
                                    playing ? "opacity-0 hover:opacity-100" : "opacity-100 bg-primary/30"
                                  }`}
                                  aria-label={playing ? "إيقاف" : "تشغيل"}
                                >
                                  <div className="w-14 h-14 rounded-full bg-accent/90 flex items-center justify-center shadow-xl">
                                    <Play className="w-6 h-6 text-accent-foreground" />
                                  </div>
                                </button>
                              </>
                            ) : (
                              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                                <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center">
                                  <Play className="w-7 h-7 text-accent" />
                                </div>
                                <span className="text-sm text-muted-foreground">الفيديو قريباً...</span>
                              </div>
                            )}
                          </div>

                          {/* Progress info */}
                          {hasVideo && (
                            <>
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>نسبة المشاهدة المطلوبة: {REQUIRED_WATCH_PERCENT}%</span>
                                <span className="font-bold text-foreground">{Math.round(videoProgress)}%</span>
                              </div>
                              <div className="progress-premium">
                                <div style={{ width: `${Math.min(videoProgress, 100)}%`, transition: "width 0.3s ease" }} />
                              </div>
                            </>
                          )}

                          <Button
                            onClick={() => {
                              if (!hasVideo) setIsVideoFinished(true);
                              setCurrentMode("quiz");
                            }}
                            disabled={hasVideo && !isVideoFinished}
                            className={`w-full h-12 font-bold rounded-xl ${isVideoFinished || !hasVideo ? "btn-gradient" : ""}`}
                          >
                            {isVideoFinished || !hasVideo ? "انتقل للاختبار السريع" : "يجب مشاهدة المقطع للمتابعة"}
                          </Button>
                        </div>
                      )}

                      {/* QUIZ MODE */}
                      {currentMode === "quiz" && !quizResult && (
                        <div className="space-y-5">
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-foreground">اختبار الفهم</p>
                            <span className="text-xs text-muted-foreground">
                              السؤال {currentQuestionIndex + 1} من {mod.quiz.length}
                            </span>
                          </div>

                          <div className="space-y-4">
                            <p className="font-semibold text-foreground leading-relaxed">
                              {mod.quiz[currentQuestionIndex].question}
                            </p>
                            <div className="space-y-2">
                              {mod.quiz[currentQuestionIndex].options.map((opt, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => handleAnswerSelect(idx)}
                                  className={`w-full text-right p-4 rounded-xl border-2 transition-all font-medium text-sm ${
                                    selectedAnswers[currentQuestionIndex] === idx
                                      ? "border-accent bg-accent/10 text-foreground"
                                      : "border-border hover:border-accent/40 text-foreground bg-card"
                                  }`}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="flex gap-3">
                            {currentQuestionIndex > 0 && (
                              <Button variant="outline" onClick={() => setCurrentQuestionIndex((p) => p - 1)}>
                                السابق
                              </Button>
                            )}
                            <Button
                              className="flex-1 btn-gradient font-bold"
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
                        <div className="text-center space-y-4 py-4">
                          {quizResult.passed ? (
                            <>
                              <div className="w-16 h-16 rounded-full bg-[hsl(var(--success))]/15 flex items-center justify-center mx-auto">
                                <CheckCircle2 className="w-8 h-8 text-[hsl(var(--success))]" />
                              </div>
                              <p className="text-lg font-bold text-foreground">ممتاز! اجتزت الاختبار</p>
                              <p className="text-sm text-muted-foreground">النتيجة: {Math.round(quizResult.score)}%</p>
                              <Button
                                className="btn-gradient font-bold px-8"
                                onClick={activeModuleIndex === MODULES.length - 1 ? handleCompleteAll : handleNextModule}
                              >
                                {activeModuleIndex === MODULES.length - 1 ? "إنهاء التهيئة" : "انتقل للمقطع التالي"}
                              </Button>
                            </>
                          ) : (
                            <>
                              <div className="w-16 h-16 rounded-full bg-destructive/15 flex items-center justify-center mx-auto">
                                <AlertCircle className="w-8 h-8 text-destructive" />
                              </div>
                              <p className="text-lg font-bold text-foreground">لم تجتز الاختبار</p>
                              <p className="text-sm text-muted-foreground">
                                النتيجة: {Math.round(quizResult.score)}% (المطلوب {PASSING_SCORE_PERCENT}%)
                              </p>
                              <div className="flex gap-3 justify-center">
                                <Button variant="outline" onClick={() => setCurrentMode("video")}>
                                  إعادة المقطع
                                </Button>
                                <Button variant="outline" onClick={handleRetryQuiz}>
                                  <RefreshCw className="w-4 h-4 ml-1" />
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
            </Card>
          );
        })}
      </div>

      {/* Final CTA */}
      {allCompleted && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4 py-6"
        >
          <p className="text-xl font-extrabold text-foreground">أنت الآن جاهز!</p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            لقد أتممت مرحلة التهيئة بنجاح. عقليتك الآن مستعدة لاتخاذ قرارات مبنية على أسس صحيحة.
          </p>
          <Button className="btn-gradient font-bold h-14 px-10 text-lg rounded-xl" onClick={handleCompleteAll}>
            ابدأ المقياس القبلي
          </Button>
        </motion.div>
      )}
    </div>
  );
}
