import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Users, GraduationCap, FileText, School, Loader2,
  TrendingUp, Clock, Activity,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
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

const PIE_COLORS = [
  "hsl(210, 70%, 20%)", "hsl(160, 55%, 38%)", "hsl(30, 80%, 55%)",
  "hsl(270, 50%, 55%)", "hsl(0, 60%, 55%)", "hsl(45, 85%, 50%)",
];

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

  return (
    <div className="space-y-6">
      {/* Connection Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <School className="w-5 h-5 text-primary" />جلب بيانات الطلاب
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 items-end">
            <Input placeholder="اسم المدرسة" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} className="max-w-sm" />
            <Button onClick={handleLink} disabled={linking || !schoolName.trim()}>
              {linking && <Loader2 className="w-4 h-4 animate-spin ml-2" />}جلب بيانات الطلاب
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <KpiCard icon={<Users className="w-5 h-5" />} label="إجمالي الطلاب" value={kpi.total} sparkData={weeklyTrend.total} />
            <KpiCard icon={<TrendingUp className="w-5 h-5" />} label="نسبة الإكمال" value={`${kpi.completionRate}%`} sparkData={weeklyTrend.completed} />
            <KpiCard icon={<Activity className="w-5 h-5" />} label="قيد التنفيذ" value={kpi.inProgress} />
            <KpiCard icon={<Clock className="w-5 h-5" />} label="نشطون هذا الأسبوع" value={kpi.activeThisWeek} sparkData={weeklyTrend.active} />
            <KpiCard icon={<GraduationCap className="w-5 h-5" />} label="أنهوا هولاند" value={`${pct(kpi.holland)}%`} />
            <KpiCard icon={<FileText className="w-5 h-5" />} label="معتمدون" value={`${pct(kpi.report)}%`} sparkData={weeklyTrend.completed} />
          </div>

          {kpi.total > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-base">توزيع أنماط RIASEC</CardTitle></CardHeader>
                <CardContent className="h-72">
                  {hollandData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={hollandData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                          {hollandData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Legend /><Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-muted-foreground text-sm text-center pt-12">لا توجد بيانات هولاند بعد</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">مسار إتمام الرحلة</CardTitle></CardHeader>
                <CardContent className="h-72 text-foreground">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={journeyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="currentColor" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Quick Nav */}
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => navigate("/institution/students")} className="gap-2">
              <Users className="w-4 h-4" />إدارة الطلاب
            </Button>
            <Button variant="outline" onClick={() => navigate("/institution/codes")} className="gap-2">
              <GraduationCap className="w-4 h-4" />أكواد التفعيل
            </Button>
            <Button variant="outline" onClick={() => navigate("/institution/activity")} className="gap-2">
              <Activity className="w-4 h-4" />سجل النشاط
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

const KpiCard = React.memo(function KpiCard({ icon, label, value, sparkData }: { icon: React.ReactNode; label: string; value: string | number; sparkData?: number[] }) {
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-4">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">{icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        {sparkData && sparkData.length > 0 && (
          <Sparkline data={sparkData} />
        )}
      </CardContent>
    </Card>
  );
});
