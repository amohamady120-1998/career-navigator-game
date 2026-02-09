import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Users, GraduationCap, FlaskConical, FileText, School, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const MILESTONE_SLUGS = ["pre-impact", "holland", "simulation", "report"];
const MILESTONE_LABELS: Record<string, string> = {
  "intro": "المقدمة",
  "pre-impact": "ما قبل الأثر",
  "holland": "اختبار هولاند",
  "simulation": "المحاكاة",
  "post-impact": "ما بعد الأثر",
  "report": "التقرير النهائي",
};

const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(160, 60%, 40%)",
  "hsl(30, 80%, 55%)",
  "hsl(270, 50%, 55%)",
  "hsl(0, 60%, 55%)",
];

interface StudentRow {
  user_id: string;
  full_name: string | null;
  progressPercent: number;
}

export default function InstitutionDashboard() {
  const { toast } = useToast();
  const [schoolName, setSchoolName] = useState("");
  const [linking, setLinking] = useState(false);
  const [loading, setLoading] = useState(true);

  const [students, setStudents] = useState<StudentRow[]>([]);
  const [journeyData, setJourneyData] = useState<{ name: string; count: number }[]>([]);
  const [hollandData, setHollandData] = useState<{ name: string; value: number }[]>([]);
  const [summaryCards, setSummaryCards] = useState({ total: 0, holland: 0, simulation: 0, report: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Get linked student IDs
    const { data: links } = await supabase
      .from("institution_student_links")
      .select("student_user_id")
      .eq("institution_user_id", session.user.id);

    const studentIds = links?.map((l) => l.student_user_id) ?? [];

    if (studentIds.length === 0) {
      setStudents([]);
      setJourneyData([]);
      setHollandData([]);
      setSummaryCards({ total: 0, holland: 0, simulation: 0, report: 0 });
      setLoading(false);
      return;
    }

    // Fetch profiles for names
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", studentIds);

    // Fetch all journey steps
    const { data: steps } = await supabase
      .from("journey_steps")
      .select("id, slug, order_index")
      .order("order_index");

    const totalSteps = steps?.length ?? 1;
    const stepMap = new Map(steps?.map((s) => [s.id, s.slug]) ?? []);
    const milestoneStepIds = steps?.filter((s) => MILESTONE_SLUGS.includes(s.slug)).map((s) => ({ id: s.id, slug: s.slug })) ?? [];

    // Fetch user_progress for linked students
    const { data: progress } = await supabase
      .from("user_progress")
      .select("user_id, step_id, status")
      .in("user_id", studentIds);

    // Journey completion chart data
    const stepCounts: Record<string, number> = {};
    steps?.forEach((s) => { stepCounts[s.slug] = 0; });
    progress?.forEach((p) => {
      if (p.status === "completed") {
        const slug = stepMap.get(p.step_id);
        if (slug && slug in stepCounts) stepCounts[slug]++;
      }
    });
    setJourneyData(
      steps?.map((s) => ({
        name: MILESTONE_LABELS[s.slug] ?? s.slug,
        count: stepCounts[s.slug] ?? 0,
      })) ?? []
    );

    // Summary cards
    const completedByUser: Record<string, Set<string>> = {};
    progress?.forEach((p) => {
      if (p.status === "completed") {
        const slug = stepMap.get(p.step_id);
        if (slug) {
          if (!completedByUser[p.user_id]) completedByUser[p.user_id] = new Set();
          completedByUser[p.user_id].add(slug);
        }
      }
    });

    const countWithSlug = (slug: string) =>
      studentIds.filter((id) => completedByUser[id]?.has(slug)).length;

    setSummaryCards({
      total: studentIds.length,
      holland: countWithSlug("holland"),
      simulation: countWithSlug("simulation"),
      report: countWithSlug("report"),
    });

    // Student list with progress %
    const studentRows: StudentRow[] = studentIds.map((id) => {
      const profile = profiles?.find((p) => p.user_id === id);
      const completed = completedByUser[id]?.size ?? 0;
      return {
        user_id: id,
        full_name: profile?.full_name ?? "—",
        progressPercent: Math.round((completed / totalSteps) * 100),
      };
    });
    setStudents(studentRows);

    // Holland distribution (aggregated)
    const { data: hollandResults } = await supabase
      .from("holland_results")
      .select("top_code")
      .in("user_id", studentIds);

    const codeCounts: Record<string, number> = {};
    hollandResults?.forEach((r) => {
      if (r.top_code) {
        const topLetter = r.top_code.charAt(0).toUpperCase();
        codeCounts[topLetter] = (codeCounts[topLetter] ?? 0) + 1;
      }
    });
    setHollandData(
      Object.entries(codeCounts).map(([name, value]) => ({ name, value }))
    );

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  return (
    <div className="space-y-8">
      {/* Link Students Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <School className="w-5 h-5 text-primary" />
            ربط الطلاب حسب المدرسة
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
              {linking ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
              ربط الطلاب
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
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard icon={<Users className="w-5 h-5" />} label="إجمالي الطلاب" value={summaryCards.total} />
            <SummaryCard icon={<GraduationCap className="w-5 h-5" />} label="أنهوا هولاند" value={`${summaryCards.total ? Math.round((summaryCards.holland / summaryCards.total) * 100) : 0}%`} />
            <SummaryCard icon={<FlaskConical className="w-5 h-5" />} label="أنهوا المحاكاة" value={`${summaryCards.total ? Math.round((summaryCards.simulation / summaryCards.total) * 100) : 0}%`} />
            <SummaryCard icon={<FileText className="w-5 h-5" />} label="وصلوا التقرير" value={`${summaryCards.total ? Math.round((summaryCards.report / summaryCards.total) * 100) : 0}%`} />
          </div>

          {/* Charts */}
          {summaryCards.total > 0 && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Journey Completion Bar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">إتمام مراحل الرحلة</CardTitle>
                </CardHeader>
                <CardContent className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={journeyData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Holland Distribution Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">توزيع أنماط هولاند</CardTitle>
                </CardHeader>
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
            </div>
          )}

          {/* Student List Table */}
          {summaryCards.total > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">قائمة الطلاب</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-96">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>الاسم</TableHead>
                        <TableHead>نسبة الإتمام</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((s) => (
                        <TableRow key={s.user_id}>
                          <TableCell>{s.full_name}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full transition-all"
                                  style={{ width: `${s.progressPercent}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground">{s.progressPercent}%</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
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
