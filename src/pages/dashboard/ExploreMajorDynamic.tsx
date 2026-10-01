import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ArrowLeft, Video, Target, AlertCircle, CheckCircle2, Briefcase, Sparkles, Map, Play } from "lucide-react";
import { HeroBand, HeroBandSubtle } from "@/components/HeroBand";
import { btnPrimary, toArabicDigits } from "@/lib/athar";
import { toast } from "sonner";

// --- TYPES ---
type ComfortLevel = "مريح جدًا" | "مقبول" | "متردد" | "مش مريح";

type StageContent = {
  title: string;
  snapshot: string;
  challenges: string[];
  scenario: {
    question: string;
    options: string[];
  };
};

type MajorData = {
  name: string;
  stages: StageContent[];
};

// --- MAJOR DATABASE ---
const MAJOR_DATABASE: Record<string, MajorData> = {
  "إدارة الأعمال": {
    name: "إدارة الأعمال",
    stages: [
      { title: "سنة أولى", snapshot: "سنة التأسيس. ستدرس مواد عامة في الإدارة، الاقتصاد، والمحاسبة. التركيز هنا على فهم لغة الأعمال والمفاهيم الأساسية، مع الكثير من القراءة النظرية.", challenges: ["التأقلم مع المصطلحات الإنجليزية للأعمال", "التعامل مع مواد الأرقام (الرياضيات المالية) لمن لا يحبها"], scenario: { question: "طلب منك دكتور المادة تلخيص كتاب عن القيادة وتقديمه أمام 50 طالباً الأسبوع القادم. كيف تتصرف؟", options: ["أبدأ فوراً وأحضر عرضاً تقديمياً مميزاً", "أشعر بالتوتر، لكني سأحاول التدرب جيداً", "أحاول التهرب أو طلب تقديم البحث ورقياً فقط"] } },
      { title: "سنة ثانية", snapshot: "يبدأ التعمق. ستدرس التسويق، السلوك التنظيمي، والمالية. ستلاحظ زيادة كبيرة في التكاليف والمشاريع الجماعية (Group Projects) التي تتطلب التنسيق مع زملائك.", challenges: ["العمل مع طلاب مختلفين عنك في الطباع", "تحليل دراسات الحالة (Case Studies) الطويلة"], scenario: { question: "أحد زملائك في المشروع الجماعي لا يعمل، وموعد التسليم غداً. ماذا تفعل؟", options: ["أنجز عمله بنفسي لضمان الدرجة النهائية", "أواجهه بحزم وأجبره على العمل", "أخبر الدكتور فوراً ليتم تقييمه بشكل منفصل"] } },
      { title: "سنة ثالثة", snapshot: "سنة التخصص الدقيق والقرارات. ستختار مسارك (مالية، تسويق، موارد بشرية...). المناهج تصبح تطبيقية ومبنية على بيانات حقيقية لشركات في السوق.", challenges: ["الضغط العالي لاتخاذ قرار التخصص الدقيق", "التعامل مع مشاريع تتطلب بحثاً ميدانياً"], scenario: { question: "مطلوب منك خطة تسويقية لمنتج جديد، ولديك ميزانية افتراضية محدودة. كيف تخطط؟", options: ["أوزع الميزانية بحذر على القنوات المضمونة", "أخاطر بوضعها في حملة مبتكرة وجريئة", "أبحث عن كيف فعلت الشركات الناجحة وأقلدها"] } },
      { title: "سنة رابعة", snapshot: "مشروع التخرج والتدريب التعاوني (Co-op). ستخرج من القاعات إلى بيئة العمل الحقيقية لتطبيق ما تعلمته تحت إشراف مدراء حقيقيين.", challenges: ["إثبات نفسك في بيئة التدريب العملي", "الموازنة بين ساعات التدريب وكتابة تقرير التخرج"], scenario: { question: "في جهة تدريبك، طلب منك مديرك أداء مهمة إدارية روتينية ومملة جداً لمدة أسبوع. ماذا تفعل؟", options: ["أنجزها بسرعة ودقة لأثبت التزامي", "أنجزها ببطء وأتذمر داخلياً", "أطلب منه تغيير المهمة لأنني هنا لأتعلم شيئاً أكبر"] } },
      { title: "بعد التخرج", snapshot: "الواقع المهني. ستبدأ في وظيفة مبتدئة (Entry-level)، وتتدرج. التحدي ليس في المعرفة الأكاديمية، بل في مهاراتك الناعمة (التواصل، الإقناع، والذكاء العاطفي).", challenges: ["تقبل البدء من الصفر وتنفيذ أوامر المدراء", "التعامل مع سياسات العمل والمنافسة بين الموظفين"], scenario: { question: "زميل لك في العمل ينسب نجاح فكرتك لنفسه أمام المدير المباشر. كيف تتصرف؟", options: ["أقاطعه بلطف أمام المدير وأوضح دوري", "أنتظر حتى نخرج وأواجهه وجهاً لوجه", "أسكت تفادياً للمشاكل، وسيعرف المدير الحقيقة لاحقاً"] } },
    ]
  },
  "هندسة البرمجيات": {
    name: "هندسة البرمجيات",
    stages: [
      { title: "سنة أولى", snapshot: "سنة التأسيس المنطقي. دراسة مكثفة للرياضيات، الفيزياء، وأساسيات البرمجة. الشاشة السوداء والأكواد ستكون رفيقك اليومي.", challenges: ["الإحباط من الأخطاء البرمجية (Bugs) المستمرة", "استيعاب المنطق الرياضي المعقد"], scenario: { question: "الكود الخاص بك لا يعمل، وحاولت لساعتين دون فائدة، والتسليم غداً. ماذا تفعل؟", options: ["أستمر في المحاولة طوال الليل حتى أصلحه", "أطلب المساعدة من زميل أو منصات الإنترنت", "أستسلم وأسلم المشروع ناقصاً"] } },
      { title: "سنة ثانية", snapshot: "التعمق في الخوارزميات وهياكل البيانات. ستتعلم كيف تجعل الكود أسرع وأكثر كفاءة، وليس فقط أن يعمل. الجهد الذهني هنا يتضاعف.", challenges: ["حل المشكلات المجردة وغير الملموسة", "الجلوس لساعات طويلة أمام الشاشة بانعزال"], scenario: { question: "لديك طريقتان لحل مشكلة: طريقة سهلة وتعمل، وطريقة معقدة لكنها أسرع في الأداء. ماذا تختار؟", options: ["الطريقة المعقدة والأسرع لضمان الجودة", "الطريقة السهلة لإنهاء المهمة والمضي قدماً", "أبحث عن حل وسط يجمع بينهما"] } },
      { title: "سنة ثالثة", snapshot: "تطوير الأنظمة وهندسة البرمجيات الكبيرة. ستعمل ضمن فرق لبناء تطبيقات حقيقية، وستتعلم قواعد البيانات وواجهات المستخدم والتأكد من الجودة (Testing).", challenges: ["العمل مع فريق برمجي تختلف قدراته", "التعامل مع متطلبات المشروع التي تتغير فجأة"], scenario: { question: "قبل تسليم التطبيق بيومين، طلب العميل (الدكتور) إضافة ميزة جديدة تماماً. ماذا تفعل؟", options: ["أحاول دمجها بسرعة رغم المخاطرة بانهيار الكود", "أشرح له تقنياً أن الوقت لا يسمح وأرفض", "أضيف جزءاً بسيطاً منها كحل مؤقت"] } },
      { title: "سنة رابعة", snapshot: "مشروع التخرج والتقنيات الحديثة (الذكاء الاصطناعي، الأمن السيبراني). ستطبق كل ما تعلمته لبناء نظام متكامل يحل مشكلة حقيقية.", challenges: ["تعلم تقنيات جديدة ذاتياً بسرعة", "الضغط لإنتاج مشروع خالي من الأخطاء"], scenario: { question: "أثناء التدريب التعاوني، اكتشفت ثغرة أمنية في نظام الشركة، لكن مديرك قال لك 'تجاهلها الآن'.", options: ["أتجاهلها كما طلب وأركز على عملي", "أوثقها في تقرير رسمي وأرسلها له لحماية نفسي", "أحاول إصلاحها سراً دون إخباره"] } },
      { title: "بعد التخرج", snapshot: "التعلم المستمر. التقنية تتغير كل 6 أشهر، ما تعلمته في الجامعة سيبدأ بالتقادم. ستعمل في فرق مرنة (Agile) وسيكون التركيز على سرعة التسليم وجودة الكود.", challenges: ["مواكبة اللغات البرمجية الجديدة باستمرار", "الجلوس المتواصل الذي قد يؤثر على الصحة"], scenario: { question: "الشركة تتبنى لغة برمجة جديدة لا تعرفها، وطلبوا منك إنجاز مهمة بها خلال أسبوع.", options: ["أقبل التحدي وأتعلم اللغة في المنزل ليلاً", "أطلب دورة تدريبية من الشركة أولاً", "أقترح إنجازها باللغة التي أتقنها لتوفير الوقت"] } },
    ]
  }
};

const getMajorData = (majorName: string): MajorData => {
  if (MAJOR_DATABASE[majorName]) return MAJOR_DATABASE[majorName];
  return {
    name: majorName,
    stages: Array.from({ length: 5 }).map((_, i) => ({
      title: i === 0 ? "سنة أولى" : i === 1 ? "سنة ثانية" : i === 2 ? "سنة ثالثة" : i === 3 ? "سنة رابعة" : "بعد التخرج",
      snapshot: `هذه المرحلة في تخصص ${majorName} تتطلب جهداً وتركيزاً. ستتعرف على المفاهيم الأساسية وتنتقل تدريجياً للتطبيق العملي.`,
      challenges: ["التعامل مع ضغط المواد الجديدة", "الموازنة بين الجانب النظري والعملي"],
      scenario: { question: `واجهت تحدياً صعباً يخص مشروعاً في ${majorName}. كيف تتصرف؟`, options: ["أبحث وأتعلم ذاتياً لحله", "أستشير الخبراء والزملاء", "أحاول تجنب المهمة المعقدة"] }
    }))
  };
};

// --- VIDEO SEGMENTS (YouTube, unlisted) ---
type VideoSegment = { id: string; title: string; desc: string; duration: string };

const aiSegments: VideoSegment[] = [
  { id: "TRkTKt440uk", title: "ليه الذكاء الاصطناعي؟ — قصة البداية", desc: "كيف يغيّر الذكاء الاصطناعي حياتنا — من قصة واقعية إلى قرار دراسته.", duration: "١:٢٥" },
];

/** Segments per major; majors without an entry keep the "coming soon" banner. */
const getMajorSegments = (majorName: string): VideoSegment[] =>
  majorName.includes("الذكاء الاصطناعي") ? aiSegments : [];

/** Embed with minimal YouTube branding. */
const youtubeEmbedUrl = (id: string) =>
  `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&playsinline=1&iv_load_policy=3`;

const COMFORT_LEVELS: ComfortLevel[] = ["مريح جدًا", "مقبول", "متردد", "مش مريح"];
const COMFORT_EMOJIS: Record<ComfortLevel, string> = { "مريح جدًا": "🤩", "مقبول": "🙂", "متردد": "🤔", "مش مريح": "😰" };

const STAGE_LABELS = ["سنة 1", "سنة 2", "سنة 3", "سنة 4", "عمل", "مراجعة"];

export default function ExploreMajorDynamic() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  
  const searchParams = new URLSearchParams(location.search);
  const majorNameParam = searchParams.get('major') || (location.state as any)?.majorName || "إدارة الأعمال";
  
  const [majorData] = useState<MajorData>(getMajorData(majorNameParam));
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [exploreStepId, setExploreStepId] = useState<string | null>(null);
  
  const [currentStage, setCurrentStage] = useState(0);
  const [comfortLevels, setComfortLevels] = useState<Record<number, ComfortLevel>>({});
  const [scenarioChoices, setScenarioChoices] = useState<Record<number, number>>({});
  const [reflections, setReflections] = useState({ q1: "", q2: "", q3: "" });
  const segments = getMajorSegments(majorData.name);
  const [activeSegment, setActiveSegment] = useState(0);

  const storageKey = `athar_explore_${majorNameParam}`;

  useEffect(() => {
    const timeout = setTimeout(() => setIsLoading(false), 2000);
    const loadProgress = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return navigate('/auth');

        // Load from localStorage
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const meta = JSON.parse(stored);
          setComfortLevels(meta.comfortLevels || {});
          setScenarioChoices(meta.scenarioChoices || {});
          setCurrentStage(meta.currentStage || 0);
          if (meta.reflections) setReflections(meta.reflections);
        }

        // Fetch the explore step UUID
        const { data: stepRow } = await supabase.from('journey_steps').select('id').eq('slug', 'explore').maybeSingle();
        if (stepRow) {
          setExploreStepId(stepRow.id);
          await supabase.from('user_progress').upsert({
            user_id: session.user.id,
            step_id: stepRow.id,
            status: 'in_progress'
          }, { onConflict: 'user_id,step_id' });
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        clearTimeout(timeout);
        setIsLoading(false);
      }
    };
    loadProgress();
    return () => clearTimeout(timeout);
  }, [navigate, majorNameParam, storageKey]);

  const saveProgress = (nextStage: number) => {
    localStorage.setItem(storageKey, JSON.stringify({
      major_name: majorNameParam,
      currentStage: nextStage,
      comfortLevels,
      scenarioChoices,
      reflections,
      last_saved_at: new Date().toISOString()
    }));
  };

  const handleNext = () => {
    const nextStage = currentStage + 1;
    setCurrentStage(nextStage);
    saveProgress(nextStage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinish = async () => {
    setIsSaving(true);
    try {
      saveProgress(currentStage);
      const { data: { session } } = await supabase.auth.getSession();
      if (session && exploreStepId) {
        // Persist explore data to DB meta_data
        const exploreMetaData = {
          major_name: majorNameParam,
          comfortLevels,
          scenarioChoices,
          reflections,
          completed_at: new Date().toISOString(),
        };
        await supabase.from('user_progress').upsert({
          user_id: session.user.id,
          step_id: exploreStepId,
          status: 'completed',
          completed_at: new Date().toISOString(),
          meta_data: exploreMetaData,
        }, { onConflict: 'user_id,step_id' });
        queryClient.invalidateQueries({ queryKey: ["user-journey-progress"] });
      }
      toast.success("تم استكشاف التخصص بنجاح!");
      navigate('/dashboard/simulation');
    } catch (e) {
      console.error(e);
      toast.error("حدث خطأ في الحفظ");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  const isReflectionStage = currentStage === 5;
  const currentStageData = !isReflectionStage ? majorData.stages[currentStage] : null;

  const canProceed = isReflectionStage 
    ? (reflections.q1.length > 5 && reflections.q2.length > 5 && reflections.q3.length > 5)
    : (comfortLevels[currentStage] !== undefined && scenarioChoices[currentStage] !== undefined);

  return (
    <div className="athar-page" dir="rtl">
      <HeroBand
        eyebrow="الفصل الثالث · تعمّق"
        title={<>{majorData.name} <HeroBandSubtle>من الداخل</HeroBandSubtle></>}
        description="رحلة افتراضية متكاملة من السنة الأولى حتى سوق العمل."
      >
        {/* Progress Timeline */}
        <ol className="flex flex-wrap gap-2">
          {[0, 1, 2, 3, 4, 5].map((step) => {
            const done = currentStage > step;
            const current = currentStage === step;
            return (
              <li
                key={step}
                aria-current={current ? "step" : undefined}
                className={`flex items-center gap-1.5 rounded-full py-1 pe-3 ps-1 text-xs font-bold ${
                  current
                    ? "bg-accent/15 text-accent"
                    : done
                    ? "bg-hero-foreground/10 text-hero-foreground"
                    : "bg-hero-foreground/5 text-hero-subtle"
                }`}
              >
                <span
                  className={`grid h-6 w-6 place-items-center rounded-full text-[0.7rem] ${
                    current ? "btn-gradient" : done ? "bg-success text-success-foreground" : "bg-hero-foreground/10"
                  }`}
                >
                  {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : step === 5 ? <Sparkles className="h-3.5 w-3.5" /> : toArabicDigits(step + 1)}
                </span>
                {STAGE_LABELS[step]}
              </li>
            );
          })}
        </ol>
        <Button
          variant="ghost"
          size="sm"
          className="mt-4 rounded-[10px] px-0 font-bold text-hero-muted hover:bg-transparent hover:text-hero-foreground"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" /> رجوع
        </Button>
      </HeroBand>

      <div className="athar-card">
        {segments.length > 0 ? (
          /* VIDEO PLAYER + SEGMENT LIST (prototype s9) */
          <div className="mb-6">
            <div className="relative mb-4 aspect-video overflow-hidden rounded-[15px] bg-hero-to">
              <iframe
                key={segments[activeSegment].id}
                src={youtubeEmbedUrl(segments[activeSegment].id)}
                title={segments[activeSegment].title}
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                loading="lazy"
              />
            </div>
            <p className="mb-2 text-sm leading-relaxed text-muted-foreground">{segments[activeSegment].desc}</p>
            <ol>
              {segments.map((seg, i) => {
                const current = i === activeSegment;
                return (
                  <li key={seg.id} className="border-b border-border/60 last:border-b-0">
                    <button
                      type="button"
                      onClick={() => setActiveSegment(i)}
                      aria-current={current ? "true" : undefined}
                      className={`flex w-full items-center gap-[13px] rounded-xl px-2 py-[13px] text-start transition-colors ${
                        current ? "bg-accent/10" : "hover:bg-muted/60"
                      }`}
                    >
                      <span
                        className={`grid h-[26px] w-[26px] flex-none place-items-center rounded-lg text-[0.78rem] font-extrabold ${
                          current ? "btn-gradient" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {current ? <Play className="h-3 w-3 fill-current" /> : toArabicDigits(i + 1)}
                      </span>
                      <span className={`flex-1 text-[0.93rem] font-bold ${current ? "text-foreground" : ""}`}>{seg.title}</span>
                      <span className="text-[0.8rem] text-muted-foreground">{seg.duration}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        ) : (
          /* BANNER */
          <div
            className="relative mb-6 grid place-items-center overflow-hidden rounded-[15px] px-5 py-8 text-center [background:radial-gradient(120%_120%_at_30%_20%,hsl(var(--hero-from)),hsl(var(--hero-to)))]"
          >
            <span className="btn-gradient mb-3 grid h-[60px] w-[60px] place-items-center rounded-full shadow-premium-lg">
              <Video className="h-6 w-6" />
            </span>
            <p className="text-sm font-semibold text-hero-foreground">
              النسخة المصورة (وثائقي 60 دقيقة من سنة أولى للتخرج) ستكون متاحة قريباً.
            </p>
            <p className="mt-1 text-xs text-hero-muted">الآن: عِش التجربة التفاعلية الواقعية واتخذ قراراتك بنفسك.</p>
          </div>
        )}

        {!isReflectionStage && currentStageData ? (
          <div className="space-y-6">
            <p className="text-sm font-bold text-muted-foreground">
              المرحلة {toArabicDigits(currentStage + 1)} من {toArabicDigits(5)}
            </p>
            <h2 className="-mt-4 flex items-center gap-2.5 text-[clamp(1.3rem,3.4vw,1.6rem)] font-extrabold">
              <Map className="h-6 w-6 text-accent" />
              {currentStageData.title}
            </h2>

            {/* Reality Snapshot + Challenges */}
            <div className="grid gap-4 md:grid-cols-2">
              <section className="rounded-[14px] border border-border bg-muted/40 p-[18px]">
                <h3 className="mb-3 flex items-center gap-2 font-extrabold">
                  <IconChip><Target className="h-4 w-4" /></IconChip> الواقع في هذه المرحلة
                </h3>
                <p className="text-[0.93rem] leading-relaxed text-muted-foreground">{currentStageData.snapshot}</p>
              </section>
              <section className="rounded-[14px] border border-border bg-muted/40 p-[18px]">
                <h3 className="mb-3 flex items-center gap-2 font-extrabold">
                  <IconChip><AlertCircle className="h-4 w-4" /></IconChip> تحديات شائعة ستواجهها
                </h3>
                <ul className="flex flex-col gap-[9px]">
                  {currentStageData.challenges.map((challenge, idx) => (
                    <li key={idx} className="relative ps-[18px] text-[0.93rem] font-medium leading-normal before:absolute before:top-2 before:h-[7px] before:w-[7px] before:rounded-full before:bg-accent before:content-[''] before:[inset-inline-start:0]">
                      {challenge}
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            {/* Mini Scenario */}
            <section>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-muted-foreground">
                <Briefcase className="h-4 w-4" /> موقف حقيقي: كيف تتصرف؟
              </h3>
              <p className="mb-4 text-[1.1rem] font-extrabold leading-normal">{currentStageData.scenario.question}</p>
              <div className="flex flex-col gap-[11px]">
                {currentStageData.scenario.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => setScenarioChoices({...scenarioChoices, [currentStage]: idx})}
                    data-selected={scenarioChoices[currentStage] === idx}
                    className="athar-option"
                  >
                    <span className="athar-tile">{["أ", "ب", "ج", "د"][idx] ?? idx + 1}</span>
                    {opt}
                  </button>
                ))}
              </div>
            </section>

            {/* Comfort Check */}
            <section>
              <h3 className="mb-3 flex items-center gap-2 font-extrabold">
                <CheckCircle2 className="h-5 w-5 text-success" /> إحساسك تجاه هذه المرحلة؟
              </h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {COMFORT_LEVELS.map((level) => {
                  const sel = comfortLevels[currentStage] === level;
                  return (
                    <button
                      key={level}
                      onClick={() => setComfortLevels({...comfortLevels, [currentStage]: level})}
                      aria-pressed={sel}
                      className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border-[1.5px] p-3 text-xs font-bold transition-colors ${
                        sel ? "border-accent bg-accent/10 text-foreground" : "border-border bg-card text-muted-foreground hover:border-accent"
                      }`}
                    >
                      <span className="text-xl">{COMFORT_EMOJIS[level]}</span>
                      {level}
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        ) : (
          /* REFLECTION STAGE */
          <div className="space-y-6">
            <div className="text-center">
              <span className="mb-3 block text-5xl">🪞</span>
              <h2 className="text-2xl font-extrabold">وقفة صدق أخيرة</h2>
              <p className="mt-2 text-muted-foreground">بعد ما عشت الرحلة كاملة بخيالك وواقعها، جاوب بصراحة.</p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block font-bold">1. بعد ما شفت التحديات، هل تحس إن التخصص ده يشبه طبيعتك؟</label>
                <Textarea value={reflections.q1} onChange={(e) => setReflections({...reflections, q1: e.target.value})} className="athar-field" rows={2}/>
              </div>
              <div>
                <label className="mb-2 block font-bold">2. إيه أكتر مرحلة قلقتك أو حسيت إنها صعبة عليك؟</label>
                <Textarea value={reflections.q2} onChange={(e) => setReflections({...reflections, q2: e.target.value})} className="athar-field" rows={2}/>
              </div>
              <div>
                <label className="mb-2 block font-bold">3. هل أنت مستعد تتحمل ضغط بيئة العمل الخاصة بهذا المجال مستقبلاً؟</label>
                <Textarea value={reflections.q3} onChange={(e) => setReflections({...reflections, q3: e.target.value})} className="athar-field" rows={2}/>
              </div>
            </div>
          </div>
        )}

        {/* NAVIGATION CTA */}
        <div className="athar-foot justify-end">
          <Button 
            className={btnPrimary}
            disabled={!canProceed || isSaving}
            onClick={isReflectionStage ? handleFinish : handleNext}
          >
            {isSaving ? <Loader2 className="h-6 w-6 animate-spin" /> : isReflectionStage ? "انتقل إلى المحاكاة الذكية" : "تأكيد واستمرار للخطوة التالية"}
            {!isSaving && <ArrowLeft className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

function IconChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="grid h-7 w-7 flex-none place-items-center rounded-[9px] bg-accent/15 text-[hsl(var(--gradient-end))]">
      {children}
    </span>
  );
}
