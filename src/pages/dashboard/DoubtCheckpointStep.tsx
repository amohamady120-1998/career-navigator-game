import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ArrowLeft, CheckCircle2, Sparkles, MessageCircleQuestion, RotateCcw } from "lucide-react";
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
    supportMessage: "ممتاز! ثقتك في اختيارك هي أقوى مؤشر للنجاح. يلا نكمّل ونجهّز تقريرك النهائي.",
    ctaText: "اعرض تقريري النهائي",
    nextRoute: "/dashboard/final-report"
  },
  {
    id: 2,
    label: "عندي شوية أسئلة",
    icon: MessageCircleQuestion,
    colorClass: "text-blue-600",
    bgClass: "bg-blue-50 border-blue-200",
    supportMessage: "طبيعي جداً! الأسئلة دي علامة وعي مش ضعف. تقدر تحجز استشارة مع مرشد مهني يساعدك.",
    ctaText: "احجز استشارة",
    nextRoute: "/dashboard/consultation"
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
    setIsSaving(true);
    const selected = DOUBT_OPTIONS.find(o => o.id === selectedId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && selected) {
        const { data: stepRow } = await supabase.from('journey_steps').select('id').eq('slug', 'doubt-checkpoint').maybeSingle();
        if (stepRow) {
          await supabase.from('user_progress').upsert({
            user_id: session.user.id,
            step_id: stepRow.id,
            status: 'completed',
            completed_at: new Date().toISOString(),
            meta_data: { doubt_level: selected.id, label: selected.label }
          }, { onConflict: 'user_id,step_id' });
          queryClient.invalidateQueries({ queryKey: ["step-guard-progress"] });
          queryClient.invalidateQueries({ queryKey: ["user-progress-slugs"] });
        }
        navigate(selected.nextRoute);
      }
    } catch {
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

  const selectedOption = DOUBT_OPTIONS.find(o => o.id === selectedId);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans" dir="rtl">
      <header className="bg-card border-b border-border px-4 py-3 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="font-extrabold text-lg text-primary hidden sm:block">أثر ستارت</div>
            <div className="text-sm font-bold text-muted-foreground bg-secondary px-3 py-1 rounded-full">
              لحظة صدق
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-muted-foreground font-bold" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 ml-2" />
            عودة
          </Button>
        </div>
      </header>

      <main className="flex-grow py-8 px-4 max-w-2xl mx-auto w-full animate-in fade-in">
        <div className="mb-10 text-center">
          <span className="text-5xl mb-4 block">💭</span>
          <h1 className="text-3xl font-bold mb-3">بعد ما شوفت الرحلة دي…</h1>
          <p className="text-xl text-muted-foreground font-medium">إحساسك إيه؟</p>
        </div>

        <div className="space-y-3 mb-10">
          {DOUBT_OPTIONS.map((option) => {
            const isSelected = selectedId === option.id;
            const Icon = option.icon;
            return (
              <Card
                key={option.id}
                onClick={() => setSelectedId(option.id)}
                className={`cursor-pointer p-5 flex items-center gap-4 transition-all duration-200 border-2 ${
                  isSelected
                    ? `${option.bgClass} shadow-md transform scale-[1.02]`
                    : `bg-card border-border hover:border-primary/30 hover:bg-accent/5`
                }`}
              >
                <div className={`flex-shrink-0 ${option.colorClass}`}>
                  <Icon className="w-7 h-7" />
                </div>
                <p className="font-semibold text-foreground text-base flex-grow">{option.label}</p>
                {isSelected && <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />}
              </Card>
            );
          })}
        </div>

        {selectedOption && (
          <Card className="p-6 bg-accent/5 border border-accent/20 mb-10 shadow-sm animate-in fade-in">
            <p className="text-foreground leading-relaxed mb-6">{selectedOption.supportMessage}</p>
            <Button
              size="lg"
              className="w-full h-14 text-lg font-bold rounded-xl shadow-md"
              onClick={handleContinue}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="w-6 h-6 animate-spin ml-2" /> : selectedOption.ctaText}
              {!isSaving && <span className="ml-2">←</span>}
            </Button>
          </Card>
        )}
      </main>
    </div>
  );
}
