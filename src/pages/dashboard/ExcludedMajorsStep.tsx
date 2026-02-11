import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Loader2, ArrowLeft, Info, AlertCircle } from "lucide-react";
import { toast } from "sonner";

// --- TYPES & FALLBACK DATA ---
type ExcludedMajor = {
  id: string;
  name: string;
  shortReason: string;
  detailedExplanation: string;
};

// Fallback data in case the backend hasn't generated the JSON yet
const FALLBACK_EXCLUDED: ExcludedMajor[] = [
  {
    id: "ex_1",
    name: "الطب البشري",
    shortReason: "يتطلب بيئة عمل روتينية وحذرة جداً، بينما أنت تميل للإبداع والمرونة.",
    detailedExplanation: "مهنة الطب عظيمة، لكنها تتطلب في سنواتها الأولى التزاماً صارماً بالقواعد الطبية وبيئة عمل قد تكون عالية الضغط وقليلة المرونة. بناءً على إجاباتك، أنت شخص يبدع أكثر في البيئات التي تتيح لك الابتكار وحرية اتخاذ القرار خارج الصندوق، وهو ما قد تفتقده في غرف الطوارئ حالياً."
  },
  {
    id: "ex_2",
    name: "المحاسبة والمالية",
    shortReason: "تعتمد بشكل مكثف على التعامل مع الأرقام بدلاً من التفاعل البشري المباشر.",
    detailedExplanation: "المحاسبة تتطلب جلوساً طويلاً وتحليلاً دقيقاً للبيانات المالية بشكل مستقل (نمط تقليدي C). شخصيتك الاجتماعية والمبادرة (S, E) تعني أنك تستمد طاقتك من التفاعل مع الناس، النقاشات، وبناء العلاقات، مما قد يجعلك تشعر بالملل السريع في المهام المكتبية البحتة."
  },
  {
    id: "ex_3",
    name: "الهندسة الميكانيكية",
    shortReason: "طبيعة العمل تركز على الآلات والأشياء أكثر من الأفكار الاستراتيجية.",
    detailedExplanation: "الهندسة تركز بقوة على النمط الواقعي (R) الذي يفضل العمل اليدوي، التعامل بالآلات، والتواجد في المواقع الميدانية. أنت أظهرت ميولاً أعلى نحو التخطيط الاستراتيجي، إدارة الأفراد، أو العمل الإبداعي، وهي مجالات قد لا تجد مساحة كافية لها في البدايات الهندسية البحتة."
  }
];

export default function ExcludedMajorsStep() {
  const navigate = useNavigate();
  
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [excludedMajors, setExcludedMajors] = useState<ExcludedMajor[]>([]);
  
  // Modal State
  const [selectedMajor, setSelectedMajor] = useState<ExcludedMajor | null>(null);

  // --- INITIALIZATION ---
  useEffect(() => {
    const loadExcludedMajors = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return navigate('/auth');

        // Try to load from localStorage first
        const stored = localStorage.getItem('athar_excluded_majors');
        let loadedMajors = stored ? JSON.parse(stored) : FALLBACK_EXCLUDED;

        // Initialize step in DB
        await supabase.from('user_progress').upsert({
          user_id: session.user.id,
          step_id: 'excluded_majors',
          status: 'in_progress'
        });

        setExcludedMajors(loadedMajors);

      } catch (error) {
        console.error("Error loading excluded majors:", error);
        toast.error("حدث خطأ في تحميل البيانات");
      } finally {
        setIsLoading(false);
      }
    };

    loadExcludedMajors();
  }, [navigate]);

  const handleContinue = async () => {
    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.from('user_progress').update({
          status: 'completed',
          completed_at: new Date().toISOString()
        }).eq('user_id', session.user.id).eq('step_id', 'excluded_majors');
      }
      navigate('/dashboard/shortlist');
    } catch (e) {
      console.error(e);
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

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans" dir="rtl">
      {/* 1) HEADER */}
      <header className="bg-card border-b border-border px-4 py-3 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="font-extrabold text-lg text-primary hidden sm:block">أثر ستارت</div>
            <div className="text-sm font-bold text-muted-foreground bg-secondary px-3 py-1 rounded-full">
              توضيح الاختيارات
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
        <div className="mb-8">
          <div className="mb-4">
            <AlertCircle className="w-8 h-8 text-accent" />
          </div>
          <h1 className="text-3xl font-bold mb-2">تخصصات أقل توافقًا معك حاليًا</h1>
          <p className="text-lg text-muted-foreground font-medium">
            ده لا يعني إنها مستحيلة… لكن في وضعك الحالي مش الأقرب لطبيعتك.
          </p>
        </div>

        {/* 3) REASSURANCE INFO CARD */}
        <Card className="p-6 border-l-4 border-l-accent bg-accent/5 mb-8 shadow-sm">
          <h3 className="font-bold text-lg mb-4">اطمّن، هذه ليست أحكاماً نهائية:</h3>
          <ul className="space-y-3">
            <li className="flex gap-3">
              <span className="text-accent font-bold">•</span>
              <span className="text-foreground">الميول تتغير مع الخبرات والتجارب الجديدة.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-accent font-bold">•</span>
              <span className="text-foreground">المهارات يمكن أن تتطور إذا قررت الاستثمار فيها.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-accent font-bold">•</span>
              <span className="text-foreground">اختيارك في المنصة اليوم ليس نهائياً، بل هو نقطة انطلاق.</span>
            </li>
          </ul>
        </Card>

        {/* 4) EXCLUDED MAJORS LIST */}
        {excludedMajors.length > 0 ? (
          <div className="space-y-4 mb-8">
            {excludedMajors.map((major) => (
              <Card key={major.id} className="p-5 bg-card border border-border hover:border-primary/30 transition-colors shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-grow">
                    <h3 className="text-lg font-bold text-foreground mb-2">{major.name}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{major.shortReason}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 text-muted-foreground hover:text-primary"
                  onClick={() => setSelectedMajor(major)}
                >
                  <Info className="w-4 h-4 ml-2" />
                  اعرف أكثر
                </Button>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 bg-card text-center shadow-sm mb-8">
            <h3 className="text-lg font-bold text-foreground mb-2">لا توجد تخصصات مستبعدة بوضوح</h3>
            <p className="text-muted-foreground">إجاباتك تظهر مرونة عالية وتوافقاً مع مجموعة كبيرة من التخصصات.</p>
          </Card>
        )}

        {/* 5) MICRO NOTE AT BOTTOM */}
        <Card className="p-4 bg-primary/5 border border-primary/20 mb-8 shadow-sm">
          <p className="text-sm text-foreground">
            🤔 لو أنت حاسس إن في تخصص منهم مهم جداً بالنسبة لك… ده طبيعي تماماً. هنراجع ده في الخطوة الجاية.
          </p>
        </Card>

        {/* 6) PRIMARY CTA */}
        <Button
          size="lg"
          className="w-full h-14 text-lg font-bold rounded-xl shadow-md mb-10"
          onClick={handleContinue}
          disabled={isSaving}
        >
          {isSaving ? <Loader2 className="w-6 h-6 animate-spin ml-2" /> : "كمّل — لو لسه متردد"}
        </Button>
      </main>

      {/* DETAILED EXPLANATION MODAL */}
      <Dialog open={!!selectedMajor} onOpenChange={(open) => !open && setSelectedMajor(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>لماذا استبعدنا {selectedMajor?.name}؟</DialogTitle>
            <DialogDescription>توضيح مبني على نمط تفكيرك وإجاباتك.</DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-foreground leading-relaxed text-right">
              {selectedMajor?.detailedExplanation}
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <DialogClose asChild>
              <Button variant="outline">حسناً، فهمت</Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
