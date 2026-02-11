import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ArrowLeft, ChevronUp, ChevronDown, CheckCircle2, Award, Briefcase, ExternalLink } from "lucide-react";
import { toast } from "sonner";

type MajorOption = {
  id: string;
  name: string;
  reasons: string[];
  tags: string[];
};

const FALLBACK_MAJORS: MajorOption[] = [
  {
    id: "m_1",
    name: "إدارة الأعمال",
    reasons: ["شخصيتك المبادرة (E) تتناسب مع قيادة الفرق", "قدرتك العالية على اتخاذ القرارات تحت الضغط", "تفضيلك للبيئات الديناميكية والمتغيرة"],
    tags: ["قيادة", "مبادرة", "تأثير"]
  },
  {
    id: "m_2",
    name: "هندسة البرمجيات",
    reasons: ["نمطك التحليلي (I) يجعلك ممتازاً في حل المشكلات", "دقتك في التعامل مع التفاصيل والمنطق", "ميلك للعمل المستقل والتركيز العميق"],
    tags: ["تحليل", "تقنية", "منطق"]
  },
  {
    id: "m_3",
    name: "التسويق والعلاقات العامة",
    reasons: ["مهاراتك الاجتماعية (S) تدعم تواصلك الفعال", "إبداعك في إيصال الأفكار وإقناع الآخرين", "رغبتك في بيئة عمل تفاعلية وغير روتينية"],
    tags: ["تواصل", "إبداع", "اجتماعي"]
  }
];

const STORAGE_KEY = "athar_shortlist_ranking";

export default function ShortlistStep() {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [majors] = useState<MajorOption[]>(FALLBACK_MAJORS);
  const [rankedIds, setRankedIds] = useState<string[]>([]);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return navigate('/auth');

      // Load saved ranking from localStorage
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const valid = parsed.filter((id: string) => FALLBACK_MAJORS.find(m => m.id === id));
          if (valid.length === FALLBACK_MAJORS.length) {
            setRankedIds(valid);
          } else {
            setRankedIds(FALLBACK_MAJORS.map(m => m.id));
          }
        } catch {
          setRankedIds(FALLBACK_MAJORS.map(m => m.id));
        }
      } else {
        setRankedIds(FALLBACK_MAJORS.map(m => m.id));
      }
      setIsLoading(false);
    };
    init();
  }, [navigate]);

  const saveRanking = (newRanking: string[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newRanking));
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newRankedIds = [...rankedIds];
    [newRankedIds[index - 1], newRankedIds[index]] = [newRankedIds[index], newRankedIds[index - 1]];
    setRankedIds(newRankedIds);
    saveRanking(newRankedIds);
  };

  const moveDown = (index: number) => {
    if (index === rankedIds.length - 1) return;
    const newRankedIds = [...rankedIds];
    [newRankedIds[index + 1], newRankedIds[index]] = [newRankedIds[index], newRankedIds[index + 1]];
    setRankedIds(newRankedIds);
    saveRanking(newRankedIds);
  };

  const handleContinue = async () => {
    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Look up step id for shortlist
      const { data: steps } = await supabase.from('journey_steps').select('id').eq('slug', 'shortlist').maybeSingle();
      if (steps) {
        await supabase.from('user_progress').upsert({
          user_id: session.user.id,
          step_id: steps.id,
          status: 'completed',
          completed_at: new Date().toISOString()
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
    navigate('/dashboard/why-not');
  };

  const handleExplore = (majorName: string) => {
    toast.success(`جاري تجهيز بيئة استكشاف تخصص "${majorName}"...`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const rankedMajors = rankedIds.map(id => majors.find(m => m.id === id)).filter(Boolean) as MajorOption[];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans" dir="rtl">
      {/* HEADER */}
      <header className="bg-card border-b border-border px-4 py-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="font-extrabold text-lg text-primary">أثر ستارت</div>
            <div className="text-sm font-bold text-muted-foreground bg-muted px-3 py-1 rounded-full">
              ترتيب الاختيارات — الخطوة 4 من الرحلة
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            عودة للوحة التحكم
          </Button>
        </div>
      </header>

      <main className="flex-grow py-8 px-4 max-w-3xl mx-auto w-full">
        {/* TITLE */}
        <div className="text-center mb-10 animate-in fade-in duration-500">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-3">
            عندك {majors.length} اختيارات قوية
          </h1>
          <p className="text-lg text-muted-foreground font-medium max-w-md mx-auto">
            خلّينا نرتّبهم مبدئيًا… وبعدها نستكشفهم بشكل واقعي.
          </p>
        </div>

        {/* MAJOR CARDS */}
        <div className="space-y-6 mb-10">
          {rankedMajors.map((major, index) => (
            <Card key={major.id} className="p-6 border-2 border-border bg-card shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${index * 100}ms` }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-extrabold text-lg">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-bold text-muted-foreground bg-muted px-3 py-1 rounded-full">
                    خيار #{index + 1}
                  </span>
                </div>
              </div>

              <h2 className="text-2xl font-extrabold text-foreground mb-4">{major.name}</h2>

              <div className="space-y-2 mb-4">
                {major.reasons.map((reason, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-muted-foreground text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    {reason}
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {major.tags.map(tag => (
                  <span key={tag} className="text-xs font-bold bg-accent text-accent-foreground px-3 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>

              <Button variant="outline" size="sm" className="gap-2" onClick={() => handleExplore(major.name)}>
                استكشف التخصص
                <ExternalLink className="w-4 h-4" />
              </Button>
            </Card>
          ))}
        </div>

        {/* RE-RANKING CONTROL */}
        <Card className="p-6 border-2 border-primary/20 bg-primary/5 mb-10">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-lg text-foreground">إعادة الترتيب</h3>
            <span className="text-xs text-muted-foreground font-medium">استخدم الأسهم</span>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            💡 ده ترتيب مبدئي… تقدر تغيّره بعد المحاكاة واستكشاف التخصصات.
          </p>

          <div className="space-y-2">
            {rankedMajors.map((major, index) => (
              <div key={major.id} className="flex items-center justify-between bg-card p-3 rounded-lg border border-border shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-extrabold text-sm">
                    {index + 1}
                  </div>
                  <span className="font-bold text-foreground">{major.name}</span>
                </div>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={index === 0} onClick={() => moveUp(index)}>
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={index === rankedMajors.length - 1} onClick={() => moveDown(index)}>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* PRIMARY CTA */}
        <div className="pb-10">
          <Button size="lg" className="w-full h-14 text-lg font-bold rounded-xl shadow-md transition-all active:scale-95" onClick={handleContinue}>
            {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : "كمّل — شوف التخصصات الأقل توافقًا"}
            {!isSaving && <ArrowLeft className="w-5 h-5 mr-2" />}
          </Button>
        </div>
      </main>
    </div>
  );
}
