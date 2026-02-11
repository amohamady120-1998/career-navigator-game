import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, CheckCircle, Phone } from "lucide-react";

const CONSULTATION_TYPES = [
  { value: "career", label: "استشارة مهنية" },
  { value: "university_local", label: "قبول جامعي محلي" },
  { value: "university_abroad", label: "قبول جامعي خارجي" },
  { value: "scholarship", label: "منح دراسية" },
];

export default function ConsultationBooking() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    whatsapp: "",
    consultation_type: "",
    notes: "",
  });

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      setUserId(session.user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (profile?.full_name) setUserName(profile.full_name);
    })();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    const cleanWhatsapp = formData.whatsapp.replace(/\D/g, "");
    if (cleanWhatsapp.length < 9) {
      toast.error("رقم الواتساب غير صحيح، يجب أن يكون 9 أرقام على الأقل");
      return;
    }

    if (!formData.consultation_type) {
      toast.error("يرجى اختيار نوع الاستشارة");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("consultation_requests").insert({
      user_id: userId,
      user_name: userName,
      whatsapp: cleanWhatsapp,
      consultation_type: formData.consultation_type,
      notes: formData.notes || null,
      report_link: null,
    });

    setLoading(false);
    if (error) {
      toast.error("حدث خطأ أثناء إرسال الطلب");
      console.error(error);
    } else {
      setSubmitted(true);
      toast.success("تم إرسال طلب الاستشارة بنجاح!");
    }
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto p-6 text-center" dir="rtl">
        <Card>
          <CardContent className="py-12 space-y-4">
            <CheckCircle className="w-16 h-16 text-primary mx-auto" />
            <h2 className="text-2xl font-bold">تم إرسال طلبك بنجاح!</h2>
            <p className="text-muted-foreground">سيتواصل معك فريقنا عبر الواتساب قريبًا</p>
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
          <CardTitle className="text-xl">طلب استشارة</CardTitle>
          <CardDescription>احجز استشارتك وسيتواصل معك فريقنا عبر الواتساب</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="whatsapp">رقم الواتساب</Label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="whatsapp"
                  type="tel"
                  placeholder="9665XXXXXXXX"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
                  className="pr-10"
                  required
                  maxLength={15}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                اكتب الرقم مع كود الدولة إذا لزم (مثال: 9665XXXXXXXX)
              </p>
            </div>

            <div className="space-y-2">
              <Label>نوع الاستشارة</Label>
              <Select
                value={formData.consultation_type}
                onValueChange={(val) => setFormData(prev => ({ ...prev, consultation_type: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوع الاستشارة" />
                </SelectTrigger>
                <SelectContent>
                  {CONSULTATION_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">ملاحظات إضافية (اختياري)</Label>
              <Textarea
                id="notes"
                placeholder="أي تفاصيل تود مشاركتها..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                maxLength={500}
                rows={3}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <><Loader2 className="w-4 h-4 animate-spin ml-2" /> جاري الإرسال...</> : "إرسال طلب الاستشارة"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
