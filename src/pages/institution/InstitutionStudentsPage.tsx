import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import StudentProfileView from "@/components/StudentProfileView";
import EmptyState from "@/components/shared/EmptyState";
import { Loader2, Download, Eye, Search, Users, ChevronRight, ChevronLeft } from "lucide-react";

const PAGE_SIZE = 15;

interface StudentRow {
  user_id: string;
  full_name: string | null;
  grade_level: string | null;
  phone: string | null;
  progressPercent: number;
  hollandTopCode: string | null;
  status: "completed" | "in_progress" | "not_started";
}

export default function InstitutionStudentsPage() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [detailStudent, setDetailStudent] = useState<StudentRow | null>(null);
  const [sortCol, setSortCol] = useState<"name" | "progress">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: links } = await supabase
      .from("institution_student_links")
      .select("student_user_id")
      .eq("institution_user_id", session.user.id);

    const studentIds = links?.map((l) => l.student_user_id) ?? [];
    if (!studentIds.length) { setStudents([]); setLoading(false); return; }

    const [profilesRes, stepsRes, progressRes, hollandRes] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name, grade_level, phone").in("user_id", studentIds),
      supabase.from("journey_steps").select("id, slug, order_index").order("order_index"),
      supabase.from("user_progress").select("user_id, step_id, status").in("user_id", studentIds),
      supabase.from("holland_results").select("user_id, top_code").in("user_id", studentIds),
    ]);

    const profiles = profilesRes.data ?? [];
    const steps = stepsRes.data ?? [];
    const progress = progressRes.data ?? [];
    const totalSteps = steps.length || 1;
    const stepMap = new Map(steps.map((s) => [s.id, s.slug]));
    const hollandMap = new Map((hollandRes.data ?? []).map(r => [r.user_id, r.top_code]));

    const completedByUser: Record<string, number> = {};
    progress.forEach((p) => {
      if (p.status === "completed") {
        completedByUser[p.user_id] = (completedByUser[p.user_id] ?? 0) + 1;
      }
    });

    const hasAnyProgress = new Set(progress.map(p => p.user_id));

    setStudents(
      studentIds.map((id) => {
        const p = profiles.find((pr) => pr.user_id === id);
        const completed = completedByUser[id] ?? 0;
        const pct = Math.round((completed / totalSteps) * 100);
        let status: StudentRow["status"] = "not_started";
        if (pct >= 100) status = "completed";
        else if (hasAnyProgress.has(id)) status = "in_progress";

        return {
          user_id: id,
          full_name: p?.full_name ?? null,
          grade_level: p?.grade_level ?? null,
          phone: p?.phone ?? null,
          progressPercent: pct,
          hollandTopCode: hollandMap.get(id) ?? null,
          status,
        };
      })
    );
    setLoading(false);
  }, []);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const filtered = students
    .filter((s) => {
      if (search && !s.full_name?.toLowerCase().includes(search.toLowerCase())) return false;
      if (gradeFilter !== "all" && s.grade_level !== gradeFilter) return false;
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortCol === "name") {
        const cmp = (a.full_name ?? "").localeCompare(b.full_name ?? "", "ar");
        return sortDir === "asc" ? cmp : -cmp;
      }
      return sortDir === "asc" ? a.progressPercent - b.progressPercent : b.progressPercent - a.progressPercent;
    });

  const grades = [...new Set(students.map(s => s.grade_level).filter(Boolean))] as string[];
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const exportCSV = () => {
    const BOM = "\uFEFF";
    const header = "الاسم,الجوال,المرحلة,نسبة الإتمام,كود هولاند,الحالة\n";
    const rows = filtered.map((s) =>
      `"${s.full_name ?? "—"}","${s.phone ?? "—"}","${s.grade_level ?? "—"}",${s.progressPercent}%,"${s.hollandTopCode ?? "—"}","${s.status}"`
    ).join("\n");
    const blob = new Blob([BOM + header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `students_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSort = (col: "name" | "progress") => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  if (students.length === 0) {
    return <EmptyState icon={Users} title="لا يوجد طلاب مرتبطين" description="قم بربط الطلاب عبر اسم المدرسة من لوحة التحكم الرئيسية" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <h1 className="text-xl font-bold">إدارة الطلاب</h1>
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="w-4 h-4 ml-2" />تصدير CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="بحث بالاسم..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="pr-9" />
          </div>
          {grades.length > 0 && (
            <Select value={gradeFilter} onValueChange={(v) => { setGradeFilter(v); setPage(0); }}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="المرحلة" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل المراحل</SelectItem>
                {grades.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="الحالة" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="completed">مكتمل</SelectItem>
              <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
              <SelectItem value="not_started">لم يبدأ</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">{filtered.length} طالب</span>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("name")}>
                    الاسم {sortCol === "name" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                  </TableHead>
                  <TableHead>المرحلة</TableHead>
                  <TableHead>كود هولاند</TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("progress")}>
                    الإتمام {sortCol === "progress" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                  </TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>عرض</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((s) => (
                  <TableRow key={s.user_id}>
                    <TableCell className="font-medium">{s.full_name ?? "—"}</TableCell>
                    <TableCell>{s.grade_level ?? "—"}</TableCell>
                    <TableCell>
                      {s.hollandTopCode ? (
                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-mono">{s.hollandTopCode}</span>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${s.progressPercent}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground w-8">{s.progressPercent}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        s.status === "completed" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                        s.status === "in_progress" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {s.status === "completed" ? "مكتمل" : s.status === "in_progress" ? "قيد التنفيذ" : "لم يبدأ"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => setDetailStudent(s)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 p-4 border-t">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground">{page + 1} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Student Detail Sheet */}
      <Sheet open={!!detailStudent} onOpenChange={(o) => !o && setDetailStudent(null)}>
        <SheetContent side="left" className="w-full sm:max-w-xl overflow-y-auto" dir="rtl">
          <SheetHeader>
            <SheetTitle>ملف الطالب — {detailStudent?.full_name ?? ""}</SheetTitle>
          </SheetHeader>
          {detailStudent && (
            <div className="mt-4">
              <StudentProfileView
                studentId={detailStudent.user_id}
                studentName={detailStudent.full_name ?? undefined}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
