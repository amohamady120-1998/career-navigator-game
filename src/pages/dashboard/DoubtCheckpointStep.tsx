import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ArrowLeft, CheckCircle2, Scale, Search, HelpCircle } from "lucide-react";
import { toast } from "sonner";

// --- TYPES & DATA ---
type DoubtLevel = {
  id: number;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  bgClass: string;
  supportMessage: string;
  ctaText: string;
  nextRoute: string;
};

const DOUBT_LEVELS: DoubtLevel[] = [
  {
    id: 1,
    label: "أنا مرتاح وواضح بالنسبة لي",
    icon: CheckCircle2,
    colorClass: "text-green-600",
    bgClass: "bg-green-50 border-green-200",
    supportMessage: "ممتاز! الثقة دي نقطة انطلاق قوية جداً. يلا ندخل في تفاصيل تخصصك ونتعمق فيه.",
    ctaText: "ابدأ استكشاف التخصص",
    nextRoute: "/dashboard/explore"
  },
  {
    id: 2,
    label: "عندي اختيارين ومش عارف أرتبهم",
    icon: Scale,
    colorClass: "text-blue-600",
    bgClass: "bg-blue-50 border-blue-200",
    supportMessage: "طبيعي جداً! هنا يجي دور المحاكاة الذكية.. هتحطك في مواقف حقيقية وتخليك تحسم قرارك بنفسك.",
    ctaText: "جرب المحاكاة الذكية",
    nextRoute: "/dashboard/simulation"
  },
  {
    id: 3,
    label: "مش مقتنع بأي اختيار بالكامل",
    icon: Search,
    colorClass: "text-amber-600",
    bgClass: "bg-amber-50 border-amber-200",
    supportMessage: "ولا يهمك، أحياناً المسميات بتخدع. التعمق في التخصصات هيوضح لك زوايا مكنتش شايفها.",
    ctaText: "استكشف التخصص بعمق",
    nextRoute: "/dashboard/explore"
  },
  {
    id: 4,
    label: "حاسس إني تايه ومش عارف أبدأ منين",
    icon: HelpCircle,
    colorClass: "text-red-600",
    bgClass: "bg-red-50 border-red-200",
    supportMessage: "مفيش مشكلة خالص، كلنا بنمر باللحظة دي. المرشد المهني موجود عشان يسمعك ويوجهك خطوة بخطوة.",
    ctaText: "احجز استشارة مهنية",
    nextRoute: "/dashboard/ai-counselor"
  }
];

export default function DoubtCheckpointStep() {
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null);

  // --- INITIALIZATION ---
  useEffect(() => {
    const loadCheckpoint = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return navigate('/auth');

        // Look up step UUID and load from DB
        const { data: stepRow } = await supabase.from('journey_steps').select('id').eq('slug', 'doubt-checkpoint').single();
        if (stepRow) {
          const { data: progress } = await supabase.from('user_progress')
            .select('meta_data')
            .eq('user_id', session.user.id)
            .eq('step_id', stepRow.id)
            .maybeSingle();
          if (progress?.meta_data && (progress.meta_data as any).doubt_level) {
            setSelectedLevelId((progress.meta_data as any).doubt_level);
          }

          // Initialize step in DB
          await supabase.from('user_progress').upsert({
            user_id: session.user.id,
            step_id: stepRow.id,
            status: 'in_progress'
          }, { onConflict: 'user_id,step_id' });
        }
      } catch (error) {
        console.error("Error loading checkpoint:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCheckpoint();
  }, [navigate]);

  // --- SAVE & CONTINUE ---
  const handleContinue = async () => {
    if (!selectedLevelId) return;
    
    setIsSaving(true);
    const selectedLevel = DOUBT_LEVELS.find(l => l.id === selectedLevelId);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && selectedLevel) {
        const { data: stepRow } = await supabase.from('journey_steps').select('id').eq('slug', 'doubt-checkpoint').single();
        if (stepRow) {
          await supabase.from('user_progress').upsert({
            user_id: session.user.id,
            step_id: stepRow.id,
            status: 'completed',
            completed_at: new Date().toISOString(),
            meta_data: { doubt_level: selectedLevel.id, label: selectedLevel.label }
          }, { onConflict: 'user_id,step_id' });
        }
        
        // Dynamic Routing based on selection
        navigate(selectedLevel.nextRoute);
      }
    } catch (error) {
      toast.error("حدث خطأ، يرجى المحاولة مرة أخرى.");
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

  const selectedOption = DOUBT_LEVELS.find(l => l.id === selectedLevelId);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans" dir="rtl">
      {/* 1) HEADER */}
      <header className="bg-card border-b border-border px-4 py-3 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="font-extrabold text-lg text-primary hidden sm:block">أثر ستارت</div>
            <div className="text-sm font-bold text-muted-foreground bg-secondary px-3 py-1 rounded-full">
              لحظة صادقة مع نفسك
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-muted-foreground font-bold" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 ml-2" />
            عودة
          </Button>
        </div>
      </header>

      <main className="flex-grow py-8 px-4 max-w-2xl mx-auto w-full animate-in fade-in">
        {/* 2) TITLE & SUBTITLE */}
        <div className="mb-10">
          <div className="mb-4">
            <span className="text-4xl">💭</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">خلّينا نكون صريحين…</h1>
          <p className="text-lg text-muted-foreground font-medium">
            بعد ما شفت الاختيارات، هل في حاجة لسه مش مرتاح لها؟
          </p>
        </div>

        {/* 3) QUESTION */}
        <div className="mb-6 text-base font-semibold text-foreground">
          إحساسك دلوقتي أقرب لإيه؟
        </div>

        {/* 4) SELECTION CARDS */}
        <div className="space-y-3 mb-10">
          {DOUBT_LEVELS.map((level) => {
            const isSelected = selectedLevelId === level.id;
            const Icon = level.icon;
            return (
              <Card
                key={level.id}
                onClick={() => setSelectedLevelId(level.id)}
                className={`cursor-pointer p-4 md:p-5 flex items-center gap-4 transition-all duration-200 border-2 ${
                  isSelected 
                    ? `${level.bgClass} shadow-md transform scale-[1.02]` 
                    : `bg-card border-border hover:border-primary/30 hover:bg-accent/5`
                }`}
              >
                <div className={`flex-shrink-0 ${level.colorClass}`}>
                  <Icon className="w-6 h-6" />
                </div>

                <div className="flex-grow">
                  <p className="font-semibold text-foreground text-sm md:text-base">
                    {level.label}
                  </p>
                </div>

                {isSelected && (
                  <div className="flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* 5) DYNAMIC RESPONSE BLOCK */}
        {selectedOption && (
          <Card className="p-6 bg-accent/5 border border-accent/20 mb-10 shadow-sm animate-in fade-in">
            <div className="flex flex-col gap-6">
              <p className="text-foreground leading-relaxed">
                {selectedOption.supportMessage}
              </p>
              
              <Button
                size="lg"
                className="w-full h-14 text-lg font-bold rounded-xl shadow-md"
                onClick={handleContinue}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 className="w-6 h-6 animate-spin ml-2" /> : selectedOption.ctaText}
                {!isSaving && <span className="ml-2">→</span>}
              </Button>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
