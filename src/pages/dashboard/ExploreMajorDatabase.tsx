import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ArrowLeft, Video, Target, AlertCircle, CheckCircle2, Map, Briefcase, Sparkles } from "lucide-react";
import { toast } from "sonner";

type ComfortLevel = 'very_comfortable' | 'ok' | 'hesitant' | 'not_comfortable';

interface MajorSection {
  id: string;
  stage_key: string;
  stage_title_ar: string;
  reality_snapshot_ar: string;
  challenges_ar: string[];
  scenario_prompt_ar: string;
  scenario_options_ar: string[];
}

const COMFORT_UI = [
  { id: 'very_comfortable', label: "مريح جدًا", emoji: "🤩" },
  { id: 'ok', label: "مقبول", emoji: "🙂" },
  { id: 'hesitant', label: "متردد", emoji: "🤔" },
  { id: 'not_comfortable', label: "مش مريح", emoji: "😰" }
];

const STAGE_ORDER = ['year1', 'year2', 'year3', 'year4', 'post_grad'];
const STAGE_LABELS = ['سنة 1', 'سنة 2', 'سنة 3', 'سنة 4', 'عمل', 'مراجعة'];

export default function ExploreMajorDatabase() {
  const navigate = useNavigate();
  const { majorId } = useParams();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [major, setMajor] = useState<{ id: string; name_ar: string } | null>(null);
  const [sections, setSections] = useState<MajorSection[]>([]);
  
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [selectedComfort, setSelectedComfort] = useState<ComfortLevel | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<number | null>(null);
  const [reflections, setReflections] = useState({ q1: "", q2: "", q3: "" });
  
  const stageStartTimeRef = useRef(Date.now());

  useEffect(() => {
    if (!majorId) {
      navigate('/dashboard');
      return;
    }
    loadData();
  }, [majorId, navigate]);

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return navigate('/auth');

      const [majorRes, sectionsRes] = await Promise.all([
        supabase.from('majors').select('id, name_ar').eq('id', majorId).single(),
        supabase.from('major_explore_sections').select('*').eq('major_id', majorId)
      ]);

      if (majorRes.data) setMajor(majorRes.data);
      if (sectionsRes.data) {
        const sorted = (sectionsRes.data as MajorSection[]).sort((a, b) => STAGE_ORDER.indexOf(a.stage_key) - STAGE_ORDER.indexOf(b.stage_key));
        setSections(sorted);
      }

      stageStartTimeRef.current = Date.now();
    } catch (e) {
      toast.error("حدث خطأ في تحميل البيانات");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = async () => {
    if (currentStageIndex < 5 && (!selectedComfort || selectedScenario === null)) return;
    setIsSaving(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Save response if not on reflection stage
      if (currentStageIndex < 5) {
        const currentStageKey = STAGE_ORDER[currentStageIndex];
        const timeSpentSec = Math.round((Date.now() - stageStartTimeRef.current) / 1000);
        await supabase.from('major_explore_responses').insert({
          user_id: session.user.id,
          major_id: majorId,
          stage_key: currentStageKey,
          comfort_level: selectedComfort,
          scenario_choice_index: selectedScenario,
          time_spent_sec: timeSpentSec
        });
      }

      const nextIndex = currentStageIndex + 1;
      const isComplete = nextIndex > 5;
      
      // Update progress
      await supabase.from('user_progress').upsert({
        user_id: session.user.id,
        step_id: 'explore_major',
        status: isComplete ? 'completed' : 'in_progress',
        completed_at: isComplete ? new Date().toISOString() : null
      });

      if (isComplete) {
        toast.success("تم استكشاف التخصص بنجاح!");
        navigate('/dashboard/simulation');
      } else {
        setCurrentStageIndex(nextIndex);
        setSelectedComfort(null);
        setSelectedScenario(null);
        stageStartTimeRef.current = Date.now();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (e) {
      console.error(e);
      toast.error("خطأ في الحفظ");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !major) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (sections.length < 5) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4" dir="rtl">
        <Card className="p-8 bg-card border border-border shadow-sm text-center max-w-md">
          <h2 className="text-2xl font-bold text-foreground mb-3">المحتوى قيد التجهيز</h2>
          <p className="text-muted-foreground mb-6">محتوى رحلة تخصص "{major.name_ar}" غير مكتمل.</p>
          <Button onClick={() => navigate('/dashboard')} variant="outline">عودة</Button>
        </Card>
      </div>
    );
  }

  const isReflectionStage = currentStageIndex === 5;
  const currentSection = !isReflectionStage ? sections[currentStageIndex] : null;
  const canProceed = isReflectionStage
    ? (reflections.q1.length > 5 && reflections.q2.length > 5 && reflections.q3.length > 5)
    : (selectedComfort !== null && selectedScenario !== null);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans" dir="rtl">
      {/* HEADER & PROGRESS */}
      <header className="bg-card border-b border-border px-4 py-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Map className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-foreground text-sm">استكشاف: {major.name_ar}</h2>
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
                  currentStageIndex >= step ? "bg-primary border-primary text-primary-foreground shadow-md" : "bg-card border-border text-muted-foreground"
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
              النسخة المصورة (رحلة 60 دقيقة) ستكون متاحة قريبًا.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              الآن: عِش التجربة التفاعلية الواقعية واتخذ قراراتك بنفسك.
            </p>
          </div>
        </Card>

        {!isReflectionStage && currentSection ? (
          <div className="space-y-6">
            {/* Stage Title */}
            <div className="flex items-center gap-3">
              <Briefcase className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">{currentSection.stage_title_ar}</h1>
            </div>

            {/* Reality Snapshot */}
            <Card className="p-5 bg-card border border-border shadow-sm">
              <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" /> الواقع في هذه المرحلة
              </h3>
              <p className="text-muted-foreground leading-relaxed">{currentSection.reality_snapshot_ar}</p>
            </Card>

            {/* Challenges */}
            <Card className="p-5 bg-card border border-border shadow-sm">
              <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-accent" /> تحديات شائعة ستواجهها
              </h3>
              <ul className="space-y-2">
                {currentSection.challenges_ar.map((challenge, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-muted-foreground text-sm">
                    <span className="text-accent font-bold mt-0.5">•</span> {challenge}
                  </li>
                ))}
              </ul>
            </Card>

            {/* Scenario */}
            <Card className="p-5 bg-card border border-border shadow-sm">
              <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" /> موقف حقيقي: كيف تتصرف؟
              </h3>
              <p className="text-foreground font-medium mb-4">{currentSection.scenario_prompt_ar}</p>
              <div className="space-y-3">
                {currentSection.scenario_options_ar.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedScenario(idx)}
                    className={`w-full text-right p-4 rounded-xl border-2 transition-all font-medium text-sm ${
                      selectedScenario === idx 
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
                {COMFORT_UI.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedComfort(item.id as ComfortLevel)}
                    className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all text-xs ${
                      selectedComfort === item.id
                        ? "border-primary bg-card shadow-md text-primary font-bold scale-105"
                        : "border-transparent bg-card/60 text-muted-foreground font-medium hover:bg-card"
                    }`}
                  >
                    <span className="text-xl">{item.emoji}</span>
                    {item.label}
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
            onClick={handleNext}
          >
            {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : isReflectionStage ? "انتقل إلى المحاكاة الذكية" : "تأكيد واستمرار للخطوة التالية"}
            {!isSaving && <ArrowLeft className="w-5 h-5 mr-2" />}
          </Button>
        </div>
      </main>
    </div>
  );
}
