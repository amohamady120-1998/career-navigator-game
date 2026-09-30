import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, CheckCircle2, Sparkles, MessageCircleQuestion, RotateCcw, ChevronLeft } from "lucide-react";
import { HeroBand } from "@/components/HeroBand";
import { btnPrimary } from "@/lib/athar";
import { toast } from "sonner";

type DoubtOption = {
  id: number;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  bgClass: string;
  supportMessage: string;
  ctaText: string;
  nextRoute: string;
};

const DOUBT_OPTIONS: DoubtOption[] = [
  {
    id: 1,
    label: "حاسس إن ده مكاني!",
    icon: Sparkles,
    colorClass: "text-green-600",
    bgClass: "bg-green-50 border-green-200",
    supportMessage: "ممتاز! ثقتك في اختيارك هي أقوى مؤشر للنجاح. يلا نكمّل ونستكشف التخصص بشكل أعمق.",
    ctaText: "استكشف التخصص",
    nextRoute: "/dashboard/explore"
  },
  {
    id: 2,
    label: "عندي شوية أسئلة",
    icon: MessageCircleQuestion,
    colorClass: "text-blue-600",
    bgClass: "bg-blue-50 border-blue-200",
    supportMessage: "طبيعي جداً! الأسئلة دي علامة وعي مش ضعف. يلا نكمّل الاستكشاف وبعدها تقدر تحجز استشارة.",
    ctaText: "كمّل الاستكشاف",
    nextRoute: "/dashboard/explore"
  },
  {
    id: 3,
    label: "مش مرتاح، عايز أعيد",
    icon: RotateCcw,
    colorClass: "text-amber-600",
    bgClass: "bg-amber-50 border-amber-200",
    supportMessage: "ولا يهمك، إعادة الاختبار فرصة لتعرف نفسك أكتر. يلا نبدأ من جديد.",
    ctaText: "أعد اختبار هولاند",
    nextRoute: "/dashboard/holland"
  }
];

export default function DoubtCheckpointStep() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => setIsLoading(false), 2000);
    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { clearTimeout(timeout); return navigate('/auth'); }

        const { data: stepRow } = await supabase.from('journey_steps').select('id').eq('slug', 'doubt-checkpoint').maybeSingle();
        if (stepRow) {
          const { data: progress } = await supabase.from('user_progress')
            .select('meta_data')
            .eq('user_id', session.user.id)
            .eq('step_id', stepRow.id)
            .maybeSingle();
          if (progress?.meta_data && (progress.meta_data as any).doubt_level) {
            setSelectedId((progress.meta_data as any).doubt_level);
          }

          await supabase.from('user_progress').upsert({
            user_id: session.user.id,
            step_id: stepRow.id,
            status: 'in_progress'
          }, { onConflict: 'user_id,step_id' });
        }
      } catch (error) {
        console.error("Error loading checkpoint:", error);
      } finally {
        clearTimeout(timeout);
        setIsLoading(false);
      }
    };
    load();
    return () => clearTimeout(timeout);
  }, [navigate]);

  const handleContinue = async () => {
    if (!selectedId) return;
    console.log("[DoubtCheckpoint] NEXT_CLICKED, selectedId:", selectedId);
    setIsSaving(true);
    const selected = DOUBT_OPTIONS.find(o => o.id === selectedId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && selected) {
        const { data: stepRow } = await supabase.from('journey_steps').select('id').eq('slug', 'doubt-checkpoint').maybeSingle();
        if (stepRow) {
          const { error } = await supabase.from('user_progress').upsert({
            user_id: session.user.id,
            step_id: stepRow.id,
            status: 'completed',
            completed_at: new Date().toISOString(),
            meta_data: { doubt_level: selected.id, label: selected.label }
          }, { onConflict: 'user_id,step_id' });
          if (error) {
            console.error("[DoubtCheckpoint] SAVE_FAILED:", error);
            toast.error("خطأ أثناء حفظ التقدم");
            setIsSaving(false);
            return;
          }
          console.log("[DoubtCheckpoint] SAVE_SUCCESS");
          await queryClient.invalidateQueries({ queryKey: ["user-journey-progress"] });

          console.log("[DoubtCheckpoint] SIDEBAR_SYNC invalidated");
        }
        console.log("[DoubtCheckpoint] Navigating to:", selected.nextRoute);
        navigate(selected.nextRoute);
      }
    } catch (e) {
      console.error("[DoubtCheckpoint] SAVE_FAILED:", e);
      toast.error("حدث خطأ، يرجى المحاولة مرة أخرى.");
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

  const selectedOption = DOUBT_OPTIONS.find(o => o.id === selectedId);

  return (
    <div className="athar-page" dir="rtl">
      <HeroBand
        eyebrow="الفصل الثاني · لحظة صدق"
        title="بعد ما شوفت الرحلة دي… إحساسك إيه؟"
        description="لا ضغط ولا استعجال. اختر ما يعبّر عنك الآن."
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
        <div className="flex flex-col gap-[11px]">
          {DOUBT_OPTIONS.map((option) => {
            const isSelected = selectedId === option.id;
            const Icon = option.icon;
            return (
              <button
                type="button"
                key={option.id}
                onClick={() => setSelectedId(option.id)}
                data-selected={isSelected}
                aria-pressed={isSelected}
                className="athar-option gap-[15px] rounded-[15px] p-[17px]"
              >
                <span className="athar-tile h-11 w-11 rounded-xl">
                  <Icon className="h-[21px] w-[21px]" />
                </span>
                <span className="flex-1 text-[1.03rem] font-bold">{option.label}</span>
                {isSelected && <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-accent" />}
              </button>
            );
          })}
        </div>

        {selectedOption && (
          <div className="mt-4 animate-in fade-in rounded-[14px] border border-accent/25 bg-accent/5 px-4 py-3.5">
            <p className="leading-relaxed">{selectedOption.supportMessage}</p>
          </div>
        )}

        <div className="athar-foot justify-end">
          <Button
            type="button"
            className={btnPrimary}
            onClick={handleContinue}
            disabled={isSaving || !selectedOption}
          >
            {isSaving ? <Loader2 className="h-6 w-6 animate-spin" /> : selectedOption?.ctaText ?? "اختر ما يعبّر عنك"}
            {!isSaving && selectedOption && <ChevronLeft className="h-[17px] w-[17px]" />}
          </Button>
        </div>
      </section>
    </div>
  );
}
