import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import atharLogoDark from "@/assets/athar-logo-dark.png";
import { GraduationCap, Users, Building2, ClipboardList, FlaskConical, FileText, Award } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ThemeToggle } from "@/components/ThemeToggle";

type UserType = "student" | "parent" | "institution";

const roles: { type: UserType; label: string; icon: typeof GraduationCap; description: string }[] = [
  {
    type: "student",
    label: "طالب",
    icon: GraduationCap,
    description: "اكتشف ميولك واختر تخصصك الجامعي بثقة",
  },
  {
    type: "parent",
    label: "ولي أمر",
    icon: Users,
    description: "ساعد ابنك في اتخاذ القرار الأنسب لمستقبله",
  },
  {
    type: "institution",
    label: "مؤسسة تعليمية",
    icon: Building2,
    description: "قدّم لطلابك أدوات التوجيه المهني الذكية",
  },
];

const steps = [
  { icon: ClipboardList, title: "استبيان الميول", desc: "أجب على أسئلة مصممة علميًا لاكتشاف نمطك المهني" },
  { icon: FlaskConical, title: "محاكاة التخصصات", desc: "عش تجربة واقعية لأبرز التخصصات الجامعية" },
  { icon: FileText, title: "التقرير التفصيلي", desc: "احصل على تحليل شامل لميولك وتوصيات مخصصة" },
  { icon: Award, title: "الشهادة", desc: "احصل على شهادة إتمام رحلة أثر البداية" },
];

const faqs = [
  { q: "هل المنصة مجانية؟", a: "نعم، المنصة مجانية بالكامل للطلاب وأولياء الأمور." },
  { q: "ما هو اختبار هولاند؟", a: "هو اختبار علمي معتمد عالميًا يساعدك في اكتشاف ميولك المهنية بناءً على 6 أنماط شخصية (RIASEC)." },
  { q: "كم يستغرق إكمال الرحلة؟", a: "تستغرق الرحلة الكاملة من 30 إلى 45 دقيقة تقريبًا." },
  { q: "هل يمكن لولي الأمر متابعة نتائج ابنه؟", a: "نعم، يمكن لولي الأمر ربط حسابه بحساب الطالب ومتابعة التقدم والنتائج." },
  { q: "هل المنصة متاحة للمؤسسات التعليمية؟", a: "نعم، توفر المنصة لوحة تحكم خاصة بالمؤسسات لمتابعة طلابها وتحليل بياناتهم." },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15 } },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const Index = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<UserType | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_type")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (profile?.user_type === "parent") navigate("/parent", { replace: true });
      else if (profile?.user_type === "institution") navigate("/institution", { replace: true });
      else navigate("/dashboard", { replace: true });
    });
  }, [navigate]);

  const handleSelect = (type: UserType) => {
    setSelected(type);
    localStorage.setItem("athar_user_type", type);
    setTimeout(() => navigate("/auth"), 400);
  };

  return (
    <div className="min-h-screen flex flex-col bg-primary" dir="rtl">
      {/* Theme Toggle */}
      <div className="absolute top-4 left-4">
        <ThemeToggle />
      </div>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-4 pt-20 pb-16">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <img src={atharLogoDark} alt="أثر البداية" className="h-24 mx-auto mb-4 object-contain" />
          <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-3">
            اكتشف مسارك المهني بثقة
          </h1>
          <p className="text-lg text-primary-foreground/70 max-w-lg mx-auto">
            منصة ذكية مبنية على أسس علمية تساعدك في اختيار التخصص الجامعي المناسب لميولك وقدراتك
          </p>
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="bg-card py-16 px-4">
        <div className="max-w-4xl mx-auto text-center mb-10">
          <h2 className="text-2xl font-bold text-foreground mb-2">كيف تعمل المنصة؟</h2>
          <p className="text-muted-foreground">أربع خطوات بسيطة نحو اكتشاف مستقبلك</p>
        </div>
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center text-center gap-3 p-6"
              >
                <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center">
                  <Icon className="w-7 h-7 text-accent" />
                </div>
                <h3 className="font-bold text-foreground">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Get Started - Role Cards */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center mb-10">
          <h2 className="text-2xl font-bold text-primary-foreground mb-2">ابدأ رحلتك الآن</h2>
          <p className="text-primary-foreground/70">اختر دورك للمتابعة</p>
        </div>
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
        >
          {roles.map((role) => {
            const Icon = role.icon;
            const isSelected = selected === role.type;
            return (
              <motion.button
                key={role.type}
                variants={item}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleSelect(role.type)}
                className={`
                  relative flex flex-col items-center gap-4 p-8 rounded-xl
                  bg-card text-card-foreground border-2 transition-colors duration-200
                  cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent
                  ${isSelected ? "border-accent shadow-lg shadow-accent/20" : "border-transparent hover:border-accent/40"}
                `}
              >
                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
                  <Icon className="w-8 h-8 text-accent" />
                </div>
                <h2 className="text-2xl font-bold">{role.label}</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">{role.description}</p>
              </motion.button>
            );
          })}
        </motion.div>
      </section>

      {/* FAQ */}
      <section className="bg-card py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">الأسئلة الشائعة</h2>
          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="bg-background rounded-lg border px-4">
                <AccordionTrigger className="text-right font-medium">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 text-center text-primary-foreground/50 text-sm">
        <p>© {new Date().getFullYear()} أثر البداية. جميع الحقوق محفوظة.</p>
      </footer>
    </div>
  );
};

export default Index;
