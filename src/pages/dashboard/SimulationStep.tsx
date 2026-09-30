import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Clock, AlertTriangle, ArrowLeft, LogOut, Save, CheckCircle2, Brain, ChevronUp, ChevronDown, Activity, ShieldCheck, Zap } from "lucide-react";
import { toast } from "sonner";
import { HeroBand } from "@/components/HeroBand";
import { btnOutline, btnPrimary, toArabicDigits } from "@/lib/athar";

// --- TYPES & DATA ---
type Trait = 'action' | 'analytical' | 'cautious' | 'seek_info' | 'risk' | 'safe';

type ScenarioOption = { text: string; trait: Trait; };

type Scenario = {
  id: string;
  stage: number;
  role: string;
  text: string;
  options: ScenarioOption[];
  requiresReasoning: boolean;
  timeLimitMs?: number;
};

const STAGE_NAMES: Record<number, string> = {
  1: "التهيئة",
  2: "محاكاة واقعية",
  3: "اختبار الضغط",
  4: "المراجعة والتأمل"
};

const SCENARIOS: Scenario[] = [
  { id: "s1_1", stage: 1, role: "متدرب في شركة", text: "طلب منك مديرك إنجاز مهمة لا تعرف كيف تقوم بها، وموعد التسليم غداً. ماذا تفعل؟", options: [{ text: "أبحث في الإنترنت وأحاول إنجازها بنفسي فوراً", trait: 'action' }, { text: "أحلل المطلوب وأسأل مديري عن التفاصيل الناقصة", trait: 'analytical' }, { text: "أطلب مساعدة زميل خبير لتجنب الأخطاء", trait: 'seek_info' }], requiresReasoning: false },
  { id: "s1_2", stage: 1, role: "عضو في فريق طلابي", text: "اختلف عضوان في الفريق حول فكرة المشروع، وبدأ النقاش يحتد. أنت قائد الفريق، كيف تتصرف؟", options: [{ text: "أتدخل بحزم وأتخذ القرار النهائي لإنهاء الجدال", trait: 'action' }, { text: "أطلب من كل شخص كتابة فكرته ومميزاتها لمناقشتها بهدوء", trait: 'analytical' }, { text: "أقترح التصويت بين جميع أعضاء الفريق", trait: 'cautious' }], requiresReasoning: false },
  { id: "s1_3", stage: 1, role: "منسق فعالية", text: "قبل الفعالية بساعة، اعتذر المتحدث الرئيسي عن الحضور. ماذا تفعل؟", options: [{ text: "أصعد للمسرح وأقدم فقرة بديلة أو أدير نقاشاً مفتوحاً", trait: 'risk' }, { text: "أبحث عن شخص بديل من الحضور لديه خبرة مقاربة", trait: 'seek_info' }, { text: "أعتذر للجمهور وألغي الفعالية حفاظاً على الجودة", trait: 'safe' }], requiresReasoning: false },
  { id: "s2_1", stage: 2, role: "مدير مشروع تقني", text: "العميل يطالب بتسليم المشروع غداً، ولكن هناك خطأ برمجي بسيط قد يسبب مشكلة لاحقاً. العميل لا يعرف عن الخطأ.", options: [{ text: "أسلم المشروع في وقته وأصلح الخطأ لاحقاً دون إخباره", trait: 'risk' }, { text: "أؤجل التسليم وأخبر العميل بالحقيقة بشفافية", trait: 'safe' }, { text: "أقترح تسليماً جزئياً للأنظمة السليمة فقط", trait: 'analytical' }], requiresReasoning: true },
  { id: "s2_2", stage: 2, role: "محلل مالي", text: "اكتشفت ثغرة قانونية تتيح لشركتك توفير ملايين الدولارات، لكنها قد تضر بسمعة الشركة إذا عُرفت للجمهور.", options: [{ text: "أستغل الثغرة لأن مصلحة الشركة المالية هي الأهم", trait: 'risk' }, { text: "أرفع تقريراً مفصلاً للإدارة العليا بالفوائد والمخاطر", trait: 'analytical' }, { text: "أتجاهل الثغرة تماماً لأن السمعة لا تقدر بثمن", trait: 'safe' }], requiresReasoning: true },
  { id: "s3_1", stage: 3, role: "طبيب طوارئ", text: "وصل مريضان: طفل يعاني من كسر مؤلم جداً يصرخ بشدة، ورجل مسن يعاني من ضيق تنفس صامت. لديك سرير واحد.", options: [{ text: "أعالج الطفل أولاً لأن ألمه واضح وحالته تثير الذعر", trait: 'action' }, { text: "أعالج المسن فوراً لأن ضيق التنفس الصامت قد يكون قاتلاً", trait: 'analytical' }, { text: "أطلب من الممرض إجراء فحص حيوي سريع لهما قبل قراري", trait: 'seek_info' }], requiresReasoning: true, timeLimitMs: 45000 },
  { id: "s3_2", stage: 3, role: "مهندس سلامة", text: "انطلق إنذار الحريق في المصنع، لكنك متأكد بنسبة 90% أنه إنذار كاذب بسبب عطل في الحساسات. إخلاء المصنع سيكلف خسائر بمئات الآلاف.", options: [{ text: "أوقف الإنذار فوراً وأذهب للتحقق من الحساسات", trait: 'risk' }, { text: "أطلق أمر الإخلاء الشامل فوراً دون تردد", trait: 'safe' }, { text: "أطلب من فريق الصيانة التحقق خلال دقيقتين قبل الإخلاء", trait: 'cautious' }], requiresReasoning: true, timeLimitMs: 60000 }
];

type AnswerData = { choice: number | null; reasoning: string; timeSpent: number; timeout: boolean; selectedChoiceAtTimeout?: number | null; };
type ScreenType = 'scenario' | 'feedback' | 'reflection' | 'summary' | 'withdrawing';

export default function SimulationStep() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [screen, setScreen] = useState<ScreenType>('scenario');
  const [previousScreen, setPreviousScreen] = useState<ScreenType | null>(null);
  const [currentStage, setCurrentStage] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerData>>({});

  const [reflections, setReflections] = useState({ q1: "", q2: "", q3: "" });
  const [rankings, setRankings] = useState(["هندسة برمجيات", "إدارة أعمال", "طب طوارئ"]);

  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const selectedChoiceRef = useRef<number | null>(null);
  const [reasoning, setReasoning] = useState("");

  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [pausedTimeLeft, setPausedTimeLeft] = useState<number | null>(null);
  const startTimeRef = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [withdrawalReason, setWithdrawalReason] = useState("");
  const [attemptedWithdrawal, setAttemptedWithdrawal] = useState(false);

  useEffect(() => {
    loadProgress();
    return () => clearCurrentTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProgress = async () => {
    const timeout = setTimeout(() => {
      setIsLoading(false);
      setupScenario(0);
    }, 2000);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { clearTimeout(timeout); return navigate('/auth'); }

      const { data: step } = await supabase
        .from("journey_steps")
        .select("id")
        .eq("slug", "simulation")
        .maybeSingle();

      if (!step) {
        clearTimeout(timeout);
        setIsLoading(false);
        setupScenario(0);
        return;
      }

      const { data: progress } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('step_id', step.id)
        .maybeSingle();

      // If already completed, still show the simulation (don't auto-redirect)
      // User can redo or review it

      clearTimeout(timeout);
      setupScenario(0);
    } catch {
      toast.error("حدث خطأ في استرجاع البيانات");
    } finally {
      setIsLoading(false);
    }
  };

  const clearCurrentTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const setupScenario = (index: number) => {
    const scenario = SCENARIOS[index];
    setSelectedChoice(null);
    selectedChoiceRef.current = null;
    setReasoning("");
    setPausedTimeLeft(null);
    startTimeRef.current = Date.now();
    clearCurrentTimer();

    if (scenario.timeLimitMs) {
      setTimeLeft(scenario.timeLimitMs / 1000);
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev !== null && prev <= 1) {
            clearCurrentTimer();
            handleTimeout(index);
            return 0;
          }
          return prev !== null ? prev - 1 : null;
        });
      }, 1000);
    } else {
      setTimeLeft(null);
    }
  };

  const resumeTimer = (secondsLeft: number, index: number) => {
    clearCurrentTimer();
    setTimeLeft(secondsLeft);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev !== null && prev <= 1) {
          clearCurrentTimer();
          handleTimeout(index);
          return 0;
        }
        return prev !== null ? prev - 1 : null;
      });
    }, 1000);
  };

  const handleTimeout = async (index: number) => {
    toast.error("انتهى الوقت! تم تسجيل الموقف كقرار متأخر.", { icon: <AlertTriangle className="w-4 h-4" /> });
    const timeSpent = Math.round(SCENARIOS[index].timeLimitMs! / 1000);
    const answerData: AnswerData = {
      choice: null,
      reasoning: reasoning || "لم يتم اتخاذ قرار في الوقت المحدد",
      timeSpent,
      timeout: true,
      selectedChoiceAtTimeout: selectedChoiceRef.current
    };
    await submitScenario(index, answerData);
  };

  // --- WITHDRAWAL PAUSE/RESUME ---
  const handleWithdrawClick = () => {
    setAttemptedWithdrawal(true);
    setPreviousScreen(screen);
    setScreen('withdrawing');
    if (timeLeft !== null) {
      setPausedTimeLeft(timeLeft);
    }
    clearCurrentTimer();
  };

  const handleCancelWithdrawal = () => {
    setScreen(previousScreen || (currentStage === 4 ? 'reflection' : 'scenario'));
    setPreviousScreen(null);
    if (pausedTimeLeft !== null && previousScreen === 'scenario') {
      resumeTimer(pausedTimeLeft, currentIndex);
      setPausedTimeLeft(null);
    }
  };

  // --- SAVE & SUBMIT ---
  const submitScenario = async (index: number, answerData: AnswerData) => {
    clearCurrentTimer();
    const newAnswers = { ...answers, [SCENARIOS[index].id]: answerData };
    setAnswers(newAnswers);

    const isLastOfStage = index === SCENARIOS.length - 1 || SCENARIOS[index + 1].stage !== SCENARIOS[index].stage;

    if (isLastOfStage) {
      setScreen('feedback');
    } else {
      const nextIndex = index + 1;
      setCurrentIndex(nextIndex);
      setupScenario(nextIndex);
    }
  };

  const handleNextClick = () => {
    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
    const answerData: AnswerData = {
      choice: selectedChoice,
      reasoning,
      timeSpent,
      timeout: false
    };
    submitScenario(currentIndex, answerData);
  };

  const persistAndFinish = async (status: string) => {
    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: step } = await supabase
        .from("journey_steps")
        .select("id")
        .eq("slug", "simulation")
        .single();

      // Compute metrics to save in meta_data for the final report
      const metrics = computeMetrics(answers);
      const traitCounts: Record<string, number> = {};
      Object.keys(answers).forEach(key => {
        const a = answers[key];
        const q = SCENARIOS.find(s => s.id === key);
        if (a.choice !== null && q) {
          const trait = q.options[a.choice]?.trait;
          if (trait) traitCounts[trait] = (traitCounts[trait] || 0) + 1;
        }
      });

      const metaData = {
        ...metrics,
        trait_counts: traitCounts,
        total_responses: Object.keys(answers).length,
        reflections,
        attempted_withdrawal: attemptedWithdrawal,
      };

      if (step) {
        await supabase.from('user_progress').upsert(
          {
            user_id: session.user.id,
            step_id: step.id,
            status,
            completed_at: new Date().toISOString(),
            meta_data: metaData,
          },
          { onConflict: "user_id,step_id" }
        );
        queryClient.invalidateQueries({ queryKey: ["user-journey-progress"] });
      }

      // Also save individual responses to simulation_responses using DB scenarios
      // Fetch DB scenarios to map by level
      const { data: dbScenarios } = await supabase
        .from("simulation_scenarios")
        .select("id, level, options_json");
      
      if (dbScenarios && dbScenarios.length > 0) {
        const responseInserts: { user_id: string; scenario_id: string; selected_option_id: string; rationale_text: string }[] = [];
        
        Object.entries(answers).forEach(([scenarioKey, answerData]) => {
          if (answerData.choice === null) return;
          const localScenario = SCENARIOS.find(s => s.id === scenarioKey);
          if (!localScenario) return;
          
          // Try to find a matching DB scenario by stage/level
          const levelStr = String(localScenario.stage);
          const matchingDbScenario = dbScenarios.find(ds => ds.level === levelStr);
          
          if (matchingDbScenario) {
            const options = matchingDbScenario.options_json as { id?: string; text?: string }[];
            const optionId = options?.[answerData.choice]?.id || String(answerData.choice);
            responseInserts.push({
              user_id: session.user.id,
              scenario_id: matchingDbScenario.id,
              selected_option_id: optionId,
              rationale_text: answerData.reasoning || "",
            });
          }
        });

        if (responseInserts.length > 0) {
          await supabase.from("simulation_responses").upsert(responseInserts, {
            onConflict: "user_id,scenario_id"
          });
        }
      }
    } catch {
      toast.error("خطأ في حفظ البيانات");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAndExit = () => {
    clearCurrentTimer();
    toast.success("تم الحفظ بنجاح");
    navigate('/dashboard');
  };

  // --- METRICS ---
  const computeMetrics = (ans: Record<string, AnswerData>) => {
    let actionCount = 0, analyticalCount = 0, cautiousCount = 0;
    let timeouts = 0, fastDecisions = 0;

    Object.keys(ans).forEach(key => {
      const a = ans[key];
      const q = SCENARIOS.find(s => s.id === key);
      if (a.timeout) timeouts++;
      if (a.timeSpent < 10 && q && !q.timeLimitMs) fastDecisions++;
      if (a.choice !== null && q) {
        const trait = q.options[a.choice]?.trait;
        if (trait === 'action' || trait === 'risk') actionCount++;
        if (trait === 'analytical' || trait === 'seek_info') analyticalCount++;
        if (trait === 'cautious' || trait === 'safe') cautiousCount++;
      }
    });

    let decision_style = 'balanced';
    if (actionCount > analyticalCount && actionCount > cautiousCount) decision_style = 'action-oriented';
    else if (analyticalCount > actionCount && analyticalCount > cautiousCount) decision_style = 'analytical';
    else if (cautiousCount > actionCount && cautiousCount > analyticalCount) decision_style = 'cautious';

    const stress_response = timeouts > 0 ? 'hesitant' : (fastDecisions > 1 ? 'impulsive' : 'composed');
    const persistence = attemptedWithdrawal ? 'tested' : 'resilient';

    let reflection_quality = 'low';
    const totalRefLength = (reflections.q1?.length || 0) + (reflections.q2?.length || 0) + (reflections.q3?.length || 0);
    if (totalRefLength > 150) reflection_quality = 'high';
    else if (totalRefLength > 60) reflection_quality = 'medium';

    return { decision_style, stress_response, persistence, reflection_quality };
  };

  const getStageFeedback = (stage: number) => {
    const metrics = computeMetrics(answers);
    if (stage === 1) {
      if (metrics.decision_style === 'action-oriented') return "استجاباتك الأولى سريعة وتميل لأخذ المبادرة الفورية لحل المشكلات.";
      if (metrics.decision_style === 'analytical') return "تُظهر تفضيلاً واضحاً لجمع المعلومات وفهم الصورة قبل اتخاذ القرار.";
      return "تميل للتأني والبحث عن التوافق قبل اتخاذ خطوات حاسمة.";
    }
    if (stage === 2) return "في المواقف الواقعية، يبدو أنك توازن بين المسؤولية الأخلاقية والمهنية بطريقة مدروسة.";
    if (stage === 3) {
      if (metrics.stress_response === 'hesitant') return "تحت الضغط، تميل لأخذ وقت إضافي لضمان عدم الوقوع في أخطاء.";
      if (metrics.stress_response === 'impulsive') return "تتحرك بسرعة وقت الأزمات وتتخذ قرارات شجاعة بدلاً من الانتظار.";
      return "تحافظ على هدوئك وتستخدم المعطيات المتاحة بشكل ممتاز تحت الضغط.";
    }
    return "الآن صار عندنا وضوح أكبر لطريقة تفكيرك. هذه المراجعة بتساعدنا نربط بين اختياراتك وشخصيتك المهنية.";
  };

  // --- STAGE NAVIGATION ---
  const handleContinueFeedback = async () => {
    if (currentStage === 4) {
      setScreen('summary');
      await persistAndFinish('completed');
    } else if (currentStage === 3) {
      setCurrentStage(4);
      setScreen('reflection');
    } else {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setCurrentStage(SCENARIOS[nextIndex].stage);
      setScreen('scenario');
      setupScenario(nextIndex);
    }
  };

  const handleWithdrawalConfirm = async () => {
    if (withdrawalReason.trim().length < 20) {
      toast.error("يرجى التوضيح بشكل كافٍ (20 حرف على الأقل)");
      return;
    }
    clearCurrentTimer();
    await persistAndFinish('completed');
    navigate('/dashboard/post-impact');
  };

  // --- RENDERING ---

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  const stageActions = (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="ghost"
        size="sm"
        className="rounded-[10px] font-bold text-hero-muted hover:bg-hero-foreground/10 hover:text-hero-foreground"
        onClick={handleSaveAndExit}
      >
        <Save className="h-4 w-4" /> حفظ
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="rounded-[10px] font-bold text-destructive hover:bg-destructive/15 hover:text-destructive"
        onClick={handleWithdrawClick}
      >
        <LogOut className="h-4 w-4" /> انسحاب
      </Button>
    </div>
  );

  if (screen === 'withdrawing') {
    return (
      <div className="athar-page" dir="rtl">
        <div className="athar-card mx-auto max-w-lg space-y-5 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-destructive/10">
            <LogOut className="h-7 w-7 text-destructive" />
          </span>
          <h2 className="text-xl font-extrabold">طلب انسحاب</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">ليه قررت توقف هنا؟ (الانسحاب قرار يُحترم، لكن نحتاج نفهم طريقة تفكيرك)</p>
          <Textarea className="athar-field" placeholder="اكتب سبب الانسحاب..." rows={4} value={withdrawalReason} onChange={(e) => setWithdrawalReason(e.target.value)} />
          <p className={`text-xs font-bold ${withdrawalReason.length < 20 ? 'text-destructive' : 'text-success'}`}>
            {withdrawalReason.length}/20 حرف مطلوب
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className={`${btnOutline} flex-1`} onClick={handleCancelWithdrawal}>تراجع، سأكمل</Button>
            <Button variant="destructive" className="h-auto flex-1 rounded-xl py-3.5 text-base font-bold" onClick={handleWithdrawalConfirm} disabled={withdrawalReason.length < 20 || isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "تأكيد الانسحاب"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'feedback') {
    return (
      <div className="athar-page" dir="rtl">
        <HeroBand
          eyebrow="الفصل الثالث · محاكاة"
          title={<>نهاية {STAGE_NAMES[currentStage]}</>}
          description={getStageFeedback(currentStage)}
        >
          <Button className={btnPrimary} onClick={handleContinueFeedback}>
            {currentStage === 4 ? "عرض الملخص" : "كمّل"}
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </HeroBand>
      </div>
    );
  }

  if (screen === 'summary') {
    const m = computeMetrics(answers);
    const items = [
      { icon: Brain, title: "نمط اتخاذ القرار", tone: "text-[hsl(var(--gradient-end))] bg-accent/15", text: <>تميل إلى الأسلوب {m.decision_style === 'analytical' ? 'التحليلي' : m.decision_style === 'action-oriented' ? 'المبادر والسريع' : 'الحذر والمتأني'}</> },
      { icon: Activity, title: "تحت الضغط", tone: "text-destructive bg-destructive/10", text: <>أداءك يُظهر أنك {m.stress_response === 'composed' ? 'تحافظ على هدوئك' : m.stress_response === 'impulsive' ? 'تتخذ قرارات سريعة لإنقاذ الموقف' : 'تتأنى خوفاً من ارتكاب الأخطاء'}</> },
      { icon: ShieldCheck, title: "المثابرة", tone: "text-success bg-success/15", text: <>تمتلك صلابة {m.persistence === 'resilient' ? 'عالية ومستمرة للنهاية' : 'جيدة رغم الضغوط المتقطعة'}</> },
      { icon: Zap, title: "جودة التأمل", tone: "text-link bg-link/10", text: <>قدرتك على مراجعة قراراتك وفهم ذاتك تعتبر {m.reflection_quality === 'high' ? 'عالية جداً وعميقة' : m.reflection_quality === 'medium' ? 'جيدة وواضحة' : 'مباشرة ومختصرة'}</> },
    ];
    return (
      <div className="athar-page" dir="rtl">
        <HeroBand
          eyebrow="الفصل الثالث · محاكاة"
          title="خلصنا المحاكاة…"
          description="الآن صار عندنا وضوح أكبر لطريقة تفكيرك."
        />
        <div className="athar-card">
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
            {items.map(({ icon: Icon, title, tone, text }) => (
              <div key={title} className="flex items-start gap-3 rounded-[14px] border border-border bg-muted/40 p-[18px]">
                <span className={`grid h-9 w-9 flex-none place-items-center rounded-[11px] ${tone}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="mb-1 font-extrabold">{title}</h3>
                  <p className="text-sm text-muted-foreground">{text}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="athar-foot justify-end">
            <Button className={btnPrimary} onClick={() => navigate('/dashboard/post-impact')}>
              كمّل — قياس الأثر البعدي
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'reflection') {
    const warn = (v: string) => (v.length > 0 && v.length < 10 ? 'border-accent' : '');
    return (
      <div className="athar-page" dir="rtl">
        <HeroBand
          eyebrow="الفصل الثالث · محاكاة · المرحلة 4 من 4 - المراجعة"
          title="وقفة تأمل"
          description="الأسئلة القادمة تساعدنا في فهم وعيك الذاتي بتجربتك. (مطلوب 10 أحرف لكل إجابة على الأقل)"
        >
          {stageActions}
        </HeroBand>

        <div className="athar-card">
          <div className="space-y-5">
            <div>
              <label className="mb-2 block font-bold">1. ما هو أكثر موقف شعرت فيه أنك تتصرف بطبيعتك ولماذا؟</label>
              <Textarea value={reflections.q1} onChange={(e) => setReflections({...reflections, q1: e.target.value})} className={`athar-field ${warn(reflections.q1)}`} rows={3}/>
            </div>
            <div>
              <label className="mb-2 block font-bold">2. كيف تعاملت نفسياً مع المواقف التي كان فيها ضغط وقت؟</label>
              <Textarea value={reflections.q2} onChange={(e) => setReflections({...reflections, q2: e.target.value})} className={`athar-field ${warn(reflections.q2)}`} rows={3}/>
            </div>
            <div>
              <label className="mb-2 block font-bold">3. لو أتيحت لك الفرصة لإعادة المحاكاة، ما الذي كنت ستغيره في قراراتك؟</label>
              <Textarea value={reflections.q3} onChange={(e) => setReflections({...reflections, q3: e.target.value})} className={`athar-field ${warn(reflections.q3)}`} rows={3}/>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="mb-3.5 font-extrabold">بناءً على التجربة، أعد ترتيب هذه التخصصات حسب ما تراه الأنسب لك الآن:</h3>
            <div className="flex flex-col gap-[11px]">
              {rankings.map((major, index) => (
                <div
                  key={major}
                  className={`flex items-center gap-3 rounded-[13px] border px-[17px] py-3 ${index === 0 ? "border-accent/50 bg-accent/5" : "border-border bg-card"}`}
                >
                  <span className={`grid h-8 w-8 flex-none place-items-center rounded-[9px] font-extrabold ${index === 0 ? "btn-gradient" : "bg-muted text-muted-foreground"}`}>
                    {toArabicDigits(index + 1)}
                  </span>
                  <span className="flex-1 font-bold">{major}</span>
                  <div className="flex flex-col gap-[3px]">
                    <button type="button" aria-label="للأعلى" disabled={index === 0}
                      className="grid h-[22px] w-7 place-items-center rounded-[7px] border border-border bg-card text-muted-foreground hover:border-accent disabled:opacity-40"
                      onClick={() => { const newR = [...rankings]; [newR[index-1], newR[index]] = [newR[index], newR[index-1]]; setRankings(newR); }}>
                      <ChevronUp className="h-[13px] w-[13px]" />
                    </button>
                    <button type="button" aria-label="للأسفل" disabled={index === rankings.length - 1}
                      className="grid h-[22px] w-7 place-items-center rounded-[7px] border border-border bg-card text-muted-foreground hover:border-accent disabled:opacity-40"
                      onClick={() => { const newR = [...rankings]; [newR[index+1], newR[index]] = [newR[index], newR[index+1]]; setRankings(newR); }}>
                      <ChevronDown className="h-[13px] w-[13px]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="athar-foot justify-end">
            <Button className={btnPrimary}
              disabled={reflections.q1.length < 10 || reflections.q2.length < 10 || reflections.q3.length < 10 || isSaving}
              onClick={() => handleContinueFeedback()}>
              {isSaving ? <Loader2 className="animate-spin" /> : "إرسال وإنهاء"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // --- SCENARIO SCREEN ---
  const currentQ = SCENARIOS[currentIndex];
  const isReasoningValid = !currentQ.requiresReasoning || (reasoning.trim().length >= 20 && reasoning.length <= 200);
  const isNextDisabled = selectedChoice === null || !isReasoningValid || isSaving;

  return (
    <div className="athar-page" dir="rtl">
      <HeroBand
        eyebrow={<>الفصل الثالث · محاكاة · المرحلة {currentStage} من 4</>}
        title={STAGE_NAMES[currentStage]}
        description="ليست أسئلة نظرية؛ موقف حقيقي، وقرارك يكشف كيف تفكّر فعلًا."
      >
        {stageActions}
      </HeroBand>

      <div className="athar-card">
        {timeLeft !== null && currentQ.timeLimitMs && (
          <div className="mb-5">
            <div className="mb-2 flex justify-between text-sm font-bold">
              <span className="flex items-center gap-1 text-muted-foreground"><Clock className="h-4 w-4" /> الوقت للموقف</span>
              <span className={timeLeft <= 10 ? "animate-pulse text-base font-extrabold text-destructive" : "text-[hsl(var(--gradient-end))]"}>{timeLeft} ثانية</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full transition-all duration-1000"
                style={{
                  width: `${(timeLeft / (currentQ.timeLimitMs / 1000)) * 100}%`,
                  background: timeLeft <= 10 ? "hsl(var(--destructive))" : "linear-gradient(90deg, hsl(var(--gradient-start)), hsl(var(--gradient-end)))",
                }}
              />
            </div>
          </div>
        )}

        <span className="mb-3 inline-block rounded-full bg-accent/10 px-3 py-1 text-xs font-bold text-[hsl(var(--gradient-end))]">
          أنت الآن: {currentQ.role}
        </span>
        <h2 className="mb-[22px] text-[clamp(1.3rem,3.4vw,1.6rem)] font-extrabold leading-normal">{currentQ.text}</h2>

        <div className="mb-6 flex flex-col gap-[11px]">
          {currentQ.options.map((opt, idx) => (
            <button key={idx}
              onClick={() => { setSelectedChoice(idx); selectedChoiceRef.current = idx; }}
              data-selected={selectedChoice === idx}
              className="athar-option">
              <span className="athar-tile">{["أ", "ب", "ج", "د", "هـ"][idx] ?? idx + 1}</span>
              {opt.text}
            </button>
          ))}
        </div>

        {currentQ.requiresReasoning && (
          <div>
            <label className="mb-2 block text-sm font-bold">لماذا اتخذت هذا القرار؟ <span className="text-destructive">*</span></label>
            <Textarea
              placeholder="اكتب تبريرك باختصار..."
              className={`athar-field resize-none ${reasoning.length > 200 || (reasoning.length > 0 && reasoning.length < 20) ? 'border-accent' : ''}`}
              maxLength={200} rows={3} value={reasoning}
              onChange={(e) => setReasoning(e.target.value)}
            />
            <div className="mt-2 flex justify-between">
              <span className={`text-xs font-bold ${reasoning.length < 20 ? 'text-[hsl(var(--gradient-end))]' : 'text-success'}`}>
                {reasoning.length < 20 ? `مطلوب ${20 - reasoning.length} حرف إضافي` : <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3"/> ممتاز</span>}
              </span>
              <span className={`text-xs font-medium ${reasoning.length >= 200 ? 'text-destructive' : 'text-muted-foreground'}`}>{reasoning.length}/200</span>
            </div>
          </div>
        )}

        <div className="athar-foot justify-end">
          <Button className={btnPrimary} disabled={isNextDisabled} onClick={handleNextClick}>
            {isSaving ? <Loader2 className="h-6 w-6 animate-spin" /> : "اتخاذ القرار والتالي"}
            {!isSaving && <ArrowLeft className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
