import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, CheckCircle, School, KeyRound } from "lucide-react";

export default function ActivateSchoolCode() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [membership, setMembership] = useState<{ school_name: string; activated_at: string } | null>(null);
  const [successSchool, setSuccessSchool] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }

      const { data } = await supabase
        .from("user_school_membership")
        .select("school_id, activated_at")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (data) {
        const { data: school } = await supabase
          .from("schools")
          .select("name")
          .eq("id", data.school_id)
          .maybeSingle();

        setMembership({
          school_name: school?.name || "مدرسة",
          activated_at: new Date(data.activated_at).toLocaleDateString("ar-SA"),
        });
      }
      setChecking(false);
    })();
  }, [navigate]);

  const handleActivate = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      toast.error("يرجى إدخال كود التفعيل");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.rpc("activate_school_code", { p_code: trimmed });
    setLoading(false);

    if (error) {
      toast.error("حدث خطأ أثناء التفعيل");
      console.error(error);
      return;
    }

    const result = data as any;
    if (result?.success) {
      setSuccessSchool(result.school_name);
      toast.success("تم التفعيل بنجاح!");
    } else {
      toast.error(result?.error || "فشل التفعيل");
    }
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (successSchool) {
    return (
      <div className="max-w-lg mx-auto p-6 text-center" dir="rtl">
        <Card>
          <CardContent className="py-12 space-y-6">
            <CheckCircle className="w-16 h-16 mx-auto" style={{ color: '#22c55e' }} />
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">تم التفعيل بنجاح!</h2>
              <p className="text-muted-foreground">مرحبًا بك في برنامج أثر عبر مدرسة <strong>{successSchool}</strong></p>
            </div>
            <Button onClick={() => navigate("/dashboard")} className="w-full">
              ابدأ الرحلة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (membership) {
    return (
      <div className="max-w-lg mx-auto p-6 text-center" dir="rtl">
        <Card>
          <CardContent className="py-12 space-y-4">
            <School className="w-12 h-12 text-primary mx-auto" />
            <h2 className="text-xl font-bold">اشتراكك مفعّل</h2>
            <p className="text-muted-foreground">
              أنت مسجل عبر مدرسة <strong>{membership.school_name}</strong>
            </p>
            <p className="text-xs text-muted-foreground">
              تاريخ التفعيل: {membership.activated_at}
            </p>
            <Button onClick={() => navigate("/dashboard")} variant="outline">
              العودة للرحلة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-6" dir="rtl">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <KeyRound className="w-5 h-5" />
            تفعيل اشتراك المدرسة
          </CardTitle>
          <CardDescription>أدخل كود التفعيل الذي حصلت عليه من مدرستك</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="مثال: ATHAR-XXXXXX"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="text-center tracking-widest font-mono text-lg"
            maxLength={20}
            dir="ltr"
          />
          <Button onClick={handleActivate} className="w-full" disabled={loading || !code.trim()}>
            {loading ? <><Loader2 className="w-4 h-4 animate-spin ml-2" /> جاري التفعيل...</> : "تفعيل"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
