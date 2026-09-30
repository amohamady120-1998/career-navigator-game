import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Users, GraduationCap, FileText, School, Loader2,
  TrendingUp, Clock, Activity, ChevronLeft,
} from "lucide-react";
import { HeroBand } from "@/components/HeroBand";
import { btnPrimary } from "@/lib/athar";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import Sparkline from "@/components/institution/Sparkline";

const STEP_LABELS: Record<string, string> = {
  intro: "المقدمة",
  "pre-impact": "ما قبل الأثر",
  holland: "اختبار هولاند",
  simulation: "المحاكاة",
  "post-impact": "ما بعد الأثر",
  report: "التقرير النهائي",
};

const RIASEC_AR: Record<string, string> = {
  R: "واقعي", I: "بحثي", A: "فني", S: "اجتماعي", E: "مقدام", C: "تقليدي",
};


interface KpiData {
  total: number;
  activated: number;
  completionRate: number;
  inProgress: number;
  activeThisWeek: number;
  holland: number;
  simulation: number;
  report: number;
}

interface WeeklyTrend {
  activated: number[];
  active: number[];
  completed: number[];
  total: number[];
}

function getWeekStarts(): string[] {
  const weeks: string[] = [];
  const now = new Date();
  for (let i = 3; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    d.setHours(0, 0, 0, 0);
    // Start of that week (Monday)
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    weeks.push(d.toISOString());
  }
  return weeks;
}

export default function InstitutionDashboard() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [schoolName, setSchoolName] = useState("");
  const [linking, setLinking] = useState(false);
  const [loading, setLoading] = useState(true);

  const [kpi, setKpi] = useState<KpiData>({ total: 0, activated: 0, completionRate: 0, inProgress: 0, activeThisWeek: 0, holland: 0, simulation: 0, report: 0 });
  const [journeyData, setJourneyData] = useState<{ name: string; count: number }[]>([]);
  const [hollandData, setHollandData] = useState<{ name: string; value: number }[]>([]);
  const [weeklyTrend, setWeeklyTrend] = useState<WeeklyTrend>({ activated: [], active: [], completed: [], total: [] });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: links } = await supabase
      .from("institution_student_links")
      .select("student_user_id, created_at")
      .eq("institution_user_id", session.user.id);

    const studentIds = links?.map((l) => l.student_user_id) ?? [];

    if (!studentIds.length) {
      setKpi({ total: 0, activated: 0, completionRate: 0, inProgress: 0, activeThisWeek: 0, holland: 0, simulation: 0, report: 0 });
      setJourneyData([]);
      setHollandData([]);
      setWeeklyTrend({ activated: [], active: [], completed: [], total: [] });
      setLoading(false);
      return;
    }

    const [stepsRes, progressRes, hollandRes] = await Promise.all([
      supabase.from("journey_steps").select("id, slug, order_index").order("order_index"),
      supabase.from("user_progress").select("user_id, step_id, status, completed_at").in("user_id", studentIds),
      supabase.from("holland_results").select("user_id, top_code").in("user_id", studentIds),
    ]);

    const steps = stepsRes.data ?? [];
    const progress = progressRes.data ?? [];
    const hollandResults = hollandRes.data ?? [];
    const totalSteps = steps.length || 1;
    const stepMap = new Map(steps.map(s => [s.id, s.slug]));

    // Compute per-user completed slugs
    const completedByUser: Record<string, Set<string>> = {};
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const activeUsers = new Set<string>();

    progress.forEach(p => {
      if (p.status === "completed") {
        const slug = stepMap.get(p.step_id);
        if (slug) {
          if (!completedByUser[p.user_id]) completedByUser[p.user_id] = new Set();
          completedByUser[p.user_id].add(slug);
        }
        if (p.completed_at && p.completed_at > oneWeekAgo) {
          activeUsers.add(p.user_id);
        }
      }
    });

    const completedCount = studentIds.filter(id => (completedByUser[id]?.size ?? 0) >= totalSteps).length;
    const inProgressCount = studentIds.filter(id => {
      const c = completedByUser[id]?.size ?? 0;
      return c > 0 && c < totalSteps;
    }).length;
    const countWith = (slug: string) => studentIds.filter(id => completedByUser[id]?.has(slug)).length;

    setKpi({
      total: studentIds.length,
      activated: studentIds.length,
      completionRate: studentIds.length ? Math.round((completedCount / studentIds.length) * 100) : 0,
      inProgress: inProgressCount,
      activeThisWeek: activeUsers.size,
      holland: countWith("holland"),
      simulation: countWith("simulation"),
      report: countWith("report"),
    });

    // Weekly sparkline aggregation (last 4 weeks)
    const weekStarts = getWeekStarts();
    const weekEnds = weekStarts.map((_, i) => {
      if (i < weekStarts.length - 1) return weekStarts[i + 1];
      return new Date().toISOString();
    });

    const activatedPerWeek: number[] = [];
    const activePerWeek: number[] = [];
    const completedPerWeek: number[] = [];
    const totalPerWeek: number[] = [];

    for (let w = 0; w < 4; w++) {
      const wStart = weekStarts[w];
      const wEnd = weekEnds[w];

      // Activated: links created in this week
      const activatedInWeek = (links ?? []).filter(l => l.created_at >= wStart && l.created_at < wEnd).length;
      activatedPerWeek.push(activatedInWeek);

      // Active: students with progress completed_at in this week
      const activeInWeek = new Set<string>();
      progress.forEach(p => {
        if (p.status === "completed" && p.completed_at && p.completed_at >= wStart && p.completed_at < wEnd) {
          activeInWeek.add(p.user_id);
        }
      });
      activePerWeek.push(activeInWeek.size);

      // Completed: students who completed report step in this week
      const completedInWeek = progress.filter(p => {
        if (p.status !== "completed" || !p.completed_at) return false;
        const slug = stepMap.get(p.step_id);
        return slug === "report" && p.completed_at >= wStart && p.completed_at < wEnd;
      });
      const uniqueCompleted = new Set(completedInWeek.map(p => p.user_id));
      completedPerWeek.push(uniqueCompleted.size);

      // Running total of students linked up to this week
      const totalUpToWeek = (links ?? []).filter(l => l.created_at < wEnd).length;
      totalPerWeek.push(totalUpToWeek);
    }

    setWeeklyTrend({
      activated: activatedPerWeek,
      active: activePerWeek,
      completed: completedPerWeek,
      total: totalPerWeek,
    });

    // Journey funnel
    const stepCounts: Record<string, number> = {};
    steps.forEach(s => { stepCounts[s.slug] = 0; });
    progress.forEach(p => {
      if (p.status === "completed") {
        const slug = stepMap.get(p.step_id);
        if (slug && slug in stepCounts) stepCounts[slug]++;
      }
    });
    setJourneyData(steps.map(s => ({ name: STEP_LABELS[s.slug] ?? s.slug, count: stepCounts[s.slug] ?? 0 })));

    // Holland distribution
    const codeCounts: Record<string, number> = {};
    hollandResults.forEach(r => {
      if (r.top_code) {
        const letter = r.top_code.charAt(0).toUpperCase();
        codeCounts[letter] = (codeCounts[letter] ?? 0) + 1;
      }
    });
    setHollandData(Object.entries(codeCounts).map(([code, value]) => ({ name: RIASEC_AR[code] ?? code, value })));

    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleLink = async () => {
    if (!schoolName.trim()) return;
    setLinking(true);
    const { data, error } = await supabase.rpc("link_students_by_school", { school_name: schoolName.trim() });
    setLinking(false);
    if (error) { toast({ title: "خطأ", description: error.message, variant: "destructive" }); return; }
    toast({ title: "تم الربط", description: `تم ربط ${data} طالب/ة بنجاح` });
    fetchData();
  };

  const pct = (n: number) => (kpi.total ? Math.round((n / kpi.total) * 100) : 0);

  const hollandTotal = hollandData.reduce((a, d) => a + d.value, 0);
  const hollandSorted = [...hollandData].sort((a, b) => b.value - a.value);
  const hollandMax = Math.max(1, ...hollandData.map((d) => d.value));

  return (
    <div className="athar-page max-w-[960px] space-y-4">
      <HeroBand
        eyebrow="لوحة المؤسسة"
        title="أثر البرنامج على طلابك — بالأرقام"
        description="تابع مشاركة الطلاب ونتائجهم، وقِس نموّ وضوحهم قبل الرحلة وبعدها في مكان واحد."
        className="mb-0"
      />

      {/* Connection Section */}
      <section className="athar-card">
        <h3 className="mb-4 flex items-center gap-2 text-[1.08rem] font-extrabold">
          <School className="h-5 w-5 text-accent" />جلب بيانات الطلاب
        </h3>
        <div className="flex flex-wrap items-end gap-3">
          <Input placeholder="اسم المدرسة" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} className="athar-field max-w-sm" />
          <Button onClick={handleLink} disabled={linking || !schoolName.trim()} className={btnPrimary}>
            {linking && <Loader2 className="h-4 w-4 animate-spin" />}جلب بيانات الطلاب
          </Button>
        </div>
      </section>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-3">
            <KpiCard icon={<Users className="h-5 w-5" />} label="إجمالي الطلاب" value={kpi.total} sparkData={weeklyTrend.total} />
            <KpiCard icon={<TrendingUp className="h-5 w-5" />} label="نسبة الإكمال" value={`${kpi.completionRate}%`} sparkData={weeklyTrend.completed} tone="success" />
            <KpiCard icon={<Activity className="h-5 w-5" />} label="قيد التنفيذ" value={kpi.inProgress} tone="accent" />
            <KpiCard icon={<Clock className="h-5 w-5" />} label="نشطون هذا الأسبوع" value={kpi.activeThisWeek} sparkData={weeklyTrend.active} />
            <KpiCard icon={<GraduationCap className="h-5 w-5" />} label="أنهوا هولاند" value={`${pct(kpi.holland)}%`} />
            <KpiCard icon={<FileText className="h-5 w-5" />} label="معتمدون" value={`${pct(kpi.report)}%`} sparkData={weeklyTrend.completed} />
          </div>

          {kpi.total > 0 && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <section className="athar-card">
                <h3 className="mb-4 text-[1.08rem] font-extrabold">توزيع أنماط RIASEC</h3>
                {hollandSorted.length > 0 ? (
                  <div className="space-y-[13px]">
                    {hollandSorted.map((d) => (
                      <div key={d.name} className="grid grid-cols-[96px_1fr_42px] items-center gap-3">
                        <b className="text-[0.9rem] font-semibold">{d.name}</b>
                        <div className="h-[9px] overflow-hidden rounded-md bg-muted">
                          <i className="block h-full rounded-md bg-accent" style={{ width: `${(d.value / hollandMax) * 100}%` }} />
                        </div>
                        <span className="text-left text-[0.82rem] font-bold text-muted-foreground">
                          {Math.round((d.value / (hollandTotal || 1)) * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="pt-12 text-center text-sm text-muted-foreground">لا توجد بيانات هولاند بعد</p>
                )}
              </section>

              <section className="athar-card">
                <h3 className="mb-4 text-[1.08rem] font-extrabold">مسار إتمام الرحلة</h3>
                <div className="h-64 text-accent">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={journeyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis allowDecimals={false} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="currentColor" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </div>
          )}

          {/* Quick Nav */}
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
            <QuickLink icon={<Users className="h-[19px] w-[19px]" />} title="إدارة الطلاب" onClick={() => navigate("/institution/students")} />
            <QuickLink icon={<GraduationCap className="h-[19px] w-[19px]" />} title="أكواد التفعيل" onClick={() => navigate("/institution/codes")} />
            <QuickLink icon={<Activity className="h-[19px] w-[19px]" />} title="سجل النشاط" onClick={() => navigate("/institution/activity")} />
          </div>
        </>
      )}
    </div>
  );
}

function QuickLink({ icon, title, onClick }: { icon: React.ReactNode; title: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-[14px] border border-border bg-card px-4 py-[15px] text-start transition-all hover:-translate-y-0.5 hover:border-accent"
    >
      <span className="grid h-[38px] w-[38px] flex-none place-items-center rounded-[11px] bg-muted text-foreground">{icon}</span>
      <b className="text-[0.98rem] font-bold">{title}</b>
      <ChevronLeft className="ms-auto h-4 w-4 text-muted-foreground" />
    </button>
  );
}

const KpiCard = React.memo(function KpiCard({ icon, label, value, sparkData, tone }: { icon: React.ReactNode; label: string; value: string | number; sparkData?: number[]; tone?: "success" | "accent" }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-[18px]">
      <div className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-accent/15 text-[hsl(var(--gradient-end))]">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className={`text-[1.55rem] font-black leading-none ${tone === "success" ? "text-success" : tone === "accent" ? "text-[hsl(var(--gradient-end))]" : "text-foreground"}`}>{value}</p>
        <p className="mt-[7px] text-[0.82rem] font-semibold text-muted-foreground">{label}</p>
      </div>
      {sparkData && sparkData.length > 0 && (
        <Sparkline data={sparkData} />
      )}
    </div>
  );
});
