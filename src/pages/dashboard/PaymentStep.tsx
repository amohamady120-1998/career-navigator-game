import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { CreditCard, MessageCircle, Shield, Star, Zap } from "lucide-react";

const STRIPE_LINK = "https://buy.stripe.com/test_placeholder";
const WHATSAPP_MESSAGE = "يا أبي، أحتاج دعمك للاشتراك في منصة 'أثر' لاكتشاف تخصصي الجامعي. هذا رابط الدفع:";

export default function PaymentStep() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [parentPhone, setParentPhone] = useState("");
  const [simulating, setSimulating] = useState(false);

  const handlePay = () => {
    window.open(STRIPE_LINK, "_blank");
  };

  const handleWhatsApp = () => {
    const cleaned = parentPhone.replace(/[\s\-\+]/g, "");
    if (!cleaned || cleaned.length < 9) {
      toast({ title: "يرجى إدخال رقم جوال صحيح", variant: "destructive" });
      return;
    }
    const phone = cleaned.startsWith("0") ? `966${cleaned.slice(1)}` : cleaned;
    const message = encodeURIComponent(`${WHATSAPP_MESSAGE} ${STRIPE_LINK}`);
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
    toast({ title: "يرجى ضغط زر الإرسال في واتساب" });
  };

  const handleSimulate = async () => {
    setSimulating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { error } = await supabase
        .from("profiles")
        .update({ has_paid: true } as any)
        .eq("user_id", session.user.id);
      if (error) throw error;
      toast({ title: "تم تفعيل الاشتراك بنجاح! 🎉" });
      navigate("/dashboard/intro", { replace: true });
    } catch (err: any) {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg w-full space-y-6"
      >
        {/* Hero Card */}
        <div className="bg-card rounded-2xl border border-border shadow-xl overflow-hidden">
          <div className="bg-primary text-primary-foreground p-6 text-center">
            <Star className="w-10 h-10 mx-auto mb-3 text-accent" />
            <h1 className="text-2xl font-bold mb-1">ابدأ رحلة مستقبلك الآن</h1>
            <p className="text-primary-foreground/70 text-sm">استثمار بسيط لقرار مصيري</p>
          </div>

          <div className="p-6 space-y-6">
            {/* Price */}
            <div className="text-center">
              <span className="text-4xl font-bold text-foreground">19.99</span>
              <span className="text-lg text-muted-foreground mr-1">USD</span>
              <p className="text-xs text-muted-foreground mt-1">≈ 75 ريال سعودي</p>
            </div>

            {/* Features */}
            <div className="space-y-2">
              {[
                "اختبار هولاند المهني الكامل",
                "محاكاة واقعية للتخصصات",
                "تقرير شامل وشهادة إتمام",
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-foreground">
                  <Zap className="w-4 h-4 text-accent flex-shrink-0" />
                  <span>{f}</span>
                </div>
              ))}
            </div>

            {/* Pay Button */}
            <Button
              onClick={handlePay}
              className="w-full h-12 text-lg font-bold gap-2"
            >
              <CreditCard className="w-5 h-5" />
              ادفع الآن (بطاقة مدى/Visa)
            </Button>

            <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground">
              <Shield className="w-3 h-3" />
              <span>دفع آمن ومشفّر بالكامل</span>
            </div>
          </div>
        </div>

        {/* WhatsApp Card */}
        <div className="bg-card rounded-2xl border border-border shadow-md p-6 space-y-4">
          <h2 className="text-base font-semibold text-center">أو اطلب من ولي أمرك الدفع 💬</h2>

          <div className="space-y-2">
            <Label htmlFor="parentPhone">رقم جوال ولي الأمر</Label>
            <Input
              id="parentPhone"
              value={parentPhone}
              onChange={(e) => setParentPhone(e.target.value)}
              placeholder="مثال: 966512345678"
              dir="ltr"
              className="text-left"
            />
          </div>

          <Button
            onClick={handleWhatsApp}
            className="w-full h-11 font-bold gap-2 bg-[hsl(142,70%,40%)] hover:bg-[hsl(142,70%,35%)] text-white"
          >
            <MessageCircle className="w-5 h-5" />
            إرسال الرابط عبر واتساب
          </Button>
        </div>

        {/* Dev simulate */}
        <div className="text-center">
          <button
            onClick={handleSimulate}
            disabled={simulating}
            className="text-xs text-muted-foreground/50 hover:text-muted-foreground underline"
          >
            {simulating ? "جارٍ التفعيل..." : "Simulate Success (Dev Only)"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
