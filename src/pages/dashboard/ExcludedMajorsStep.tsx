import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Loader2, ArrowLeft, Info, ShieldCheck, ChevronLeft } from "lucide-react";
import { HeroBand } from "@/components/HeroBand";
import { btnPrimary } from "@/lib/athar";
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
  const queryClient = useQueryClient();
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [excludedMajors, setExcludedMajors] = useState<ExcludedMajor[]>([]);
  
  // Modal State
  const [selectedMajor, setSelectedMajor] = useState<ExcludedMajor | null>(null);

  // --- INITIALIZATION ---
  useEffect(() => {
    const timeout = setTimeout(() => {
      setExcludedMajors(FALLBACK_EXCLUDED);
      setIsLoading(false);
    }, 2000);

    const loadExcludedMajors = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { clearTimeout(timeout); return navigate('/auth'); }

        const { data: stepRow } = await supabase.from('journey_steps').select('id').eq('slug', 'excluded-majors').maybeSingle();
        
        let loadedMajors = FALLBACK_EXCLUDED;
        if (stepRow) {
          const { data: progress } = await supabase.from('user_progress')
            .select('meta_data')
            .eq('user_id', session.user.id)
            .eq('step_id', stepRow.id)
            .maybeSingle();
          if (progress?.meta_data && (progress.meta_data as any).excluded_majors) {
            loadedMajors = (progress.meta_data as any).excluded_majors;
          }

          await supabase.from('user_progress').upsert({
            user_id: session.user.id,
            step_id: stepRow.id,
            status: 'in_progress'
          }, { onConflict: 'user_id,step_id' });
        }

        setExcludedMajors(loadedMajors);
      } catch (error) {
        console.error("Error loading excluded majors:", error);
        setExcludedMajors(FALLBACK_EXCLUDED);
      } finally {
        clearTimeout(timeout);
        setIsLoading(false);
      }
    };

    loadExcludedMajors();
    return () => clearTimeout(timeout);
  }, [navigate]);

  const handleContinue = async () => {
    console.log("[ExcludedMajors] NEXT_CLICKED");
    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: stepRow } = await supabase.from('journey_steps').select('id').eq('slug', 'excluded-majors').single();
        if (stepRow) {
          const { error } = await supabase.from('user_progress').upsert({
            user_id: session.user.id,
            step_id: stepRow.id,
            status: 'completed',
            completed_at: new Date().toISOString()
          }, { onConflict: 'user_id,step_id' });
          if (error) {
            console.error("[ExcludedMajors] SAVE_FAILED:", error);
            toast.error("خطأ أثناء حفظ التقدم");
            setIsSaving(false);
            return;
          }
          console.log("[ExcludedMajors] SAVE_SUCCESS");
          await queryClient.invalidateQueries({ queryKey: ["user-journey-progress"] });

          console.log("[ExcludedMajors] SIDEBAR_SYNC invalidated");
        }
      }
      console.log("[ExcludedMajors] Navigating to /dashboard/doubt-checkpoint");
      navigate('/dashboard/doubt-checkpoint');
    } catch (e) {
      console.error("[ExcludedMajors] SAVE_FAILED:", e);
      toast.error("حدث خطأ غير متوقع");
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

  return (
    <div className="athar-page" dir="rtl">
      <HeroBand
        eyebrow="الفصل الثاني · لماذا استبعدناها"
        title="تخصصات أقل توافقًا معك حاليًا"
        description="ده لا يعني إنها مستحيلة… لكن في وضعك الحالي مش الأقرب لطبيعتك."
      >
        <Button
          variant="ghost"
          size="sm"
          className="rounded-[10px] px-0 font-bold text-hero-muted hover:bg-transparent hover:text-hero-foreground"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft className="h-4 w-4" />
          عودة
        </Button>
      </HeroBand>

      <section className="athar-card">
        {excludedMajors.length > 0 ? (
          <div>
            {excludedMajors.map((major) => (
              <div key={major.id} className="flex flex-wrap items-start gap-3 border-b border-border/60 py-3.5 first:pt-0 last:border-b-0">
                <div className="min-w-0 flex-1">
                  <b className="font-bold">{major.name}</b>
                  <p className="mt-1 text-[0.9rem] leading-relaxed text-muted-foreground">{major.shortReason}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 rounded-[10px] font-bold"
                  onClick={() => setSelectedMajor(major)}
                >
                  <Info className="h-4 w-4" />
                  اعرف أكثر
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-4 text-center">
            <h3 className="mb-2 text-lg font-bold">لا توجد تخصصات مستبعدة بوضوح</h3>
            <p className="text-muted-foreground">إجاباتك تظهر مرونة عالية وتوافقاً مع مجموعة كبيرة من التخصصات.</p>
          </div>
        )}

        {/* Reassurance */}
        <div className="mt-4 rounded-[14px] border border-success/25 bg-success/5 px-4 py-3.5">
          <h3 className="mb-2.5 flex items-center gap-2 font-bold text-success">
            <ShieldCheck className="h-[18px] w-[18px]" />
            اطمّن، هذه ليست أحكاماً نهائية:
          </h3>
          <ul className="space-y-2 text-[0.92rem] font-medium">
            <li>• الميول تتغير مع الخبرات والتجارب الجديدة.</li>
            <li>• المهارات يمكن أن تتطور إذا قررت الاستثمار فيها.</li>
            <li>• اختيارك في المنصة اليوم ليس نهائياً، بل هو نقطة انطلاق.</li>
          </ul>
        </div>

        <p className="mt-4 rounded-[14px] border border-border bg-muted/50 px-4 py-3.5 text-sm">
          🤔 لو أنت حاسس إن في تخصص منهم مهم جداً بالنسبة لك… ده طبيعي تماماً. هنراجع ده في الخطوة الجاية.
        </p>

        <div className="athar-foot justify-end">
          <Button type="button" className={btnPrimary} onClick={handleContinue} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-6 w-6 animate-spin" /> : "كمّل — لو لسه متردد"}
            {!isSaving && <ChevronLeft className="h-[17px] w-[17px]" />}
          </Button>
        </div>
      </section>

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
              <Button variant="outline" className="rounded-xl font-bold">حسناً، فهمت</Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
