import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ArrowLeft, ChevronUp, ChevronDown, CheckCircle2, Award, Briefcase, ExternalLink } from "lucide-react";
import { toast } from "sonner";

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
      await queryClient.invalidateQueries({ queryKey: ["step-guard-progress"] });
      await queryClient.invalidateQueries({ queryKey: ["user-progress-slugs"] });
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

              <h2 className="text-2xl font-extrabold text-foreground mb-4">{major.title}</h2>

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

              <Button variant="outline" size="sm" className="gap-2" onClick={() => handleExplore(major.id)}>
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
                  <span className="font-bold text-foreground">{major.title}</span>
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
          <Button type="button" size="lg" className="w-full h-14 text-lg font-bold rounded-xl shadow-md transition-all active:scale-95" onClick={handleContinue} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : "كمّل — شوف التخصصات الأقل توافقًا"}
            {!isSaving && <ArrowLeft className="w-5 h-5 mr-2" />}
          </Button>
        </div>
      </main>
    </div>
  );
}
