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
import {
  Loader2, Users, School, Award, Search, GraduationCap,
  Building2, UserCheck, DollarSign, UserPlus, Activity,
} from "lucide-react";
import {
  PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
} from "recharts";

const USER_TYPE_LABELS: Record<string, string> = {
  student: "طالب",
  parent: "ولي أمر",
  institution: "مؤسسة",
};

const TYPE_COLORS = [
  "hsl(210, 70%, 40%)",
  "hsl(160, 55%, 38%)",
  "hsl(30, 80%, 55%)",
];

function getLastNWeekStarts(n: number): Date[] {
  const weeks: Date[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    weeks.push(d);
  }
  return weeks;
}

function weekLabel(d: Date): string {
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export default function AdminOverviewTab() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalUsers: 0, totalSchools: 0, completedJourneys: 0,
    totalStudents: 0, totalParents: 0, totalInstitutions: 0,
    totalRevenue: 0, totalSeats: 0,
  });
  const [schools, setSchools] = useState<{ name: string; count: number }[]>([]);
  const [searchEmail, setSearchEmail] = useState("");
  const [searchResult, setSearchResult] = useState<any[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [userTypeData, setUserTypeData] = useState<{ name: string; value: number }[]>([]);
  const [wauData, setWauData] = useState<{ week: string; count: number }[]>([]);
  const [recentSignups, setRecentSignups] = useState<{ full_name: string | null; user_type: string; created_at: string }[]>([]);

  useEffect(() => {
    (async () => {
      const [profilesRes, progressRes, ordersRes] = await Promise.all([
        supabase.from("profiles").select("user_id, school_name, user_type, full_name, created_at"),
        supabase.from("user_progress").select("user_id, status, completed_at"),
        supabase.from("school_orders").select("seats_total, seats_used, status"),
      ]);

      const profiles = profilesRes.data ?? [];
      const progress = progressRes.data ?? [];
      const orders = ordersRes.data ?? [];

      // Basic stats
      const schoolSet = new Set(
        profiles.filter(p => p.school_name).map(p => p.school_name!.trim())
      );
      const completedUsers = new Set(
        progress.filter(p => p.status === "completed").map(p => p.user_id)
      );

      // User type counts
      const typeCounts: Record<string, number> = { student: 0, parent: 0, institution: 0 };
      profiles.forEach(p => {
        if (p.user_type in typeCounts) typeCounts[p.user_type]++;
      });

      setUserTypeData(
        Object.entries(typeCounts)
          .filter(([, v]) => v > 0)
          .map(([k, v]) => ({ name: USER_TYPE_LABELS[k] ?? k, value: v }))
      );

      // Revenue from school_orders
      const totalSeats = orders.reduce((sum, o) => sum + (o.seats_total ?? 0), 0);
      const totalUsedSeats = orders.reduce((sum, o) => sum + (o.seats_used ?? 0), 0);

      setStats({
        totalUsers: profiles.length,
        totalSchools: schoolSet.size,
        completedJourneys: completedUsers.size,
        totalStudents: typeCounts.student,
        totalParents: typeCounts.parent,
        totalInstitutions: typeCounts.institution,
        totalRevenue: totalUsedSeats, // seats used as proxy for revenue
        totalSeats,
      });

      // Schools table
      const schoolCounts: Record<string, number> = {};
      profiles.forEach(p => {
        if (p.school_name?.trim()) {
          const name = p.school_name.trim();
          schoolCounts[name] = (schoolCounts[name] ?? 0) + 1;
        }
      });
      setSchools(Object.entries(schoolCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count));

      // Weekly Active Users (last 8 weeks)
      const weekStarts = getLastNWeekStarts(8);
      const wauResults: { week: string; count: number }[] = [];
      for (let w = 0; w < weekStarts.length; w++) {
        const wStart = weekStarts[w].toISOString();
        const wEnd = w < weekStarts.length - 1 ? weekStarts[w + 1].toISOString() : new Date().toISOString();
        const activeInWeek = new Set<string>();
        progress.forEach(p => {
          if (p.status === "completed" && p.completed_at && p.completed_at >= wStart && p.completed_at < wEnd) {
            activeInWeek.add(p.user_id);
          }
        });
        wauResults.push({ week: weekLabel(weekStarts[w]), count: activeInWeek.size });
      }
      setWauData(wauResults);

      // Recent signups (last 10)
      const sorted = [...profiles].sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? "")).slice(0, 10);
      setRecentSignups(sorted.map(p => ({ full_name: p.full_name, user_type: p.user_type, created_at: p.created_at })));

      setLoading(false);
    })();
  }, []);

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

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Quick Nav */}
      <Card>
        <CardHeader><CardTitle className="text-lg">التنقل السريع بين لوحات التحكم</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => navigate("/dashboard")} className="gap-2">
              <GraduationCap className="w-4 h-4" />لوحة الطالب
            </Button>
            <Button variant="outline" onClick={() => navigate("/parent")} className="gap-2">
              <UserCheck className="w-4 h-4" />لوحة ولي الأمر
            </Button>
            <Button variant="outline" onClick={() => navigate("/institution")} className="gap-2">
              <Building2 className="w-4 h-4" />لوحة المؤسسة
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {[
          { icon: Users, label: "إجمالي المستخدمين", value: stats.totalUsers },
          { icon: GraduationCap, label: "الطلاب", value: stats.totalStudents },
          { icon: UserCheck, label: "أولياء الأمور", value: stats.totalParents },
          { icon: Building2, label: "المؤسسات", value: stats.totalInstitutions },
          { icon: School, label: "المدارس المسجلة", value: stats.totalSchools },
          { icon: Award, label: "رحلات مكتملة", value: stats.completedJourneys },
          { icon: DollarSign, label: "المقاعد المستخدمة", value: `${stats.totalRevenue} / ${stats.totalSeats}` },
          { icon: Activity, label: "نشاط هذا الأسبوع", value: wauData.length > 0 ? wauData[wauData.length - 1].count : 0 },
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Type Pie */}
        <Card>
          <CardHeader><CardTitle className="text-base">توزيع أنواع المستخدمين</CardTitle></CardHeader>
          <CardContent className="h-72">
            {userTypeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={userTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                    {userTypeData.map((_, i) => (
                      <Cell key={i} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm text-center pt-12">لا توجد بيانات</p>
            )}
          </CardContent>
        </Card>

        {/* Weekly Active Users Trend */}
        <Card>
          <CardHeader><CardTitle className="text-base">المستخدمون النشطون أسبوعياً</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={wauData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(210, 70%, 40%)"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name="مستخدمون نشطون"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Signups */}
      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><UserPlus className="w-5 h-5" />آخر التسجيلات</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>تاريخ التسجيل</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentSignups.map((u, i) => (
                  <TableRow key={i}>
                    <TableCell>{u.full_name ?? "—"}</TableCell>
                    <TableCell>{USER_TYPE_LABELS[u.user_type] ?? u.user_type}</TableCell>
                    <TableCell dir="ltr" className="text-left">{new Date(u.created_at).toLocaleDateString("ar-SA")}</TableCell>
                  </TableRow>
                ))}
                {recentSignups.length === 0 && (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">لا توجد تسجيلات</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

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

      {/* User Lookup */}
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
