import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { CreditCard, MessageCircle, Shield, Star, Zap, CheckCircle2, Tag } from "lucide-react";

const STRIPE_LINK = "https://buy.stripe.com/test_placeholder";
const WHATSAPP_MESSAGE = "يا أبي، أحتاج دعمك للاشتراك في منصة 'أثر' لاكتشاف تخصصي الجامعي. هذا رابط الدفع:";
const BASE_PRICE = 19.99;

export default function PaymentStep() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [parentPhone, setParentPhone] = useState("");
  const [simulating, setSimulating] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [checkingPromo, setCheckingPromo] = useState(false);

  const finalPrice = promoApplied ? +(BASE_PRICE * (1 - discount / 100)).toFixed(2) : BASE_PRICE;

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setCheckingPromo(true);
    const { data, error } = await supabase
      .from("promo_codes")
      .select("discount_percentage, is_active")
      .eq("code", promoCode.trim().toUpperCase())
      .maybeSingle();

    if (error || !data) {
      toast({ title: "كود الخصم غير صالح", variant: "destructive" });
      setPromoApplied(false);
      setDiscount(0);
    } else if (!(data as any).is_active) {
      toast({ title: "كود الخصم منتهي الصلاحية", variant: "destructive" });
      setPromoApplied(false);
      setDiscount(0);
    } else {
      setDiscount((data as any).discount_percentage);
      setPromoApplied(true);
      toast({ title: `تم تطبيق خصم ${(data as any).discount_percentage}% 🎉` });
    }
    setCheckingPromo(false);
  };

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

  const features = [
    "اختبار هولاند المهني الكامل",
    "محاكاة واقعية للتخصصات",
    "تقرير شامل وشهادة إتمام",
  ];

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-lg w-full space-y-6"
      >
        {/* Hero Card */}
        <div className="bg-card rounded-2xl border border-border/50 shadow-xl overflow-hidden">
          <div className="relative p-8 text-center overflow-hidden" style={{ background: 'linear-gradient(135deg, hsl(214 72% 11%), hsl(214 60% 18%))' }}>
            <div className="absolute top-0 right-0 w-40 h-40 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", delay: 0.2 }}
            >
              <Star className="w-12 h-12 mx-auto mb-4 text-accent" />
            </motion.div>
            <h1 className="text-2xl font-extrabold text-primary-foreground mb-1">ابدأ رحلة مستقبلك الآن</h1>
            <p className="text-primary-foreground/60 text-sm">استثمار بسيط لقرار مصيري</p>
          </div>

          <div className="p-6 space-y-6">
            {/* Price */}
            <div className="text-center">
              {promoApplied && (
                <div className="mb-1">
                  <span className="text-lg text-muted-foreground line-through">{BASE_PRICE}</span>
                  <span className="text-xs text-muted-foreground mr-1">USD</span>
                </div>
              )}
              <span className="text-5xl font-extrabold text-foreground">{finalPrice}</span>
              <span className="text-lg text-muted-foreground mr-1">USD</span>
              <p className="text-xs text-muted-foreground mt-1">≈ {Math.round(finalPrice * 3.75)} ريال سعودي</p>
              {promoApplied && (
                <p className="text-xs text-[hsl(var(--success))] font-bold mt-1">خصم {discount}% مطبّق ✓</p>
              )}
            </div>

            {/* Promo Code */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1 text-sm">
                <Tag className="w-3.5 h-3.5" />
                هل لديك كود خصم؟
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="مثال: ATHAR50"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  dir="ltr"
                  className="text-left flex-1"
                  disabled={promoApplied}
                />
                <Button
                  variant="outline"
                  onClick={handleApplyPromo}
                  disabled={checkingPromo || promoApplied || !promoCode.trim()}
                  size="sm"
                  className="shrink-0"
                >
                  {checkingPromo ? "..." : promoApplied ? "✓" : "تطبيق"}
                </Button>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-3">
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-3 text-sm text-foreground"
                >
                  <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                  <span>{f}</span>
                </motion.div>
              ))}
            </div>

            {/* Pay Button */}
            <Button
              onClick={handlePay}
              className="w-full h-12 text-lg font-bold gap-2 btn-gradient rounded-xl"
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
        <div className="card-premium p-6 space-y-4">
          <h2 className="text-base font-bold text-center">أو اطلب من ولي أمرك الدفع 💬</h2>

          <div className="space-y-2">
            <Label htmlFor="parentPhone">رقم جوال ولي الأمر</Label>
            <Input
              id="parentPhone"
              value={parentPhone}
              onChange={(e) => setParentPhone(e.target.value)}
              placeholder="مثال: 966512345678"
              dir="ltr"
              className="text-left h-11"
            />
          </div>

          <Button
            onClick={handleWhatsApp}
            className="w-full h-11 font-bold gap-2 rounded-xl"
            style={{ background: 'hsl(142 70% 40%)', color: 'white' }}
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
            className="text-xs text-muted-foreground/30 hover:text-muted-foreground/60 underline transition-colors"
          >
            {simulating ? "جارٍ التفعيل..." : "Simulate Success (Dev Only)"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
