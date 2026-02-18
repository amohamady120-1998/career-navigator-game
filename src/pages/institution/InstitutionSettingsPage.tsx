import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Settings, KeyRound } from "lucide-react";

export default function InstitutionSettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [resettingPassword, setResettingPassword] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setEmail(session.user.email ?? "");

      const [profileRes, adminRes] = await Promise.all([
        supabase.from("profiles").select("full_name, phone").eq("user_id", session.user.id).maybeSingle(),
        supabase.from("school_admins").select("school_id").eq("user_id", session.user.id).maybeSingle(),
      ]);

      if (profileRes.data) {
        setFullName(profileRes.data.full_name ?? "");
        setPhone(profileRes.data.phone ?? "");
      }

      if (adminRes.data) {
        const { data: school } = await supabase.from("schools").select("name").eq("id", adminRes.data.school_id).maybeSingle();
        if (school) setSchoolName(school.name);
      }
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName.trim(), phone: phone.trim() || null })
        .eq("user_id", session.user.id);
      if (error) throw error;
      toast({ title: "تم حفظ التغييرات ✓" });
    } catch (err: any) {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleResetPassword = async () => {
    setResettingPassword(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
      if (error) throw error;
      toast({ title: "تم إرسال رابط إعادة التعيين" });
    } catch (err: any) {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    } finally { setResettingPassword(false); }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-xl font-bold flex items-center gap-2"><Settings className="w-5 h-5" /> الإعدادات</h1>

      {schoolName && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">معلومات المؤسسة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>اسم المؤسسة</Label>
              <Input value={schoolName} disabled className="bg-muted" />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">المعلومات الشخصية</CardTitle>
          <CardDescription>تعديل الاسم ورقم الجوال</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>البريد الإلكتروني</Label>
            <Input value={email} disabled dir="ltr" className="text-left bg-muted" />
          </div>
          <div className="space-y-2">
            <Label>الاسم الكامل</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="أدخل اسمك" />
          </div>
          <div className="space-y-2">
            <Label>رقم الجوال</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05XXXXXXXX" dir="ltr" className="text-left" />
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving && <Loader2 className="w-4 h-4 animate-spin ml-2" />}حفظ التغييرات
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><KeyRound className="w-5 h-5" /> كلمة المرور</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handleResetPassword} disabled={resettingPassword} className="w-full">
            {resettingPassword && <Loader2 className="w-4 h-4 animate-spin ml-2" />}إعادة تعيين كلمة المرور
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
