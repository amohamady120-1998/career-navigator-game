import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ArrowLeft, Video, Target, AlertCircle, CheckCircle2, GraduationCap, Briefcase, Sparkles, Map } from "lucide-react";
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
        await supabase.from('user_progress').upsert({
          user_id: session.user.id,
          step_id: exploreStepId,
          status: 'completed',
          completed_at: new Date().toISOString()
        }, { onConflict: 'user_id,step_id' });
        queryClient.invalidateQueries({ queryKey: ["step-guard-progress"] });
        queryClient.invalidateQueries({ queryKey: ["user-progress-slugs"] });
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isReflectionStage = currentStage === 5;
  const currentStageData = !isReflectionStage ? majorData.stages[currentStage] : null;

  const canProceed = isReflectionStage 
    ? (reflections.q1.length > 5 && reflections.q2.length > 5 && reflections.q3.length > 5)
    : (comfortLevels[currentStage] !== undefined && scenarioChoices[currentStage] !== undefined);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans" dir="rtl">
      {/* HEADER & PROGRESS */}
      <header className="bg-card border-b border-border px-4 py-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-foreground text-sm">استكشاف: {majorData.name}</h2>
                <p className="text-xs text-muted-foreground">رحلة افتراضية متكاملة</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-muted-foreground font-bold" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 ml-1" /> رجوع
            </Button>
          </div>
          
          {/* Progress Timeline */}
          <div className="flex items-center justify-between gap-1">
            {[0, 1, 2, 3, 4, 5].map((step) => (
              <div key={step} className="flex flex-col items-center gap-1 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                  currentStage >= step ? "bg-primary border-primary text-primary-foreground shadow-md" : "bg-card border-border text-muted-foreground"
                }`}>
                  {step === 5 ? <Sparkles className="w-4 h-4" /> : step + 1}
                </div>
                <span className="text-[10px] text-muted-foreground hidden sm:block">{STAGE_LABELS[step]}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-grow py-8 px-4 max-w-2xl mx-auto w-full animate-in fade-in">
        {/* BANNER */}
        <Card className="p-4 mb-8 border border-accent/20 bg-accent/5 flex items-start gap-3 shadow-sm">
          <div className="flex-shrink-0 mt-1">
            <Video className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              النسخة المصورة (وثائقي 60 دقيقة من سنة أولى للتخرج) ستكون متاحة قريباً.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              الآن: عِش التجربة التفاعلية الواقعية واتخذ قراراتك بنفسك.
            </p>
          </div>
        </Card>

        {!isReflectionStage && currentStageData ? (
          <div className="space-y-6">
            {/* Stage Title */}
            <div className="flex items-center gap-3">
              <Map className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">{currentStageData.title}</h1>
            </div>

            {/* Reality Snapshot */}
            <Card className="p-5 bg-card border border-border shadow-sm">
              <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" /> الواقع في هذه المرحلة
              </h3>
              <p className="text-muted-foreground leading-relaxed">{currentStageData.snapshot}</p>
            </Card>

            {/* Challenges */}
            <Card className="p-5 bg-card border border-border shadow-sm">
              <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-accent" /> تحديات شائعة ستواجهها
              </h3>
              <ul className="space-y-2">
                {currentStageData.challenges.map((challenge, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-muted-foreground text-sm">
                    <span className="text-accent font-bold mt-0.5">•</span> {challenge}
                  </li>
                ))}
              </ul>
            </Card>

            {/* Mini Scenario */}
            <Card className="p-5 bg-card border border-border shadow-sm">
              <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" /> موقف حقيقي: كيف تتصرف؟
              </h3>
              <p className="text-foreground font-medium mb-4">{currentStageData.scenario.question}</p>
              <div className="space-y-3">
                {currentStageData.scenario.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => setScenarioChoices({...scenarioChoices, [currentStage]: idx})}
                    className={`w-full text-right p-4 rounded-xl border-2 transition-all font-medium text-sm ${
                      scenarioChoices[currentStage] === idx 
                        ? "border-primary bg-primary/5 text-primary shadow-sm" 
                        : "border-border hover:border-primary/30 text-muted-foreground"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </Card>

            {/* Comfort Check */}
            <Card className="p-5 bg-secondary/30 border border-border shadow-sm">
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" /> إحساسك تجاه هذه المرحلة؟
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {COMFORT_LEVELS.map((level) => (
                  <button
                    key={level}
                    onClick={() => setComfortLevels({...comfortLevels, [currentStage]: level})}
                    className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all text-xs ${
                      comfortLevels[currentStage] === level
                        ? "border-primary bg-card shadow-md text-primary font-bold scale-105"
                        : "border-transparent bg-card/60 text-muted-foreground font-medium hover:bg-card"
                    }`}
                  >
                    <span className="text-xl">{COMFORT_EMOJIS[level]}</span>
                    {level}
                  </button>
                ))}
              </div>
            </Card>
          </div>
        ) : (
          /* REFLECTION STAGE */
          <div className="space-y-6">
            <div className="text-center mb-6">
              <span className="text-5xl mb-4 block">🪞</span>
              <h1 className="text-3xl font-bold text-foreground">وقفة صدق أخيرة</h1>
              <p className="text-muted-foreground mt-2">بعد ما عشت الرحلة كاملة بخيالك وواقعها، جاوب بصراحة.</p>
            </div>

            <Card className="p-6 bg-card border border-border shadow-sm space-y-6">
              <div>
                <label className="block font-bold text-foreground mb-2">1. بعد ما شفت التحديات، هل تحس إن التخصص ده يشبه طبيعتك؟</label>
                <Textarea value={reflections.q1} onChange={(e) => setReflections({...reflections, q1: e.target.value})} className="bg-secondary/30" rows={2}/>
              </div>
              <div>
                <label className="block font-bold text-foreground mb-2">2. إيه أكتر مرحلة قلقتك أو حسيت إنها صعبة عليك؟</label>
                <Textarea value={reflections.q2} onChange={(e) => setReflections({...reflections, q2: e.target.value})} className="bg-secondary/30" rows={2}/>
              </div>
              <div>
                <label className="block font-bold text-foreground mb-2">3. هل أنت مستعد تتحمل ضغط بيئة العمل الخاصة بهذا المجال مستقبلاً؟</label>
                <Textarea value={reflections.q3} onChange={(e) => setReflections({...reflections, q3: e.target.value})} className="bg-secondary/30" rows={2}/>
              </div>
            </Card>
          </div>
        )}

        {/* NAVIGATION CTA */}
        <div className="mt-8 pt-4 border-t border-border">
          <Button 
            size="lg" 
            className="w-full h-14 text-lg font-bold rounded-xl shadow-md"
            disabled={!canProceed || isSaving}
            onClick={isReflectionStage ? handleFinish : handleNext}
          >
            {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : isReflectionStage ? "انتقل إلى المحاكاة الذكية" : "تأكيد واستمرار للخطوة التالية"}
            {!isSaving && <ArrowLeft className="w-5 h-5 mr-2" />}
          </Button>
        </div>
      </main>
    </div>
  );
}
