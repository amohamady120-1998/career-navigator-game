import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, School, Users, Key, BarChart3 } from "lucide-react";

export default function SchoolDashboard() {
  const navigate = useNavigate();
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }

      const { data: membership } = await supabase
        .from("user_school_membership")
        .select("school_id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (membership) setSchoolId(membership.school_id);
      setLoading(false);
    })();
  }, [navigate]);

  const { data: school } = useQuery({
    queryKey: ["school-info", schoolId],
    queryFn: async () => {
      const { data } = await supabase.from("schools").select("*").eq("id", schoolId!).single();
      return data;
    },
    enabled: !!schoolId,
  });

  const { data: orders } = useQuery({
    queryKey: ["school-orders-dash", schoolId],
    queryFn: async () => {
      const { data } = await supabase.from("school_orders").select("*").eq("school_id", schoolId!);
      return data || [];
    },
    enabled: !!schoolId,
  });

  const totalSeats = orders?.reduce((s, o) => s + o.seats_total, 0) || 0;
  const usedSeats = orders?.reduce((s, o) => s + o.seats_used, 0) || 0;

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!schoolId) {
    return (
      <div className="max-w-lg mx-auto p-6 text-center" dir="rtl">
        <Card>
          <CardContent className="py-12">
            <School className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">لم يتم ربط حسابك بمدرسة بعد</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex items-center gap-3">
        <School className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">{school?.name || "لوحة المدرسة"}</h1>
          <p className="text-sm text-muted-foreground">{school?.city}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-1">
              <Users className="w-4 h-4" /> المقاعد الكلية
            </CardTitle>
          </CardHeader>
          <CardContent><p className="text-3xl font-bold">{totalSeats}</p></CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-1">
              <BarChart3 className="w-4 h-4" /> المستخدمة
            </CardTitle>
          </CardHeader>
          <CardContent><p className="text-3xl font-bold">{usedSeats}</p></CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-1">
              <Key className="w-4 h-4" /> المتبقية
            </CardTitle>
          </CardHeader>
          <CardContent><p className="text-3xl font-bold">{totalSeats - usedSeats}</p></CardContent>
        </Card>
      </div>

      {orders && orders.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">تفاصيل الطلبات</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {orders.map(o => (
                <div key={o.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <span className="font-medium">{o.seats_total} مقعد</span>
                    <span className="text-sm text-muted-foreground mr-2">({o.seats_used} مستخدم)</span>
                  </div>
                  <span className={`text-sm px-2 py-1 rounded ${o.status === 'active' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {o.status === 'active' ? 'نشط' : o.status === 'paused' ? 'متوقف' : 'مغلق'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
