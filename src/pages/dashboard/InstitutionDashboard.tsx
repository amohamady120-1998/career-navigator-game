import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import StudentProfileView from "@/components/StudentProfileView";
import { useToast } from "@/hooks/use-toast";
import {
  Users, GraduationCap, FlaskConical, FileText, School, Loader2,
  ChevronRight, ChevronLeft, Download, Eye,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

const MILESTONE_SLUGS = ["pre-impact", "holland", "simulation", "report"];
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

const PAGE_SIZE = 10;

interface StudentRow {
  user_id: string;
  full_name: string | null;
  grade_level: string | null;
  phone: string | null;
  progressPercent: number;
  hollandTopCode: string | null;
}

function exportCSV(students: StudentRow[]) {
  const BOM = "\uFEFF";
  const header = "الاسم,البريد الإلكتروني,الجوال,المرحلة الدراسية,نسبة الإتمام,كود هولاند\n";
  const rows = students.map((s) =>
    `"${s.full_name ?? "—"}","—","${s.phone ?? "—"}","${s.grade_level ?? "—"}",${s.progressPercent}%,"${s.hollandTopCode ?? "—"}"`
  ).join("\n");
  const blob = new Blob([BOM + header + rows], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `students_export_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function InstitutionDashboard() {
  const { toast } = useToast();
  const [schoolName, setSchoolName] = useState("");
  const [linking, setLinking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  const [students, setStudents] = useState<StudentRow[]>([]);
  const [journeyData, setJourneyData] = useState<{ name: string; count: number }[]>([]);
  const [hollandData, setHollandData] = useState<{ name: string; value: number }[]>([]);
  const [summary, setSummary] = useState({ total: 0, holland: 0, simulation: 0, report: 0 });

  // Student detail dialog
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailStudent, setDetailStudent] = useState<StudentRow | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: links } = await supabase
      .from("institution_student_links")
      .select("student_user_id")
      .eq("institution_user_id", session.user.id);

    const studentIds = links?.map((l) => l.student_user_id) ?? [];

    if (!studentIds.length) {
      setStudents([]);
      setJourneyData([]);
      setHollandData([]);
      setSummary({ total: 0, holland: 0, simulation: 0, report: 0 });
      setLoading(false);
      return;
    }

    const [profilesRes, stepsRes, progressRes, hollandRes] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name, grade_level, phone").in("user_id", studentIds),
      supabase.from("journey_steps").select("id, slug, order_index").order("order_index"),
      supabase.from("user_progress").select("user_id, step_id, status").in("user_id", studentIds),
      supabase.from("holland_results").select("user_id, top_code").in("user_id", studentIds),
    ]);

    const profiles = profilesRes.data ?? [];
    const steps = stepsRes.data ?? [];
    const progress = progressRes.data ?? [];
    const hollandResults = hollandRes.data ?? [];

    const totalSteps = steps.length || 1;
    const stepMap = new Map(steps.map((s) => [s.id, s.slug]));

    const completedByUser: Record<string, Set<string>> = {};
    progress.forEach((p) => {
      if (p.status === "completed") {
        const slug = stepMap.get(p.step_id);
        if (slug) {
          if (!completedByUser[p.user_id]) completedByUser[p.user_id] = new Set();
          completedByUser[p.user_id].add(slug);
        }
      }
    });

    const stepCounts: Record<string, number> = {};
    steps.forEach((s) => { stepCounts[s.slug] = 0; });
    progress.forEach((p) => {
      if (p.status === "completed") {
        const slug = stepMap.get(p.step_id);
        if (slug && slug in stepCounts) stepCounts[slug]++;
      }
    });
    setJourneyData(
      steps.map((s) => ({ name: STEP_LABELS[s.slug] ?? s.slug, count: stepCounts[s.slug] ?? 0 }))
    );

    const countWith = (slug: string) => studentIds.filter((id) => completedByUser[id]?.has(slug)).length;
    setSummary({
      total: studentIds.length,
      holland: countWith("holland"),
      simulation: countWith("simulation"),
      report: countWith("report"),
    });

    // Holland code map for student rows
    const hollandMap = new Map(hollandResults.map(r => [r.user_id, r.top_code]));

    setStudents(
      studentIds.map((id) => {
        const p = profiles.find((pr) => pr.user_id === id);
        return {
          user_id: id,
          full_name: p?.full_name ?? "—",
          grade_level: p?.grade_level ?? "—",
          phone: p?.phone ?? null,
          progressPercent: Math.round(((completedByUser[id]?.size ?? 0) / totalSteps) * 100),
          hollandTopCode: hollandMap.get(id) ?? null,
        };
      })
    );

    const codeCounts: Record<string, number> = {};
    hollandResults.forEach((r) => {
      if (r.top_code) {
        const letter = r.top_code.charAt(0).toUpperCase();
        codeCounts[letter] = (codeCounts[letter] ?? 0) + 1;
      }
    });
    setHollandData(
      Object.entries(codeCounts).map(([code, value]) => ({
        name: RIASEC_AR[code] ?? code,
        value,
      }))
    );

    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleLink = async () => {
    if (!schoolName.trim()) return;
    setLinking(true);
    const { data, error } = await supabase.rpc("link_students_by_school", {
      school_name: schoolName.trim(),
    });
    setLinking(false);
    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "تم الربط", description: `تم ربط ${data} طالب/ة بنجاح` });
    fetchData();
  };

  const handleViewStudent = (student: StudentRow) => {
    setDetailStudent(student);
    setDetailOpen(true);
  };

  const pct = (n: number) => (summary.total ? Math.round((n / summary.total) * 100) : 0);
  const totalPages = Math.ceil(students.length / PAGE_SIZE);
  const pagedStudents = students.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="space-y-8">
      {/* Connection Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <School className="w-5 h-5 text-primary" />
            جلب بيانات الطلاب
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 items-end">
            <Input
              placeholder="اسم المدرسة"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              className="max-w-sm"
            />
            <Button onClick={handleLink} disabled={linking || !schoolName.trim()}>
              {linking && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
              جلب بيانات الطلاب
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard icon={<Users className="w-5 h-5" />} label="إجمالي الطلاب" value={summary.total} />
            <KpiCard icon={<GraduationCap className="w-5 h-5" />} label="أنهوا هولاند" value={`${pct(summary.holland)}%`} />
            <KpiCard icon={<FlaskConical className="w-5 h-5" />} label="أنهوا المحاكاة" value={`${pct(summary.simulation)}%`} />
            <KpiCard icon={<FileText className="w-5 h-5" />} label="معتمدون" value={`${pct(summary.report)}%`} />
          </div>

          {summary.total > 0 && (
            <>
              {/* Charts Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader><CardTitle className="text-base">توزيع أنماط RIASEC</CardTitle></CardHeader>
                  <CardContent className="h-72">
                    {hollandData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={hollandData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                            {hollandData.map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Legend />
                          <Tooltip />
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

              {/* Student Table */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">قائمة الطلاب</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => exportCSV(students)}>
                    <Download className="w-4 h-4 ml-2" />
                    تصدير CSV
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>الاسم</TableHead>
                          <TableHead>المرحلة</TableHead>
                          <TableHead>كود هولاند</TableHead>
                          <TableHead>نسبة الإتمام</TableHead>
                          <TableHead>عرض</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pagedStudents.map((s) => (
                          <TableRow key={s.user_id}>
                            <TableCell>{s.full_name}</TableCell>
                            <TableCell>{s.grade_level}</TableCell>
                            <TableCell>
                              {s.hollandTopCode ? (
                                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-mono">{s.hollandTopCode}</span>
                              ) : "—"}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${s.progressPercent}%` }} />
                                </div>
                                <span className="text-xs text-muted-foreground">{s.progressPercent}%</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" onClick={() => handleViewStudent(s)}>
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-4 mt-4">
                      <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                      <span className="text-sm text-muted-foreground">{page + 1} / {totalPages}</span>
                      <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}

      {/* Student Profile Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>ملف الطالب — {detailStudent?.full_name ?? ""}</DialogTitle>
          </DialogHeader>
          {detailStudent && (
            <StudentProfileView
              studentId={detailStudent.user_id}
              studentName={detailStudent.full_name ?? undefined}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KpiCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-4">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">{icon}</div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
