import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, School, Award, Search, GraduationCap, Building2, UserCheck } from "lucide-react";

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  const [stats, setStats] = useState({ totalUsers: 0, totalSchools: 0, completedJourneys: 0 });
  const [schools, setSchools] = useState<{ name: string; count: number }[]>([]);
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResult, setSearchResult] = useState<any[] | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleData) { navigate("/dashboard"); return; }
      setAuthorized(true);

      const [profilesRes, progressRes] = await Promise.all([
        supabase.from("profiles").select("user_id, school_name, user_type"),
        supabase.from("user_progress").select("user_id, status"),
      ]);

      const profiles = profilesRes.data ?? [];
      const progress = progressRes.data ?? [];

      const schoolSet = new Set(
        profiles.filter(p => p.school_name).map(p => p.school_name!.trim())
      );
      const completedUsers = new Set(
        progress.filter(p => p.status === "completed").map(p => p.user_id)
      );

      setStats({ totalUsers: profiles.length, totalSchools: schoolSet.size, completedJourneys: completedUsers.size });

      const schoolCounts: Record<string, number> = {};
      profiles.forEach(p => {
        if (p.school_name?.trim()) {
          const name = p.school_name.trim();
          schoolCounts[name] = (schoolCounts[name] ?? 0) + 1;
        }
      });
      setSchools(Object.entries(schoolCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count));
      setLoading(false);
    })();
  }, [navigate]);

  const handleSearch = async () => {
    if (!searchEmail.trim()) return;
    setSearching(true);
    setSearchResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("lookup-user-by-email", {
        body: { email: searchEmail.trim() },
      });

      if (error) throw error;
      if (!data?.results?.length) {
        toast({ title: "لم يتم العثور على نتائج", variant: "destructive" });
      } else {
        setSearchResult(data.results);
      }
    } catch (err: any) {
      toast({ title: "خطأ في البحث", description: err.message, variant: "destructive" });
    }
    setSearching(false);
  };

  if (!authorized || loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto p-6" dir="rtl">
      <h1 className="text-2xl font-bold">لوحة المشرف العام</h1>

      {/* Quick Nav for Testing All Dashboards */}
      <Card>
        <CardHeader><CardTitle className="text-lg">التنقل السريع بين لوحات التحكم</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => navigate("/dashboard")} className="gap-2">
              <GraduationCap className="w-4 h-4" />
              لوحة الطالب
            </Button>
            <Button variant="outline" onClick={() => navigate("/parent")} className="gap-2">
              <UserCheck className="w-4 h-4" />
              لوحة ولي الأمر
            </Button>
            <Button variant="outline" onClick={() => navigate("/institution")} className="gap-2">
              <Building2 className="w-4 h-4" />
              لوحة المؤسسة
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Users, label: "إجمالي المستخدمين", value: stats.totalUsers },
          { icon: School, label: "المدارس المسجلة", value: stats.totalSchools },
          { icon: Award, label: "رحلات مكتملة", value: stats.completedJourneys },
        ].map((kpi, i) => (
          <Card key={i}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-2 rounded-lg bg-primary/10 text-primary"><kpi.icon className="w-5 h-5" /></div>
              <div>
                <p className="text-sm text-muted-foreground">{kpi.label}</p>
                <p className="text-2xl font-bold">{kpi.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Schools Table */}
      <Card>
        <CardHeader><CardTitle className="text-lg">المدارس المسجلة</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم المدرسة</TableHead>
                  <TableHead>عدد الطلاب</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schools.map((s) => (
                  <TableRow key={s.name}>
                    <TableCell>{s.name}</TableCell>
                    <TableCell>{s.count}</TableCell>
                  </TableRow>
                ))}
                {schools.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">لا توجد مدارس مسجلة</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* User Lookup by Email */}
      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Search className="w-5 h-5" />بحث عن مستخدم بالبريد</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Input
              placeholder="أدخل البريد الإلكتروني"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              dir="ltr"
              className="text-left"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={searching}>
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : "بحث"}
            </Button>
          </div>
          {searchResult && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>البريد</TableHead>
                    <TableHead>الاسم</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>المدرسة</TableHead>
                    <TableHead>المرحلة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {searchResult.map((u: any) => (
                    <TableRow key={u.user_id}>
                      <TableCell dir="ltr" className="text-left">{u.email ?? "—"}</TableCell>
                      <TableCell>{u.full_name ?? "—"}</TableCell>
                      <TableCell>{u.user_type ?? "—"}</TableCell>
                      <TableCell>{u.school_name ?? "—"}</TableCell>
                      <TableCell>{u.grade_level ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
