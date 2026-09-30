import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, ChevronUp, ChevronDown, CheckCircle2, ExternalLink, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { HeroBand } from "@/components/HeroBand";
import { btnPrimary, toArabicDigits } from "@/lib/athar";

type MajorOption = { id: string; title: string; reasons: string[]; tags?: string[] };

export default function ShortlistStep() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [majors, setMajors] = useState<MajorOption[]>([]);
  const [rankedIds, setRankedIds] = useState<string[]>([]);

  useEffect(() => {
    const loadShortlist = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return navigate('/auth');

        // Fetch the report data from initial_report step
        // Look up step UUIDs
        const { data: stepsData } = await supabase.from('journey_steps').select('id, slug').in('slug', ['initial-report', 'shortlist']);
        const stepMap = Object.fromEntries((stepsData || []).map(s => [s.slug, s.id]));

        const { data: reportProgress } = await supabase
          .from('user_progress')
          .select('meta_data')
          .eq('user_id', session.user.id)
          .eq('step_id', stepMap['initial-report'] || '')
          .maybeSingle();

        const { data: shortlistProgress } = await supabase
          .from('user_progress')
          .select('meta_data')
          .eq('user_id', session.user.id)
          .eq('step_id', stepMap['shortlist'] || '')
          .maybeSingle();

        let loadedMajors: MajorOption[] = [];
        if (reportProgress?.meta_data) {
          loadedMajors = (reportProgress.meta_data as any).majors || [];
          // ensure tags exist for UI
          loadedMajors = loadedMajors.map(m => ({...m, tags: m.tags || ["موصى به"]}));
        }

        let loadedRankings = loadedMajors.map(m => m.id);
        if (shortlistProgress?.meta_data && (shortlistProgress.meta_data as any).ranking_json) {
          loadedRankings = (shortlistProgress.meta_data as any).ranking_json;
        }

        setMajors(loadedMajors);
        const validRankings = loadedRankings.filter(id => loadedMajors.find(m => m.id === id));
        setRankedIds(validRankings.length === loadedMajors.length ? validRankings : loadedMajors.map(m => m.id));
      } catch (error) {
        toast.error("حدث خطأ في تحميل التخصصات");
      } finally {
        setIsLoading(false);
      }
    };
    loadShortlist();
  }, [navigate]);

  const saveRankingToDb = async (newRanking: string[]) => {
    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: stepRow } = await supabase.from('journey_steps').select('id').eq('slug', 'shortlist').single();
      if (stepRow) {
        await supabase.from('user_progress').upsert({
          user_id: session.user.id,
          step_id: stepRow.id,
          status: 'in_progress',
          meta_data: { ranking_json: newRanking, last_saved_at: new Date().toISOString() }
        }, { onConflict: 'user_id,step_id' });
      }
    } catch (error) {
      toast.error("خطأ أثناء حفظ الترتيب");
    } finally {
      setIsSaving(false);
    }
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newRankedIds = [...rankedIds];
    [newRankedIds[index - 1], newRankedIds[index]] = [newRankedIds[index], newRankedIds[index - 1]];
    setRankedIds(newRankedIds);
    saveRankingToDb(newRankedIds);
  };

  const moveDown = (index: number) => {
    if (index === rankedIds.length - 1) return;
    const newRankedIds = [...rankedIds];
    [newRankedIds[index + 1], newRankedIds[index]] = [newRankedIds[index], newRankedIds[index + 1]];
    setRankedIds(newRankedIds);
    saveRankingToDb(newRankedIds);
  };

  const handleContinue = async () => {
    console.log('[ShortlistStep] Continue button clicked');
    setIsSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("يرجى تسجيل الدخول أولاً");
        setIsSaving(false);
        return;
      }

      const { data: stepRow } = await supabase.from('journey_steps').select('id').eq('slug', 'shortlist').single();
      if (stepRow) {
        const { error: progressError } = await supabase.from('user_progress').upsert({
          user_id: session.user.id,
          step_id: stepRow.id,
          status: 'completed',
          completed_at: new Date().toISOString(),
          meta_data: { ranking_json: rankedIds, completed_at: new Date().toISOString() }
        }, { onConflict: 'user_id,step_id' });

        if (progressError) {
          console.error('[ShortlistStep] Progress save error:', progressError);
          toast.error("خطأ أثناء حفظ التقدم");
          setIsSaving(false);
          return;
        }
        console.log('[ShortlistStep] Progress saved successfully');
      }

      const { error: shortlistError } = await supabase.from('student_shortlist').upsert({
        user_id: session.user.id,
        major_ids: rankedIds,
        ranking_ids: rankedIds,
      }, { onConflict: 'user_id' });

      if (shortlistError) {
        console.error('[ShortlistStep] Shortlist save error:', shortlistError);
        toast.error("خطأ أثناء حفظ الترتيب");
        setIsSaving(false);
        return;
      }

      // Invalidate StepGuard cache so the next page sees "shortlist" as completed
      await queryClient.invalidateQueries({ queryKey: ["user-journey-progress"] });

      console.log('[ShortlistStep] Cache invalidated, navigating to /dashboard/excluded-majors');
      navigate('/dashboard/excluded-majors');
    } catch (e) {
      console.error('[ShortlistStep] Unexpected error:', e);
      toast.error("حدث خطأ غير متوقع");
      setIsSaving(false);
    }
  };

  // Navigates to the dynamic explore page using the DB UUID
  const handleExplore = (majorId: string) => {
    navigate(`/dashboard/explore/${majorId}`);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  const rankedMajors = rankedIds.map(id => majors.find(m => m.id === id)).filter(Boolean) as MajorOption[];

  return (
    <div className="athar-page" dir="rtl">
      <HeroBand
        eyebrow="الفصل الثاني · ترتيب الاختيارات"
        title={<>عندك {toArabicDigits(majors.length)} اختيارات قوية</>}
        description="خلّينا نرتّبهم مبدئيًا… وبعدها نستكشفهم بشكل واقعي."
      >
        <Button
          variant="ghost"
          size="sm"
          className="rounded-[10px] px-0 font-bold text-hero-muted hover:bg-transparent hover:text-hero-foreground"
          onClick={() => navigate('/dashboard')}
        >
          عودة للوحة التحكم
        </Button>
      </HeroBand>

      <section className="athar-card">
        <div className="flex flex-col gap-[11px]">
          {rankedMajors.map((major, index) => {
            const top = index === 0;
            return (
              <div
                key={major.id}
                className={`rounded-[13px] border px-[17px] py-[15px] transition-colors ${
                  top ? "border-accent/50 bg-accent/5" : "border-border bg-card"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`grid h-8 w-8 flex-none place-items-center rounded-[9px] font-extrabold ${
                      top ? "btn-gradient" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {toArabicDigits(index + 1)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-bold">{major.title}</h2>
                    <small className="block text-[0.8rem] text-muted-foreground">
                      {top ? "الأقرب لنمطك" : `خيار #${toArabicDigits(index + 1)}`}
                    </small>
                  </div>
                  <div className="flex flex-col gap-[3px]">
                    <button
                      type="button"
                      aria-label={`نقل ${major.title} للأعلى`}
                      disabled={index === 0}
                      onClick={() => moveUp(index)}
                      className="grid h-[22px] w-7 place-items-center rounded-[7px] border border-border bg-card text-muted-foreground transition-colors hover:border-accent hover:text-[hsl(var(--gradient-end))] disabled:opacity-40"
                    >
                      <ChevronUp className="h-[13px] w-[13px]" />
                    </button>
                    <button
                      type="button"
                      aria-label={`نقل ${major.title} للأسفل`}
                      disabled={index === rankedMajors.length - 1}
                      onClick={() => moveDown(index)}
                      className="grid h-[22px] w-7 place-items-center rounded-[7px] border border-border bg-card text-muted-foreground transition-colors hover:border-accent hover:text-[hsl(var(--gradient-end))] disabled:opacity-40"
                    >
                      <ChevronDown className="h-[13px] w-[13px]" />
                    </button>
                  </div>
                </div>

                {major.reasons.length > 0 && (
                  <ul className="mt-3 space-y-1.5 ps-11">
                    {major.reasons.map((reason, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                        {reason}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-2 ps-11">
                  {major.tags.map(tag => (
                    <span key={tag} className="rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-semibold text-[hsl(var(--gradient-end))]">
                      {tag}
                    </span>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="ms-auto gap-2 rounded-[10px] font-bold"
                    onClick={() => handleExplore(major.id)}
                  >
                    استكشف التخصص
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-[14px] border border-success/25 bg-success/5 px-4 py-3.5 text-[0.92rem] font-semibold text-success">
          <ShieldCheck className="h-[18px] w-[18px] flex-none" />
          💡 ده ترتيب مبدئي… تقدر تغيّره بعد المحاكاة واستكشاف التخصصات.
        </div>

        <div className="athar-foot justify-end">
          <Button type="button" className={btnPrimary} onClick={handleContinue} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-6 w-6 animate-spin" /> : "كمّل — شوف التخصصات الأقل توافقًا"}
            {!isSaving && <ArrowLeft className="h-5 w-5" />}
          </Button>
        </div>
      </section>
    </div>
  );
}
