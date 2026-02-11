import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Users } from "lucide-react";

export default function AdminSchoolUsage() {
  const { data: memberships, isLoading } = useQuery({
    queryKey: ["admin-school-usage"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_school_membership")
        .select("*, schools(name)")
        .order("activated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: progressStats } = useQuery({
    queryKey: ["admin-school-progress-stats"],
    queryFn: async () => {
      const userIds = memberships?.map(m => m.user_id) || [];
      if (!userIds.length) return {};

      const { data, error } = await supabase
        .from("user_progress")
        .select("user_id, status")
        .in("user_id", userIds)
        .eq("status", "completed");
      if (error) return {};

      const counts: Record<string, number> = {};
      data.forEach(p => {
        counts[p.user_id] = (counts[p.user_id] || 0) + 1;
      });
      return counts;
    },
    enabled: !!memberships?.length,
  });

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  // Group by school
  const bySchool: Record<string, { name: string; users: typeof memberships }> = {};
  memberships?.forEach(m => {
    const schoolName = (m as any).schools?.name || "غير معروف";
    if (!bySchool[m.school_id]) bySchool[m.school_id] = { name: schoolName, users: [] };
    bySchool[m.school_id].users!.push(m);
  });

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6" dir="rtl">
      <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="w-6 h-6" /> استخدام المدارس</h1>

      {Object.entries(bySchool).map(([schoolId, school]) => (
        <Card key={schoolId}>
          <CardHeader>
            <CardTitle className="text-lg">{school.name} ({school.users!.length} طالب)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">معرف الطالب</TableHead>
                  <TableHead className="text-right">كود التفعيل</TableHead>
                  <TableHead className="text-right">تاريخ التفعيل</TableHead>
                  <TableHead className="text-right">خطوات مكتملة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {school.users!.map(u => (
                  <TableRow key={u.id}>
                    <TableCell className="font-mono text-xs">{u.user_id.slice(0, 8)}...</TableCell>
                    <TableCell className="font-mono">{u.activated_by_code || "—"}</TableCell>
                    <TableCell>{new Date(u.activated_at).toLocaleDateString("ar-SA")}</TableCell>
                    <TableCell>{progressStats?.[u.user_id] || 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}

      {!memberships?.length && (
        <Card><CardContent className="py-8 text-center text-muted-foreground">لا يوجد طلاب مفعلين بعد</CardContent></Card>
      )}
    </div>
  );
}
