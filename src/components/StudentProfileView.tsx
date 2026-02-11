import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { User, GraduationCap, Award, Brain, Compass, BarChart3, ShieldCheck, BookOpen } from "lucide-react";
import { analyzeSimulationTraits, TRAIT_LABELS, type TraitDimension } from "@/lib/traitMapping";

const RIASEC_LABELS: Record<string, string> = {
  R: "واقعي", I: "بحثي", A: "فني", S: "اجتماعي", E: "مبادر", C: "تقليدي",
};

const COMFORT_LABELS: Record<string, string> = {
  very_comfortable: "مرتاح جدًا",
  comfortable: "مرتاح",
  neutral: "محايد",
  uncomfortable: "غير مرتاح",
  very_uncomfortable: "غير مرتاح جدًا",
};

const STAGE_LABELS: Record<string, string> = {
  year1: "السنة الأولى",
  year2: "السنة الثانية",
  year3: "السنة الثالثة",
  year4: "السنة الرابعة",
  post_grad: "بعد التخرج",
};

interface Props {
  studentId: string;
  studentName?: string;
  onClose?: () => void;
}

export default function StudentProfileView({ studentId, studentName }: Props) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [journeyProgress, setJourneyProgress] = useState<{ name: string; completed: boolean }[]>([]);
  const [progressPercent, setProgressPercent] = useState(0);
  const [holland, setHolland] = useState<any>(null);
  const [hollandCode, setHollandCode] = useState<any>(null);
  const [shortlist, setShortlist] = useState<{ name: string }[]>([]);
  const [exploreInsights, setExploreInsights] = useState<{ stage: string; comfort: string; majorName: string }[]>([]);
  const [topTraits, setTopTraits] = useState<{ key: TraitDimension; label: string; score: number }[]>([]);
  const [impactPre, setImpactPre] = useState<number | null>(null);
  const [impactPost, setImpactPost] = useState<number | null>(null);
  const [certificate, setCertificate] = useState<any>(null);

  useEffect(() => {
    fetchAllData();
  }, [studentId]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [
        profileRes, stepsRes, progressRes, hollandRes, shortlistRes,
        exploreRes, simRes, scenariosRes, impactRes, certRes,
      ] = await Promise.all([
        supabase.from("profiles").select("full_name, grade_level, school_name").eq("user_id", studentId).maybeSingle(),
        supabase.from("journey_steps").select("id, name_ar, slug, order_index").order("order_index"),
        supabase.from("user_progress").select("step_id, status").eq("user_id", studentId),
        supabase.from("holland_results").select("scores, top_code").eq("user_id", studentId).maybeSingle(),
        supabase.from("student_shortlist").select("ranking_ids").eq("user_id", studentId).maybeSingle(),
        supabase.from("major_explore_responses").select("stage_key, comfort_level, major_id").eq("user_id", studentId),
        supabase.from("simulation_responses").select("scenario_id, selected_option_id").eq("user_id", studentId),
        supabase.from("simulation_scenarios").select("id, options_json"),
        supabase.from("impact_assessments").select("assessment_type, score_json").eq("user_id", studentId),
        supabase.from("certificates").select("certificate_code, issued_at").eq("user_id", studentId).maybeSingle(),
      ]);

      // Profile
      setProfile(profileRes.data);

      // Journey progress
      const steps = stepsRes.data ?? [];
      const completedIds = new Set(
        (progressRes.data ?? []).filter(p => p.status === "completed").map(p => p.step_id)
      );
      const jp = steps.map(s => ({ name: s.name_ar, completed: completedIds.has(s.id) }));
      setJourneyProgress(jp);
      const completedCount = jp.filter(s => s.completed).length;
      setProgressPercent(steps.length ? Math.round((completedCount / steps.length) * 100) : 0);

      // Holland
      if (hollandRes.data) {
        setHolland(hollandRes.data);
        const { data: codeData } = await supabase
          .from("holland_codes")
          .select("description, strengths, weaknesses")
          .eq("code", hollandRes.data.top_code)
          .maybeSingle();
        setHollandCode(codeData);
      }

      // Shortlist
      if (shortlistRes.data?.ranking_ids) {
        const ids = shortlistRes.data.ranking_ids as string[];
        if (ids.length) {
          const { data: majors } = await supabase.from("majors").select("id, name_ar").in("id", ids);
          const majorMap = new Map((majors ?? []).map(m => [m.id, m.name_ar]));
          setShortlist(ids.map(id => ({ name: majorMap.get(id) ?? "—" })));
        }
      }

      // Explore insights
      if (exploreRes.data?.length) {
        const majorIds = [...new Set(exploreRes.data.map(r => r.major_id).filter(Boolean))] as string[];
        let majorMap = new Map<string, string>();
        if (majorIds.length) {
          const { data: majors } = await supabase.from("majors").select("id, name_ar").in("id", majorIds);
          majorMap = new Map((majors ?? []).map(m => [m.id, m.name_ar]));
        }
        setExploreInsights(
          exploreRes.data.map(r => ({
            stage: r.stage_key,
            comfort: r.comfort_level,
            majorName: r.major_id ? majorMap.get(r.major_id) ?? "—" : "—",
          }))
        );
      }

      // Simulation traits
      if (simRes.data?.length && scenariosRes.data?.length) {
        const traits = analyzeSimulationTraits(simRes.data, scenariosRes.data);
        setTopTraits(traits.slice(0, 3));
      }

      // Impact
      const impacts = impactRes.data ?? [];
      const pre = impacts.find(i => i.assessment_type === "pre");
      const post = impacts.find(i => i.assessment_type === "post");
      if (pre?.score_json) {
        const scores = pre.score_json as Record<string, number>;
        const vals = Object.values(scores).filter(v => typeof v === "number");
        setImpactPre(vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null);
      }
      if (post?.score_json) {
        const scores = post.score_json as Record<string, number>;
        const vals = Object.values(scores).filter(v => typeof v === "number");
        setImpactPost(vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null);
      }

      // Certificate
      setCertificate(certRes.data);
    } catch (err) {
      console.error("Error loading student profile:", err);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="space-y-4" dir="rtl">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-32 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  const displayName = studentName || profile?.full_name || "الطالب";
  const scores = holland?.scores as Record<string, number> | undefined;
  const maxScore = scores ? Math.max(...Object.values(scores).map(Number), 1) : 1;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Basic Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="w-5 h-5 text-primary" />
            {displayName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">المرحلة الدراسية</p>
              <p className="font-medium">{profile?.grade_level || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">المدرسة</p>
              <p className="font-medium">{profile?.school_name || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">نسبة الإتمام</p>
              <p className="font-bold text-primary">{progressPercent}%</p>
            </div>
          </div>
          <Progress value={progressPercent} className="mt-3 h-2.5" />
        </CardContent>
      </Card>

      {/* Journey Steps */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="w-5 h-5 text-primary" />
            مراحل الرحلة
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {journeyProgress.map((step, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 p-2 rounded-lg border text-xs ${
                  step.completed
                    ? "border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/5 text-foreground font-medium"
                    : "border-border bg-muted/30 text-muted-foreground"
                }`}
              >
                <div className={`w-2 h-2 rounded-full shrink-0 ${step.completed ? "bg-[hsl(var(--success))]" : "bg-muted-foreground/30"}`} />
                {step.name}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Holland Results */}
      {holland && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Compass className="w-5 h-5 text-primary" />
              نتائج هولاند (RIASEC)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <Badge variant="secondary" className="text-lg px-5 py-1.5 font-bold">
                {holland.top_code}
              </Badge>
            </div>
            {hollandCode?.description && (
              <p className="text-sm text-muted-foreground text-center">{hollandCode.description}</p>
            )}
            {scores && (
              <div className="space-y-2">
                {["R", "I", "A", "S", "E", "C"].map(code => {
                  const score = Number(scores[code] || 0);
                  const pct = (score / maxScore) * 100;
                  return (
                    <div key={code} className="flex items-center gap-3">
                      <span className="w-14 text-xs font-medium">{RIASEC_LABELS[code]}</span>
                      <div className="flex-1 h-3.5 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-8 text-xs text-muted-foreground">{score}</span>
                    </div>
                  );
                })}
              </div>
            )}
            {hollandCode && (
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <h4 className="font-bold text-xs text-[hsl(var(--success))] mb-1.5">نقاط القوة</h4>
                  <ul className="space-y-1">
                    {(hollandCode.strengths as string[])?.map((s: string, i: number) => (
                      <li key={i} className="text-xs text-muted-foreground">• {s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-xs text-destructive mb-1.5">نقاط الضعف</h4>
                  <ul className="space-y-1">
                    {(hollandCode.weaknesses as string[])?.map((w: string, i: number) => (
                      <li key={i} className="text-xs text-muted-foreground">• {w}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Shortlist */}
      {shortlist.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <GraduationCap className="w-5 h-5 text-primary" />
              التخصصات المختارة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {shortlist.map((m, i) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                    {i + 1}
                  </span>
                  {m.name}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Explore Insights */}
      {exploreInsights.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="w-5 h-5 text-primary" />
              رؤى الاستكشاف
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {exploreInsights.map((insight, i) => (
                <div key={i} className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/30">
                  <div>
                    <span className="text-muted-foreground text-xs">{STAGE_LABELS[insight.stage] || insight.stage}</span>
                    <span className="mx-2 text-muted-foreground">—</span>
                    <span className="font-medium">{insight.majorName}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {COMFORT_LABELS[insight.comfort] || insight.comfort}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Simulation Traits */}
      {topTraits.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Brain className="w-5 h-5 text-primary" />
              أبرز السمات المهنية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topTraits.map((trait, i) => (
                <div key={trait.key} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-accent/20 text-accent-foreground flex items-center justify-center text-xs font-bold shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{trait.label}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">{trait.score} نقاط</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Impact Comparison */}
      {(impactPre !== null || impactPost !== null) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="w-5 h-5 text-primary" />
              مقارنة الأثر
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground mb-1">القبلي</p>
                <p className="text-3xl font-bold text-primary">{impactPre ?? "—"}</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground mb-1">البعدي</p>
                <p className="text-3xl font-bold text-primary">{impactPost ?? "—"}</p>
              </div>
            </div>
            {impactPre !== null && impactPost !== null && (
              <p className="text-center text-sm mt-3 text-muted-foreground">
                التغيير: <span className={`font-bold ${impactPost > impactPre ? "text-[hsl(var(--success))]" : "text-destructive"}`}>
                  {impactPost > impactPre ? "+" : ""}{impactPost - impactPre}
                </span>
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Certificate */}
      {certificate && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="w-5 h-5 text-primary" />
              الشهادة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">رمز الشهادة</p>
                <p className="font-mono font-bold text-lg">{certificate.certificate_code}</p>
              </div>
              <Badge className="bg-[hsl(var(--success))] text-white">صادرة</Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
