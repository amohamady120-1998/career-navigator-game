import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, Award, TrendingUp, Download, BarChart3, CheckCircle } from "lucide-react";

// Step display order for the funnel
const FUNNEL_STEPS = [
  { slug: "intro", label: "المقدمة" },
  { slug: "pre-impact", label: "قياس الأثر القبلي" },
  { slug: "holland", label: "اختبار هولند" },
  { slug: "initial-report", label: "التقرير المبدئي" },
  { slug: "shortlist", label: "ترتيب الاختيارات" },
  { slug: "excluded-majors", label: "تخصصات أقل توافقًا" },
  { slug: "doubt-checkpoint", label: "لحظة صدق" },
  { slug: "simulation", label: "المحاكاة المهنية" },
  { slug: "post-impact", label: "قياس الأثر البعدي" },
  { slug: "report", label: "التقرير النهائي" },
];

interface ProgressRow {
  step_slug: string;
  step_name: string;
  total_students: number;
  completed_count: number;
  in_progress_count: number;
}

interface ImpactSummary {
  count_pre_completed: number;
  count_post_completed: number;
  avg_pre_score: number | null;
  avg_post_score: number | null;
}

interface StudentRow {
  user_id: string;
  activated_at: string;
  activated_by_code?: string;
}

interface SchoolAnalyticsProps {
  schoolName: string;
  totalSeats: number;
  usedSeats: number;
  students: StudentRow[];
  progressData: ProgressRow[];
  impactData: ImpactSummary | null;
  studentProgress?: Record<string, string[]>; // user_id -> completed step slugs
}

function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const bom = "\uFEFF";
  const csv = bom + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function SchoolAnalytics({
  schoolName,
  totalSeats,
  usedSeats,
  students,
  progressData,
  impactData,
  studentProgress,
}: SchoolAnalyticsProps) {
  const totalActivated = students.length;

  // Completion rate: students who completed "report" step
  const reportStep = progressData.find(p => p.step_slug === "report");
  const completionRate = totalActivated > 0 && reportStep
    ? Math.round((reportStep.completed_count / totalActivated) * 100)
    : 0;

  // Build funnel data
  const funnelData = useMemo(() => {
    const map = new Map(progressData.map(p => [p.step_slug, p]));
    return FUNNEL_STEPS.map(s => {
      const row = map.get(s.slug);
      return {
        label: s.label,
        slug: s.slug,
        completed: row?.completed_count || 0,
        inProgress: row?.in_progress_count || 0,
        pct: totalActivated > 0 && row ? Math.round((row.completed_count / totalActivated) * 100) : 0,
      };
    });
  }, [progressData, totalActivated]);

  // Impact delta
  const hasImpactScores = impactData?.avg_pre_score != null && impactData?.avg_post_score != null;
  const delta = hasImpactScores ? Math.round((impactData!.avg_post_score! - impactData!.avg_pre_score!) * 10) / 10 : null;

  const exportStudents = () => {
    downloadCSV(
      `${schoolName}-students.csv`,
      ["user_id", "activated_at", "code"],
      students.map(s => [s.user_id, s.activated_at, s.activated_by_code || ""])
    );
  };

  const exportProgress = () => {
    if (!studentProgress) return;
    const stepSlugs = FUNNEL_STEPS.map(s => s.slug);
    const headers = ["user_id", ...stepSlugs, "pre_done", "post_done"];
    const rows = students.map(s => {
      const completed = studentProgress[s.user_id] || [];
      const flags = stepSlugs.map(slug => completed.includes(slug) ? "1" : "0");
      return [s.user_id, ...flags, "—", "—"];
    });
    downloadCSV(`${schoolName}-progress.csv`, headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-1">
              <Users className="w-4 h-4" /> الطلاب المُفعّلين
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalActivated}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-1">
              <BarChart3 className="w-4 h-4" /> المقاعد
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{usedSeats}<span className="text-lg text-muted-foreground font-normal">/{totalSeats}</span></p>
            <p className="text-xs text-muted-foreground mt-1">متبقي: {totalSeats - usedSeats}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-1">
              <Award className="w-4 h-4" /> نسبة الإكمال
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{completionRate}%</p>
            <Progress value={completionRate} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-4 h-4" /> تأثير الرحلة
            </CardTitle>
          </CardHeader>
          <CardContent>
            {delta !== null ? (
              <>
                <p className={`text-3xl font-bold ${delta > 0 ? "text-primary" : "text-destructive"}`}>
                  {delta > 0 ? "+" : ""}{delta}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">الفرق بين القبلي والبعدي</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">لا توجد بيانات كافية بعد</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5" /> مسار التقدم (Funnel)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">المرحلة</TableHead>
                <TableHead className="text-right">مكتمل</TableHead>
                <TableHead className="text-right">قيد التنفيذ</TableHead>
                <TableHead className="text-right">نسبة الإكمال</TableHead>
                <TableHead className="text-right w-[200px]">التقدم</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {funnelData.map(f => (
                <TableRow key={f.slug}>
                  <TableCell className="font-medium">{f.label}</TableCell>
                  <TableCell>
                    <Badge variant="default" className="gap-1">
                      <CheckCircle className="w-3 h-3" /> {f.completed}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {f.inProgress > 0 ? (
                      <Badge variant="secondary">{f.inProgress}</Badge>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                  <TableCell className="font-semibold">{f.pct}%</TableCell>
                  <TableCell>
                    <Progress value={f.pct} className="h-2" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Impact Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5" /> قياس الأثر
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">أكملوا القبلي</p>
              <p className="text-2xl font-bold">{impactData?.count_pre_completed || 0}</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">أكملوا البعدي</p>
              <p className="text-2xl font-bold">{impactData?.count_post_completed || 0}</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">متوسط التحسن</p>
              {delta !== null ? (
                <p className={`text-2xl font-bold ${delta > 0 ? "text-primary" : "text-destructive"}`}>
                  {delta > 0 ? "+" : ""}{delta}%
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">—</p>
              )}
            </div>
          </div>
          {!hasImpactScores && (
            <p className="text-sm text-muted-foreground text-center mt-4">
              تم جمع بيانات قياس الأثر، وسيظهر التحليل الرقمي بعد اكتمال عدد كافٍ من الاستجابات.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Export */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Download className="w-5 h-5" /> تصدير البيانات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={exportStudents}>
              <Download className="w-4 h-4 ml-1" /> تصدير الطلاب المُفعّلين
            </Button>
            {studentProgress && (
              <Button variant="outline" onClick={exportProgress}>
                <Download className="w-4 h-4 ml-1" /> تصدير ملخص التقدم
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
